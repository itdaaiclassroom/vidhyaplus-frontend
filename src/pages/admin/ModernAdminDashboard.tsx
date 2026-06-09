import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import StudentReportCard from "@/components/StudentReportCard";
import SessionAnalytics from "@/components/SessionAnalytics";
import { 
  School, Users, GraduationCap, BarChart3, Activity, 
  MessageSquare, Calendar as CalendarIcon, LogOut, 
  Settings, Search, Eye, Plus, Shield, Clock, HelpCircle,
  BookOpen, ClipboardList, Radio, MonitorPlay, ChevronRight,
  Trash2, Edit, ShieldCheck, AlertTriangle, Download, X,
  User as UserIcon, Mail, Phone, MapPin, Globe, Key,
  Award, Star, CheckCircle2, Layers, ArrowLeft, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area, ReferenceLine
} from "recharts";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { uploadFileToR2 } from "@/services/uploadService";
import { toast } from "sonner";
import { fetchAdminOverview, fetchAdminAnalytics, createAnnouncement, fetchAdminAnnouncements, fetchTeacherLogs, getApiBase, createSchool, updateSchool, deleteSchool, fetchAuditLogs, fetchAdminProfile, updateAdminProfile, createTeacher, updateTeacher, deleteTeacher } from "@/api/client";
import type { AuditLogEntry } from "@/api/client";
import MaterialManagement from "./MaterialManagement";
import GatingAdminPanel from "./GatingAdminPanel";
import UserManagementPanel from "./UserManagementPanel";
import { ReportsPanel } from "./ReportsPanel";
import TeacherReportsDialog from "@/components/TeacherReportsDialog";
import { AdminSchoolContextWrapper } from "./AdminSchoolContextWrapper";
import StudentRegistrationWizard from "../principal/StudentRegistrationWizard";
import TeacherRegistration from "../principal/TeacherRegistration";
import IdCardGenerator from "./IdCardGenerator";
import { AdminManageTeachers } from "./AdminManageTeachers";
import AdminProfile from "./AdminProfile";
import { ChevronDown } from "lucide-react";
import QuestionBankPanel from "./QuestionBankPanel";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = (() => {
      if (!label || typeof label !== "string") return label;
      const parts = label.split("-");
      if (parts.length === 3) {
        const dateObj = new Date(label);
        if (!isNaN(dateObj.getTime())) {
          const day = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });
          const year = dateObj.getFullYear();
          return `${day} ${monthName} ${year}`;
        }
      }
      return label;
    })();

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-100/80 rounded-2xl shadow-xl shadow-slate-200/50">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">{formattedDate}</p>
        <p className="text-sm font-extrabold text-slate-800">
          Active Count: <span className="text-primary font-mono">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const ModernAdminDashboard = () => {
  // Reliable YYYY-MM-DD formatter (avoids toLocaleDateString locale inconsistencies)
  const toISODateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const { data, loading, refetch } = useAppData();
  const { userName, logout, role, permissions, updatePermissions } = useAuth();
  const navigate = useNavigate();

  // Read initial tab from URL hash (e.g. /admin#materials → "materials")
  const getTabFromHash = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  }, []);

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [expandedNavs, setExpandedNavs] = useState<string[]>([]);
  const [studentStartDate, setStudentStartDate] = useState<string>("");
  const [studentEndDate, setStudentEndDate] = useState<string>("");
  const [teacherStartDate, setTeacherStartDate] = useState<string>("");
  const [teacherEndDate, setTeacherEndDate] = useState<string>("");


  const [announcement, setAnnouncement] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<string>("all");
  const [analytics, setAnalytics] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [overviewDate, setOverviewDate] = useState<string>(() => toISODateStr(new Date()));
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [selectedReportTeacherId, setSelectedReportTeacherId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  // ── Audit Logs state ──────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditFilters, setAuditFilters] = useState({ actor_role: "", entity: "", action: "", from: "", to: "" });
  const [auditPendingFilters, setAuditPendingFilters] = useState({ actor_role: "", entity: "", action: "", from: "", to: "" });
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);
  const [schoolFormOpen, setSchoolFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<{ id: string; name: string; code: string; district: string; mandal?: string; sessionsCompleted: number; activeStatus: boolean; principalName?: string; principalEmail?: string } | null>(null);
  const [schoolForm, setSchoolForm] = useState<{
    name: string;
    code: string;
    district: string;
    mandal: string;
    sessionsCompleted: number;
    activeStatus: boolean;
    principalName: string;
    principalEmail: string;
    principalPassword: string;
    logo: File | null;
  }>({ name: "", code: "", district: "", mandal: "", sessionsCompleted: 0, activeStatus: true, principalName: "", principalEmail: "", principalPassword: "", logo: null });
  const [schoolSubmitting, setSchoolSubmitting] = useState(false);

  // ── Teacher CRUD & View state ─────────────────────────────────────────────
  const [teacherFormOpen, setTeacherFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<{ id: string; full_name: string; email: string; school_id: string } | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    full_name: "",
    email: "",
    school_id: "",
    password: ""
  });
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);
  const [viewingTeacherTab, setViewingTeacherTab] = useState<"overview" | "syllabus">("overview");
  const [selectedSyllabusClassId, setSelectedSyllabusClassId] = useState<string>("overall");
  const [selectedSyllabusSubjectId, setSelectedSyllabusSubjectId] = useState<string>("");
  const syllabusReportType = selectedSyllabusClassId === "overall" ? "overall" : "individual";
  const syllabusSelectedGrade = selectedSyllabusClassId !== "overall" ? Number(selectedSyllabusClassId) : null;
  const syllabusSelectedSubjectId = selectedSyllabusSubjectId;

  const [syllabusSearchQuery, setSyllabusSearchQuery] = useState("");
  const [syllabusStatusFilter, setSyllabusStatusFilter] = useState<"all" | "completed" | "in_progress" | "not_started">("all");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedSchoolId, setEditedSchoolId] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedDesignation, setEditedDesignation] = useState("");
  const [editedExperience, setEditedExperience] = useState("");
  const [editedSkills, setEditedSkills] = useState("");
  const [editedHighestQualification, setEditedHighestQualification] = useState("");
  const [editedClassIds, setEditedClassIds] = useState<string[]>([]);
  const [editedSubjectIds, setEditedSubjectIds] = useState<string[]>([]);
  const [editedPassword, setEditedPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (viewingTeacher) {
      setViewingTeacherTab("overview");
      setIsEditingProfile(false);
      setSelectedSyllabusClassId("overall");
      setSelectedSyllabusSubjectId("");
      setSyllabusSearchQuery("");
      setSyllabusStatusFilter("all");
      setExpandedChapters({});

      // Initialize edit fields
      setEditedName(viewingTeacher.name || "");
      setEditedEmail(viewingTeacher.email || "");
      setEditedSchoolId(viewingTeacher.schoolId || "");
      setEditedPhone(viewingTeacher.phone || "");
      setEditedDesignation(viewingTeacher.designation || "");
      setEditedExperience(viewingTeacher.experience || "");
      setEditedSkills(viewingTeacher.skills || "");
      setEditedHighestQualification(viewingTeacher.highest_qualification || "");
      setEditedClassIds(viewingTeacher.classIds || []);
      setEditedPassword("");

      // Subjects matching: resolve names to IDs
      if (data && data.subjects) {
        const matchedSubjectIds = data.subjects
          .filter(s => viewingTeacher.subjects?.includes(s.name))
          .map(s => s.id);
        setEditedSubjectIds(matchedSubjectIds);
      }
    }
  }, [viewingTeacher, data]);

  const [viewingSchool, setViewingSchool] = useState<any>(null);
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [aiReportData, setAiReportData] = useState<any>(null);
  const [aiReportDialogOpen, setAiReportDialogOpen] = useState(false);
  const [aiReportContent, setAiReportContent] = useState("");
  const [aiReportStudentName, setAiReportStudentName] = useState("");
  const [aiReportStudentId, setAiReportStudentId] = useState<string | number | undefined>(undefined);
  const [aiReportStudentClass, setAiReportStudentClass] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);

  // ── Admin Profile state ───────────────────────────────────────────────────
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    mandal: "",
    district: "",
    language: "",
    password: ""
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === "profile") {
      setProfileLoading(true);
      fetchAdminProfile()
        .then(setAdminProfile)
        .catch(err => {
          console.error("Failed to fetch admin profile:", err);
          toast.error("Failed to load profile details");
        })
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab]);

  const handleEditProfileClick = () => {
    setProfileForm({
      full_name: adminProfile?.full_name || userName || "",
      email: adminProfile?.email || "",
      phone: adminProfile?.phone || "",
      location: adminProfile?.location || "",
      mandal: adminProfile?.mandal || "",
      district: adminProfile?.district || "",
      language: adminProfile?.language || "",
      password: ""
    });
    setEditProfileModalOpen(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      await updateAdminProfile(profileForm);
      toast.success("Profile updated successfully!");
      setEditProfileModalOpen(false);
      // Re-fetch profile
      const updatedProfile = await fetchAdminProfile();
      setAdminProfile(updatedProfile);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const filteredStudentData = useMemo(() => {
    if (!analytics || !analytics.students || !Array.isArray(analytics.students)) return [];
    return analytics.students.filter((entry: any) => {
      if (!entry || !entry.date || typeof entry.date !== "string") return false;
      const entryDate = entry.date.slice(0, 10);
      if (studentStartDate && entryDate < studentStartDate) return false;
      if (studentEndDate && entryDate > studentEndDate) return false;
      return true;
    });
  }, [analytics, studentStartDate, studentEndDate]);

  const studentStatsInRange = useMemo(() => {
    if (filteredStudentData.length === 0) return { total: 0, avg: 0, peak: 0 };
    const values = filteredStudentData.map((s: any) => s.active || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / values.length);
    const peak = Math.max(...values);
    return { total, avg, peak };
  }, [filteredStudentData]);

  const studentRangeExceeded = useMemo(() => {
    if (!studentStartDate || !studentEndDate) return false;
    const start = new Date(studentStartDate);
    const end = new Date(studentEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 31;
  }, [studentStartDate, studentEndDate]);

  const filteredTeacherData = useMemo(() => {
    if (!analytics || !analytics.teachers || !Array.isArray(analytics.teachers)) return [];
    return analytics.teachers.filter((entry: any) => {
      if (!entry || !entry.date || typeof entry.date !== "string") return false;
      const entryDate = entry.date.slice(0, 10);
      if (teacherStartDate && entryDate < teacherStartDate) return false;
      if (teacherEndDate && entryDate > teacherEndDate) return false;
      return true;
    });
  }, [analytics, teacherStartDate, teacherEndDate]);

  const teacherStatsInRange = useMemo(() => {
    if (filteredTeacherData.length === 0) return { total: 0, avg: 0, peak: 0 };
    const values = filteredTeacherData.map((t: any) => t.active || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / values.length);
    const peak = Math.max(...values);
    return { total, avg, peak };
  }, [filteredTeacherData]);

  const teacherRangeExceeded = useMemo(() => {
    if (!teacherStartDate || !teacherEndDate) return false;
    const start = new Date(teacherStartDate);
    const end = new Date(teacherEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 31;
  }, [teacherStartDate, teacherEndDate]);

  // ── Admin Announcements state ─────────────────────────────────────────────
  const [adminAnnouncements, setAdminAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [tabAnnouncementTitle, setTabAnnouncementTitle] = useState("");
  const [tabAnnouncement, setTabAnnouncement] = useState("");
  const [tabAnnouncementTarget, setTabAnnouncementTarget] = useState("all");
  const [tabSending, setTabSending] = useState(false);

  const downloadReport = async (studentName: string) => {
    if (!reportRef.current) return;
    
    const toastId = toast.loading("Finalizing your premium PDF...");
    
    try {
      const originalWidth = reportRef.current.style.width;
      const originalMaxWidth = reportRef.current.style.maxWidth;
      reportRef.current.style.width = "1200px";
      reportRef.current.style.maxWidth = "none";

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#F8FAFC",
        width: 1200,
        height: reportRef.current.scrollHeight,
        windowWidth: 1200,
        windowHeight: reportRef.current.scrollHeight,
        scrollY: 0,
        x: 0,
        y: 0
      });
      
      reportRef.current.style.width = originalWidth;
      reportRef.current.style.maxWidth = originalMaxWidth;

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF matching A4 width but dynamic height to fit content
      const pdfWidth = 210; // A4 width in mm
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, contentHeight + (margin * 2)]
      });
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`VidhyaPlus_Report_${studentName.replace(/\s+/g, '_')}.pdf`);
      
      toast.success("Professional PDF Downloaded!", { id: toastId });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  useEffect(() => {
    if (schoolFormOpen && editingSchool) {
      setSchoolForm({ name: editingSchool.name, code: editingSchool.code, district: editingSchool.district, mandal: editingSchool.mandal ?? "", sessionsCompleted: editingSchool.sessionsCompleted, activeStatus: editingSchool.activeStatus, principalName: editingSchool.principalName ?? "", principalEmail: editingSchool.principalEmail ?? "", principalPassword: "", logo: null });
    } else if (schoolFormOpen && !editingSchool) {
      setSchoolForm({ name: "", code: "", district: "", mandal: "", sessionsCompleted: 0, activeStatus: true, principalName: "", principalEmail: "", principalPassword: "", logo: null });
    }
  }, [schoolFormOpen, editingSchool]);

  // Load Admin specific data
  useEffect(() => {
    setOverviewLoading(true);
    const startTime = Date.now();
    fetchAdminOverview(overviewDate)
      .then(setOverview)
      .catch(console.error)
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1000 - elapsed);
        setTimeout(() => {
          setOverviewLoading(false);
        }, delay);
      });
  }, [overviewDate]);

  useEffect(() => {
    fetchTeacherLogs().then(setLogs).catch(console.error);
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchAdminProfile()
        .then(profile => {
          if (profile && profile.permissions) {
            updatePermissions(profile.permissions);
          }
        })
        .catch(err => {
          console.error("Failed to sync admin permissions on mount:", err);
        });
    }
  }, [role, updatePermissions]);

  // Fetch audit logs whenever filters or page change
  useEffect(() => {
    if (activeTab !== "logs") return;
    setAuditLoading(true);
    setExpandedLog(null);
    fetchAuditLogs({
      actor_role: auditFilters.actor_role || undefined,
      entity: auditFilters.entity || undefined,
      action: auditFilters.action || undefined,
      from: auditFilters.from || undefined,
      to: auditFilters.to || undefined,
      page: auditPage,
      limit: 20,
    })
      .then((res) => {
        setAuditLogs(res.data);
        setAuditTotal(res.total);
        setAuditTotalPages(res.total_pages || 1);
      })
      .catch(() => {
        setAuditLogs([]);
        setAuditTotal(0);
        setAuditTotalPages(1);
      })
      .finally(() => setAuditLoading(false));
  }, [auditFilters, auditPage, activeTab]);

  const { schools, teachers, students, liveSessions, classes, subjects } = data;

  const activeSessions = useMemo(() => liveSessions.filter(s => s.status === "active"), [liveSessions]);

  const loadAnnouncementsHistory = () => {
    setLoadingAnnouncements(true);
    fetchAdminAnnouncements()
      .then((res) => {
        const sorted = (res || []).sort((a: any, b: any) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime());
        setAdminAnnouncements(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch admin announcements", err);
      })
      .finally(() => setLoadingAnnouncements(false));
  };

  useEffect(() => {
    if (activeTab === "announcements") {
      loadAnnouncementsHistory();
    }
  }, [activeTab]);

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) return;
    try {
      await createAnnouncement({ 
        title: "Admin Announcement", 
        message: announcement,
        target_role: announcementTarget 
      });
      toast.success(`Announcement sent to ${announcementTarget === 'all' ? 'everyone' : announcementTarget}`);
      setAnnouncement("");
      if (activeTab === "announcements") {
        loadAnnouncementsHistory();
      }
    } catch (err) {
      toast.error("Failed to send announcement");
    }
  };

  const handleTabSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabAnnouncementTitle.trim() || !tabAnnouncement.trim()) {
      toast.error("Please fill in both the title and the message.");
      return;
    }
    setTabSending(true);
    try {
      await createAnnouncement({
        title: tabAnnouncementTitle.trim(),
        message: tabAnnouncement.trim(),
        target_role: tabAnnouncementTarget
      });
      toast.success(`Announcement broadcasted to ${tabAnnouncementTarget === 'all' ? 'everyone' : tabAnnouncementTarget}`);
      setTabAnnouncementTitle("");
      setTabAnnouncement("");
      loadAnnouncementsHistory();
    } catch (err) {
      toast.error("Failed to send announcement");
    } finally {
      setTabSending(false);
    }
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim() || !schoolForm.code.trim() || !schoolForm.district.trim()) return;
    setSchoolSubmitting(true);
    
    try {
      let logoUrl: string | undefined;
      if (schoolForm.logo) {
        toast.info("Uploading logo...");
        try {
          logoUrl = await uploadFileToR2(schoolForm.logo, 'school-logos');
        } catch (uploadErr) {
          console.error("Logo upload failed:", uploadErr);
          toast.warning("Logo upload failed, continuing without logo.");
        }
      }

      if (editingSchool) {
        await updateSchool(editingSchool.id, { 
          name: schoolForm.name, 
          code: schoolForm.code, 
          district: schoolForm.district, 
          mandal: schoolForm.mandal || undefined, 
          sessions_completed: schoolForm.sessionsCompleted, 
          active_status: schoolForm.activeStatus,
          principalName: schoolForm.principalName,
          principalEmail: schoolForm.principalEmail,
          principalPassword: schoolForm.principalPassword || undefined,
          ...(logoUrl ? { logo_url: logoUrl } : {})
        });
        toast.success("School updated successfully!");
        refetch(); 
        setSchoolFormOpen(false); 
        setEditingSchool(null);
      } else {
        await createSchool({ 
          name: schoolForm.name, 
          code: schoolForm.code, 
          district: schoolForm.district, 
          mandal: schoolForm.mandal || undefined, 
          sessions_completed: schoolForm.sessionsCompleted, 
          active_status: schoolForm.activeStatus,
          principalName: schoolForm.principalName,
          principalEmail: schoolForm.principalEmail,
          principalPassword: schoolForm.principalPassword,
          ...(logoUrl ? { logo_url: logoUrl } : {})
        });
        toast.success("School created successfully!");
        refetch(); 
        setSchoolFormOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save school");
    } finally {
      setSchoolSubmitting(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.full_name.trim() || !teacherForm.email.trim() || !teacherForm.school_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setTeacherSubmitting(true);
    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          full_name: teacherForm.full_name,
          email: teacherForm.email,
          school_id: teacherForm.school_id,
          password: teacherForm.password || undefined
        });
        toast.success("Teacher updated successfully!");
      } else {
        if (!teacherForm.password) {
          toast.error("Password is required for a new teacher.");
          setTeacherSubmitting(false);
          return;
        }
        await createTeacher({
          full_name: teacherForm.full_name,
          email: teacherForm.email,
          school_id: teacherForm.school_id,
          password: teacherForm.password
        });
        toast.success("Teacher created successfully!");
      }
      refetch();
      setTeacherFormOpen(false);
      setEditingTeacher(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save teacher");
    } finally {
      setTeacherSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher(teacherId);
      toast.success("Teacher deleted successfully!");
      if (viewingTeacher && viewingTeacher.id === teacherId) {
        setViewingTeacher(null);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete teacher");
    }
  };

  const handleSaveProfile = async () => {
    if (!viewingTeacher) return;
    if (!editedName.trim() || !editedEmail.trim() || !editedSchoolId) {
      toast.error("Name, Email, and School are required.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateTeacher(viewingTeacher.id, {
        full_name: editedName,
        email: editedEmail,
        school_id: editedSchoolId,
        password: editedPassword || undefined,
        phone: editedPhone,
        designation: editedDesignation,
        skills: editedSkills,
        experience: editedExperience,
        highest_qualification: editedHighestQualification,
        assigned_class_ids: editedClassIds,
        assigned_subject_ids: editedSubjectIds
      });

      toast.success("Profile saved successfully!");

      const updatedSubjectNames = data.subjects
        .filter(s => editedSubjectIds.includes(s.id))
        .map(s => s.name);

      setViewingTeacher((prev: any) => ({
        ...prev,
        name: editedName,
        email: editedEmail,
        schoolId: editedSchoolId,
        phone: editedPhone,
        designation: editedDesignation,
        experience: editedExperience,
        skills: editedSkills,
        highest_qualification: editedHighestQualification,
        classIds: editedClassIds,
        subjects: updatedSubjectNames
      }));

      setIsEditingProfile(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const teacherStats = useMemo(() => {
    if (!viewingTeacher) return null;
    
    // Taught subjects
    const tSubjects = data.subjects.filter(s => viewingTeacher.subjects?.includes(s.name)) || [];
    const tSubjectIds = tSubjects.map(s => s.id);
    
    // Taught classes/grades
    const tGrades = new Set<number>();
    viewingTeacher.classIds?.forEach((cid: string) => {
      const cls = data.classes.find(c => c.id === cid);
      if (cls && cls.grade) tGrades.add(cls.grade);
    });
    
    const gradesList = Array.from(tGrades);
    
    // Syllabus completion
    const relevantChapters = data.chapters.filter(ch => 
      tSubjectIds.includes(ch.subjectId) &&
      (gradesList.length === 0 || gradesList.includes(ch.grade))
    );
    const relevantChapterIds = new Set(relevantChapters.map(c => c.id));
    const relevantTopics = data.topics.filter(t => relevantChapterIds.has(t.chapterId));
    const relevantTopicIds = new Set(relevantTopics.map(t => t.id));
    
    const completedTopics = data.liveSessions?.filter(ls => 
      ls.teacherId === viewingTeacher.id && 
      relevantTopicIds.has(ls.topicId) && 
      (ls.status?.toLowerCase() === 'completed' || ls.status?.toLowerCase() === 'done' || ls.status?.toLowerCase() === 'ended')
    ).length || 0;
    
    // Use fallback or teacherEffectiveness if topics count is 0
    let completionRate = relevantTopics.length > 0 ? Math.round((completedTopics / relevantTopics.length) * 100) : 0;
    const te = data.teacherEffectiveness?.find((x: any) => x.teacherId === viewingTeacher.id) as any;
    if (completionRate === 0 && te && te.lessonCompletionRate) {
      completionRate = te.lessonCompletionRate;
    }
    
    // Sessions Conducted
    const sessionsConducted = data.liveSessions?.filter(ls => 
      ls.teacherId === viewingTeacher.id && 
      (ls.status?.toLowerCase() === 'completed' || ls.status?.toLowerCase() === 'done' || ls.status?.toLowerCase() === 'ended' || ls.status?.toLowerCase() === 'active')
    ).length || 0;
    
    // Student Attendance / Participation rate
    let studentParticipation = 0;
    const teacherClassStatus = data.classStatus?.filter(s => s.teacherId === viewingTeacher.id) || [];
    if (teacherClassStatus.length > 0) {
      const conducted = teacherClassStatus.filter(s => s.status === 'conducted').length;
      studentParticipation = Math.round((conducted / teacherClassStatus.length) * 100);
    } else if (te && te.totalScheduled > 0) {
      studentParticipation = Math.round((te.classesCompleted / te.totalScheduled) * 100);
    } else {
      studentParticipation = 84; // default fallback
    }
    
    // Quiz Performance
    const teacherStudents = data.students.filter(s => viewingTeacher.classIds?.includes(s.classId || ""));
    const teacherStudentIds = teacherStudents.map(s => String(s.id));
    const quizResults = data.studentQuizResults.filter(r => teacherStudentIds.includes(String(r.studentId)));
    
    let quizPerformance = 0;
    if (quizResults.length > 0) {
      const totalScore = quizResults.reduce((sum, r) => sum + r.score, 0);
      const totalMax = quizResults.reduce((sum, r) => sum + r.total, 0);
      quizPerformance = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    } else {
      quizPerformance = 72; // default fallback
    }
    
    const classesCount = viewingTeacher.classIds?.length || 0;
    const rankingScore = Math.round((completionRate * 0.3) + (studentParticipation * 0.2) + (sessionsConducted > 0 ? 90 * 0.2 : 0) + (quizPerformance * 0.3)) || 75;
    
    return {
      sessionsConducted,
      syllabusCompletion: completionRate,
      unitProgress: Math.min(100, Math.round(completionRate * 1.1)),
      studentParticipation,
      quizPerformance,
      classesCount,
      rankingScore
    };
  }, [viewingTeacher, data]);

  const syllabusTeacherGrades = useMemo(() => {
    if (!viewingTeacher) return [];
    const grades = new Set<number>();
    
    // 1. Try explicit assigned classIds
    viewingTeacher.classIds?.forEach((cid: string) => {
      const cls = data.classes.find(c => c.id === cid);
      if (cls && cls.grade) grades.add(cls.grade);
    });

    // 2. If explicit assignment is empty, infer dynamically from live sessions
    if (grades.size === 0) {
      data.liveSessions?.forEach(ls => {
        if (ls.teacherId === viewingTeacher.id) {
          const cls = data.classes.find(c => c.id === ls.classId);
          if (cls && cls.grade) grades.add(cls.grade);
        }
      });
    }

    return Array.from(grades).sort((a, b) => a - b);
  }, [viewingTeacher, data.classes, data.liveSessions]);

  const syllabusTeacherSubjects = useMemo(() => {
    if (!viewingTeacher) return [];
    
    // 1. Try explicit viewingTeacher.subjects mapping
    let subjects = data.subjects.filter(s => viewingTeacher.subjects?.includes(s.name));
    
    // 2. If not found, dynamically infer from liveSessions
    if (subjects.length === 0) {
      const teacherSessionSubjects = new Set(
        data.liveSessions?.filter(ls => ls.teacherId === viewingTeacher.id).map(ls => ls.subjectId) || []
      );
      subjects = data.subjects.filter(s => teacherSessionSubjects.has(s.id));
    }

    // Filter down to the selected grade if applicable
    if (syllabusSelectedGrade) {
      subjects = subjects.filter(s => !s.grades || s.grades.includes(syllabusSelectedGrade));
    }
    
    return subjects;
  }, [viewingTeacher, syllabusSelectedGrade, data.subjects, data.liveSessions]);

  const syllabusReportData = useMemo(() => {
    if (!viewingTeacher) return null;
    let targetSubjects = syllabusTeacherSubjects;
    if (syllabusReportType === "individual" && syllabusSelectedSubjectId) {
      targetSubjects = syllabusTeacherSubjects.filter(s => s.id === syllabusSelectedSubjectId);
    }

    let targetGrades = syllabusTeacherGrades;
    if (syllabusReportType === "individual" && syllabusSelectedGrade) {
      targetGrades = [syllabusSelectedGrade];
    }

    const relevantChapters = data.chapters.filter(ch => 
      targetSubjects.some(s => s.id === ch.subjectId) &&
      targetGrades.includes(ch.grade)
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const relevantChapterIds = new Set(relevantChapters.map(c => c.id));
    const relevantTopics = data.topics.filter(t => relevantChapterIds.has(t.chapterId)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const topicStatusMap = new Map<string, string>();
    const teacherLiveSessions = data.liveSessions?.filter(ls => {
      if (ls.teacherId !== viewingTeacher.id) return false;
      if (syllabusReportType === "individual" && syllabusSelectedGrade) {
        const cls = data.classes.find(c => c.id === ls.classId);
        if (cls?.grade !== syllabusSelectedGrade) return false;
      }
      return true;
    }) || [];

    teacherLiveSessions.forEach(ls => {
      const existing = topicStatusMap.get(ls.topicId);
      if (existing === 'completed' || existing === 'done') return;
      const st = ls.status?.toLowerCase();
      if (st === 'completed' || st === 'done' || st === 'ended') {
        topicStatusMap.set(ls.topicId, 'completed');
      } else {
        topicStatusMap.set(ls.topicId, 'in_progress');
      }
    });

    const dynamicTopics = relevantTopics.map(t => {
      const dynamicStatus = topicStatusMap.get(t.id);
      return { ...t, status: dynamicStatus || "not_started" };
    });

    const totalTopics = dynamicTopics.length;
    const completedTopics = dynamicTopics.filter(t => t.status === "completed" || t.status === "done").length;
    let completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    let attendancePct = 0;
    const teacherClassStatus = data.classStatus?.filter(s => s.teacherId === viewingTeacher.id) || [];
    
    if (teacherClassStatus.length > 0) {
      const conducted = teacherClassStatus.filter(s => s.status === 'conducted').length;
      attendancePct = Math.round((conducted / teacherClassStatus.length) * 100);
    } else {
      const te = data.teacherEffectiveness?.find((x: any) => x.teacherId === viewingTeacher.id) as any;
      if (te && te.totalScheduled > 0) {
        attendancePct = Math.round((te.classesCompleted / te.totalScheduled) * 100);
      }
    }

    if (totalTopics === 0) {
      const te = data.teacherEffectiveness?.find((x: any) => x.teacherId === viewingTeacher.id) as any;
      if (te && te.lessonCompletionRate) {
        completionRate = te.lessonCompletionRate;
      }
    }

    return {
      chapters: relevantChapters,
      topics: dynamicTopics,
      attendancePct,
      completionRate
    };

  }, [viewingTeacher, syllabusReportType, syllabusSelectedGrade, syllabusSelectedSubjectId, data.chapters, data.topics, data.classStatus, data.teacherEffectiveness, syllabusTeacherSubjects, syllabusTeacherGrades, data.liveSessions, data.classes]);

  const filteredSyllabusReportData = useMemo(() => {
    if (!syllabusReportData) return { chapters: [], topics: [], attendancePct: 0, completionRate: 0 };
    const query = syllabusSearchQuery.trim().toLowerCase();
    const status = syllabusStatusFilter;

    const filteredTopics = (syllabusReportData.topics || []).filter(t => {
      const matchesQuery = t.name?.toLowerCase().includes(query);
      const isCompleted = t.status === "completed" || t.status === "done";
      const isInProgress = t.status === "in_progress" || t.status === "active";
      const isNotStarted = !isCompleted && !isInProgress;

      let matchesStatus = true;
      if (status === "completed") matchesStatus = isCompleted;
      else if (status === "in_progress") matchesStatus = isInProgress;
      else if (status === "not_started") matchesStatus = isNotStarted;

      return matchesQuery && matchesStatus;
    });

    const filteredChapters = (syllabusReportData.chapters || []).filter(ch => 
      filteredTopics.some(t => t.chapterId === ch.id)
    );

    return {
      ...syllabusReportData,
      chapters: filteredChapters,
      topics: filteredTopics
    };
  }, [syllabusReportData, syllabusSearchQuery, syllabusStatusFilter]);

  useEffect(() => {
    if (syllabusReportData?.chapters) {
      const initialExpanded: Record<string, boolean> = {};
      syllabusReportData.chapters.forEach(ch => {
        initialExpanded[ch.id] = true;
      });
      setExpandedChapters(initialExpanded);
    }
  }, [syllabusReportData?.chapters]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const rawNavItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "schools", label: "Schools", icon: School },
    { 
      id: "teachers", 
      label: "Teachers", 
      icon: Users,
      subItems: [
        { id: "teachers", label: "Teachers Info" },
        { id: "teacher-registration", label: "Teacher Registration" },
        { id: "manage-teachers", label: "Manage Teachers" }
      ]
    },
    { 
      id: "students", 
      label: "Students", 
      icon: GraduationCap,
      subItems: [
        { id: "students", label: "Students Info" },
        { id: "student-registration", label: "Student Registrations" },
        { id: "id-cards", label: "ID Cards & Options" }
      ]
    },
    { id: "materials", label: "Materials", icon: BookOpen },
    { id: "question_bank", label: "Question Bank", icon: HelpCircle },
    { id: "gating", label: "Gating Controls", icon: ShieldCheck },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "announcements", label: "Announcements", icon: MessageSquare },
    { id: "usermanagement", label: "User Management", icon: Shield },
    { id: "logs", label: "Activity Logs", icon: ClipboardList },
    { id: "profile", label: "Profile", icon: Settings },
  ];

  // Keep all state declarations intact ...
  // Since we replaced role="team" with role="admin" and permissions, we handle that here.

  const navItems = rawNavItems.filter(item => {
    if (role === "superadmin") return true; // Super admin sees everything
    if (role === "admin") {
      if (item.id === "profile") return true; // Profile always visible
      // Overview visibility is now controlled by permissions (if specified). By default, it falls through to true if unset.
      
      if (item.id === "usermanagement") return false; // Only superadmin can manage admins
      if (item.id === "logs") return false; // Only superadmin sees audit logs
      if (item.id === "gating") return false; // Only superadmin sees gating

      // For feature tabs, check permissions
      if (permissions && permissions[item.id]) {
        return permissions[item.id] !== 'none';
      }
      
      if (item.id === "announcements") return false; // Strictly Superadmin only
      
      // Other generic tabs (reports) visible to all admins by default or we can check permissions.
      return true;
    }
    return false;
  });

  // When an admin lands on a tab they cannot see, auto-redirect them to their first allowed tab.
  useEffect(() => {
    if (role === "admin") {
      const allowedIds = navItems.flatMap(n => n.subItems ? [n.id, ...n.subItems.map((sub: any) => sub.id)] : [n.id]);
      if (!allowedIds.includes(activeTab)) {
        const firstTab = navItems[0]?.id;
        if (firstTab) setActiveTab(firstTab);
      }
    }
  }, [role, navItems, activeTab]);

  // Sync activeTab → URL hash so refresh preserves the current section
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (activeTab !== currentHash) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // Listen for browser back/forward to update the active tab from hash
  useEffect(() => {
    const onHashChange = () => {
      const tab = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const resolveImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${getApiBase()}/uploads/${path.replace(/^\/+/, "")}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-slate-800">Vidhyaplus</span>
            {role === "superadmin" && (
              <div className="mt-0.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Superadmin
              </div>
            )}
            {role === "admin" && (
              <div className="mt-0.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Administrator
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navItems.map((item: any) => {
            const isExpanded = expandedNavs.includes(item.id);
            const isSubActive = item.subItems?.some((sub: any) => sub.id === activeTab);
            const isActive = activeTab === item.id || isSubActive;
            
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedNavs(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
                      if (!isExpanded && !isSubActive) setActiveTab(item.subItems[0].id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive && !item.subItems
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : isActive && item.subItems
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.subItems && (
                    isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </button>
                
                {item.subItems && isExpanded && (
                  <div className="pl-4 pr-2 py-1 space-y-1">
                    {item.subItems.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveTab(sub.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          activeTab === sub.id 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === sub.id ? "bg-white" : "bg-slate-300"}`} />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Middle Section */}
      <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
        {activeTab !== "announcements" && (
          <header className="mb-8 flex items-center justify-between print:hidden">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome, {userName}</h1>
              <p className="text-slate-500">Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === "overview" && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-500">Overview Date:</span>
                  <input
                    type="date"
                    value={overviewDate}
                    onChange={(e) => setOverviewDate(e.target.value)}
                    className="text-xs p-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-700 font-extrabold font-mono"
                  />
                  {overviewDate !== toISODateStr(new Date()) && (
                    <button
                      onClick={() => setOverviewDate(toISODateStr(new Date()))}
                      className="text-[10px] text-primary hover:text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-md transition-colors"
                      title="Reset to today"
                    >
                     Reset to Today
                    </button>
                  )}
                </div>
              )}
              {activeTab !== "overview" && (
                <div className="relative">
                  {/* Search bar removed per user request */}
                </div>
              )}
              {activeTab === "schools" && (
                <Button className="rounded-xl px-6" onClick={() => { setEditingSchool(null); setSchoolFormOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Add School
                </Button>
              )}
            </div>
          </header>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Overview Content */}
          <TabsContent value="overview" className="relative min-h-[400px] space-y-8 animate-in fade-in duration-300">
            {overviewLoading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-md rounded-3xl transition-all duration-300">
                <div className="flex flex-col items-center space-y-4 bg-white/80 p-8 rounded-3xl border border-slate-100/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl max-w-sm">
                  {/* Premium Spinner */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-slate-800 font-extrabold text-base tracking-tight animate-bounce">Please wait</h4>
                    <p className="text-slate-500 text-xs font-semibold animate-pulse">Loading your data...</p>
                  </div>
                </div>
              </div>
            )}
            <div className={overviewLoading ? "hidden" : "space-y-8"}>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard 
                title="Total Schools" 
                value={overview?.totalSchools || 0} 
                icon={School} 
                color="blue" 
              />
              <SummaryCard 
                title="Total Teachers" 
                value={overview?.totalTeachers || 0} 
                icon={Users} 
                color="purple" 
              />
              <SummaryCard 
                title="Total Students" 
                value={overview?.totalStudents || 0} 
                icon={GraduationCap} 
                color="amber" 
              />
              <SummaryCard 
                title="Session Status" 
                value={`${overview?.sessionsCompleted || 0} / ${overview?.sessionsTotal || 1200}`} 
                icon={Activity} 
                color="green" 
                trend={`${Math.round(((overview?.sessionsCompleted || 0) / (overview?.sessionsTotal || 1200)) * 100)}% coverage`}
              />
            </div>

            {/* Daily Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Attendance Card */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Attendance</h4>
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">
                        {overview?.studentAttendance?.present !== undefined 
                          ? `${overview.studentAttendance.present} Present` 
                          : "No Data"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Daily Attendance Rate</span>
                      <span className="text-teal-600">
                        {overview?.studentAttendance?.total && overview?.studentAttendance?.total > 0
                          ? `${Math.round((overview.studentAttendance.present / overview.studentAttendance.total) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${overview?.studentAttendance?.total && overview?.studentAttendance?.total > 0 
                            ? Math.round((overview.studentAttendance.present / overview.studentAttendance.total) * 100) 
                            : 0}%` 
                        }} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Students</span>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {overview?.studentAttendance?.total ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Absent Students</span>
                      <p className="text-sm font-bold text-rose-500 mt-1">
                        {overview?.studentAttendance?.absent ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Attendance Card */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teacher Attendance</h4>
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">
                        {overview?.teacherAttendance?.present !== undefined 
                          ? `${overview.teacherAttendance.present} Present` 
                          : "No Data"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Daily Attendance Rate</span>
                      <span className="text-purple-600">
                        {overview?.teacherAttendance?.total && overview?.teacherAttendance?.total > 0
                          ? `${Math.round((overview.teacherAttendance.present / overview.teacherAttendance.total) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${overview?.teacherAttendance?.total && overview?.teacherAttendance?.total > 0 
                            ? Math.round((overview.teacherAttendance.present / overview.teacherAttendance.total) * 100) 
                            : 0}%` 
                        }} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Teachers</span>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {overview?.teacherAttendance?.total ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Absent Teachers</span>
                      <p className="text-sm font-bold text-rose-500 mt-1">
                        {overview?.teacherAttendance?.absent ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Metrics Card */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Sessions</h4>
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">
                        {overview?.sessions?.completed !== undefined 
                          ? `${overview.sessions.completed} Completed` 
                          : "No Data"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Daily Completion Rate</span>
                      <span className="text-emerald-600">
                        {overview?.sessions?.total && overview?.sessions?.total > 0
                          ? `${Math.round((overview.sessions.completed / overview.sessions.total) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${overview?.sessions?.total && overview?.sessions?.total > 0 
                            ? Math.round((overview.sessions.completed / overview.sessions.total) * 100) 
                            : 0}%` 
                        }} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Scheduled</span>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {overview?.sessions?.total ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
                      <p className="text-sm font-bold text-amber-500 mt-1">
                        {overview?.sessions?.total && overview?.sessions?.completed !== undefined
                          ? Math.max(0, overview.sessions.total - overview.sessions.completed)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>

            {/* Analytics Charts */}
            {false && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Analytics Card */}
              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-white border-b border-slate-50 py-5 px-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="text-slate-800 text-lg flex items-center gap-2 font-bold font-display">
                      <Activity className="w-5 h-5 text-teal-500" /> Student Analytics
                    </CardTitle>
                    {/* Date selection for Student Analytics */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                        <input 
                          type="date" 
                          value={studentStartDate} 
                          onChange={(e) => setStudentStartDate(e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                        <input 
                          type="date" 
                          value={studentEndDate} 
                          onChange={(e) => setStudentEndDate(e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      {(studentStartDate || studentEndDate) && (
                        <button 
                          onClick={() => { setStudentStartDate(""); setStudentEndDate(""); }}
                          className="text-[10px] text-teal-600 hover:text-teal-800 font-bold bg-teal-50 px-2 py-1 rounded-md transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {studentRangeExceeded ? (
                    <div className="flex flex-col items-center justify-center h-[318px] bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-slate-800">Date Range Too Large</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Please select a date range of 31 days or less to view detailed student analytics.</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Date Info Panel replaced with Range Stats Panel */}
                      {(studentStartDate || studentEndDate) ? (
                        <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50/50 rounded-2xl border border-teal-100/50 flex justify-between items-center mb-4 shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Metrics in Range</p>
                            <p className="text-xs text-slate-500 mt-0.5">Avg: <strong className="text-teal-700 font-mono">{studentStatsInRange.avg}</strong> | Peak: <strong className="text-teal-700 font-mono">{studentStatsInRange.peak}</strong></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">Total Active</p>
                            <span className="text-2xl font-black text-teal-800 font-mono">{studentStatsInRange.total}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center mb-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Students (All History)</p>
                            <p className="text-xs text-slate-400 mt-0.5">Showing all historical records</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-500 font-mono">
                            {filteredStudentData.reduce((sum: number, s: any) => sum + (s.active || 0), 0)}
                          </span>
                        </div>
                      )}

                      <div className="h-[260px] w-full overflow-x-auto select-none scrollbar-thin scrollbar-thumb-slate-200">
                        <div style={{ minWidth: `${Math.max(100, filteredStudentData.length * 35)}px`, height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredStudentData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 11}} 
                                tickFormatter={(str) => {
                                  if (typeof str !== 'string') return '';
                                  const parts = str.split('-');
                                  return parts.length === 3 ? parts[2] : str;
                                }}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                              <Tooltip content={<CustomTooltip />} cursor={false} />
                              <Bar dataKey="active" fill="#1a9988" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Teacher Analytics Card */}
              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-white border-b border-slate-50 py-5 px-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="text-slate-800 text-lg flex items-center gap-2 font-bold font-display">
                      <Users className="w-5 h-5 text-purple-500" /> Teacher Analytics
                    </CardTitle>
                    {/* Date selection for Teacher Analytics */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                        <input 
                          type="date" 
                          value={teacherStartDate} 
                          onChange={(e) => setTeacherStartDate(e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                        <input 
                          type="date" 
                          value={teacherEndDate} 
                          onChange={(e) => setTeacherEndDate(e.target.value)}
                          className="text-xs p-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      {(teacherStartDate || teacherEndDate) && (
                        <button 
                          onClick={() => { setTeacherStartDate(""); setTeacherEndDate(""); }}
                          className="text-[10px] text-purple-600 hover:text-purple-800 font-bold bg-purple-50 px-2 py-1 rounded-md transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {teacherRangeExceeded ? (
                    <div className="flex flex-col items-center justify-center h-[318px] bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-slate-800">Date Range Too Large</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Please select a date range of 31 days or less to view detailed teacher analytics.</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Date Info Panel replaced with Range Stats Panel */}
                      {(teacherStartDate || teacherEndDate) ? (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50/50 rounded-2xl border border-purple-100/50 flex justify-between items-center mb-4 shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Metrics in Range</p>
                            <p className="text-xs text-slate-500 mt-0.5">Avg: <strong className="text-purple-700 font-mono">{teacherStatsInRange.avg}</strong> | Peak: <strong className="text-purple-700 font-mono">{teacherStatsInRange.peak}</strong></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">Total Active</p>
                            <span className="text-2xl font-black text-purple-800 font-mono">{teacherStatsInRange.total}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center mb-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Teachers (All History)</p>
                            <p className="text-xs text-slate-400 mt-0.5">Showing all historical records</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-500 font-mono">
                            {filteredTeacherData.reduce((sum: number, t: any) => sum + (t.active || 0), 0)}
                          </span>
                        </div>
                      )}

                      <div className="h-[260px] w-full overflow-x-auto select-none scrollbar-thin scrollbar-thumb-slate-200">
                        <div style={{ minWidth: `${Math.max(100, filteredTeacherData.length * 35)}px`, height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredTeacherData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 11}} 
                                tickFormatter={(str) => {
                                  if (typeof str !== 'string') return '';
                                  const parts = str.split('-');
                                  return parts.length === 3 ? parts[2] : str;
                                }}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                              <Tooltip content={<CustomTooltip />} cursor={false} />
                              <Bar dataKey="active" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Session Analytics Card */}
              <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300 lg:col-span-2">
                <CardHeader className="bg-white border-b border-slate-50 py-5 px-6">
                  <CardTitle className="text-slate-800 text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold font-display">
                      <BarChart3 className="w-5 h-5 text-orange-500" /> Session Analytics
                    </span>
                    <span className="text-xs text-slate-400 font-semibold font-mono">
                      Total Target: {overview?.sessionsTotal || 1200}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {/* Premium Progress Bar Display */}
                  {(() => {
                    const completed = overview?.sessionsCompleted || 0;
                    const total = overview?.sessionsTotal || 1200;
                    const remaining = Math.max(0, total - completed);
                    const pct = Math.round((completed / total) * 100);
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-end mb-1">
                          <div>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{pct}%</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Syllabus Coverage Progress</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-500 font-mono">{completed} completed</p>
                            <p className="text-xs text-rose-500 font-bold font-mono">{remaining} remaining</p>
                          </div>
                        </div>
                        
                        {/* Progress bar wrapper */}
                        <div className="relative w-full h-5 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/50 shadow-inner flex">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-r-xl shadow-lg shadow-emerald-500/20 transition-all duration-500 relative overflow-hidden" 
                            style={{ width: `${pct}%` }}
                          >
                            {/* Shine effect animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>

                        {/* Stat Pills */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              <span className="text-lg font-extrabold text-slate-800">{completed} Sessions</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Remaining Target</p>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                              <span className="text-lg font-extrabold text-slate-800">{remaining} Sessions</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status Efficiency</p>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              <span className="text-lg font-extrabold text-slate-800">
                                {pct >= 75 ? "Excellent" : pct >= 50 ? "On Track" : "Action Needed"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
            )}
          </TabsContent>

          {/* Students Content */}
          <TabsContent value="students" className="space-y-6">
             <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden mb-6">
               <CardContent className="p-6">
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="space-y-2 flex-1 min-w-[200px]">
                     <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Students</Label>
                     <div className="relative">
                       <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                       <Input 
                         className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-colors h-11 rounded-xl shadow-sm" 
                         placeholder="Name or ID..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                     </div>
                   </div>
                   
                   <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-end">
                     <div className="space-y-2 w-full md:w-48">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">School</Label>
                       <Select value={filterSchool} onValueChange={setFilterSchool}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Schools" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Schools</SelectItem>
                           {[...schools].sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                             <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2 w-full md:w-36">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Class</Label>
                       <Select value={filterClass} onValueChange={setFilterClass}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Classes" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Classes</SelectItem>
                           {Array.from(new Set(classes.map(c => c.grade))).sort((a,b) => a-b).map(g => (
                             <SelectItem key={g} value={String(g)}>{g}th Class</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2 w-full md:w-36">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section</Label>
                       <Select value={filterSection} onValueChange={setFilterSection}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Sections" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Sections</SelectItem>
                           {Array.from(new Set(classes.map(c => c.section))).sort().map(s => (
                             <SelectItem key={s} value={s}>{s}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <Button 
                       variant="outline" 
                       className="rounded-xl h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap" 
                       onClick={() => { setFilterSchool("all"); setFilterClass("all"); setFilterSection("all"); setSearchQuery(""); }}
                     >
                       Reset
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">Student Directory</CardTitle>
                      <p className="text-xs text-slate-500 font-medium">Manage and view student reports</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white px-3 py-1 text-slate-600 border-slate-200 shadow-sm">
                    {students.filter(s => {
                      const studentClass = classes.find(c => c.id === s.classId);
                      const grade = studentClass?.grade;
                      const section = s.section || studentClass?.section;
                      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toString().includes(searchQuery);
                      const matchSchool = filterSchool === "all" || s.schoolId.toString() === filterSchool;
                      const matchClass = filterClass === "all" || grade?.toString() === filterClass;
                      const matchSection = filterSection === "all" || section === filterSection;
                      return matchSearch && matchSchool && matchClass && matchSection;
                    }).length} Students Found
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Class & Section</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">School</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Performance</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students
                          .filter(s => {
                            const studentClass = classes.find(c => c.id === s.classId);
                            const grade = studentClass?.grade;
                            const section = s.section || studentClass?.section;
                            
                            const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toString().includes(searchQuery);
                            const matchSchool = filterSchool === "all" || s.schoolId.toString() === filterSchool;
                            const matchClass = filterClass === "all" || grade?.toString() === filterClass;
                            const matchSection = filterSection === "all" || section === filterSection;
                            return matchSearch && matchSchool && matchClass && matchSection;
                          })
                          .sort((a, b) => {
                            const classA = classes.find(c => c.id === a.classId);
                            const classB = classes.find(c => c.id === b.classId);
                            const gradeA = classA?.grade || 0;
                            const gradeB = classB?.grade || 0;
                            if (gradeA !== gradeB) return gradeA - gradeB;
                            
                            const secA = a.section || classA?.section || '';
                            const secB = b.section || classB?.section || '';
                            if (secA !== secB) return secA.localeCompare(secB);
                            
                            return Number(a.id) - Number(b.id);
                          })
                          .map(s => {
                            const studentClass = classes.find(c => c.id === s.classId);
                            const grade = studentClass?.grade;
                            const section = s.section || studentClass?.section;
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                      {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-800">{s.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold border-0">
                                    {grade ? `${grade} - ${section || ''}` : (section || 'N/A')}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <School className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">{schools.find(sc => sc.id === s.schoolId)?.name || 'Main School'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center">
                                    {(() => {
                                      const results = data.studentQuizResults.filter(r => String(r.studentId) === String(s.id));
                                      if (results.length === 0) return <Badge variant="outline" className="text-slate-400 border-slate-200">N/A</Badge>;
                                      const avg = results.reduce((acc, curr) => acc + (curr.score * 100 / curr.total), 0) / results.length;
                                      const isGood = avg >= 70;
                                      return (
                                        <Badge className={isGood ? "bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold" : "bg-amber-50 text-amber-600 border border-amber-200 font-bold"}>
                                          {Math.round(avg)}%
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg font-semibold transition-colors"
                                    onClick={() => {
                                      const studentClass = classes.find(c => c.id === s.classId);
                                      setAiReportStudentId(s.id);
                                      setAiReportStudentName(s.name);
                                      setAiReportStudentClass(studentClass?.name || "N/A");
                                      setAiReportDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1.5" /> Report
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                  <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">No Students Found</h3>
                                <p className="text-slate-500 font-medium text-sm">Try adjusting your filters or search query.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* Teachers Content */}
          <TabsContent value="teachers" className="space-y-6">
             <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden mb-6">
               <CardContent className="p-6">
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="space-y-2 flex-1 min-w-[200px]">
                     <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Teachers</Label>
                     <div className="relative">
                       <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                       <Input 
                         className="pl-10 bg-slate-50 border-slate-100 focus:bg-white transition-colors h-11 rounded-xl shadow-sm" 
                         placeholder="Name or Subject..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                       />
                     </div>
                   </div>
                   
                   <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-end">
                     <div className="space-y-2 w-full md:w-48">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">School</Label>
                       <Select value={filterSchool} onValueChange={setFilterSchool}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Schools" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Schools</SelectItem>
                           {[...schools].sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                             <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2 w-full md:w-40">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject</Label>
                       <Select value={filterSubject} onValueChange={setFilterSubject}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Subjects" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Subjects</SelectItem>
                           {[...subjects].sort((a,b) => a.name.localeCompare(b.name)).map(sub => (
                             <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2 w-full md:w-36">
                       <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section</Label>
                       <Select value={filterSection} onValueChange={setFilterSection}>
                         <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500">
                           <SelectValue placeholder="All Sections" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All Sections</SelectItem>
                           {Array.from(new Set(classes.map(c => c.section))).sort().map(s => (
                             <SelectItem key={s} value={s}>{s}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <Button 
                       variant="outline" 
                       className="rounded-xl h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap" 
                       onClick={() => { setFilterSchool("all"); setFilterSubject("all"); setFilterSection("all"); setSearchQuery(""); }}
                     >
                       Reset
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">Teacher Directory</CardTitle>
                      <p className="text-xs text-slate-500 font-medium">Manage and view teacher performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-white px-3 py-1 text-slate-600 border-slate-200 shadow-sm">
                      {teachers.filter(t => {
                        const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchSchool = filterSchool === "all" || t.schoolId?.toString() === filterSchool;
                        const matchSubject = filterSubject === "all" || (t.subjects && t.subjects.includes(filterSubject));
                        return matchSearch && matchSchool && matchSubject;
                      }).length} Teachers Found
                    </Badge>
                    <Button className="rounded-xl px-4 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { 
                      setEditingTeacher(null); 
                      setTeacherForm({ full_name: "", email: "", school_id: "", password: "" });
                      setTeacherFormOpen(true); 
                    }}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Teacher
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Teacher Name</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">School</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Subject(s)</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teachers
                          .filter(t => {
                            const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchSchool = filterSchool === "all" || t.schoolId?.toString() === filterSchool;
                            const matchSubject = filterSubject === "all" || (t.subjects && t.subjects.includes(filterSubject));
                            return matchSearch && matchSchool && matchSubject;
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(t => {
                            const teacherSubjects = t.subjects && Array.isArray(t.subjects) ? t.subjects.join(", ") : "";
                            return (
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                                      {t.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-800">{t.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <School className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">{schools.find(sc => sc.id === t.schoolId)?.name || 'Main School'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-medium text-slate-600">
                                    {teacherSubjects ? teacherSubjects : <span className="text-slate-400 italic">Not Assigned</span>}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm font-bold">Active</Badge>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-primary hover:bg-primary/5 rounded-lg font-semibold transition-colors"
                                    onClick={() => setViewingTeacher(t)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" /> View Profile
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        {teachers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                  <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">No Teachers Found</h3>
                                <p className="text-slate-500 font-medium text-sm">Try adjusting your filters or search query.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* New Sub-pages for Students & Teachers */}
          <TabsContent value="student-registration" className="space-y-6">
            <AdminSchoolContextWrapper 
              title="Student Registration" 
              description="Select a school to register new students individually or in bulk."
            >
              <StudentRegistrationWizard />
            </AdminSchoolContextWrapper>
          </TabsContent>

          <TabsContent value="id-cards" className="space-y-6">
            <AdminSchoolContextWrapper 
              title="ID Card Generator" 
              description="Select a school to generate ID cards and Option Cards for students."
            >
              <IdCardGenerator isEmbedded={true} />
            </AdminSchoolContextWrapper>
          </TabsContent>

          <TabsContent value="teacher-registration" className="space-y-6">
            <AdminSchoolContextWrapper 
              title="Teacher Registration" 
              description="Select a school to register new teachers individually or in bulk."
            >
              <TeacherRegistration />
            </AdminSchoolContextWrapper>
          </TabsContent>

          <TabsContent value="manage-teachers" className="space-y-6">
            <AdminSchoolContextWrapper 
              title="Manage Teachers" 
              description="Select a school to assign subjects and sections to teachers."
            >
              <AdminManageTeachers />
            </AdminSchoolContextWrapper>
          </TabsContent>

          {/* Materials Content */}
          <TabsContent value="materials" className="space-y-6">
            <MaterialManagement />
          </TabsContent>

          {/* Question Bank Content */}
          <TabsContent value="question_bank" className="space-y-6">
            <QuestionBankPanel subjects={subjects} />
          </TabsContent>

          {/* User Management Content */}
          <TabsContent value="usermanagement" className="space-y-6">
            <UserManagementPanel />
          </TabsContent>

          {/* Logs Content */}
          <TabsContent value="logs" className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" /> System Audit Logs
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Immutable trail of all Create / Update / Delete operations</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-0 px-4 py-1.5 text-sm font-bold rounded-full">
                  {auditTotal.toLocaleString()} events
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => { setAuditFilters({ ...auditFilters }); }}
                >
                  <Activity className="w-4 h-4" /> Refresh
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Role */}
                  <div className="space-y-1.5 w-40">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actor Role</Label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={auditPendingFilters.actor_role}
                      onChange={(e) => setAuditPendingFilters(f => ({ ...f, actor_role: e.target.value }))}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="principal">Principal</option>
                      <option value="teacher">Teacher</option>
                      <option value="team">Team</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  {/* Entity */}
                  <div className="space-y-1.5 w-48">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entity</Label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={auditPendingFilters.entity}
                      onChange={(e) => setAuditPendingFilters(f => ({ ...f, entity: e.target.value }))}
                    >
                      <option value="">All Entities</option>
                      <option value="admin">Admin</option>
                      <option value="team">Team</option>
                      <option value="teacher">Teacher</option>
                      <option value="teacher_bulk">Teacher Bulk</option>
                      <option value="teacher_attendance">Teacher Attendance</option>
                      <option value="teacher_assignment">Teacher Assignment</option>
                      <option value="teacher_subjects">Teacher Subjects</option>
                      <option value="student">Student</option>
                      <option value="school">School</option>
                      <option value="subject">Subject</option>
                      <option value="section">Section</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  {/* Action */}
                  <div className="space-y-1.5 w-36">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action</Label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={auditPendingFilters.action}
                      onChange={(e) => setAuditPendingFilters(f => ({ ...f, action: e.target.value }))}
                    >
                      <option value="">All Actions</option>
                      <option value="CREATE">CREATE</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  {/* From date */}
                  <div className="space-y-1.5 w-40">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From</Label>
                    <input
                      type="date"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={auditPendingFilters.from}
                      onChange={(e) => setAuditPendingFilters(f => ({ ...f, from: e.target.value }))}
                    />
                  </div>
                  {/* To date */}
                  <div className="space-y-1.5 w-40">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To</Label>
                    <input
                      type="date"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={auditPendingFilters.to}
                      onChange={(e) => setAuditPendingFilters(f => ({ ...f, to: e.target.value }))}
                    />
                  </div>
                  {/* Buttons */}
                  <div className="flex gap-2 pb-0.5">
                    <Button
                      className="rounded-xl h-10 px-6"
                      onClick={() => { setAuditFilters({ ...auditPendingFilters }); setAuditPage(1); }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-10"
                      onClick={() => {
                        const empty = { actor_role: "", entity: "", action: "", from: "", to: "" };
                        setAuditPendingFilters(empty);
                        setAuditFilters(empty);
                        setAuditPage(1);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Pills */}
            {auditLogs.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {(["CREATE", "UPDATE", "DELETE"] as const).map((act) => {
                  const count = auditLogs.filter(l => l.action === act).length;
                  const styles: Record<string, string> = {
                    CREATE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                    UPDATE: "bg-amber-50 text-amber-700 border border-amber-200",
                    DELETE: "bg-red-50 text-red-700 border border-red-200",
                  };
                  return (
                    <span key={act} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${styles[act]}`}>
                      <span className={`w-2 h-2 rounded-full ${act === "CREATE" ? "bg-emerald-500" : act === "UPDATE" ? "bg-amber-500" : "bg-red-500"}`} />
                      {act}: {count}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Table */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-400 text-sm">Loading audit logs…</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-16">ID</th>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actor</th>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Action</th>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Entity</th>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-44">Time (IST)</th>
                          <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-16 text-center">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center gap-3 text-slate-400">
                                <ClipboardList className="w-10 h-10 opacity-30" />
                                <p className="text-sm font-medium">No audit logs found</p>
                                <p className="text-xs">Try adjusting your filters or date range</p>
                              </div>
                            </td>
                          </tr>
                        ) : auditLogs.map((log) => {
                          const actionStyles: Record<string, string> = {
                            CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
                            UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
                            DELETE: "bg-red-100 text-red-700 border-red-200",
                          };
                          const roleStyles: Record<string, string> = {
                            admin: "bg-purple-100 text-purple-700",
                            principal: "bg-blue-100 text-blue-700",
                            teacher: "bg-teal-100 text-teal-700",
                            team: "bg-orange-100 text-orange-700",
                            student: "bg-indigo-100 text-indigo-700",
                          };
                          const timeIST = new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata"
                          }).format(new Date(log.created_at));
                          const isExpanded = expandedLog === log.id;
                          return (
                            <Fragment key={log.id}>
                              <tr
                                key={log.id}
                                className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50" : ""}`}
                                onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                              >
                                <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">#{log.id}</td>
                                <td className="px-5 py-3.5">
                                  <p className="text-sm font-semibold text-slate-800">{log.actor_name || `ID ${log.actor_id}`}</p>
                                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleStyles[log.actor_role] || "bg-slate-100 text-slate-500"}`}>
                                    {log.actor_role}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${actionStyles[log.action] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <p className="text-sm text-slate-700 font-medium">{log.entity}</p>
                                  {log.entity_id && <p className="text-xs text-slate-400 font-mono">/{log.entity_id}</p>}
                                </td>
                                <td className="px-5 py-3.5 text-xs text-slate-500">{timeIST}</td>
                                <td className="px-5 py-3.5 text-center">
                                  <button className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${isExpanded ? "bg-primary text-white" : "bg-slate-100 text-slate-400 hover:bg-primary/10 hover:text-primary"}`}>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  </button>
                                </td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${log.id}-expanded`} className="bg-slate-50/80">
                                    <td colSpan={6} className="px-6 py-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div className="space-y-1">
                                          <p className="font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                            {log.status}
                                          </span>
                                          {log.error_msg && <p className="text-red-500 mt-1">{log.error_msg}</p>}
                                        </div>
                                        <div className="space-y-1">
                                          <p className="font-bold text-slate-400 uppercase tracking-wider">Action Summary</p>
                                          {log.meta ? (
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600">
                                              <p className="font-medium mb-2">Modified Fields:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {Object.keys(log.meta).map(key => (
                                                  <Badge key={key} variant="secondary" className="bg-white text-slate-500 border-slate-200 capitalize">
                                                    {key.replace(/_/g, ' ')}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-slate-400">No additional details</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                >
                  ← Prev
                </Button>
                <span className="text-sm text-slate-500 font-medium">
                  Page <span className="font-bold text-slate-800">{auditPage}</span> of <span className="font-bold text-slate-800">{auditTotalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                >
                  Next →
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab Content */}
          <TabsContent value="announcements" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Broadcast Announcements</h2>
                <p className="text-slate-500 text-sm mt-0.5">Create, broadcast, and review historical announcements sent to schools and users.</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-semibold">Admin Panel</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Compose Broadcast */}
              <div className="lg:col-span-5">
                <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden sticky top-24">
                  <div className="bg-slate-50/80 border-b border-slate-100 p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-teal-600" />
                      </div>
                      Broadcast New Message
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mt-2">Publish an announcement that will be displayed in user dashboards instantly.</p>
                  </div>
                  <CardContent className="p-6">
                    <form onSubmit={handleTabSendAnnouncement} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Announcement Title</Label>
                        <Input
                          placeholder="e.g. Server Maintenance Notice"
                          value={tabAnnouncementTitle}
                          onChange={(e) => setTabAnnouncementTitle(e.target.value)}
                          className="rounded-xl border-slate-100 h-12 bg-slate-50 focus-visible:ring-teal-500 text-slate-800 font-medium shadow-sm transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Audience</Label>
                        <Select value={tabAnnouncementTarget} onValueChange={setTabAnnouncementTarget}>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-teal-500 font-medium text-slate-700">
                            <SelectValue placeholder="Select Target Audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Everyone (All Roles)</SelectItem>
                            <SelectItem value="teachers">Teachers Only</SelectItem>
                            <SelectItem value="principals">Principals Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message Content</Label>
                        <textarea
                          className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none text-slate-700 leading-relaxed font-medium shadow-sm"
                          placeholder="Type your broadcast announcement message here..."
                          value={tabAnnouncement}
                          onChange={(e) => setTabAnnouncement(e.target.value)}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={tabSending}
                        className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        {tabSending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Radio className="w-4 h-4" />
                            <span>Publish Broadcast</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Broadcast History */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-0 shadow-sm rounded-3xl bg-white p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Broadcast History
                    </h3>
                    <Badge variant="outline" className="text-slate-500 font-bold border-slate-200">
                      {adminAnnouncements.length} Sent
                    </Badge>
                  </div>

                  {loadingAnnouncements ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 animate-pulse text-sm font-medium">Retrieving announcement history...</p>
                    </div>
                  ) : adminAnnouncements.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl">
                      <Radio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="text-slate-700 font-bold text-base">No Broadcasts Yet</h4>
                      <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">Use the compose form on the left to broadcast your very first system announcement.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                      {adminAnnouncements.map((ann) => {
                        const dateFormatted = ann.created_at
                          ? new Intl.DateTimeFormat("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Asia/Kolkata",
                            }).format(new Date(ann.created_at))
                          : "Unknown time";

                        const audienceBadgeColors: Record<string, string> = {
                          all: "bg-emerald-50 text-emerald-700 border-emerald-100",
                          teachers: "bg-blue-50 text-blue-700 border-blue-100",
                          principals: "bg-purple-50 text-purple-700 border-purple-100",
                        };

                        const audienceLabels: Record<string, string> = {
                          all: "All Users",
                          teachers: "Teachers Only",
                          principals: "Principals Only",
                        };

                        return (
                          <div
                            key={ann.id}
                            className="p-5 border border-slate-100 hover:border-slate-200 rounded-2xl bg-slate-50/40 hover:bg-slate-50 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h4 className="font-bold text-slate-800 text-base leading-tight">
                                  {ann.title || "Admin Announcement"}
                                </h4>
                                <span className="text-slate-400 text-xs font-semibold block mt-1">
                                  {dateFormatted}
                                </span>
                              </div>
                              <Badge
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                                  audienceBadgeColors[ann.target_role || "all"] || audienceBadgeColors.all
                                }`}
                              >
                                {audienceLabels[ann.target_role || "all"] || audienceLabels.all}
                              </Badge>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                              {ann.message}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Gating Controls Content */}
          <TabsContent value="gating" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Teacher Competency Gating</h2>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">Advanced Control</Badge>
            </div>
            <GatingAdminPanel />
          </TabsContent>

          {/* Profile Content */}
          <TabsContent value="profile" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <AdminProfile />
          </TabsContent>

          {/* Schools Content */}
          <TabsContent value="schools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...schools]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(school => (
                <Card key={school.id} className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg font-bold text-slate-800">{school.name}</CardTitle>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{school.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={school.activeStatus ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}>
                        {school.activeStatus ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { 
                        setEditingSchool({ 
                          id: school.id, 
                          name: school.name, 
                          code: school.code, 
                          district: school.district, 
                          mandal: school.mandal, 
                          sessionsCompleted: school.sessionsCompleted, 
                          activeStatus: school.activeStatus,
                          principalName: school.principalName,
                          principalEmail: school.principalEmail
                        }); 
                        setSchoolFormOpen(true); 
                      }}>
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => { if (window.confirm("Delete this school?")) deleteSchool(school.id).then(() => refetch()); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">District:</span>
                      <span className="font-medium text-slate-800">{school.district}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Teachers:</span>
                      <span className="font-medium text-slate-800">{school.teachers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Students:</span>
                      <span className="font-medium text-slate-800">{school.students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Avg. Performance:</span>
                      <span className="font-bold text-primary">
                        {(() => {
                          const schoolStudents = students.filter(s => s.schoolId === school.id).map(s => String(s.id));
                          const results = data.studentQuizResults.filter(r => schoolStudents.includes(String(r.studentId)));
                          if (results.length === 0) return "N/A";
                          const avg = results.reduce((acc, curr) => acc + (curr.score * 100 / curr.total), 0) / results.length;
                          return `${Math.round(avg)}%`;
                        })()}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => setViewingSchool(school)}
                      >
                        View Details
                      </Button>
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-rose-500 uppercase">Live Session</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowLiveMonitor(true)}>
                          <ChevronRight className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Content */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Live Sessions Monitor Toggle Button (Floating) */}
      <div className="fixed bottom-8 right-8 z-50 transition-all duration-300">
        <Button 
          className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 bg-primary hover:bg-primary-hover"
          onClick={() => setShowLiveMonitor(!showLiveMonitor)}
        >
          <MonitorPlay className="w-6 h-6" />
        </Button>
      </div>

      {/* Live Monitor Panel */}
      {showLiveMonitor && (
        <Card className="fixed bottom-24 right-8 w-96 z-50 shadow-2xl border-0 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 transition-all duration-300">
          <CardHeader className="bg-primary text-white flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" /> Live Sessions ({activeSessions.length})
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowLiveMonitor(false)}>
              Minimize
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {activeSessions.length > 0 ? (
              activeSessions.map(session => (
                <div key={session.id} className="p-4 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{session.topicName}</p>
                    <p className="text-xs text-slate-500">{session.className} • {session.teacherName}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 px-3">
                    Watch
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No ongoing sessions</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Profile Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogTitle className="sr-only">Student Profile: {selectedStudent?.name}</DialogTitle>
          <div className="relative h-32 bg-primary">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {selectedStudent?.profile_image_url ? (
                  <img src={selectedStudent.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>
          </div>
          <div className="pt-16 pb-8 px-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent?.name}</h2>
                <p className="text-primary font-medium">#{selectedStudent?.id}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-0 px-4 py-1.5 rounded-full">
                Hosteller: {selectedStudent?.is_hosteller ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-50">
              <DetailItem label="School" value={schools.find(s => s.id === selectedStudent?.schoolId)?.name || 'Main School'} />
              {(() => {
                const studentClass = classes.find(c => c.id === selectedStudent?.classId);
                const grade = studentClass?.grade;
                const section = selectedStudent?.section || studentClass?.section;
                return <DetailItem label="Class" value={grade ? `${grade} - ${section || ''}` : (section || 'N/A')} />;
              })()}
              <DetailItem label="Phone" value={selectedStudent?.phone_number || 'N/A'} />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <DetailItem label="Village" value={selectedStudent?.village || 'N/A'} />
              <DetailItem label="Mandal" value={selectedStudent?.mandal || 'N/A'} />
              <DetailItem label="District" value={selectedStudent?.district || 'N/A'} />
              <DetailItem label="State" value={selectedStudent?.state || 'Andhra Pradesh'} />
              <DetailItem label="Pincode" value={selectedStudent?.pincode || 'N/A'} />
              <DetailItem label="Address" value={selectedStudent?.address || 'N/A'} />
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Individual Performance
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.studentQuizResults.filter(r => String(r.studentId) === String(selectedStudent?.id))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 10}} 
                      tickFormatter={(val) => val ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey={(r) => Math.round(r.score * 100 / r.total)} 
                      name="Score (%)"
                      stroke="#1a9988" 
                      strokeWidth={3} 
                      dot={{r: 4, fill: '#1a9988'}} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* School Details Dialog */}
      <Dialog open={!!viewingSchool} onOpenChange={() => setViewingSchool(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-white max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">School Details: {viewingSchool?.name}</DialogTitle>
          <div className="bg-primary p-8 text-white shrink-0">
             <div className="flex justify-between items-start">
               <div>
                 <Badge className="bg-white/20 text-white border-0 mb-2">{viewingSchool?.code}</Badge>
                 <h2 className="text-3xl font-bold font-display">{viewingSchool?.name}</h2>
                 <p className="text-white/70 flex items-center gap-1 mt-1">
                   <Activity className="w-4 h-4" /> {viewingSchool?.district} District
                 </p>
               </div>
               <div className="text-right">
                 <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Status</p>
                 <Badge className="bg-emerald-400 text-primary font-bold mt-1">
                   {viewingSchool?.activeStatus ? "ACTIVE" : "INACTIVE"}
                 </Badge>
               </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-6">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Teachers</p>
                  <p className="text-2xl font-bold text-slate-800">{teachers.filter(t => t.schoolId === viewingSchool?.id).length}</p>
                </Card>
                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Students</p>
                  <p className="text-2xl font-bold text-slate-800">{students.filter(s => s.schoolId === viewingSchool?.id).length}</p>
                </Card>
                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Classes</p>
                  <p className="text-2xl font-bold text-slate-800">{Array.from(new Set(classes.filter(c => c.schoolId === viewingSchool?.id).map(c => c.grade))).length}</p>
                </Card>
                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sections</p>
                  <p className="text-2xl font-bold text-slate-800">{classes.filter(c => c.schoolId === viewingSchool?.id).length}</p>
                </Card>
                <Card className="bg-slate-50 border-0 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sessions</p>
                  <p className="text-2xl font-bold text-slate-800">{data.liveSessions.filter(ls => classes.filter(c => c.schoolId === viewingSchool?.id).map(c => c.id).includes(ls.classId)).length}</p>
                </Card>
             </div>

             <Tabs defaultValue="school-teachers" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="school-teachers" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Teachers</TabsTrigger>
                  <TabsTrigger value="school-students" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Students</TabsTrigger>
                  <TabsTrigger value="school-sessions" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="school-teachers">
                   <div className="overflow-hidden border border-slate-100 rounded-2xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Subject</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {teachers.filter(t => t.schoolId === viewingSchool?.id).map(t => {
                            const teacherSubjects = t.subjects && Array.isArray(t.subjects) ? t.subjects.join(", ") : "";
                            return (
                              <tr key={t.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 text-right">{teacherSubjects || 'Not Assigned'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                   </div>
                </TabsContent>

                <TabsContent value="school-students">
                   <div className="overflow-hidden border border-slate-100 rounded-2xl">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider text-center">Performance</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {students
                            .filter(s => s.schoolId === viewingSchool?.id)
                            .sort((a, b) => {
                              const classA = classes.find(c => c.id === a.classId);
                              const classB = classes.find(c => c.id === b.classId);
                              const gradeA = classA?.grade || 0;
                              const gradeB = classB?.grade || 0;
                              if (gradeA !== gradeB) return gradeA - gradeB;
                              
                              const secA = a.section || classA?.section || '';
                              const secB = b.section || classB?.section || '';
                              if (secA !== secB) return secA.localeCompare(secB);
                              
                              return Number(a.id) - Number(b.id);
                            })
                            .map(s => {
                            const studentClass = classes.find(c => c.id === s.classId);
                            const grade = studentClass?.grade;
                            const section = s.section || studentClass?.section;
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{grade ? `${grade} - ${section || ''}` : (section || 'N/A')}</td>
                                <td className="px-6 py-4 text-center">
                                  <Badge variant="outline" className="text-primary font-bold">
                                    {(() => {
                                      const results = data.studentQuizResults.filter(r => String(r.studentId) === String(s.id));
                                      if (results.length === 0) return "N/A";
                                      const avg = results.reduce((acc, curr) => acc + (curr.score * 100 / curr.total), 0) / results.length;
                                      return `${Math.round(avg)}%`;
                                    })()}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-primary border-primary/20 hover:bg-primary/5 rounded-lg font-semibold"
                                    onClick={() => {
                                      const studentClass = classes.find(c => c.id === s.classId);
                                      const att = data.studentAttendance?.find((a: any) => a.studentId === s.id);
                                      const quizResultsList = data.studentQuizResults.filter((r: any) => String(r.studentId) === String(s.id) && (r.assessmentType === 'live_quiz' || r.assessmentType === 'assessment'));
                                      const quizScore = quizResultsList.reduce((sum: number, r: any) => sum + r.score, 0);
                                      const totalQuizMax = quizResultsList.reduce((sum: number, r: any) => sum + r.total, 0) || 20;
                                      const fa1Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'fa1');
                                      const sa1Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'sa1');
                                      const mockFA1 = fa1Result && fa1Result.total > 0 ? Math.round((fa1Result.score / fa1Result.total) * 100) : 0;
                                      const mockSA1 = sa1Result && sa1Result.total > 0 ? Math.round((sa1Result.score / sa1Result.total) * 100) : 0;
                                      const mockPerfIndex = Math.floor((mockFA1/100)*30 + (mockSA1/100)*40 + (quizScore/totalQuizMax)*20 + ((att?.percentage || 0)/100)*10) || 0;

                                      const promise = fetch(`${getApiBase()}/api/ai/report-card`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ studentName: s.name, studentId: s.id })
                                      }).then(res => res.json()).then(resData => {
                                        setAiReportContent(resData.report);
                                        setAiReportStudentName(s.name);
                                          const studentSubjects = data.subjects.filter((sub: any) => sub.grades?.includes(studentClass?.grade));
                                        const realSubjectGrades = studentSubjects.length > 0 ? studentSubjects.map((sub: any) => {
                                          const subChaps = data.chapters.filter((ch: any) => ch.subjectId === sub.id);
                                          const subMarks = data.studentQuizResults.filter((r: any) => 
                                            String(r.studentId) === String(s.id) && 
                                            subChaps.some((ch: any) => ch.id === r.chapterId)
                                          );
                                          
                                          const getScore = (type: string) => subMarks.find((r: any) => r.assessmentType?.toUpperCase() === type)?.score || "—";
                                          
                                          const totalScore = subMarks.reduce((sum: number, r: any) => sum + r.score, 0);
                                          const totalMax = subMarks.reduce((sum: number, r: any) => sum + r.total, 0);
                                          const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
                                          
                                          let gradeVal = "C";
                                          if (pct >= 90) gradeVal = "A+";
                                          else if (pct >= 80) gradeVal = "A";
                                          else if (pct >= 70) gradeVal = "B+";
                                          else if (pct >= 60) gradeVal = "B";
                                          else if (pct >= 50) gradeVal = "C+";

                                          return {
                                            name: sub.name,
                                            fa1: getScore('FA1'),
                                            fa2: getScore('FA2'),
                                            fa3: getScore('FA3'),
                                            fa4: getScore('FA4'),
                                            sa1: getScore('SA1'),
                                            sa2: getScore('SA2'),
                                            quiz: totalMax > 0 ? Math.round((totalScore / (totalMax || 1)) * 50) : 0,
                                            grade: gradeVal
                                          };
                                        }) : [
                                          { name: "No Data", fa1: "—", fa2: "—", fa3: "—", fa4: "—", sa1: "—", sa2: "—", quiz: 0, grade: "—" }
                                        ];

                                        setAiReportData({
                                          attendance: att?.percentage || 0,
                                          perfIndex: mockPerfIndex,
                                          rollNumber: (s as any).rollNo || "N/A",
                                          quizScore: quizScore,
                                          quizTotal: totalQuizMax,
                                          academicYear: "2023-24",
                                          className: studentClass?.name || "N/A",
                                          subjectGrades: realSubjectGrades
                                        });
                                        setAiReportDialogOpen(true);
                                        return resData;
                                      });

                                      toast.promise(
                                        promise,
                                        {
                                          loading: `Generating Report Card for ${s.name}...`,
                                          success: `Report Card Generated for ${s.name}!`,
                                          error: 'Failed to generate report card'
                                        }
                                      );
                                    }}
                                  >
                                    View Report
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                   </div>
                </TabsContent>

                <TabsContent value="school-sessions">
                  {viewingSchool && <SessionAnalytics schoolId={viewingSchool.id} />}
                </TabsContent>
             </Tabs>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
             <Button variant="ghost" onClick={() => setViewingSchool(null)}>Close Details</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* School Form Dialog */}
      <Dialog open={schoolFormOpen} onOpenChange={setSchoolFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchool ? "Edit School" : "Add School"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSchoolSubmit} className="grid gap-4 pt-2">
            <div>
              <Label>Name</Label>
              <Input value={schoolForm.name} onChange={(e) => setSchoolForm(f => ({ ...f, name: e.target.value }))} placeholder="School name" required />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={schoolForm.code} onChange={(e) => setSchoolForm(f => ({ ...f, code: e.target.value }))} placeholder="School code" required />
            </div>
            <div>
              <Label>District</Label>
              <Input value={schoolForm.district} onChange={(e) => setSchoolForm(f => ({ ...f, district: e.target.value }))} placeholder="District" required />
            </div>
            <div>
              <Label>School Logo</Label>
              <div className="flex items-center gap-4 mt-1">
                <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border">
                  {schoolForm.logo ? (
                    <img src={URL.createObjectURL(schoolForm.logo)} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <School className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Input type="file" accept="image/*" onChange={(e) => setSchoolForm(f => ({ ...f, logo: e.target.files?.[0] || null }))} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Mandal</Label>
              <Input value={schoolForm.mandal} onChange={(e) => setSchoolForm(f => ({ ...f, mandal: e.target.value }))} placeholder="Mandal (optional)" />
            </div>
            <div>
              <Label>Sessions completed</Label>
              <Input type="number" min={0} value={schoolForm.sessionsCompleted} onChange={(e) => setSchoolForm(f => ({ ...f, sessionsCompleted: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="school-active" checked={schoolForm.activeStatus} onChange={(e) => setSchoolForm(f => ({ ...f, activeStatus: e.target.checked }))} />
              <Label htmlFor="school-active" className="cursor-pointer">Active</Label>
            </div>

            <div className="space-y-3 mt-2 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-primary">{editingSchool ? "Edit Principal Credentials" : "Principal Credentials"}</p>
              <div>
                <Label>Principal Name</Label>
                <Input value={schoolForm.principalName} onChange={(e) => setSchoolForm(f => ({ ...f, principalName: e.target.value }))} placeholder="Dr. Maheshwar Rao" />
              </div>
              <div>
                <Label>Principal Email</Label>
                <Input type="email" value={schoolForm.principalEmail} onChange={(e) => setSchoolForm(f => ({ ...f, principalEmail: e.target.value }))} placeholder="principal@school.edu" autoComplete="off" />
              </div>
              <div>
                <Label>Principal Password {editingSchool && "(leave blank to keep current)"}</Label>
                <Input type="password" value={schoolForm.principalPassword} onChange={(e) => setSchoolForm(f => ({ ...f, principalPassword: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setSchoolFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={schoolSubmitting}>{editingSchool ? "Update" : "Add"} School</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* AI Report Card Result Dialog */}
      <Dialog open={aiReportDialogOpen} onOpenChange={setAiReportDialogOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[95vh] p-0 overflow-y-auto border-none shadow-2xl rounded-3xl bg-[#F8FAFC]">
          <div className="bg-white sticky top-0 z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
            <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">AI Generated Report</DialogTitle>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => downloadReport(aiReportStudentName)}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 shadow-lg shadow-primary/20 gap-2 border-none h-10"
              >
                <Download className="w-4 h-4" /> DOWNLOAD PDF
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAiReportDialogOpen(false)}
                className="bg-white/80 hover:bg-slate-50 border-slate-200 rounded-xl h-10 w-10"
              >
                <X className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
          <div className="p-6" ref={reportRef}>
            <StudentReportCard
              studentId={aiReportStudentId}
              studentName={aiReportStudentName}
              className={aiReportStudentClass}
              schoolName="VidhyaPlus Academy"
              onClose={() => setAiReportDialogOpen(false)}
              onDownload={() => downloadReport(aiReportStudentName)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <TeacherReportsDialog 
        open={reportModalOpen} 
        onOpenChange={setReportModalOpen} 
        teacherId={selectedReportTeacherId} 
      />

      {/* Teacher Form Dialog */}
      <Dialog open={teacherFormOpen} onOpenChange={setTeacherFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTeacherSubmit} className="grid gap-4 pt-2">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={teacherForm.full_name} 
                onChange={(e) => setTeacherForm(f => ({ ...f, full_name: e.target.value }))} 
                placeholder="Teacher name" 
                required 
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                value={teacherForm.email} 
                onChange={(e) => setTeacherForm(f => ({ ...f, email: e.target.value }))} 
                placeholder="teacher@school.edu" 
                required 
                autoComplete="off"
              />
            </div>
            <div>
              <Label>School</Label>
              <Select 
                value={teacherForm.school_id} 
                onValueChange={(v) => setTeacherForm(f => ({ ...f, school_id: v }))}
              >
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary">
                  <SelectValue placeholder="Select School" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password {editingTeacher && "(leave blank to keep current)"}</Label>
              <Input 
                type="password" 
                value={teacherForm.password} 
                onChange={(e) => setTeacherForm(f => ({ ...f, password: e.target.value }))} 
                placeholder="••••••••" 
                autoComplete="new-password" 
                required={!editingTeacher}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setTeacherFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={teacherSubmitting}>{editingTeacher ? "Update" : "Add"} Teacher</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Teacher View Profile Dialog */}
      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-slate-50 max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">Teacher Profile: {viewingTeacher?.name}</DialogTitle>
          
          <div className="bg-primary p-6 text-white shrink-0">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold text-2xl border border-white/20 shadow-md">
                  {viewingTeacher?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display">{viewingTeacher?.name}</h2>
                  <p className="text-white/70 flex items-center gap-1.5 mt-1 text-sm">
                    <Mail className="w-4 h-4" /> {viewingTeacher?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditingProfile ? (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all flex items-center gap-1.5"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Save Profile
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold transition-all"
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset edited fields to viewingTeacher
                        setEditedName(viewingTeacher.name || "");
                        setEditedEmail(viewingTeacher.email || "");
                        setEditedSchoolId(viewingTeacher.schoolId || "");
                        setEditedPhone(viewingTeacher.phone || "");
                        setEditedDesignation(viewingTeacher.designation || "");
                        setEditedExperience(viewingTeacher.experience || "");
                        setEditedSkills(viewingTeacher.skills || "");
                        setEditedHighestQualification(viewingTeacher.highest_qualification || "");
                        setEditedClassIds(viewingTeacher.classIds || []);
                        setEditedPassword("");
                        const matchedSubjectIds = data.subjects
                          .filter(s => viewingTeacher.subjects?.includes(s.name))
                          .map(s => s.id);
                        setEditedSubjectIds(matchedSubjectIds);
                      }}
                      disabled={profileSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold transition-all flex items-center gap-1.5"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white font-bold transition-all flex items-center gap-1.5"
                      onClick={() => handleDeleteTeacher(viewingTeacher.id)}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Teacher
                    </Button>
                  </>
                )}
                <Badge className="bg-emerald-400 text-primary font-bold">
                  ACTIVE
                </Badge>
              </div>
            </div>
          </div>

          {/* Unified Dialog Tabs Header */}
          <div className="flex bg-slate-100 p-1 rounded-t-none shrink-0 border-b border-slate-200">
            <button
              onClick={() => setViewingTeacherTab("overview")}
              className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${
                viewingTeacherTab === "overview"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview & Metrics
            </button>
            <button
              onClick={() => setViewingTeacherTab("syllabus")}
              className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${
                viewingTeacherTab === "syllabus"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Syllabus & Progress
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {/* Tab 1: Overview & Metrics */}
            {viewingTeacherTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-2xl bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        Teacher Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Name</Label>
                            <Input
                              value={editedName}
                              onChange={e => setEditedName(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Email</Label>
                            <Input
                              value={editedEmail}
                              onChange={e => setEditedEmail(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="Email Address"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">School</Label>
                            <div className="mt-1">
                              <Select value={editedSchoolId} onValueChange={setEditedSchoolId}>
                                <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-lg text-sm">
                                  <SelectValue placeholder="Select School" />
                                </SelectTrigger>
                                <SelectContent>
                                  {schools.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Password</Label>
                            <Input
                              type="password"
                              value={editedPassword}
                              onChange={e => setEditedPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Phone</Label>
                            <Input
                              value={editedPhone}
                              onChange={e => setEditedPhone(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="Phone Number"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Designation</Label>
                            <Input
                              value={editedDesignation}
                              onChange={e => setEditedDesignation(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="e.g. Teacher"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Experience</Label>
                            <Input
                              value={editedExperience}
                              onChange={e => setEditedExperience(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="e.g. 5 Years"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Highest Qualification</Label>
                            <Input
                              value={editedHighestQualification}
                              onChange={e => setEditedHighestQualification(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="e.g. B.Ed, M.Sc"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Skills</Label>
                            <Input
                              value={editedSkills}
                              onChange={e => setEditedSkills(e.target.value)}
                              className="h-9 w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white mt-1"
                              placeholder="e.g. Communication, Leadership (comma separated)"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Subject(s) Taught (Click to assign)</Label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {data.subjects.map(subject => {
                                const isSelected = editedSubjectIds.includes(subject.id);
                                return (
                                  <Badge
                                    key={subject.id}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer transition-all hover:scale-105 select-none font-bold py-1 px-2.5 rounded-full ${
                                      isSelected ? "bg-primary text-white" : "text-slate-500 hover:text-slate-800 border-slate-200 bg-white"
                                    }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setEditedSubjectIds(prev => prev.filter(id => id !== subject.id));
                                      } else {
                                        setEditedSubjectIds(prev => [...prev, subject.id]);
                                      }
                                    }}
                                  >
                                    <span className="mr-1">{subject.icon}</span> {subject.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Assigned Classes (Click to assign)</Label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {classes
                                .filter(c => String(c.schoolId) === String(editedSchoolId))
                                .map(cls => {
                                  const isSelected = editedClassIds.includes(cls.id);
                                  return (
                                    <Badge
                                      key={cls.id}
                                      variant={isSelected ? "default" : "outline"}
                                      className={`cursor-pointer transition-all hover:scale-105 select-none font-bold py-1 px-2.5 rounded-full ${
                                        isSelected ? "bg-primary text-white" : "text-slate-500 hover:text-slate-800 border-slate-200 bg-white"
                                      }`}
                                      onClick={() => {
                                        if (isSelected) {
                                          setEditedClassIds(prev => prev.filter(id => id !== cls.id));
                                        } else {
                                          setEditedClassIds(prev => [...prev, cls.id]);
                                        }
                                      }}
                                    >
                                      {cls.grade}th {cls.section}
                                    </Badge>
                                  );
                                })}
                              {classes.filter(c => String(c.schoolId) === String(editedSchoolId)).length === 0 && (
                                <p className="text-xs text-slate-400 italic">No classes configured for this school</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Name</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.name}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Email</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.email}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">School</Label>
                            <p className="text-sm font-medium text-slate-800">
                              {schools.find(s => s.id === viewingTeacher?.schoolId)?.name || 'Main School'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Subject(s)</Label>
                            <p className="text-sm font-medium text-slate-800">
                              {viewingTeacher?.subjects && Array.isArray(viewingTeacher.subjects) ? viewingTeacher.subjects.join(", ") : 'Not Assigned'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Phone</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.phone || 'Not Provided'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Designation</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.designation || 'Teacher'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Experience</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.experience || 'Not Provided'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Highest Qualification</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.highest_qualification || 'Not Provided'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Skills</Label>
                            <p className="text-sm font-medium text-slate-800">{viewingTeacher?.skills || 'Not Provided'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 uppercase tracking-wider">Assigned Classes</Label>
                            <p className="text-sm font-medium text-slate-800">
                              {(() => {
                                const assigned = viewingTeacher?.classIds?.map((cid: string) => {
                                  const cls = classes.find(c => c.id === cid);
                                  return cls ? `${cls.grade}th ${cls.section}` : null;
                                }).filter(Boolean).join(", ");
                                return assigned || 'No Classes Taught';
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 text-white text-center flex-1 flex flex-col justify-center items-center">
                      <Award className="w-12 h-12 mb-3 opacity-90" />
                      <h3 className="text-lg font-bold mb-0.5">Teacher Performance Score</h3>
                      <p className="text-purple-100 text-xs mb-4">Calculated from dynamic aggregates</p>
                      
                      <div className="text-5xl font-black tracking-tight drop-shadow-md">
                        {teacherStats?.rankingScore || 0}<span className="text-xl text-purple-200 font-medium ml-0.5">/100</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-700">
                      <Star className="w-4 h-4 text-amber-500" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                        <div className="w-8 h-8 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{teacherStats?.sessionsConducted || 0}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Sessions Conducted</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                        <div className="w-8 h-8 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{teacherStats?.syllabusCompletion || 0}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Syllabus Completion</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                        <div className="w-8 h-8 mx-auto bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-2">
                          <Layers className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{teacherStats?.unitProgress || 0}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Unit Progress</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                        <div className="w-8 h-8 mx-auto bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-2">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{teacherStats?.studentParticipation || 0}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Student Attendance</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                        <div className="w-8 h-8 mx-auto bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-2">
                          <Star className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{teacherStats?.quizPerformance || 0}%</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Quiz Performance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {viewingTeacherTab === "syllabus" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Class</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedSyllabusClassId === "overall" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedSyllabusClassId("overall");
                          setSelectedSyllabusSubjectId("");
                        }}
                        className={`rounded-full px-4 font-semibold text-xs transition-all ${
                          selectedSyllabusClassId === "overall" 
                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-350"
                        }`}
                      >
                        Overall Report
                      </Button>
                      {syllabusTeacherGrades.map(grade => (
                        <Button
                          key={grade}
                          variant={selectedSyllabusClassId === String(grade) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedSyllabusClassId(String(grade));
                            // Auto-select the first subject for this grade
                            const subjectsForGrade = data.subjects.filter(s => 
                              viewingTeacher.subjects?.includes(s.name) && (!s.grades || s.grades.includes(grade))
                            );
                            if (subjectsForGrade.length > 0) {
                              setSelectedSyllabusSubjectId(subjectsForGrade[0].id);
                            } else {
                              setSelectedSyllabusSubjectId("");
                            }
                          }}
                          className={`rounded-full px-4 font-semibold text-xs transition-all ${
                            selectedSyllabusClassId === String(grade) 
                              ? "bg-primary text-white shadow-md shadow-primary/20" 
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          Class {grade}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedSyllabusClassId !== "overall" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Subject</label>
                      <div className="flex flex-wrap gap-2">
                        {syllabusTeacherSubjects.map(subject => (
                          <Button
                            key={subject.id}
                            variant={selectedSyllabusSubjectId === subject.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSyllabusSubjectId(subject.id)}
                            className={`rounded-full px-4 font-semibold text-xs transition-all ${
                              selectedSyllabusSubjectId === subject.id 
                                ? "bg-primary text-white shadow-md shadow-primary/20" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-350"
                            }`}
                          >
                            <span className="mr-1">{subject.icon || "📚"}</span> {subject.name}
                          </Button>
                        ))}
                        {syllabusTeacherSubjects.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No subjects assigned for Class {selectedSyllabusClassId}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {syllabusReportData && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white rounded-2xl p-6 border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                          {schools.find(s => s.id === viewingTeacher?.schoolId)?.name || "Main School"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500">
                          <div>
                            <span className="text-slate-450 uppercase tracking-wider text-[10px]">Class:</span>{" "}
                            <span className="font-bold text-slate-800">
                              {selectedSyllabusClassId === "overall" ? "Overall" : `Class ${selectedSyllabusClassId}`}
                            </span>
                          </div>
                          <div className="w-px h-3.5 bg-slate-200" />
                          <div>
                            <span className="text-slate-450 uppercase tracking-wider text-[10px]">Subject:</span>{" "}
                            <span className="font-bold text-slate-800">
                              {selectedSyllabusClassId === "overall"
                                ? syllabusTeacherSubjects.map(s => s.name).join(", ") || "All Subjects"
                                : data.subjects.find(s => s.id === selectedSyllabusSubjectId)?.name || "N/A"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 w-full md:w-auto">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3 flex-1 md:flex-none">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <svg className="w-10 h-10 transform -rotate-90">
                              <circle cx="20" cy="20" r="16" className="stroke-slate-200" strokeWidth="3.5" fill="transparent" />
                              <circle cx="20" cy="20" r="16" className="stroke-blue-600 transition-all duration-1000 ease-out" strokeWidth="3.5" fill="transparent" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={(2 * Math.PI * 16) - (syllabusReportData.attendancePct / 100) * (2 * Math.PI * 16)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-blue-600">{syllabusReportData.attendancePct}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
                            <p className="text-sm font-bold text-slate-800">{syllabusReportData.attendancePct}%</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-3 flex-1 md:flex-none">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <svg className="w-10 h-10 transform -rotate-90">
                              <circle cx="20" cy="20" r="16" className="stroke-slate-200" strokeWidth="3.5" fill="transparent" />
                              <circle cx="20" cy="20" r="16" className="stroke-emerald-500 transition-all duration-1000 ease-out" strokeWidth="3.5" fill="transparent" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={(2 * Math.PI * 16) - (syllabusReportData.completionRate / 100) * (2 * Math.PI * 16)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-emerald-600">{syllabusReportData.completionRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completion</p>
                            <p className="text-sm font-bold text-slate-800">{syllabusReportData.completionRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chapters Breakdown with search and filters */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-150 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <h4 className="font-extrabold text-slate-800 text-sm tracking-wide">Curriculum & Topic Breakdown</h4>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 h-8 hover:bg-slate-50"
                            onClick={() => {
                              const allExpanded = { ...expandedChapters };
                              const totalChapters = syllabusReportData?.chapters || [];
                              const isAnyCollapsed = totalChapters.some(c => !allExpanded[c.id]);
                              totalChapters.forEach(c => {
                                allExpanded[c.id] = isAnyCollapsed;
                              });
                              setExpandedChapters(allExpanded);
                            }}
                          >
                            {syllabusReportData?.chapters.some(c => !expandedChapters[c.id]) ? "Expand All" : "Collapse All"}
                          </Button>
                        </div>
                      </div>

                      {/* Search & Status Filter Row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search topics..."
                            value={syllabusSearchQuery}
                            onChange={e => setSyllabusSearchQuery(e.target.value)}
                            className="pl-9 h-9 w-full bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1.5 shrink-0 hidden sm:inline">Filter:</span>
                          {(["all", "completed", "in_progress", "not_started"] as const).map(status => {
                            const labels = {
                              all: "All Topics",
                              completed: "Completed",
                              in_progress: "In Progress",
                              not_started: "Not Started"
                            };
                            const colors = {
                              all: "border-slate-200 text-slate-600 hover:bg-slate-50",
                              completed: "border-emerald-200 text-emerald-600 hover:bg-emerald-50/50",
                              in_progress: "border-amber-200 text-amber-600 hover:bg-amber-50/50",
                              not_started: "border-slate-300 text-slate-500 hover:bg-slate-50"
                            };
                            const activeColors = {
                              all: "bg-slate-800 text-white border-slate-800 shadow-sm",
                              completed: "bg-emerald-500 text-white border-emerald-500 shadow-sm",
                              in_progress: "bg-amber-500 text-white border-amber-500 shadow-sm",
                              not_started: "bg-slate-400 text-white border-slate-400 shadow-sm"
                            };
                            const isActive = syllabusStatusFilter === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setSyllabusStatusFilter(status)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                                  isActive ? activeColors[status] : colors[status]
                                }`}
                              >
                                {labels[status]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                        {filteredSyllabusReportData.chapters.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                            {syllabusReportData.chapters.length === 0 
                              ? "No chapters assigned for the current selection."
                              : "No topics match the current search or status filter."
                            }
                          </div>
                        ) : (
                          filteredSyllabusReportData.chapters.map(chapter => {
                            const isChapterExpanded = expandedChapters[chapter.id] !== false;
                            const chapterTopics = filteredSyllabusReportData.topics.filter(t => t.chapterId === chapter.id);
                            
                            const totalChapterTopics = syllabusReportData.topics.filter(t => t.chapterId === chapter.id).length;
                            const completedChapterTopics = syllabusReportData.topics.filter(t => t.chapterId === chapter.id && (t.status === "completed" || t.status === "done")).length;
                            const chapterCompletionRate = totalChapterTopics > 0 ? Math.round((completedChapterTopics / totalChapterTopics) * 100) : 0;

                            return (
                              <div key={chapter.id} className="bg-slate-50/50 rounded-2xl border border-slate-100/70 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200/50 transition-all duration-300">
                                <button
                                  type="button"
                                  onClick={() => setExpandedChapters(prev => ({ ...prev, [chapter.id]: !isChapterExpanded }))}
                                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50/30 text-left transition-colors"
                                >
                                  <div className="flex-1 min-w-0 pr-4">
                                    <h5 className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                      <BookOpen className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                      {chapter.name}
                                    </h5>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                          style={{ width: `${chapterCompletionRate}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                                        {chapterCompletionRate}% Completed
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                        ({completedChapterTopics}/{totalChapterTopics} topics)
                                      </span>
                                    </div>
                                  </div>

                                  <div className={`p-1.5 rounded-lg bg-slate-100/60 text-slate-500 transition-transform duration-300 ${isChapterExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </button>

                                {isChapterExpanded && (
                                  <div className="p-4 bg-white border-t border-slate-50 animate-in slide-in-from-top-1 duration-200">
                                    {chapterTopics.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic py-1 pl-6">No matching topics under this chapter.</p>
                                    ) : (
                                      <div className="relative pl-6 space-y-3">
                                        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100" />
                                        
                                        {chapterTopics.map((topic) => {
                                          const isCompleted = topic.status === "completed" || topic.status === "done";
                                          const isInProgress = topic.status === "in_progress" || topic.status === "active";
                                          
                                          return (
                                            <div key={topic.id} className="relative flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/60 transition-all duration-200 group">
                                              <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                                {isCompleted ? (
                                                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm z-10">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                  </div>
                                                ) : isInProgress ? (
                                                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shadow-sm z-10 animate-pulse">
                                                    <Clock className="w-3.5 h-3.5" />
                                                  </div>
                                                ) : (
                                                  <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-350 z-10 group-hover:border-slate-400 group-hover:bg-slate-50 transition-all">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                                                  </div>
                                                )}
                                              </div>

                                              <div className="flex-1 min-w-0 pr-4">
                                                <span className={`text-xs font-semibold block truncate ${isCompleted ? 'text-slate-800' : 'text-slate-500 font-medium'}`}>
                                                  {topic.name}
                                                </span>
                                              </div>

                                              <div className="flex-shrink-0">
                                                <Badge className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                                  isCompleted ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                  isInProgress ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                  "bg-slate-100 text-slate-400 border border-slate-200"
                                                }`}>
                                                  {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                                                </Badge>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
            <Button variant="ghost" onClick={() => setViewingTeacher(null)}>Close Profile</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const themeColors: any = {
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "from-blue-50/50 to-transparent"
    },
    purple: {
      bg: "bg-purple-50 text-purple-600 border-purple-100",
      accent: "from-purple-50/50 to-transparent"
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "from-amber-50/50 to-transparent"
    },
    green: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "from-emerald-50/50 to-transparent"
    }
  };
  
  const c = themeColors[color] || themeColors.blue;

  return (
    <Card className="group relative border border-slate-100 shadow-sm rounded-2xl bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-tr ${c.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      <CardContent className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-xl ${c.bg} border flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {trend}
            </Badge>
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight transition-all duration-300 group-hover:text-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
};

const InsightItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <span className="text-sm text-slate-500 font-medium">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

const DetailItem = ({ label, value }: any) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-slate-700 font-medium">{value}</p>
  </div>
);

const PermissionBadge = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
    <span className="text-xs font-semibold text-slate-700">{label}</span>
  </div>
);

export default ModernAdminDashboard;
