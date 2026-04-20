import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StudentQRCard from "@/components/StudentQRCard";
import PptxViewer from "@/components/PptxViewer";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  School, Users, GraduationCap, CalendarCheck, BookOpen, ClipboardList,
  ChevronRight, MapPin, Clock, QrCode, FileDown, FileText, CheckCircle2,
  XCircle, Video, TrendingUp, AlertTriangle, BarChart3, Activity, Star,
  Radio, Eye, MonitorPlay, ArrowLeft, Target, Trophy, Presentation, Upload
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { StudentForm, TeacherForm } from "./RegistrationForms";
import { createSchool, updateSchool, deleteSchool, getTeacherAssignments, updateTeacher, updateTeacherAssignments, updateChapterTextbook, updateTopicPpt, getApiBase } from "@/api/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { data, loading, error, isFromApi, refetch } = useAppData();
  const { userName, role: authRole } = useAuth();
  const {
    schools,
    classes,
    teachers,
    students,
    subjects,
    chapters,
    topics,
    activityLogs,
    classStatus,
    leaveApplications,
    classRecordings,
    homework,
    studentAttendance,
    liveSessions,
    studentQuizResults,
    studyMaterials,
    chapterQuizzes,
    impactMetrics,
    teacherEffectiveness,
    weakTopicHeatmap,
    engagementMetrics,
    curriculum,
    studentUsageLogs,
    admins,
    timetables,
  } = data;

  const curriculumTyped = (curriculum as {
    syllabusByChapter?: Record<string, Array<{ monthLabel: string; weekLabel: string; periods: number; teachingPlan: string }>>;
    currentWeekChapterIds?: string[];
  }) || {};
  const syllabusByChapter = curriculumTyped.syllabusByChapter ?? {};

  const adminDisplayName = (authRole === "admin" && userName) ? userName : ((admins?.length && isFromApi) ? (admins[0]?.full_name || userName) : userName);
  const resolveUploadUrl = (p?: string | null) => {
    const raw = (p || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = raw.replace(/^\/+/, "");
    if (normalized.startsWith("uploads/")) return `${getApiBase()}/${normalized}`;
    return `${getApiBase()}/uploads/${normalized}`;
  };
  const toPreviewUrl = (url: string) => {
    const raw = (url || "").trim();
    if (!raw) return "";
    return raw;
  };
  const isPptxUrl = (url: string) => /\.(ppt|pptx)(\?|#|$)/i.test((url || "").trim());

  const openMaterialPreviewSafe = useCallback(
    async (args: { title: string; previewUrl: string; fallbackUrl?: string; previewType?: "iframe" | "pptx" }) => {
      const { title, previewUrl, fallbackUrl, previewType = "iframe" } = args;
      if (!previewUrl) return;

      setMaterialPreview({
        open: true,
        title,
        url: previewUrl,
        fallbackUrl,
        previewType,
      });

      if (previewType === "pptx") return;

      try {
        // HEAD will be ok only when the server can serve the preview file (PDF converted).
        const r = await fetch(previewUrl, { method: "HEAD" });
        if (!r.ok) {
          setMaterialPreview({
            open: true,
            title,
            url: "",
            fallbackUrl: fallbackUrl || previewUrl,
            previewType: "message",
            message:
              "Preview is not available for this file (PDF conversion missing or failed). Please open in a new tab instead.",
          });
        }
      } catch (_) {
        setMaterialPreview({
          open: true,
          title,
          url: "",
          fallbackUrl: fallbackUrl || previewUrl,
          previewType: "message",
          message: "Preview is not available for this file (network or conversion issue). Please open in a new tab instead.",
        });
      }
    },
    []
  );

  const overviewChartData = useMemo(() => {
    const schoolClassIds = new Map<string, string[]>();
    classes.forEach((c) => {
      const list = schoolClassIds.get(c.schoolId) || [];
      list.push(c.id);
      schoolClassIds.set(c.schoolId, list);
    });
    return schools.map((s) => {
      const classIds = schoolClassIds.get(s.id) || [];
      const schoolStudentIds = new Set(students.filter((st) => st.classId && classIds.includes(st.classId)).map((st) => st.id));
      const quizzes = studentQuizResults.filter((r) => schoolStudentIds.has(r.studentId)).length;
      return {
        name: s.name,
        sessions: s.sessionsCompleted ?? 0,
        quizzes,
      };
    });
  }, [schools, classes, students, studentQuizResults]);

  // Merge active live sessions into class status for pie and table (ongoing live count + rows)
  const activeSessions = useMemo(() => liveSessions.filter(s => s.status === "active"), [liveSessions]);
  const combinedClassStatus = useMemo(() => {
    const fromTable = classStatus.filter((c) => c.status !== "ongoing_live" && c.status !== "ongoing live");
    const liveRows = activeSessions.map((ls) => ({
      id: `live-${ls.id}`,
      date: ls.startTime ? String(ls.startTime).slice(0, 10) : "",
      classId: ls.classId,
      teacherId: ls.teacherId,
      status: "ongoing_live" as const,
      reason: null as string | null,
    }));
    return [...fromTable, ...liveRows];
  }, [classStatus, activeSessions]);

  const overviewPieData = useMemo(() => {
    const conducted = combinedClassStatus.filter((c) => c.status === "conducted").length;
    const cancelled = combinedClassStatus.filter((c) => c.status === "cancelled").length;
    const ongoingLive = combinedClassStatus.filter((c) => c.status === "ongoing_live" || c.status === "ongoing live").length;
    return [
      { name: "Conducted", value: conducted, color: "hsl(174, 62%, 38%)" },
      { name: "Cancelled", value: cancelled, color: "hsl(0, 70%, 50%)" },
      { name: "Ongoing Live", value: ongoingLive, color: "hsl(38, 92%, 55%)" },
    ].filter((d) => d.value > 0).length
      ? [
          { name: "Conducted", value: conducted, color: "hsl(174, 62%, 38%)" },
          { name: "Cancelled", value: cancelled, color: "hsl(0, 70%, 50%)" },
          { name: "Ongoing Live", value: ongoingLive, color: "hsl(38, 92%, 55%)" },
        ]
      : [
          { name: "Conducted", value: 0, color: "hsl(174, 62%, 38%)" },
          { name: "Cancelled", value: 0, color: "hsl(0, 70%, 50%)" },
          { name: "Ongoing Live", value: 0, color: "hsl(38, 92%, 55%)" },
        ];
  }, [combinedClassStatus]);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showQRCards, setShowQRCards] = useState(false);
  const [watchingLive, setWatchingLive] = useState<string | null>(null);
  const [teacherSchoolFilter, setTeacherSchoolFilter] = useState("all");
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState("all");
  const [teacherNameFilter, setTeacherNameFilter] = useState("all");
  const [showTeachersMenu, setShowTeachersMenu] = useState(false);
  const [manageTeachersView, setManageTeachersView] = useState(false);
  const menuHideTimeout = useRef<number | null>(null);
  const [showRegistrationMenu, setShowRegistrationMenu] = useState(false);
  const registrationRef = useRef<HTMLDivElement | null>(null);
  const [registrationModalType, setRegistrationModalType] = useState<"student" | "teacher" | null>(null);
  const [schoolFormOpen, setSchoolFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<{ id: string; name: string; code: string; district: string; mandal?: string; sessionsCompleted: number; activeStatus: boolean } | null>(null);
  const [materialGrade, setMaterialGrade] = useState<number | null>(null);
  const [materialSubjectId, setMaterialSubjectId] = useState<string | null>(null);
  const [materialChapterId, setMaterialChapterId] = useState<string | null>(null);
  const [uploadingTextbookFor, setUploadingTextbookFor] = useState<string | null>(null);
  const [uploadingPptFor, setUploadingPptFor] = useState<string | null>(null);
  const textbookInputRef = useRef<HTMLInputElement>(null);
  const pptInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogType, setPlanDialogType] = useState<"textbook" | "wholeyear" | null>(null);
  const [planFilterMonth, setPlanFilterMonth] = useState("all");
  const [planFilterWeek, setPlanFilterWeek] = useState("all");
  const [planFilterChapter, setPlanFilterChapter] = useState("all");
  const [schoolForm, setSchoolForm] = useState({ name: "", code: "", district: "", mandal: "", sessionsCompleted: 0, activeStatus: true });
  const [schoolSubmitting, setSchoolSubmitting] = useState(false);
  useEffect(() => {
    if (schoolFormOpen && editingSchool) {
      setSchoolForm({ name: editingSchool.name, code: editingSchool.code, district: editingSchool.district, mandal: editingSchool.mandal ?? "", sessionsCompleted: editingSchool.sessionsCompleted, activeStatus: editingSchool.activeStatus });
    } else if (schoolFormOpen && !editingSchool) {
      setSchoolForm({ name: "", code: "", district: "", mandal: "", sessionsCompleted: 0, activeStatus: true });
    }
  }, [schoolFormOpen, editingSchool]);
  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim() || !schoolForm.code.trim() || !schoolForm.district.trim()) return;
    setSchoolSubmitting(true);
    if (editingSchool) {
      updateSchool(editingSchool.id, { name: schoolForm.name, code: schoolForm.code, district: schoolForm.district, mandal: schoolForm.mandal || undefined, sessions_completed: schoolForm.sessionsCompleted, active_status: schoolForm.activeStatus })
        .then(() => { refetch(); setSchoolFormOpen(false); setEditingSchool(null); })
        .finally(() => setSchoolSubmitting(false));
    } else {
      createSchool({ name: schoolForm.name, code: schoolForm.code, district: schoolForm.district, mandal: schoolForm.mandal || undefined, sessions_completed: schoolForm.sessionsCompleted, active_status: schoolForm.activeStatus })
        .then(() => { refetch(); setSchoolFormOpen(false); })
        .finally(() => setSchoolSubmitting(false));
    }
  };
  useEffect(() => {
    return () => {
      if (menuHideTimeout.current) {
        clearTimeout(menuHideTimeout.current);
        menuHideTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!registrationRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!registrationRef.current.contains(e.target)) {
        setShowRegistrationMenu(false);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const [selectedTimetableSchool, setSelectedTimetableSchool] = useState<string | null>(null);
  const [selectedTimetableClass, setSelectedTimetableClass] = useState<number | null>(null);
  const [selectedTimetableSection, setSelectedTimetableSection] = useState<string | null>(null);

  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherEditSchoolId, setTeacherEditSchoolId] = useState("");
  const [teacherEditAssignments, setTeacherEditAssignments] = useState<Array<{ classId: string; subjectId: string; schoolId: string }>>([]);
  const [teacherAssignmentsLoading, setTeacherAssignmentsLoading] = useState(false);
  const [teacherAssignmentsSaving, setTeacherAssignmentsSaving] = useState(false);

  useEffect(() => {
    if (!editingTeacherId) return;
    const t = teachers.find((x) => x.id === editingTeacherId);
    if (t) {
      setTeacherEditSchoolId(t.schoolId);
      setTeacherAssignmentsLoading(true);
      getTeacherAssignments(editingTeacherId)
        .then((r) => {
          setTeacherEditAssignments(
            r.assignments.length
              ? r.assignments.map((a) => ({ classId: a.classId, subjectId: a.subjectId, schoolId: a.schoolId }))
              : [{ classId: "", subjectId: "", schoolId: t.schoolId }]
          );
        })
        .catch(() => setTeacherEditAssignments([{ classId: "", subjectId: "", schoolId: t.schoolId }]))
        .finally(() => setTeacherAssignmentsLoading(false));
    }
  }, [editingTeacherId, teachers]);

  const [manageNameFilter, setManageNameFilter] = useState("");
  const [manageIdFilter, setManageIdFilter] = useState("");
  const [classStatusSchoolFilter, setClassStatusSchoolFilter] = useState("all");
  const [classStatusClassFilter, setClassStatusClassFilter] = useState("all");
  const [leaveSchoolFilter, setLeaveSchoolFilter] = useState("all");
  const [leaveTeacherFilter, setLeaveTeacherFilter] = useState("all");
  const [leaveTeacherIdFilter, setLeaveTeacherIdFilter] = useState("");
  const [logSchoolFilter, setLogSchoolFilter] = useState("all");
  const [logTeacherFilter, setLogTeacherFilter] = useState("all");
  const [logTeacherIdFilter, setLogTeacherIdFilter] = useState("");
  const [showLiveSessionsDialog, setShowLiveSessionsDialog] = useState(false);
  const [materialPreview, setMaterialPreview] = useState<{
    open: boolean;
    title: string;
    url: string;
    fallbackUrl?: string;
    previewType?: "iframe" | "pptx" | "message";
    message?: string;
  }>({ open: false, title: "", url: "", previewType: "iframe" });
  const navigate = useNavigate();

  const overviewCards = [
    { icon: School, label: "Schools", value: schools.length, bg: "bg-teal-light", color: "text-primary" },
    { icon: Users, label: "Teachers", value: teachers.length, bg: "bg-info-light", color: "text-info" },
    { icon: GraduationCap, label: "Students", value: students.length, bg: "bg-amber-light", color: "text-amber" },
  ];

  const school = selectedSchool ? schools.find(s => s.id === selectedSchool) : null;
  const classDetail = selectedClass ? classes.find(c => c.id === selectedClass) : null;
  const classStudents = useMemo(
    () => (selectedClass ? students.filter(s => s.classId === selectedClass) : []),
    [selectedClass, students]
  );

  const classSubjectPerformance = useMemo(() => {
    if (!classDetail || !selectedClass) return [];
    return subjects
      .filter(s => s.grades.includes(classDetail.grade))
      .map((sub) => {
        const subChapterIds = chapters.filter(ch => ch.subjectId === sub.id && ch.grade === classDetail.grade).map(ch => ch.id);
        const results = studentQuizResults.filter(r => classStudents.some(cs => cs.id === r.studentId) && subChapterIds.includes(r.chapterId));
        const totalScore = results.reduce((a, r) => a + r.score, 0);
        const totalPossible = results.reduce((a, r) => a + r.total, 0);
        const percent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
        return { name: sub.name, percent };
      });
  }, [classDetail, selectedClass, classStudents, subjects, chapters, studentQuizResults]);

  const schoolFilteredTeachers = useMemo(
    () => teachers.filter(t => teacherSchoolFilter === "all" || t.schoolId === teacherSchoolFilter),
    [teachers, teacherSchoolFilter]
  );

  const teacherSubjectOptions = useMemo(
    () => Array.from(new Set(schoolFilteredTeachers.flatMap(t => t.subjects))).sort(),
    [schoolFilteredTeachers]
  );

  const filteredTeacherEffectiveness = useMemo(() => {
    return (teacherEffectiveness as Array<{ teacherId: string; [k: string]: unknown }>)
      .map(te => {
        const teacher = teachers.find(t => t.id === te.teacherId);
        if (!teacher) return null;
        return { ...te, teacher };
      })
      .filter((entry): entry is NonNullable<typeof entry> => !!entry)
      .filter(({ teacher }) => {
        if (teacherSchoolFilter !== "all" && teacher.schoolId !== teacherSchoolFilter) return false;
        if (teacherSubjectFilter !== "all" && !teacher.subjects.includes(teacherSubjectFilter)) return false;
        if (teacherNameFilter !== "all" && teacher.id !== teacherNameFilter) return false;
        return true;
      });
  }, [teacherEffectiveness, teachers, teacherSchoolFilter, teacherSubjectFilter, teacherNameFilter]);

  const downloadAllQRCards = useCallback(() => {
    if (!classStudents.length || !school || !classDetail) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    const renderCard = (s: typeof classStudents[0]): Promise<string> => {
      return new Promise((resolve) => {
        const qrValue = JSON.stringify({ student_id: s.id, name: s.name, roll: s.rollNo, class: classDetail!.name });
        const canvas = document.createElement("canvas");
        const scale = 3;
        canvas.width = 320 * scale;
        canvas.height = 420 * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(""); return; }
        ctx.scale(scale, scale);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.roundRect(0, 0, 320, 420, 16); ctx.fill();
        ctx.fillStyle = "#1a9988";
        ctx.beginPath(); ctx.roundRect(0, 0, 320, 70, [16, 16, 0, 0]); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ITDA AI Classroom", 160, 30);
        ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText("Student Identity Card", 160, 50);
        const tempDiv = document.createElement("div");
        container.appendChild(tempDiv);
        import("react-dom/client").then(({ createRoot }) => {
          import("react").then((React) => {
            const root = createRoot(tempDiv);
            root.render(React.createElement(QRCodeSVG, { value: qrValue, size: 160, level: "M", bgColor: "#ffffff", fgColor: "#1a2b3c" }));
            setTimeout(() => {
              const svg = tempDiv.querySelector("svg");
              if (!svg) { root.unmount(); resolve(""); return; }
              const svgData = new XMLSerializer().serializeToString(svg);
              const img = new window.Image();
              const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              img.onload = () => {
                ctx.drawImage(img, 80, 90, 160, 160);
                ctx.fillStyle = "#1a2b3c";
                ctx.font = "bold 18px 'Space Grotesk', sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(s.name, 160, 295);
                ctx.fillStyle = "#6b7280";
                ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
                ctx.fillText(`Roll No: ${s.rollNo}`, 160, 318);
                ctx.fillText(classDetail!.name, 160, 338);
                ctx.fillText(school!.name, 160, 358);
                ctx.fillStyle = "#1a9988";
                ctx.font = "bold 11px monospace";
                ctx.fillText(`ID: ${s.id}`, 160, 394);
                URL.revokeObjectURL(url);
                root.unmount();
                resolve(canvas.toDataURL("image/png"));
              };
              img.src = url;
            }, 100);
          });
        });
      });
    };

    Promise.all(classStudents.map(renderCard)).then((images) => {
      document.body.removeChild(container);
      const html = `<!DOCTYPE html><html><head><title>QR Cards - ${classDetail!.name}</title>
<style>@page{size:A4;margin:10mm}body{margin:0;font-family:sans-serif}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:16px}.grid img{width:100%;max-width:280px;margin:0 auto;display:block;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{text-align:center;padding:16px;border-bottom:2px solid #1a9988;margin-bottom:8px}.header h1{font-size:18px;color:#1a9988;margin:0}.header p{font-size:12px;color:#666;margin:4px 0 0}@media print{.no-print{display:none}}</style></head><body>
<div class="header"><h1>${classDetail!.name} — Student QR Cards</h1><p>${school!.name} • ${classStudents.length} students</p></div>
<button class="no-print" onclick="window.print()" style="display:block;margin:12px auto;padding:10px 24px;background:#1a9988;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Print All Cards</button>
<div class="grid">${images.filter(Boolean).map(src => `<img src="${src}"/>`).join("")}</div></body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
    });
  }, [classStudents, school, classDetail]);

  const downloadClassCsv = useCallback(() => {
    if (!classStudents.length || !school || !classDetail) return;
    const rows: string[] = [];
    const header = ["Student ID", "Name", "Roll No", "Class", "School", "Quiz %", "Attendance %", "Avg Usage (min)", "Password"];
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    rows.push(header.join(","));

    classStudents.forEach((s) => {
      // quiz percent
      const studentResults = studentQuizResults.filter(r => r.studentId === s.id);
      const totalScore = studentResults.reduce((a, r) => a + r.score, 0);
      const totalPossible = studentResults.reduce((a, r) => a + r.total, 0);
      const quizPct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      // attendance
      const att = studentAttendance.find(a => a.studentId === s.id);
      const attPct = att ? att.percentage : "";
      // avg usage
      const usageLogs = (studentUsageLogs as Array<{ studentId?: string; minutes?: number }>).filter(u => u.studentId === s.id);
      const totalMins = usageLogs.reduce((sum, u) => sum + (Number(u.minutes) || 0), 0);
      const avgUsage = usageLogs.length ? Math.round(totalMins / usageLogs.length) : 0;

      const line = [
        escape(s.id),
        escape(s.name),
        escape(s.rollNo),
        escape(classDetail.name),
        escape(school.name),
        escape(quizPct),
        escape(attPct),
        escape(avgUsage),
        escape((s as { password?: string }).password ?? ""),
      ];
      rows.push(line.join(","));
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `${classDetail.name.replace(/\s+/g, "_")}_students_${new Date().toISOString().slice(0,10)}.csv`;
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [classStudents, school, classDetail]);

  // Student profile popup
  const studentProfile = selectedStudent ? students.find(s => s.id === selectedStudent) : null;
  const studentProfileResults = selectedStudent ? studentQuizResults.filter(r => r.studentId === selectedStudent) : [];
  const studentProfileAtt = selectedStudent ? studentAttendance.find(a => a.studentId === selectedStudent) : null;

  // Live Watch View
  if (watchingLive) {
    const session = liveSessions.find(s => s.id === watchingLive);
    if (!session) {
      setWatchingLive(null);
    } else {
      return (
        <DashboardLayout title="Live Class Monitoring" userDisplayName={adminDisplayName}>
          <Button variant="ghost" onClick={() => setWatchingLive(null)} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <Card className="shadow-card border-border mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">{session.topicName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {session.teacherName} • {session.className} • {session.subjectName}
                  </p>
                </div>
                <Badge className="bg-destructive/10 text-destructive animate-pulse gap-1">
                  <Radio className="w-3 h-3" /> LIVE
                </Badge>
              </div>
              <div className="aspect-video bg-foreground/5 rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <MonitorPlay className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-display font-bold">Live Classroom Stream</p>
                  <p className="text-sm text-muted-foreground mt-1">Passive monitoring mode — Audio & Video</p>
                  <p className="text-xs text-muted-foreground mt-2">Started: {new Date(session.startTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      );
    }
  }

  // Student Profile Modal
  if (selectedStudent && studentProfile) {
    const totalScore = studentProfileResults.reduce((a, r) => a + r.score, 0);
    const totalQ = studentProfileResults.reduce((a, r) => a + r.total, 0);
    const pct = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
    const studentClass = classes.find(c => c.id === studentProfile.classId);
    const studentSchool = schools.find(s => s.id === studentProfile.schoolId);

    return (
      <DashboardLayout title="Student Profile" userDisplayName={adminDisplayName}>
        <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="mb-4 gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                  {studentProfile.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{studentProfile.name}</h2>
                  <p className="text-sm text-muted-foreground">Roll No: {studentProfile.rollNo} • {studentClass?.name} • {studentSchool?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="font-display text-2xl font-bold text-foreground">{pct}%</p>
                  <p className="text-xs text-muted-foreground">Performance</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="font-display text-2xl font-bold text-foreground">{studentProfileAtt?.percentage || 0}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="font-display text-2xl font-bold text-foreground">{studentProfileResults.length}</p>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="font-display text-sm">Quiz History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {studentProfileResults.length > 0 ? studentProfileResults.map((r, i) => {
                const ch = chapters.find(c => c.id === r.chapterId);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-foreground">{ch?.name || r.chapterId}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.score}/{r.total}</Badge>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground">No quiz data.</p>}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading && !schools.length) {
    return (
      <DashboardLayout title="Admin Dashboard" userDisplayName={adminDisplayName}>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center text-muted-foreground">Loading data from database…</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard" userDisplayName={adminDisplayName}>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Could not load data</p>
          <p className="text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" userDisplayName={adminDisplayName}>
      {!isFromApi && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
          Showing demo data. Set <code className="bg-black/10 px-1 rounded">VITE_API_URL</code> (e.g. http://localhost:3001) and run the API server to use your database.
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <div
            className="relative inline-block"
            onMouseOver={() => {
              if (menuHideTimeout.current) {
                clearTimeout(menuHideTimeout.current as number);
                menuHideTimeout.current = null;
              }
              setShowTeachersMenu(true);
            }}
            onMouseOut={() => {
              // short delay to avoid flicker when moving between trigger and menu
              menuHideTimeout.current = window.setTimeout(() => setShowTeachersMenu(false), 150);
            }}
          >
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            {showTeachersMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-popover border border-border rounded-md shadow-lg z-50">
                <button
                  onClick={() => { setManageTeachersView(true); setActiveTab("teachers"); setShowTeachersMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary"
                >Manage Teachers</button>
                <button
                  onClick={() => { setManageTeachersView(false); setActiveTab("teachers"); setShowTeachersMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary"
                >Teacher Effectiveness</button>
              </div>
            )}
          </div>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="classstatus">Class Status</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
            <div className="relative inline-block" ref={registrationRef}>
              <Button variant="ghost" onClick={() => setShowRegistrationMenu(v => !v)} className="h-9">Registration</Button>
              {showRegistrationMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => { setShowRegistrationMenu(false); setRegistrationModalType("student"); }}
                    className="w-full text-left px-3 py-2 hover:bg-secondary"
                  >Student Registration</button>
                  <button
                    onClick={() => { setShowRegistrationMenu(false); setRegistrationModalType("teacher"); }}
                    className="w-full text-left px-3 py-2 hover:bg-secondary"
                  >Teacher Registration</button>
                </div>
              )}
            </div>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          {/* Detailed Analytics */}
          <h3 className="font-display text-lg font-bold text-foreground mt-8">Detailed Analytics</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {overviewCards.map(c => (
              <Card
                key={c.label}
                className={`shadow-card border-border ${(c.label === "Schools" || c.label === "Teachers" || c.label === "Students") ? "cursor-pointer card-hover" : ""}`}
                onClick={
                  c.label === "Schools"
                    ? () => navigate("/admin/schools-analytics")
                    : c.label === "Teachers"
                      ? () => setActiveTab("teachers")
                      : c.label === "Students"
                        ? () => navigate("/admin/students-filter")
                      : undefined
                }
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="shadow-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{engagementMetrics.quizCompletionRate}%</p>
                  <p className="text-xs text-muted-foreground">Quiz Completion Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card
              className="shadow-card border-border cursor-pointer card-hover"
              onClick={() => setShowLiveSessionsDialog(true)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-light flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{activeSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Live Sessions Now</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><School className="w-4 h-4 text-primary" /> Sessions & Quizzes by School</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overviewChartData} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(174, 62%, 38%)" name="Sessions" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="quizzes" fill="hsl(38, 92%, 55%)" name="Quizzes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> Class Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={overviewPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {overviewPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Daily Active Students</CardTitle></CardHeader>
              <CardContent>
                {(engagementMetrics.dailyActiveStudents && (engagementMetrics.dailyActiveStudents as Array<{ date: string; count: number }>).length > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={engagementMetrics.dailyActiveStudents as Array<{ date: string; count: number }>}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(174, 62%, 38%)" strokeWidth={2} dot={{ fill: "hsl(174, 62%, 38%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No attendance data yet. Data is loaded from the database.</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" /> Weak Chapter Heatmap
                </CardTitle>
                {curriculumTyped.currentWeekChapterIds?.length ? (
                  <p className="text-xs text-muted-foreground mt-1">Showing current week only (from syllabus). Set chapter_syllabus.is_current_week = 1 in DB for the active week.</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(weakTopicHeatmap) && weakTopicHeatmap.length > 0 ? (
                    (() => {
                      const typed = weakTopicHeatmap as Array<{ subject: string; chapter: string; avgScore: number; weakStudents?: number }>;
                      const bySubject = new Map<string, { subject: string; chapter: string; avgScore: number; weakStudents?: number }>();
                      typed.forEach((t) => {
                        const existing = bySubject.get(t.subject);
                        if (!existing || (t.avgScore ?? 0) < (existing.avgScore ?? 0))
                          bySubject.set(t.subject, t);
                      });
                      return [...bySubject.values()].sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0));
                    })().map((topic, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-secondary rounded-xl">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{topic.chapter}</p>
                              <Badge variant="outline" className="text-xs">{topic.subject}</Badge>
                            </div>
                            <Progress value={topic.avgScore ?? 0} className="h-2" />
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${(topic.avgScore ?? 0) < 50 ? "text-destructive" : "text-amber"}`}>{topic.avgScore ?? 0}%</p>
                            <p className="text-xs text-muted-foreground">{topic.weakStudents ?? 0} weak</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">No chapter quiz data yet. Weak topics are computed from the database.</div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* SCHOOLS - Multi-level drill-down */}
        <TabsContent value="schools" className="space-y-4">
          {!selectedSchool ? (
            /* Level 1: School Cards */
            <div>
              <div className="flex gap-3 mb-6">
                <Button className="gap-2" onClick={() => { setEditingSchool(null); setSchoolFormOpen(true); }}>
                  <School className="w-4 h-4" /> Add School
                </Button>
                <Button variant="outline" className="gap-2">
                  <ClipboardList className="w-4 h-4" /> Manage Schools
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
              {schools.map(s => {
                const schoolClasses = classes.filter(c => c.schoolId === s.id);
                const schoolClassIds = new Set(schoolClasses.map((c) => c.id));
                const schoolStudentIds = new Set(students.filter((st) => st.classId && schoolClassIds.has(st.classId)).map((st) => st.id));
                const schoolAttendance = studentAttendance.filter((a) => schoolStudentIds.has(a.studentId));
                const engagementPct = schoolAttendance.length ? Math.round(schoolAttendance.reduce((sum, a) => sum + a.percentage, 0) / schoolAttendance.length) : 0;
                const schoolResults = studentQuizResults.filter((r) => schoolStudentIds.has(r.studentId));
                const totalSc = schoolResults.reduce((sum, r) => sum + r.score, 0);
                const totalTot = schoolResults.reduce((sum, r) => sum + r.total, 0);
                const performancePct = totalTot > 0 ? Math.round((totalSc / totalTot) * 100) : 0;
                const completionPct = s.sessionsCompleted > 0 ? Math.min(100, Math.round((schoolResults.length / s.sessionsCompleted) * 10)) : 0;
                const schoolSessions = activeSessions.filter(ls =>
                  classes.filter(c => c.schoolId === s.id).some(c => c.id === ls.classId)
                );
                return (
                  <Card key={s.id} className="shadow-card border-border card-hover cursor-pointer relative" onClick={() => setSelectedSchool(s.id)}>
                    {schoolSessions.length > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                        <Radio className="w-3 h-3" /> {schoolSessions.length} LIVE
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{s.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{s.code} • {s.district}</p>
                          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{s.teachers} teacher(s)</span>
                            <span>{s.students} students</span>
                            <span>{s.sessionsCompleted} sessions</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-secondary rounded-lg p-2 text-center">
                              <p className="font-display text-sm font-bold text-foreground">{engagementPct}%</p>
                              <p className="text-[10px] text-muted-foreground">Engagement</p>
                            </div>
                            <div className="bg-secondary rounded-lg p-2 text-center">
                              <p className="font-display text-sm font-bold text-foreground">{completionPct}%</p>
                              <p className="text-[10px] text-muted-foreground">Completion</p>
                            </div>
                            <div className="bg-secondary rounded-lg p-2 text-center">
                              <p className="font-display text-sm font-bold text-foreground">{performancePct}%</p>
                              <p className="text-[10px] text-muted-foreground">Performance</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingSchool({ id: s.id, name: s.name, code: s.code, district: s.district, mandal: (s as { mandal?: string }).mandal, sessionsCompleted: s.sessionsCompleted, activeStatus: s.activeStatus }); setSchoolFormOpen(true); }}>Edit</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => { if (window.confirm("Delete this school?")) deleteSchool(s.id).then(() => refetch()); }}>Delete</Button>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          ) : !selectedClass ? (
            /* Level 2: Classes in School */
            <div>
              <Button variant="ghost" onClick={() => setSelectedSchool(null)} className="mb-4">← Back to Schools</Button>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">{school?.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{school?.district} • {school?.teachers} teachers • {school?.students} students</p>

              <div className="grid md:grid-cols-2 gap-4">
                {classes.filter(c => c.schoolId === selectedSchool).map(c => {
                  const classLive = activeSessions.filter(ls => ls.classId === c.id);
                  return (
                    <Card key={c.id} className="shadow-card border-border card-hover cursor-pointer relative" onClick={() => setSelectedClass(c.id)}>
                      {classLive.length > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                          <Radio className="w-3 h-3" /> LIVE
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-display font-semibold text-foreground">{c.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Grade {c.grade} • {c.studentCount} students</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {classLive.length > 0 && (
                          <div className="mt-3 p-2 bg-destructive/5 rounded-lg">
                            <p className="text-xs text-foreground font-medium">Active: {classLive[0].topicName}</p>
                            <p className="text-[10px] text-muted-foreground">{classLive[0].teacherName} • {classLive[0].subjectName}</p>
                            <Button size="sm" variant="destructive" className="mt-2 h-6 text-xs gap-1" onClick={(e) => {
                              e.stopPropagation();
                              setWatchingLive(classLive[0].id);
                            }}>
                              <Eye className="w-3 h-3" /> Watch Live
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : !selectedSubject ? (
            /* Level 3: Class details — Students + Subjects */
            <div className="pb-8">
              <Button variant="ghost" onClick={() => setSelectedClass(null)} className="mb-6 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Classes
              </Button>
              
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h2 className="font-display text-2xl font-bold text-foreground">{classDetail?.name}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadAllQRCards}>
                    <FileDown className="w-4 h-4" /> Download All QR Cards
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadClassCsv()}>
                    <FileDown className="w-4 h-4" /> Download Students CSV
                  </Button>
                  <Button variant={showQRCards ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setShowQRCards(!showQRCards)}>
                    <QrCode className="w-4 h-4" /> {showQRCards ? "Show Table" : "Show QR Cards"}
                  </Button>
                </div>
              </div>

              {/* Subjects for this grade */}
              <h3 className="font-display text-lg font-bold text-foreground mb-4">Subjects</h3>

              {/* Class performance bar chart */}
              <Card className="shadow-card border-border mb-4">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Overall Class Performance</h4>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={classSubjectPerformance} margin={{ left: 0, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="percent" fill="hsl(174, 62%, 38%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 mb-8">
                {subjects.filter(s => s.grades.includes(classDetail?.grade || 0)).map(sub => (
                  <Card key={sub.id} className="shadow-card border-border card-hover cursor-pointer min-w-[180px] flex-shrink-0" onClick={() => setSelectedSubject(sub.id)}>
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl">{sub.icon}</span>
                      <p className="text-sm font-medium text-foreground mt-2">{sub.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Students */}
              <h3 className="font-display text-lg font-bold text-foreground mb-4">Students</h3>
              {showQRCards ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                  {classStudents.map(s => (
                    <StudentQRCard
                      key={s.id}
                      student={s}
                      schoolName={school?.name || ""}
                      schoolCode={school?.code || ""}
                      className={classDetail?.name || ""}
                      grade={classDetail?.grade ?? null}
                      section={s.section || ""}
                    />
                  ))}
                </div>
              ) : (
                <Card className="shadow-card border-border">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-secondary">
                          <th className="text-left p-3 font-medium text-muted-foreground">Roll</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Attendance</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                        </tr></thead>
                        <tbody>
                          {classStudents.map(s => {
                            const att = studentAttendance.find(a => a.studentId === s.id);
                            return (
                              <tr key={s.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedStudent(s.id)}>
                                <td className="p-3 text-foreground">{s.rollNo}</td>
                                <td className="p-3 text-foreground font-medium">{s.name}</td>
                                <td className="p-3">
                                  {att ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={att.percentage} className="h-2 w-20" />
                                      <span className="text-xs text-muted-foreground">{att.percentage}%</span>
                                    </div>
                                  ) : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="p-3">
                                  <Button variant="outline" size="sm" className="text-xs h-7">View Profile</Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Level 4: Subject detail — Topics, quizzes, recordings */
            <div className="pb-6">
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => setSelectedSubject(null)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to {classDetail?.name}
                </Button>
              </div>
              
              <div className="mb-6 p-6 bg-gradient-to-r from-teal-light/10 to-info-light/10 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                    {subjects.find(s => s.id === selectedSubject)?.icon} {subjects.find(s => s.id === selectedSubject)?.name}
                  </h2>
                </div>
                
                {/* Teacher Info */}
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Teaching by</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold">
                      RK
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">Rajesh Kumar</p>
                      <p className="text-xs text-muted-foreground">Teacher ID: T001</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2 flex-1 sm:flex-none">
                    <FileText className="w-4 h-4" /> Syllabus
                  </Button>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                    <Video className="w-4 h-4" /> Sessions
                  </Button>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                    <Trophy className="w-4 h-4" /> Quizzes
                  </Button>
                </div>
              </div>

              {/* Top Performers Section */}
              {(() => {
                const subjectChapters = chapters.filter(ch => ch.subjectId === selectedSubject && ch.grade === (classDetail?.grade || 0));
                const subjectChapterIds = subjectChapters.map(ch => ch.id);
                
                // Calculate scores for each student in this subject
                const studentScores = classStudents.map(student => {
                  const studentResults = studentQuizResults.filter(r => 
                    r.studentId === student.id && 
                    subjectChapterIds.some(chId => {
                      const ch = chapters.find(c => c.id === chId);
                      return ch && r.chapterId === ch.id;
                    })
                  );
                  
                  const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0);
                  const totalPossible = studentResults.reduce((sum, r) => sum + r.total, 0);
                  const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
                  
                  return { student, percentage, totalScore, totalPossible };
                });

                // Sort by percentage and get top 5
                const topPerformers = studentScores.sort((a, b) => b.percentage - a.percentage).slice(0, 5);

                return (
                  <div className="mb-6">
                    <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-accent" /> Top Performers
                    </h3>
                    {topPerformers.filter(p => p.totalPossible > 0).length > 0 ? (
                      <div className="grid gap-3">
                        {topPerformers.filter(p => p.totalPossible > 0).map((performer, index) => (
                          <div key={performer.student.id} className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-display font-semibold text-foreground">{performer.student.name}</p>
                                <Badge className="bg-success-light text-success text-sm">{performer.percentage}%</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Roll No: {performer.student.rollNo}</p>
                              <Progress value={performer.percentage} className="h-2 mt-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Card className="shadow-card border-border">
                        <CardContent className="p-6 text-center text-muted-foreground">
                          No quiz results available for this subject yet.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()}

            </div>
          )}
        </TabsContent>

        {/* TEACHERS */}
        <TabsContent value="teachers" className="space-y-4">
          {manageTeachersView ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold text-foreground">Manage Teachers</h3>
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Teacher name"
                    value={manageNameFilter}
                    onChange={(e) => setManageNameFilter(e.target.value)}
                    className="input h-9 px-3 border border-border rounded-md"
                  />
                  <input
                    placeholder="Teacher ID"
                    value={manageIdFilter}
                    onChange={(e) => setManageIdFilter(e.target.value)}
                    className="input h-9 px-3 border border-border rounded-md"
                  />
                  <Button onClick={() => { /* filters applied via local state */ }} className="h-9">Filter</Button>
                </div>
              </div>
              <Card className="shadow-card border-border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">School</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Subjects</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers
                          .filter(t => (manageNameFilter ? t.name.toLowerCase().includes(manageNameFilter.toLowerCase()) : true))
                          .filter(t => (manageIdFilter ? t.id.includes(manageIdFilter) : true))
                          .map(t => (
                            <tr key={t.id} className="border-b border-border last:border-0">
                              <td className="p-3 text-foreground font-medium">{t.id}</td>
                              <td className="p-3 text-foreground">{t.name}</td>
                              <td className="p-3 text-muted-foreground">{schools.find(s => s.id === t.schoolId)?.name}</td>
                              <td className="p-3 text-muted-foreground">{t.subjects.join(", ")}</td>
                              <td className="p-3">
                                <Button variant="outline" size="sm" onClick={() => setEditingTeacherId(t.id)}>Edit</Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Teacher Effectiveness
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto lg:min-w-[620px]">
                  <Select value={teacherSchoolFilter} onValueChange={setTeacherSchoolFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="School" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {schools.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={teacherSubjectFilter} onValueChange={setTeacherSubjectFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {teacherSubjectOptions.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={teacherNameFilter} onValueChange={setTeacherNameFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Teacher (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {schoolFilteredTeachers
                        .filter(t => teacherSubjectFilter === "all" || t.subjects.includes(teacherSubjectFilter))
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredTeacherEffectiveness.length > 0 ? (
                  filteredTeacherEffectiveness.map(({ teacher, ...te }) => {
                    const eff = te as { name?: string; quizAvgScore?: number; studentEngagement?: number; lessonCompletionRate?: number; rating?: number; classesCompleted?: number; totalScheduled?: number };
                    const schoolName = schools.find(s => s.id === teacher.schoolId)?.name;
                    const performanceSeries = [
                      { metric: "Quiz", value: eff.quizAvgScore ?? 0 },
                      { metric: "Engage", value: eff.studentEngagement ?? 0 },
                      { metric: "Complete", value: eff.lessonCompletionRate ?? 0 },
                    ];

                    return (
                      <Card key={te.teacherId} className="shadow-card border-border">
                        <CardContent className="p-5">
                          <div className="grid lg:grid-cols-[1fr_180px] gap-4 items-center">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                                  {(eff.name || teacher.name).charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-display font-semibold text-foreground">{eff.name ?? teacher.name}</h4>
                                  <p className="text-xs text-muted-foreground">{schoolName} • {teacher.subjects.join(", ")}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(eff.rating ?? 0) ? "text-accent fill-accent" : "text-border"}`} />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-1">{eff.rating ?? "—"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-secondary rounded-lg p-3 text-center">
                                  <p className="font-display text-xl font-bold text-foreground">{eff.classesCompleted ?? 0}/{eff.totalScheduled ?? 0}</p>
                                  <p className="text-xs text-muted-foreground">Classes</p>
                                </div>
                                <div className="bg-secondary rounded-lg p-3 text-center">
                                  <p className="font-display text-xl font-bold text-foreground">{eff.quizAvgScore ?? 0}%</p>
                                  <p className="text-xs text-muted-foreground">Quiz Avg</p>
                                </div>
                                <div className="bg-secondary rounded-lg p-3 text-center">
                                  <p className="font-display text-xl font-bold text-foreground">{eff.studentEngagement ?? 0}%</p>
                                  <p className="text-xs text-muted-foreground">Engagement</p>
                                </div>
                                <div className="bg-secondary rounded-lg p-3 text-center">
                                  <p className="font-display text-xl font-bold text-foreground">{eff.lessonCompletionRate ?? 0}%</p>
                                  <p className="text-xs text-muted-foreground">Completion</p>
                                </div>
                              </div>
                            </div>
                            <div className="h-40 bg-secondary/40 rounded-xl p-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceSeries}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                                  <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                  <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                                  <Bar dataKey="value" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="shadow-card border-border lg:col-span-2">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No teachers match the selected filters.
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* LEAVE MANAGEMENT */}
        <TabsContent value="leave" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Leave Applications</CardTitle>
              <div className="ml-auto flex items-center gap-2">
                <Select value={leaveSchoolFilter} onValueChange={setLeaveSchoolFilter}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={leaveTeacherFilter} onValueChange={setLeaveTeacherFilter}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="Teacher (Name)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <input
                  placeholder="Teacher ID"
                  value={leaveTeacherIdFilter}
                  onChange={(e) => setLeaveTeacherIdFilter(e.target.value)}
                  className="input h-9 px-3 border border-border rounded-md w-36"
                />

                <Button onClick={() => { /* filters are reactive via state */ }} className="h-9">Filter</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary">
                    <th className="text-left p-3 font-medium text-muted-foreground">Teacher</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Leave Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Applied On</th>
                  </tr></thead>
                  <tbody>
                    {(
                      leaveApplications
                        .filter(lv => {
                          const teacher = teachers.find(t => t.id === lv.teacherId);
                          if (!teacher) return false;
                          if (leaveSchoolFilter !== "all" && teacher.schoolId !== leaveSchoolFilter) return false;
                          if (leaveTeacherFilter !== "all" && lv.teacherId !== leaveTeacherFilter) return false;
                          if (leaveTeacherIdFilter && !lv.teacherId.includes(leaveTeacherIdFilter)) return false;
                          return true;
                        })
                        .map(lv => {
                      const teacher = teachers.find(t => t.id === lv.teacherId);
                      return (
                        <tr key={lv.id} className="border-b border-border last:border-0">
                          <td className="p-3 text-foreground font-medium">{teacher?.name}</td>
                          <td className="p-3 text-foreground">{lv.date}</td>
                          <td className="p-3 text-muted-foreground">{lv.reason}</td>
                          <td className="p-3 text-muted-foreground">{lv.appliedOn}</td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Class Timetables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                8 periods/day. Breaks: 10:20-10:35 and 2:20-2:35. Lunch: 11:55-1:00.
              </p>
              {!selectedTimetableSchool && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">School → Class → Section → Time table</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {schools.map((s) => (
                      <Card key={s.id} className="shadow-card border-border card-hover cursor-pointer" onClick={() => { setSelectedTimetableSchool(s.id); setSelectedTimetableClass(null); setSelectedTimetableSection(null); }}>
                        <CardContent className="p-4"><p className="font-medium">{s.name}</p></CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {selectedTimetableSchool && selectedTimetableClass == null && (
                <div>
                  <Button variant="ghost" onClick={() => setSelectedTimetableSchool(null)} className="mb-3">← Back to Schools</Button>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from(new Set(classes.filter((c) => c.schoolId === selectedTimetableSchool).map((c) => c.grade))).sort((a, b) => a - b).map((g) => (
                      <Card key={g} className="shadow-card border-border card-hover cursor-pointer" onClick={() => { setSelectedTimetableClass(g); setSelectedTimetableSection(null); }}>
                        <CardContent className="p-4 text-center"><span className="font-semibold">Class {g}</span></CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {selectedTimetableSchool && selectedTimetableClass != null && !selectedTimetableSection && (
                <div>
                  <Button variant="ghost" onClick={() => setSelectedTimetableClass(null)} className="mb-3">← Back to Classes</Button>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {classes.filter((c) => c.schoolId === selectedTimetableSchool && c.grade === selectedTimetableClass).map((c) => (
                      <Card key={c.id} className="shadow-card border-border card-hover cursor-pointer" onClick={() => setSelectedTimetableSection(c.id)}>
                        <CardContent className="p-4 text-center"><span className="font-semibold">Section {c.section}</span></CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {selectedTimetableSchool && selectedTimetableClass != null && selectedTimetableSection && (
                <div>
                  <Button variant="ghost" onClick={() => setSelectedTimetableSection(null)} className="mb-3">← Back to Sections</Button>
                  {(() => {
                    const cls = classes.find((c) => c.id === selectedTimetableSection);
                    const rows = (timetables as Array<{ classId: string; weekDay: number; periodNo: number; subjectName: string; teacherId?: string | null; startTime: string; endTime: string }>)
                      .filter((t) => t.classId === selectedTimetableSection)
                      .sort((a, b) => (a.weekDay - b.weekDay) || (a.periodNo - b.periodNo));
                    if (!rows.length) return <p className="text-sm text-muted-foreground">No timetable found for this section.</p>;
                    const dayNames: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
                    return (
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-sm font-semibold text-foreground mb-2">{cls?.name}</p>
                        <div className="overflow-x-auto rounded-md border border-border">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="bg-secondary border-b border-border">
                                <th className="p-2 text-left font-medium">Day \\ Period</th>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => <th key={`tt-p-${p}`} className="p-2 text-left font-medium">P{p}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 2, 3, 4, 5, 6].map((d) => (
                                <tr key={`tt-d-${d}`} className="border-b border-border last:border-0">
                                  <td className="p-2 font-semibold">{dayNames[d]}</td>
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                                    const r = rows.find((x) => x.weekDay === d && x.periodNo === p);
                                    const t = r ? teachers.find((x) => x.id === (r.teacherId || "")) : null;
                                    return (
                                      <td key={`tt-${d}-${p}`} className="p-2 align-top">
                                        {r ? (
                                          <div className="rounded bg-secondary px-1.5 py-1">
                                            <p className="font-medium">{r.subjectName}</p>
                                            <p className="text-[10px] text-muted-foreground">{t?.name || "Teacher not mapped"}</p>
                                          </div>
                                        ) : <span className="text-muted-foreground">-</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MATERIALS */}
        <TabsContent value="materials" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Study Materials & Syllabus
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Class → Subject → Chapter → Topic-wise micro lesson plan. Use filters in Textbook / Whole year dialogs.
              </p>
            </CardHeader>
            <CardContent>
              {materialGrade == null ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Select a class (grade):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[6, 7, 8, 9, 10].map(g => (
                      <Card key={g} className="shadow-card border-border card-hover cursor-pointer" onClick={() => { setMaterialGrade(g); setMaterialSubjectId(null); setMaterialChapterId(null); }}>
                        <CardContent className="p-5 flex items-center justify-center">
                          <span className="font-display font-bold text-lg">Class {g}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : materialSubjectId == null ? (
                <div>
                  <Button variant="ghost" onClick={() => { setMaterialGrade(null); setMaterialSubjectId(null); setMaterialChapterId(null); }} className="mb-4">← Back to Classes</Button>
                  <p className="text-sm text-muted-foreground mb-4">Class {materialGrade} – Select subject:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects.filter(s => s.grades.includes(materialGrade)).map(sub => (
                      <Card key={sub.id} className="shadow-card border-border card-hover cursor-pointer" onClick={() => { setMaterialSubjectId(sub.id); setMaterialChapterId(null); }}>
                        <CardContent className="p-4 flex items-center gap-2">
                          <span className="text-xl">{sub.icon}</span>
                          <span className="font-medium">{sub.name}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : materialChapterId == null ? (
                <div>
                  <Button variant="ghost" onClick={() => setMaterialSubjectId(null)} className="mb-4">← Back to Subjects</Button>
                  <p className="text-sm text-muted-foreground mb-4">
                    Class {materialGrade} • {subjects.find(s => s.id === materialSubjectId)?.name} – Select chapter:
                  </p>
                  <div className="space-y-2">
                    {chapters.filter(ch => ch.subjectId === materialSubjectId && ch.grade === materialGrade).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(ch => (
                      <Card key={ch.id} className="shadow-card border-border card-hover cursor-pointer" onClick={() => setMaterialChapterId(ch.id)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <span className="font-medium">{ch.name}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Button variant="ghost" onClick={() => setMaterialChapterId(null)} className="mb-4">← Back to Chapters</Button>
                  {(() => {
                    const ch = chapters.find(c => c.id === materialChapterId);
                    const sub = subjects.find(s => s.id === materialSubjectId);
                    const chapterTopics = topics.filter(t => t.chapterId === materialChapterId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    const syllabusEntries = (syllabusByChapter[materialChapterId] ?? []) as Array<{ monthLabel: string; weekLabel: string; periods: number; teachingPlan: string }>;
                    const primaryEntry = syllabusEntries[0];
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Button variant="outline" size="sm" onClick={() => { setPlanDialogType("textbook"); setPlanDialogOpen(true); }}><BookOpen className="w-4 h-4 mr-1" /> Textbook</Button>
                          <Button variant="outline" size="sm" onClick={() => { setPlanDialogType("wholeyear"); setPlanDialogOpen(true); }}><FileText className="w-4 h-4 mr-1" /> Whole Year Micro Lesson Plan</Button>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground mb-2">{ch?.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4">Class {materialGrade} • {sub?.name}</p>
                        {/* Admin: Add textual material for this chapter (replaces existing) */}
                        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/20">
                          <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Textual material (chapter PDF)
                          </p>
                          {(ch as { textbookChunkPdfPath?: string | null })?.textbookChunkPdfPath && (
                            <p className="text-xs text-muted-foreground mb-2">
                              Current: {(ch as { textbookChunkPdfPath: string }).textbookChunkPdfPath}
                              {" · "}
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => {
                                  const previewUrl = toPreviewUrl(
                                    resolveUploadUrl((ch as { textbookChunkPdfPath: string }).textbookChunkPdfPath)
                                  );
                                  if (!previewUrl) return;
                                  void openMaterialPreviewSafe({
                                    title: `${ch?.name || "Chapter"} - Textbook`,
                                    previewUrl,
                                    fallbackUrl: previewUrl,
                                  });
                                }}
                              >
                                View
                              </button>
                            </p>
                          )}
                          <input
                            ref={textbookInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const chapterId = materialChapterId;
                              if (!chapterId || !e.target.files?.[0]) return;
                              const file = e.target.files[0];
                              setUploadingTextbookFor(chapterId);
                              try {
                                const base64 = await file.arrayBuffer().then((buf) => {
                                  let binary = "";
                                  const bytes = new Uint8Array(buf);
                                  const chunk = 0x8000;
                                  for (let i = 0; i < bytes.length; i += chunk) {
                                    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                                  }
                                  return btoa(binary);
                                });
                                if (!base64) throw new Error("Failed to read file");
                                await updateChapterTextbook(chapterId, { file: base64, filename: file.name });
                                refetch?.();
                                toast.success("Textbook uploaded and saved.");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Upload failed. File may be too large or server error.");
                              } finally {
                                setUploadingTextbookFor(null);
                                e.target.value = "";
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={!!uploadingTextbookFor}
                            onClick={() => textbookInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingTextbookFor ? "Uploading…" : (ch as { textbookChunkPdfPath?: string | null })?.textbookChunkPdfPath ? "Replace textual material" : "Add textual material"}
                          </Button>
                        </div>
                        {(primaryEntry || (ch && (ch.monthLabel || ch.teachingPlanSummary))) ? (
                          <div className="rounded-lg border border-border p-4 mb-4 bg-muted/20">
                            {primaryEntry ? (
                              <>
                                <p className="text-sm font-medium text-foreground mb-1">{primaryEntry.monthLabel} ({primaryEntry.weekLabel}) • {primaryEntry.periods} periods</p>
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{primaryEntry.teachingPlan}</pre>
                              </>
                            ) : ch && (
                              <>
                                <p className="text-sm font-medium text-foreground mb-1">
                                  {ch.monthLabel}
                                  {ch.periods != null && ` • ${ch.periods} periods`}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{ch.teachingPlanSummary}</p>
                              </>
                            )}
                          </div>
                        ) : null}
                        <h4 className="font-display font-semibold text-foreground mb-2">Topic-wise (Micro lesson plan)</h4>
                        <div className="space-y-2">
                          {chapterTopics.length > 0 ? chapterTopics.map(t => (
                            <div key={t.id} className="p-3 rounded-lg bg-secondary border border-border/60">
                              <p className="text-sm font-medium text-foreground">{t.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">Status: {t.status}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {(t as { topicPptPath?: string | null }).topicPptPath && (
                                  <button
                                    type="button"
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => {
                                      const originalUrl = resolveUploadUrl((t as { topicPptPath: string }).topicPptPath);
                                      const previewUrl = toPreviewUrl(originalUrl);
                                      if (!previewUrl) return;
                                      void openMaterialPreviewSafe({
                                        title: `${t.name} - PPT`,
                                        previewUrl,
                                        fallbackUrl: originalUrl,
                                        previewType: isPptxUrl(originalUrl) ? "pptx" : "iframe",
                                      });
                                    }}
                                  >
                                    View PPT
                                  </button>
                                )}
                                {(t as { microLessons?: Array<{ id: string; periodNo: number; conceptText: string; planText: string }> }).microLessons?.length ? (
                                  <details className="w-full mt-1">
                                    <summary className="text-xs text-primary cursor-pointer">View micro lesson plan</summary>
                                    <div className="mt-2 space-y-2">
                                      {(t as { microLessons: Array<{ id: string; periodNo: number; conceptText: string; planText: string }> }).microLessons.map((ml) => (
                                        <div key={ml.id} className="rounded border border-border/70 bg-background p-2">
                                          <p className="text-xs font-medium text-foreground">Period {ml.periodNo}</p>
                                          {ml.conceptText ? <p className="text-xs text-muted-foreground mt-1">Concept: {ml.conceptText}</p> : null}
                                          {ml.planText ? <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ml.planText}</p> : null}
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                ) : null}
                                <input
                                  type="file"
                                  accept=".ppt,.pptx,.pdf"
                                  className="hidden"
                                  ref={el => { pptInputRefs.current[t.id] = el; }}
                                  onChange={async (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const file = e.target.files[0];
                                    setUploadingPptFor(t.id);
                                    try {
                                      const base64 = await file.arrayBuffer().then((buf) => {
                                        let binary = "";
                                        const bytes = new Uint8Array(buf);
                                        const chunk = 0x8000;
                                        for (let i = 0; i < bytes.length; i += chunk) {
                                          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
                                        }
                                        return btoa(binary);
                                      });
                                      if (!base64) throw new Error("Failed to read file");
                                      await updateTopicPpt(t.id, { file: base64, filename: file.name });
                                      refetch?.();
                                      toast.success("PPT uploaded and saved.");
                                    } catch (err) {
                                      toast.error(err instanceof Error ? err.message : "Upload failed. File may be too large or server error.");
                                    } finally {
                                      setUploadingPptFor(null);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 h-7 text-xs"
                                  disabled={!!uploadingPptFor}
                                  onClick={() => pptInputRefs.current[t.id]?.click()}
                                >
                                  <Presentation className="w-3.5 h-3.5" />
                                  {uploadingPptFor === t.id ? "Uploading…" : (t as { topicPptPath?: string | null }).topicPptPath ? "Replace PPT" : "Add PPT"}
                                </Button>
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">No topics for this chapter in the database.</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS STATUS */}
        <TabsContent value="classstatus" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" /> Class Status Management
              </CardTitle>
              <div className="ml-auto flex items-center gap-2">
                <Select value={classStatusSchoolFilter} onValueChange={(v) => { setClassStatusSchoolFilter(v); setClassStatusClassFilter("all"); }}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={classStatusClassFilter} onValueChange={setClassStatusClassFilter}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes
                      .filter(c => classStatusSchoolFilter === "all" ? true : c.schoolId === classStatusSchoolFilter)
                      .map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Class</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Teacher</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr></thead>
                  <tbody>
                    {combinedClassStatus
                      .filter(cs => {
                        if (classStatusSchoolFilter !== "all") {
                          const cls = classes.find(c => c.id === cs.classId);
                          if (!cls || cls.schoolId !== classStatusSchoolFilter) return false;
                        }
                        if (classStatusClassFilter !== "all" && cs.classId !== classStatusClassFilter) return false;
                        const d = new Date(String(cs.date || "").slice(0, 10));
                        if (Number.isNaN(d.getTime())) return false;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tenDaysAgo = new Date(today);
                        tenDaysAgo.setDate(today.getDate() - 9);
                        return d >= tenDaysAgo && d <= today;
                      })
                      .sort((a, b) => {
                        const da = new Date(String(a.date || "").slice(0, 10)).getTime();
                        const db = new Date(String(b.date || "").slice(0, 10)).getTime();
                        return db - da;
                      })
                      .slice(0, 10)
                      .map(cs => {
                        const cls = classes.find(c => c.id === cs.classId);
                        const teacher = teachers.find(t => t.id === cs.teacherId);
                        const isLive = cs.status === "ongoing_live" || cs.status === "ongoing live";
                        const liveSessionId = String(cs.id).startsWith("live-") ? String(cs.id).replace("live-", "") : null;
                        return (
                          <tr key={cs.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-muted-foreground">{cs.date}</td>
                            <td className="p-3 text-foreground font-medium">{cls?.name}</td>
                            <td className="p-3 text-foreground">{teacher?.name}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                cs.status === "conducted" ? "bg-success-light text-success" :
                                isLive ? "bg-primary/20 text-primary" :
                                "bg-destructive/10 text-destructive"
                              }`}>
                                {cs.status === "conducted"
                                  ? <><CheckCircle2 className="w-3 h-3" /> Conducted</>
                                  : isLive
                                    ? <><Radio className="w-3 h-3" /> Ongoing Live</>
                                    : <><XCircle className="w-3 h-3" /> Cancelled</>
                                }
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{cs.reason ?? "—"}</td>
                            <td className="p-3">
                              {isLive && liveSessionId ? (
                                <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => { setWatchingLive(liveSessionId); setActiveTab("overview"); }}>
                                  <Eye className="w-3 h-3" /> Watch
                                </Button>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    {combinedClassStatus
                      .filter(cs => {
                        if (classStatusSchoolFilter !== "all") {
                          const cls = classes.find(c => c.id === cs.classId);
                          if (!cls || cls.schoolId !== classStatusSchoolFilter) return false;
                        }
                        if (classStatusClassFilter !== "all" && cs.classId !== classStatusClassFilter) return false;
                        const d = new Date(String(cs.date || "").slice(0, 10));
                        if (Number.isNaN(d.getTime())) return false;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tenDaysAgo = new Date(today);
                        tenDaysAgo.setDate(today.getDate() - 9);
                        return d >= tenDaysAgo && d <= today;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                            No class status rows in the last 10 days for current filters.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Activity Audit Log</CardTitle>
              <div className="ml-auto flex items-center gap-2">
                <Select value={logSchoolFilter} onValueChange={setLogSchoolFilter}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={logTeacherFilter} onValueChange={setLogTeacherFilter}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="Teacher (Name)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <input
                  placeholder="Teacher ID"
                  value={logTeacherIdFilter}
                  onChange={(e) => setLogTeacherIdFilter(e.target.value)}
                  className="input h-9 px-3 border border-border rounded-md w-36"
                />

                <Button onClick={() => { /* reactive filters */ }} className="h-9">Filter</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary">
                    <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">School/Class</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">GPS</th>
                  </tr></thead>
                  <tbody>
                    {activityLogs
                      .filter(log => {
                        // school filter: compare by school id -> name
                        if (logSchoolFilter !== "all") {
                          const expectedName = schools.find(s => s.id === logSchoolFilter)?.name;
                          if (expectedName && log.school !== expectedName) return false;
                        }
                        // teacher select filter (by id)
                        if (logTeacherFilter !== "all") {
                          const t = teachers.find(t => t.id === logTeacherFilter);
                          if (!t || log.user !== t.name) return false;
                        }
                        // teacher id typed filter: map log.user -> teacher id and match substring
                        if (logTeacherIdFilter) {
                          const t = teachers.find(t => t.name === log.user);
                          if (!t || !t.id.includes(logTeacherIdFilter)) return false;
                        }
                        return true;
                      })
                      .map(log => (
                        <tr key={log.id} className="border-b border-border last:border-0">
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp}</div>
                          </td>
                          <td className="p-3 text-foreground font-medium">{log.user}</td>
                          <td className="p-3"><Badge variant="outline" className="text-xs">{log.role}</Badge></td>
                          <td className="p-3 text-foreground">{log.action}</td>
                          <td className="p-3 text-muted-foreground">{log.school} / {log.class}</td>
                          <td className="p-3 text-muted-foreground text-xs">{log.gps}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTeacherId} onOpenChange={(open) => { if (!open) setEditingTeacherId(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher — School & Subject</DialogTitle>
          </DialogHeader>
          {editingTeacherId && (() => {
            const t = teachers.find((x) => x.id === editingTeacherId);
            if (!t) return null;
            const classesForEditSchool = classes.filter((c) => c.schoolId === teacherEditSchoolId);
            return (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">Teacher: <strong>{t.name}</strong></p>
                <div>
                  <Label>School</Label>
                  <Select value={teacherEditSchoolId} onValueChange={(v) => { setTeacherEditSchoolId(v); setTeacherEditAssignments((prev) => prev.map((a) => ({ ...a, schoolId: v }))); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Class – Subject assignments</span>
                    <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setTeacherEditAssignments((prev) => [...prev, { classId: "", subjectId: "", schoolId: teacherEditSchoolId }])}>Add</Button>
                  </Label>
                  {teacherAssignmentsLoading ? (
                    <p className="text-sm text-muted-foreground py-2">Loading…</p>
                  ) : (
                    <div className="space-y-2 mt-1 max-h-48 overflow-y-auto">
                      {teacherEditAssignments.map((a, i) => (
                        <div key={i} className="flex gap-2 items-center flex-wrap">
                          <Select value={a.classId} onValueChange={(v) => setTeacherEditAssignments((prev) => prev.map((p, j) => j === i ? { ...p, classId: v } : p))}>
                            <SelectTrigger className="h-9 flex-1 min-w-[100px]">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classesForEditSchool.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={a.subjectId} onValueChange={(v) => setTeacherEditAssignments((prev) => prev.map((p, j) => j === i ? { ...p, subjectId: v } : p))}>
                            <SelectTrigger className="h-9 flex-1 min-w-[100px]">
                              <SelectValue placeholder="Subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setTeacherEditAssignments((prev) => prev.filter((_, j) => j !== i))}>×</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingTeacherId(null)}>Cancel</Button>
                  <Button
                    disabled={teacherAssignmentsSaving}
                    onClick={() => {
                      const payload = teacherEditAssignments.filter((a) => a.classId && a.subjectId).map((a) => ({ class_id: a.classId, subject_id: a.subjectId, school_id: a.schoolId || teacherEditSchoolId }));
                      setTeacherAssignmentsSaving(true);
                      updateTeacher(editingTeacherId, { school_id: teacherEditSchoolId })
                        .then(() => updateTeacherAssignments(editingTeacherId, { school_id: teacherEditSchoolId, assignments: payload }))
                        .then(() => { refetch(); setEditingTeacherId(null); })
                        .catch((err) => alert(err instanceof Error ? err.message : "Failed to update"))
                        .finally(() => setTeacherAssignmentsSaving(false));
                    }}
                  >
                    {teacherAssignmentsSaving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={materialPreview.open}
        onOpenChange={(open) => setMaterialPreview((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold text-foreground truncate">
                {materialPreview.title || "Material Preview"}
              </h3>
              {(materialPreview.fallbackUrl || materialPreview.url) ? (
                <a
                  href={materialPreview.fallbackUrl || materialPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Open in new tab
                </a>
              ) : null}
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-xl border border-border overflow-hidden bg-background h-[68vh]">
              {materialPreview.previewType === "message" ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
                  <p className="text-sm text-muted-foreground">{materialPreview.message || "Preview not available."}</p>
                  {materialPreview.fallbackUrl ? (
                    <a
                      href={materialPreview.fallbackUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Open in new tab
                    </a>
                  ) : null}
                </div>
              ) : materialPreview.previewType === "pptx" && materialPreview.url ? (
                <div className="h-full p-3 bg-muted/20">
                  <PptxViewer src={materialPreview.url} width={1280} height={720} />
                </div>
              ) : materialPreview.url ? (
                <iframe
                  title={materialPreview.title || "Material preview"}
                  src={materialPreview.url}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No preview URL available.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 border-t border-border pt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMaterialPreview((prev) => ({ ...prev, open: false }))}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!registrationModalType}
        onOpenChange={(open) => { if (!open) setRegistrationModalType(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{registrationModalType === "student" ? "Student Registration" : "Teacher Registration"}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
            ) : schools.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No schools in the system. Add schools from the <strong>Schools</strong> tab first, then register students or teachers.
              </p>
            ) : registrationModalType === "student" ? (
              <StudentForm
                schools={schools}
                classes={classes}
                onClose={() => setRegistrationModalType(null)}
                onSuccess={() => { refetch(); setRegistrationModalType(null); }}
              />
            ) : registrationModalType === "teacher" ? (
              <TeacherForm
                schools={schools}
                onClose={() => setRegistrationModalType(null)}
                onSuccess={() => { refetch(); setRegistrationModalType(null); }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLiveSessionsDialog} onOpenChange={setShowLiveSessionsDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" /> Live Sessions Now
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 space-y-2 pt-2">
            {activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No live sessions at the moment.</p>
            ) : (
              activeSessions.map((ls) => {
                const schoolName = classes.find(c => c.id === ls.classId) ? schools.find(s => s.id === classes.find(c => c.id === ls.classId)?.schoolId)?.name : "";
                return (
                  <Card key={ls.id} className="border-border">
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{ls.topicName || "Live class"}</p>
                        <p className="text-sm text-muted-foreground">
                          {ls.teacherName} • {ls.className} • {ls.subjectName}
                          {schoolName ? ` • ${schoolName}` : ""}
                        </p>
                        {ls.startTime && (
                          <p className="text-xs text-muted-foreground mt-1">Started: {new Date(ls.startTime).toLocaleTimeString()}</p>
                        )}
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setShowLiveSessionsDialog(false);
                          setWatchingLive(ls.id);
                          setActiveTab("overview");
                        }}
                      >
                        <Eye className="w-4 h-4" /> Watch
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={schoolFormOpen} onOpenChange={setSchoolFormOpen}>
        <DialogContent>
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
              <Label>Mandal</Label>
              <Input value={schoolForm.mandal} onChange={(e) => setSchoolForm(f => ({ ...f, mandal: e.target.value }))} placeholder="Mandal (optional)" />
            </div>
            <div>
              <Label>Sessions completed</Label>
              <Input type="number" min={0} value={schoolForm.sessionsCompleted} onChange={(e) => setSchoolForm(f => ({ ...f, sessionsCompleted: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="school-active" checked={schoolForm.activeStatus} onChange={(e) => setSchoolForm(f => ({ ...f, activeStatus: e.target.checked }))} />
              <Label htmlFor="school-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSchoolFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={schoolSubmitting}>{editingSchool ? "Update" : "Add"} School</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={(open) => { setPlanDialogOpen(open); if (!open) setPlanDialogType(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{planDialogType === "textbook" ? "Textbook" : "Whole Year Micro Lesson Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Month</Label>
                <Select value={planFilterMonth} onValueChange={setPlanFilterMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {["June", "July", "August", "September", "October", "November", "December", "January", "February"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Week</Label>
                <Select value={planFilterWeek} onValueChange={setPlanFilterWeek}>
                  <SelectTrigger><SelectValue placeholder="Week" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {["Week 1", "Week 2", "Week 3", "Week 4", "Week 1–2", "Week 3–4"].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Chapter</Label>
                <Select value={planFilterChapter} onValueChange={setPlanFilterChapter}>
                  <SelectTrigger><SelectValue placeholder="Chapter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(materialGrade != null && materialSubjectId ? chapters.filter(c => c.grade === materialGrade && c.subjectId === materialSubjectId) : chapters).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 min-h-[200px] bg-muted/30 text-sm text-muted-foreground">
              Filter by month, week, and chapter to view content. Data is loaded from the syllabus in the database.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
