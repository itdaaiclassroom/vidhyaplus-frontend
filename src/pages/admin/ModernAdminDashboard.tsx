import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import StudentReportCard from "@/components/StudentReportCard";
import { 
  School, Users, GraduationCap, BarChart3, Activity, 
  MessageSquare, Calendar as CalendarIcon, LogOut, 
  Settings, Search, Eye, Plus, Shield, Clock,
  BookOpen, ClipboardList, Radio, MonitorPlay, ChevronRight,
  Trash2, Edit, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { uploadFileToR2 } from "@/services/uploadService";
import { toast } from "sonner";
import { fetchAdminOverview, fetchAdminAnalytics, createAnnouncement, fetchTeacherLogs, getApiBase, createSchool, updateSchool, deleteSchool, fetchAuditLogs } from "@/api/client";
import type { AuditLogEntry } from "@/api/client";
import MaterialManagement from "./MaterialManagement";
import GatingAdminPanel from "./GatingAdminPanel";
import UserManagementPanel from "./UserManagementPanel";

const ModernAdminDashboard = () => {
  const { data, loading, refetch } = useAppData();
  const { userName, logout, role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [announcement, setAnnouncement] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<string>("all");
  const [analytics, setAnalytics] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
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
  const [editingSchool, setEditingSchool] = useState<{ id: string; name: string; code: string; district: string; mandal?: string; sessionsCompleted: number; activeStatus: boolean } | null>(null);
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
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadReport = async (studentName: string) => {
    if (!reportRef.current) return;
    
    const toastId = toast.loading("Finalizing your premium PDF...");
    
    try {
      const originalStyle = reportRef.current.style.width;
      reportRef.current.style.width = "800px";

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800
      });
      
      reportRef.current.style.width = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`VidhyaPlus_Report_${studentName.replace(/\\s+/g, '_')}.pdf`);
      
      toast.success("Professional PDF Downloaded!", { id: toastId });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  useEffect(() => {
    if (schoolFormOpen && editingSchool) {
      setSchoolForm({ name: editingSchool.name, code: editingSchool.code, district: editingSchool.district, mandal: editingSchool.mandal ?? "", sessionsCompleted: editingSchool.sessionsCompleted, activeStatus: editingSchool.activeStatus, principalName: "", principalEmail: "", principalPassword: "", logo: null });
    } else if (schoolFormOpen && !editingSchool) {
      setSchoolForm({ name: "", code: "", district: "", mandal: "", sessionsCompleted: 0, activeStatus: true, principalName: "", principalEmail: "", principalPassword: "", logo: null });
    }
  }, [schoolFormOpen, editingSchool]);

  // Load Admin specific data
  useEffect(() => {
    fetchAdminOverview().then(setOverview).catch(console.error);
    fetchAdminAnalytics().then(setAnalytics).catch(console.error);
    fetchTeacherLogs().then(setLogs).catch(console.error);
  }, []);

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
    } catch (err) {
      toast.error("Failed to send announcement");
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const rawNavItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "schools", label: "Schools", icon: School },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "materials", label: "Materials", icon: BookOpen },
    { id: "logs", label: "Logs", icon: ClipboardList },
    { id: "gating", label: "Gating Controls", icon: ShieldCheck },
    { id: "profile", label: "Profile", icon: Settings },
    { id: "usermanagement", label: "User Management", icon: Shield },
  ];

  const teamRole = localStorage.getItem("auth.teamRole")?.toLowerCase() || "";
  const navItems = rawNavItems.filter(item => {
    if (role === "admin") return true; // Super admin sees all
    if (role === "team") {
      if (teamRole.includes("material") && item.id === "materials") return true;
      if (teamRole.includes("timetable") && item.id === "timetable") return true;
      if (teamRole.includes("attendance") && item.id === "logs") return true;
      if (teamRole.includes("syllabus") && item.id === "materials") return true;
      if (item.id === "profile") return true; // Everyone sees profile
      return false;
    }
    return false;
  });

  useEffect(() => {
    if (role === "team" && activeTab === "overview") {
      const firstTab = navItems[0]?.id;
      if (firstTab) setActiveTab(firstTab);
    }
  }, [role, navItems, activeTab]);

  const resolveImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${getApiBase()}/uploads/${path.replace(/^\/+/, "")}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl text-slate-800">Vidhyaplus</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
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
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {userName}</h1>
            <p className="text-slate-500">Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-10 w-64 bg-white border-slate-200" placeholder="Search everything..." />
            </div>
            {activeTab === "schools" && (
              <Button className="rounded-xl px-6" onClick={() => { setEditingSchool(null); setSchoolFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add School
              </Button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Overview Content */}
          <TabsContent value="overview" className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Total Schools" value={overview?.totalSchools || 0} icon={School} color="blue" />
              <SummaryCard title="Total Teachers" value={overview?.totalTeachers || 0} icon={Users} color="purple" />
              <SummaryCard title="Total Students" value={overview?.totalStudents || 0} icon={GraduationCap} color="amber" />
              <SummaryCard 
                title="Session Status" 
                value={`${overview?.sessionsCompleted || 0} / ${overview?.sessionsTotal || 1200}`} 
                icon={Activity} 
                color="green" 
              />
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Student Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.students || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="active" stroke="#1a9988" strokeWidth={3} dot={{r: 4, fill: '#1a9988'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" /> Teacher Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.teachers || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" /> Session Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[analytics?.sessions || {completed: 0, remaining: 0}]} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" hide />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed Sessions" />
                        <Bar dataKey="remaining" fill="#ef4444" radius={[0, 4, 4, 0]} name="Remaining Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-500">Completed (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-sm text-slate-500">Remaining (Red)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Content */}
          <TabsContent value="students" className="space-y-6">
             <div className="flex flex-wrap gap-4 items-end bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Students</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      className="pl-9 bg-slate-50 border-slate-100 rounded-xl" 
                      placeholder="Name or ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 w-48">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">School</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterSchool}
                    onChange={(e) => setFilterSchool(e.target.value)}
                  >
                    <option value="all">All Schools</option>
                    {[...schools].sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 w-32">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {Array.from(new Set(classes.map(c => c.grade))).sort((a,b) => a-b).map(g => <option key={g} value={g}>{g}th Class</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 w-32">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <option value="all">All Sections</option>
                    {Array.from(new Set(classes.map(c => c.section))).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Button variant="outline" className="rounded-xl h-10" onClick={() => { setFilterSchool("all"); setFilterClass("all"); setFilterSection("all"); setSearchQuery(""); }}>
                  Reset
                </Button>
             </div>

             <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Class</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">School</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Performance</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Action</th>
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
                              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{grade ? `${grade} - ${section || ''}` : (section || 'N/A')}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{schools.find(sc => sc.id === s.schoolId)?.name || 'Main School'}</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center">
                                    <Badge className="bg-primary/10 text-primary border-0 font-bold">
                                      {(() => {
                                        const results = data.studentQuizResults.filter(r => String(r.studentId) === String(s.id));
                                        if (results.length === 0) return "N/A";
                                        const avg = results.reduce((acc, curr) => acc + (curr.score * 100 / curr.total), 0) / results.length;
                                        return `${Math.round(avg)}%`;
                                      })()}
                                    </Badge>
                                  </div>
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
                                      const totalQuizMax = quizResultsList.reduce((sum: number, r: any) => sum + r.total, 0);
                                      const fa1Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'fa1');
                                      const fa2Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'fa2');
                                      const fa3Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'fa3');
                                      const fa4Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'fa4');
                                      const sa1Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'sa1');
                                      const sa2Result = data.studentQuizResults.find((r: any) => String(r.studentId) === String(s.id) && r.assessmentType?.toLowerCase() === 'sa2');

                                      const faList = [fa1Result, fa2Result, fa3Result, fa4Result].filter(v => v !== undefined && v.total > 0);
                                      const sumFA = faList.reduce((sum, v) => sum + v.score, 0);
                                      const maxFA = faList.reduce((sum, v) => sum + v.total, 0);
                                      const percFA = maxFA > 0 ? (sumFA / maxFA) * 100 : null;

                                      const saList = [sa1Result, sa2Result].filter(v => v !== undefined && v.total > 0);
                                      const sumSA = saList.reduce((sum, v) => sum + v.score, 0);
                                      const maxSA = saList.reduce((sum, v) => sum + v.total, 0);
                                      const percSA = maxSA > 0 ? (sumSA / maxSA) * 100 : null;

                                      const percQuiz = totalQuizMax > 0 ? (quizScore / totalQuizMax) * 100 : null;
                                      const percAtt = att?.percentage != null ? att.percentage : null;

                                      const percentages = [percFA, percSA, percQuiz, percAtt].filter(p => p !== null);
                                      const mockPerfIndex = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;


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
                                    <Eye className="w-4 h-4 mr-2" /> View Report
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No students found</td>
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
             <div className="flex flex-wrap gap-4 items-end bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Teachers</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      className="pl-9 bg-slate-50 border-slate-100 rounded-xl" 
                      placeholder="Name or Subject..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 w-48">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">School</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterSchool}
                    onChange={(e) => setFilterSchool(e.target.value)}
                  >
                    <option value="all">All Schools</option>
                    {[...schools].sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 w-40">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {[...subjects].sort((a,b) => a.name.localeCompare(b.name)).map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 w-32">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <option value="all">All Sections</option>
                    {Array.from(new Set(classes.map(c => c.section))).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Button variant="outline" className="rounded-xl h-10" onClick={() => { setFilterSchool("all"); setFilterSubject("all"); setFilterSection("all"); setSearchQuery(""); }}>
                  Reset
                </Button>
             </div>

             <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">School</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Subject</th>
                          <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Status</th>
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
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{schools.find(sc => sc.id === t.schoolId)?.name || 'Main School'}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{teacherSubjects || 'Not Assigned'}</td>
                                <td className="px-6 py-4 text-sm text-right">
                                  <Badge className="bg-emerald-100 text-emerald-600 border-0">Active</Badge>
                                </td>
                              </tr>
                            )
                          })}
                        {teachers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No teachers found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* Materials Content */}
          <TabsContent value="materials" className="space-y-6">
            <MaterialManagement />
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
                            <>
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                      <div className="space-y-1">
                                        <p className="font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                          {log.status}
                                        </span>
                                        {log.error_msg && <p className="text-red-500 mt-1">{log.error_msg}</p>}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="font-bold text-slate-400 uppercase tracking-wider">IP / User Agent</p>
                                        <p className="text-slate-600 font-mono">{log.ip_address || "—"}</p>
                                        <p className="text-slate-400 truncate max-w-xs" title={log.user_agent || ""}>{log.user_agent ? log.user_agent.slice(0, 60) + (log.user_agent.length > 60 ? "…" : "") : "—"}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="font-bold text-slate-400 uppercase tracking-wider">Meta Payload</p>
                                        {log.meta ? (
                                          <pre className="bg-slate-800 text-emerald-400 rounded-lg p-3 text-[10px] overflow-x-auto max-h-32 leading-relaxed">
                                            {JSON.stringify(log.meta, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="text-slate-400">No metadata</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
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

          {/* Gating Controls Content */}
          <TabsContent value="gating" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Teacher Competency Gating</h2>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">Advanced Control</Badge>
            </div>
            <GatingAdminPanel />
          </TabsContent>

          {/* Profile Content */}
          <TabsContent value="profile" className="space-y-8">
            <div className="relative">
              {/* Cover Gradient */}
              <div className="h-48 w-full bg-gradient-to-r from-primary/80 to-blue-600/80 rounded-3xl overflow-hidden shadow-lg">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
              </div>
              
              {/* Profile Header */}
              <div className="px-8 -mt-16 relative flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-slate-100">
                <div className="p-1.5 bg-white rounded-3xl shadow-2xl">
                  <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-primary border-4 border-white overflow-hidden shadow-inner">
                    {userName?.charAt(0) || "A"}
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-slate-800">{userName || "Administrator"}</h2>
                    <Badge className="bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                      {role === 'admin' ? 'Super Admin' : role === 'team' ? `Team: ${teamRole}` : role}
                    </Badge>
                  </div>
                  <p className="text-slate-500 font-medium">System Management & Administration</p>
                </div>
                <div className="flex gap-3 pb-2">
                  <Button variant="outline" className="rounded-xl border-slate-200">Edit Details</Button>
                  <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={handleLogout}>Logout</Button>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Account Information */}
                <Card className="border-0 shadow-sm rounded-3xl lg:col-span-2 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
                        <p className="text-lg font-semibold text-slate-800">{userName}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account ID</Label>
                        <p className="text-lg font-semibold text-slate-800 font-mono">#{role === 'admin' ? '001' : (localStorage.getItem("auth.teamId") || 'ADM-882')}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Email</Label>
                        <p className="text-lg font-semibold text-slate-800">{role === 'admin' ? 'admin@vidhyaplus.com' : 'team@vidhyaplus.com'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</Label>
                        <p className="text-lg font-semibold text-slate-800">+91 98765 43210</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Location</Label>
                        <p className="text-lg font-semibold text-slate-800">Headquarters (Remote)</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Language</Label>
                        <p className="text-lg font-semibold text-slate-800">English (Primary), Telugu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Permissions & Role Card */}
                <Card className="border-0 shadow-sm rounded-3xl overflow-hidden h-fit">
                  <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" /> Role & Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-sm font-bold text-primary mb-1 uppercase tracking-wider">Access Level</p>
                      <p className="text-2xl font-black text-slate-800">{role?.toUpperCase()}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Permissions</p>
                      <div className="space-y-3">
                        {role === 'admin' ? (
                          <>
                            <PermissionBadge label="Full System Access" />
                            <PermissionBadge label="User Management" />
                            <PermissionBadge label="Database Write Access" />
                            <PermissionBadge label="School Configurations" />
                            <PermissionBadge label="Audit Log Viewer" />
                          </>
                        ) : (
                          <>
                            <PermissionBadge label="Material Management" />
                            <PermissionBadge label="Syllabus Control" />
                            <PermissionBadge label="Profile View" />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 italic">Account created on May 12, 2024</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                          activeStatus: school.activeStatus 
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
        </Tabs>
      </main>

      {/* 3. Right Utility Panel */}
      {activeTab === "overview" && (
        <aside className="w-[340px] bg-white border-l border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Calendar
              </h3>
              <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Announcements
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500">Target Audience</Label>
                  <select 
                    className="w-full p-3 bg-slate-50 border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={announcementTarget}
                    onChange={(e) => setAnnouncementTarget(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="principals">Principals Only</option>
                  </select>
                </div>
                <textarea 
                  className="w-full h-32 p-4 bg-slate-50 border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Broadcast a message..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                />
                <Button className="w-full rounded-xl py-6 font-bold" onClick={handleSendAnnouncement}>
                  Send Message
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Insights</h3>
              <div className="space-y-4">
                 <InsightItem icon={Clock} label="Avg. Session Time" value="42 min" />
                 <InsightItem icon={MonitorPlay} label="Active Classes" value={activeSessions.length} />
              </div>
            </div>
          </section>
        </aside>
      )}

      {/* Live Sessions Monitor Toggle Button (Floating) */}
      <div className={`fixed bottom-8 ${activeTab === 'overview' ? 'right-[360px]' : 'right-8'} z-50 transition-all duration-300`}>
        <Button 
          className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 bg-primary hover:bg-primary-hover"
          onClick={() => setShowLiveMonitor(!showLiveMonitor)}
        >
          <MonitorPlay className="w-6 h-6" />
        </Button>
      </div>

      {/* Live Monitor Panel */}
      {showLiveMonitor && (
        <Card className={`fixed bottom-24 ${activeTab === 'overview' ? 'right-[360px]' : 'right-8'} w-96 z-50 shadow-2xl border-0 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 transition-all duration-300`}>
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
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
             </div>

             <Tabs defaultValue="school-teachers" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="school-teachers" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Teachers</TabsTrigger>
                  <TabsTrigger value="school-students" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Students</TabsTrigger>
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
                <Input type="email" value={schoolForm.principalEmail} onChange={(e) => setSchoolForm(f => ({ ...f, principalEmail: e.target.value }))} placeholder="principal@school.edu" />
              </div>
              <div>
                <Label>Principal Password {editingSchool && "(leave blank to keep current)"}</Label>
                <Input type="password" value={schoolForm.principalPassword} onChange={(e) => setSchoolForm(f => ({ ...f, principalPassword: e.target.value }))} placeholder="••••••••" />
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
          <div ref={reportRef}>
            <StudentReportCard
              studentName={aiReportStudentName}
              className={aiReportData?.className || "N/A"}
              rollNumber={aiReportData?.rollNumber || "N/A"}
              schoolName="VidhyaPlus Academy"
              attendance={aiReportData?.attendance || 0}
              perfIndex={aiReportData?.perfIndex || 0}
              academicYear={aiReportData?.academicYear}
              subjectGrades={aiReportData?.subjectGrades}
              aiReportContent={aiReportContent}
              onClose={() => setAiReportDialogOpen(false)}
              onDownload={() => downloadReport(aiReportStudentName)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };
  
  return (
    <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} border flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
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
