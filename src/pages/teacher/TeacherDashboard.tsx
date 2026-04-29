import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PptxViewer from "@/components/PptxViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { createLeaveApplication, updateLeaveApplicationStatus, createLiveQuiz, getLiveQuizLeaderboard, endLiveQuiz, getApiBase, startLiveSession, submitAttendance, endLiveSession, getLiveQuizTeacherQr, fetchLiveQuizStatus, startLiveQuizCapture, submitLiveQuizAnswer, getAiRecommendations, askAiAssistant, fetchPrincipalStudents, fetchTodayTeacherAttendance, markTeacherSelfAttendance, fetchTeacherAssignments } from "@/api/client";

import { liveQuizCheckpoint } from "@/lib/liveQuizCheckpoint";
import { toast } from "sonner";

type TopicLike = { id: string; chapterId: string; name: string; order: number; status: string; topicPptPath?: string | null; materials: Array<{ id: string; type: string; title: string; url: string }> };
type LiveSessionLike = { id: string; teacherId: string; classId: string; subjectId: string; chapterId: string; topicId: string; topicName: string; teacherName: string; className: string; subjectName: string; startTime: string; status: string; attendanceMarked: boolean; quizSubmitted: boolean };
import {
  BookOpen, Bot, Play, QrCode, CheckCircle2, XCircle, Lightbulb,
  Video, VideoOff, CalendarOff, CalendarCheck, FileText, Upload,
  Clock, ArrowLeft, ChevronRight, ChevronLeft, Trophy, Presentation, Image,
  PlayCircle, Film, FileDown, ChevronDown, Users, Radio,
  Microscope, Globe, Sparkles, BarChart3, MonitorPlay, Monitor, X,
  Maximize, Minimize, Pause, Send, MessageCircle, Medal, RotateCcw,
  Youtube, ExternalLink
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const statusColors = {
  completed: { bg: "bg-success-light", text: "text-success", label: "Completed", color: "hsl(var(--success))" },
  in_progress: { bg: "bg-amber-light", text: "text-amber", label: "In Progress", color: "hsl(var(--amber))" },
  not_started: { bg: "bg-secondary", text: "text-muted-foreground", label: "Not Started", color: "hsl(var(--border))" },
  /** Jan/Feb (later-term) chapters: still listed, not part of “completed syllabus” yet */
  future_syllabus: { bg: "bg-secondary", text: "text-muted-foreground", label: "Yet to complete", color: "hsl(var(--border))" },
};

type ChapterStatusKey = keyof typeof statusColors;

function normalizeTopicStatus(raw: string | undefined | null): ChapterStatusKey {
  const s = String(raw || "not_started")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  if (s === "completed") return "completed";
  if (s === "in_progress" || s === "planned") return "in_progress";
  return "not_started";
}

/** Coerce API ids so topic↔chapter joins and status map lookups work if JSON mixes string/number ids. */
function sameId(a: unknown, b: unknown): boolean {
  return String(a ?? "") === String(b ?? "");
}

/** When a chapter has topics, badge + progress must follow topic rows from the API — not stale local chapter state. */
function deriveChapterStatusKey(
  chTopics: Array<{ id: string; status?: string }>,
  topicStatusState: Record<string, string>
): ChapterStatusKey {
  if (chTopics.length === 0) return "not_started";
  const norms = chTopics.map((t) => normalizeTopicStatus(topicStatusState[String(t.id)] ?? t.status));
  if (norms.every((x) => x === "completed")) return "completed";
  if (norms.some((x) => x === "in_progress")) return "in_progress";
  if (norms.some((x) => x === "completed")) return "in_progress";
  return "not_started";
}

/** Calendar month on chapter rows (`macro_month_label`); Jan/Feb are excluded from syllabus completion scope. */
const SYLLABUS_MONTH_ORDER: Record<string, number> = {
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  january: 13,
  february: 14,
};

function chapterMonthOrder(monthLabel: string | null | undefined): number | null {
  if (monthLabel == null || String(monthLabel).trim() === "") return null;
  const raw = String(monthLabel).trim().toLowerCase();
  const tokens = raw.split(/[-/\s]+/).filter(Boolean);
  const last = tokens[tokens.length - 1];
  return SYLLABUS_MONTH_ORDER[last] ?? null;
}

/** Chapters through December count toward syllabus completion; Jan/Feb are shown but treated as not done yet. */
function isChapterInSyllabusThroughDecember(ch: { monthLabel?: string | null }): boolean {
  const ord = chapterMonthOrder(ch.monthLabel);
  if (ord === null) return true;
  return ord <= SYLLABUS_MONTH_ORDER.december;
}

/** Same syllabus rules everywhere (chapter list, lesson plan modal): Jan/Feb topics show “Yet to complete” even if DB says completed. */
function displayTopicSyllabusLabel(
  chapter: { monthLabel?: string | null } | undefined,
  topicId: string,
  topicStatus: string | undefined,
  topicStatusState: Record<string, string>
): string {
  if (chapter && !isChapterInSyllabusThroughDecember(chapter)) return "Yet to complete";
  const raw = topicStatusState[String(topicId)] ?? topicStatus ?? "not_started";
  const k = normalizeTopicStatus(raw);
  return statusColors[k].label;
}

const materialTypeIcons: Record<string, typeof FileText> = {
  ppt: Presentation, pdf: FileText, video: PlayCircle, image: Image,
  ai_video: Film, recording: Video, doc: FileText, notes: FileText,
  simulation: Microscope, vr: Globe,
};

function getLocalDateYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Direct file URL (for download / open in new tab). */
function getMaterialDirectUrl(relativePath: string): string {
  const base = getApiBase();
  return `${base}/uploads/${relativePath.replace(/\\/g, "/")}`;
}

/** URL for viewing: direct file URL. PDF in iframe; PPTX rendered by PptxViewer component. */
function getMaterialViewerUrl(relativePath: string): string {
  return getMaterialDirectUrl(relativePath);
}

function isPptxPath(relativePath: string | null): boolean {
  return !!relativePath && /\.pptx?$/i.test(relativePath);
}

const TeacherDashboard = () => {
  const [lessonPlanOpen, setLessonPlanOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, refetch } = useAppData();
  const { userName, teacherId, role } = useAuth();

  const classes = data.classes;
  const subjects = data.subjects;
  const chapters = data.chapters;
  const topics = data.topics as TopicLike[];
  const students = data.students;
  const schools = data.schools;
  const classStatusFromApi = data.classStatus;
  const leaveApplications = data.leaveApplications;
  const studentAttendance = data.studentAttendance;
  const studentQuizResults = data.studentQuizResults;
  const studyMaterials = data.studyMaterials;
  const liveSessionsFromApi = data.liveSessions as LiveSessionLike[];
  const chapterQuizzes = data.chapterQuizzes || [];
  const studentUsageLogs = (data.studentUsageLogs || []) as Array<{ studentId: string; date: string; minutes: number }>;
  const timetables = (data.timetables || []) as Array<{ classId: string; weekDay: number; periodNo: number; subjectName: string; subjectId?: string | null; teacherId?: string | null; startTime: string; endTime: string }>;
  const coCurricularActivities = (data.coCurricularActivities || []) as Array<{ id: string; title: string; description: string; date: string; status: string; icon: string; registrations: number; classId?: string | null; teacherId?: string | null }>;

  const urlClass = searchParams.get("class") || "";
  const urlSubject = searchParams.get("subject") || "";

  const [selectedClass, setSelectedClass] = useState<string>(urlClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(urlSubject);

  useEffect(() => {
    setSelectedClass(urlClass);
    setSelectedSubject(urlSubject);
  }, [urlClass, urlSubject]);

  const currentClass = useMemo(() => classes.find((c) => c.id === selectedClass), [classes, selectedClass]);
  const grade = currentClass?.grade ?? 8;
  const currentSubject = useMemo(() => subjects.find((s) => s.id === selectedSubject), [subjects, selectedSubject]);

  useEffect(() => {
    if (role !== "teacher") return;
    if (!selectedClass || !selectedSubject || !currentClass || !currentSubject) {
      navigate("/teacher/setup", { replace: true });
    }
  }, [role, selectedClass, selectedSubject, currentClass, currentSubject, navigate]);

  const [chapterStatusState, setChapterStatusState] = useState<Record<string, string>>({});
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const filteredChaptersForTopics = useMemo(
    () =>
      chapters.filter(
        (ch) => String(ch.subjectId) === String(selectedSubject) && Number(ch.grade) === Number(grade)
      ),
    [chapters, selectedSubject, grade]
  );
  const topicIdsForFilteredChapters = useMemo(
    () =>
      new Set(
        topics
          .filter((t) => filteredChaptersForTopics.some((c) => sameId(c.id, t.chapterId)))
          .map((t) => String(t.id))
      ),
    [topics, filteredChaptersForTopics]
  );
  const [topicStatusState, setTopicStatusState] = useState<Record<string, string>>({});
  useEffect(() => {
    const initial: Record<string, string> = {};
    topics.forEach((t) => {
      const tid = String(t.id);
      if (topicIdsForFilteredChapters.has(tid)) initial[tid] = t.status || "not_started";
    });
    // Prefer values from API (`initial`) over stale local state when data is refetched.
    setTopicStatusState((prev) => ({ ...prev, ...initial }));
  }, [topics, topicIdsForFilteredChapters]);

  const filteredChapters = filteredChaptersForTopics;

  const [activeSession, setActiveSession] = useState<LiveSessionLike | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, "present" | "absent">>({});
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [sessionQuizDone, setSessionQuizDone] = useState(false);
  const [materialPreviewOpen, setMaterialPreviewOpen] = useState(false);
  const [materialPreviewUrl, setMaterialPreviewUrl] = useState<string | null>(null);
  const [materialPreviewRelativePath, setMaterialPreviewRelativePath] = useState<string | null>(null);
  const [materialPreviewTitle, setMaterialPreviewTitle] = useState("");
  const [mainScreenContentUrl, setMainScreenContentUrl] = useState<string | null>(null);
  const [mainScreenTitle, setMainScreenTitle] = useState("");
  const [mainScreenDirectUrl, setMainScreenDirectUrl] = useState<string | null>(null);
  const [liveQuizSession, setLiveQuizSession] = useState<{ id: string; questions: Array<{ id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string }> } | null>(null);
  const [liveQuizLeaderboard, setLiveQuizLeaderboard] = useState<Array<{ rank: number; studentId: string; studentName: string; score: number }>>([]);
  const [liveQuizTeacherQr, setLiveQuizTeacherQr] = useState<string | null>(null);
  const [liveQuizStatus, setLiveQuizStatus] = useState<{ started: boolean; connectedDevices: number; questions: number; students: number; answersCaptured: number; attendanceReady?: boolean; attendanceDate?: string; currentQuestionNo?: number; progressByQuestion?: Record<string, number>; submitted?: boolean } | null>(null);
  const [liveQuizCaptureMode, setLiveQuizCaptureMode] = useState<"manual" | "qr">("manual");
  const [manualQuestionNo, setManualQuestionNo] = useState(1);
  const [manualSelections, setManualSelections] = useState<Record<string, Record<string, string>>>({});
  const [manualSubmittingStudentId, setManualSubmittingStudentId] = useState<string | null>(null);
  const [liveQuizLaunching, setLiveQuizLaunching] = useState(false);
  const [showLaunchQuizDialog, setShowLaunchQuizDialog] = useState(false);
  const liveQuizLeaderboardRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveQuizStatusPollSeq = useRef(0);
  const [sessionStartLoading, setSessionStartLoading] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [sessionEnding, setSessionEnding] = useState(false);
  const [recommendations, setRecommendations] = useState<{ videos: any[], resources: any[] } | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState<string | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<{ marked: boolean; status?: string } | null>(null);

  useEffect(() => {
    if (teacherId) {
      fetchTodayTeacherAttendance(teacherId)
        .then(setTodayAttendance)
        .catch(console.error);
    }
  }, [teacherId]);



  // --- New UI state ---
  const [sessionViewMode, setSessionViewMode] = useState<"tools" | "attendance" | "ai_chat" | "recommendations">("tools");

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const sessionContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      sessionContainerRef.current?.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const classStatusState = useMemo(
    () =>
      classStatusFromApi.filter((cs) => {
        if (cs.classId !== selectedClass) return false;
        if (!selectedSubject) return true;
        return !cs.subjectId || cs.subjectId === selectedSubject;
      }) as Array<{
        id: string;
        date: string;
        classId: string;
        subjectId?: string | null;
        status: "conducted" | "cancelled";
        teacherId: string;
        reason?: string;
      }>,
    [classStatusFromApi, selectedClass, selectedSubject]
  );
  const [classStatusLocal, setClassStatusLocal] = useState<typeof classStatusState>([]);
  useEffect(() => {
    setClassStatusLocal(classStatusState);
  }, [classStatusState]);

  const leaves = useMemo(() => leaveApplications.filter((l) => l.teacherId === teacherId), [leaveApplications, teacherId]);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // --- Attendance Calendar state ---
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-indexed
  const [calendarUpdating, setCalendarUpdating] = useState<string | null>(null); // leave id being updated

  /**
   * Backend may return dates as "Wed Feb 18" (no year) OR "YYYY-MM-DD".
   * Normalise both to "YYYY-MM-DD" using the current year so the calendar lookup works.
   */
  const parseLeaveDate = (raw: string): string => {
    if (!raw) return raw;
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
    // Format: "Wed Feb 18" — day-name month-abbr day
    const MONTHS: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const parts = raw.trim().split(/\s+/);
    if (parts.length >= 3) {
      const month = MONTHS[parts[1]];
      const day = parts[2].padStart(2, "0");
      if (month && day) return `${new Date().getFullYear()}-${month}-${day}`;
    }
    return raw;
  };

  const leaveByDate = useMemo(() => {
    const map = new Map<string, typeof leaves[0]>();
    // Normalise every leave date to YYYY-MM-DD for reliable lookup
    leaves.forEach((lv) => map.set(parseLeaveDate(lv.date), lv));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves]);

  /**
   * "Cancel leave" — sets status to "rejected" so the day is treated as present again.
   * This is the corrective action when a leave was submitted by mistake.
   */
  const handleCancelLeave = async (leaveId: string) => {
    setCalendarUpdating(leaveId);
    try {
      await updateLeaveApplicationStatus(leaveId, "rejected");
      refetch();
      toast.success("Leave cancelled — day marked as present.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel leave");
    } finally {
      setCalendarUpdating(null);
    }
  };

  const [activities, setActivities] = useState<Array<{ id: string; title: string; description: string; date: string; status: string; icon: string; registrations: number }>>([]);
  const [registrations, setRegistrations] = useState<Array<{ activityId: string; studentId: string; status: string }>>([]);

  // state for inline registration form
  const [registeringActivity, setRegisteringActivity] = useState<string | null>(null);
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [viewingActivityRegistrations, setViewingActivityRegistrations] = useState<string | null>(null);

  const beginRegister = (activityId: string) => {
    setRegisteringActivity(activityId);
    setRegisterStudentId("");
  };

  const confirmRegister = () => {
    if (!registeringActivity || !registerStudentId) {
      setRegisteringActivity(null);
      return;
    }
    // increment count on activity
    setActivities(prev =>
      prev.map(a =>
        a.id === registeringActivity
          ? { ...a, registrations: a.registrations + 1 }
          : a
      )
    );
    // record registration details
    setRegistrations(prev => [
      ...prev,
      { activityId: registeringActivity, studentId: registerStudentId, status: "registered" as const },
    ]);
    setRegisteringActivity(null);
    setRegisterStudentId("");
  };

  useEffect(() => {
    const filtered = coCurricularActivities
      .filter((a) => !a.classId || a.classId === selectedClass)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.date,
        status: a.status,
        icon: a.icon || "🏅",
        registrations: a.registrations || 0,
      }));
    setActivities(filtered);
  }, [coCurricularActivities, selectedClass]);

  const [dynamicStudents] = useState<any[] | null>(null);

  const classStudents = useMemo(() => {
    const sourceStudents = dynamicStudents !== null ? dynamicStudents : students;
    return sourceStudents.filter((s) => String(s.classId) === String(selectedClass));
  }, [students, dynamicStudents, selectedClass]);

  const downloadClassCsv = useCallback(() => {
    if (!classStudents.length || !currentClass) return;
    const rows: string[] = [];
    const header = ["Student ID", "Name", "Roll No", "Section", "Class", "School", "Quiz %", "Attendance %", "Avg Usage (min)"];
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    rows.push(header.join(","));
    const schoolName = schools.find((sc) => sc.id === currentClass.schoolId)?.name || "";

    classStudents.forEach((s) => {
      const studentResults = studentQuizResults.filter((r) => r.studentId === s.id);
      const totalScore = studentResults.reduce((a, r) => a + r.score, 0);
      const totalPossible = studentResults.reduce((a, r) => a + r.total, 0);
      const quizPct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      const att = studentAttendance.find((a) => a.studentId === s.id);
      const attPct = att ? att.percentage : "";
      const usageLogs = studentUsageLogs.filter((u) => u.studentId === s.id);
      const avgUsage = usageLogs.length ? Math.round(usageLogs.reduce((a, u) => a + u.minutes, 0) / usageLogs.length) : 0;
      const line = [
        escape(s.id),
        escape(s.name),
        escape(s.rollNo),
        escape((s as { section?: string }).section ?? ""),
        escape(currentClass.name),
        escape(schoolName),
        escape(quizPct),
        escape(attPct),
        escape(avgUsage),
      ];
      rows.push(line.join(","));
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `${currentClass.name.replace(/\s+/g, "_")}_students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [classStudents, currentClass, schools, studentQuizResults, studentAttendance, studentUsageLogs]);

  // used when clicking "view" on a student row
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);

  const detailedStudent = viewingStudent ? students.find((s) => s.id === viewingStudent) : null;
  const detailedResults = viewingStudent ? studentQuizResults.filter((r) => r.studentId === viewingStudent) : [];
  const detailedUsage = viewingStudent ? studentUsageLogs.filter((u) => u.studentId === viewingStudent) : [];
  const detailedRegistrations = viewingStudent ? registrations.filter((r) => r.studentId === viewingStudent) : [];

  const detailedSubjectPerf = useMemo(() => {
    if (!viewingStudent) return [];
    const gradeVal = currentClass?.grade ?? 0;
    const gradeSubs = subjects.filter((s) => s.grades.includes(gradeVal));
    return gradeSubs.map((sub) => {
      const subChaps = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === gradeVal);
      const subRes = detailedResults.filter((r) => subChaps.some((ch) => ch.id === r.chapterId));
      const score = subRes.reduce((a, r) => a + r.score, 0);
      const total = subRes.reduce((a, r) => a + r.total, 0);
      return { name: sub.name, score: total > 0 ? Math.round((score / total) * 100) : 0 };
    });
  }, [viewingStudent, currentClass?.grade, subjects, chapters, detailedResults]);

  const detailedWeak = detailedSubjectPerf.filter((s) => s.score > 0 && s.score < 60).sort((a, b) => a.score - b.score);

  const filteredChapterIds = filteredChapters.map((ch) => ch.id);
  /** Full chapter count (e.g. 21). Completed = only June–Dec chapters that are fully done; Jan/Feb never count as completed yet. */
  const completedChapterCount = filteredChapters.filter((ch) => {
    if (!isChapterInSyllabusThroughDecember(ch)) return false;
    const chTopics = topics.filter((t) => sameId(t.chapterId, ch.id));
    if (chTopics.length === 0) return (chapterStatusState[String(ch.id)] || "not_started") === "completed";
    return chTopics.every((t) => (topicStatusState[String(t.id)] ?? t.status) === "completed");
  }).length;
  const syllabusProgress = filteredChapters.length > 0
    ? Math.round((completedChapterCount / filteredChapters.length) * 100)
    : 0;
  const totalQuizChapterIds = Array.from(
    new Set(chapterQuizzes.filter((q) => filteredChapterIds.includes(q.chapterId)).map((q) => q.chapterId))
  );
  const completedQuizChapterIds = Array.from(
    new Set(
      studentQuizResults
        .filter((r) => classStudents.some((student) => student.id === r.studentId) && filteredChapterIds.includes(r.chapterId))
        .map((r) => r.chapterId)
    )
  );
  const totalQuizCount = totalQuizChapterIds.length > 0 ? totalQuizChapterIds.length : filteredChapterIds.length;
  const completedQuizCount = completedQuizChapterIds.length;
  const conductedSessions = classStatusLocal.filter((cs) => cs.status === "conducted").length;
  const scheduledSessions = classStatusLocal.length;

  const rankedStudentsByMarks = classStudents
    .map((student) => {
      const results = studentQuizResults.filter(
        (r) => r.studentId === student.id && filteredChapterIds.includes(r.chapterId)
      );
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const totalPossible = results.reduce((sum, r) => sum + r.total, 0);
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      return { student, percentage, totalPossible, totalScore };
    })
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return b.totalScore - a.totalScore;
    });

  // Session timer
  useEffect(() => {
    if (!activeSession || sessionPaused) return;
    const timer = setInterval(() => setSessionTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [activeSession, sessionPaused]);

  /** Clear live-quiz UI and local scan buffers so a new live session never inherits the previous one. */
  const resetLiveQuizUiState = useCallback(() => {
    liveQuizCheckpoint("reset_live_quiz_ui");
    if (liveQuizLeaderboardRef.current) {
      clearInterval(liveQuizLeaderboardRef.current);
      liveQuizLeaderboardRef.current = null;
    }
    setLiveQuizSession(null);
    setLiveQuizLeaderboard([]);
    setLiveQuizTeacherQr(null);
    setLiveQuizStatus(null);
    setLiveQuizCaptureMode("manual");
    setManualQuestionNo(1);
    setManualSelections({});
    setManualSubmittingStudentId(null);
    setShowLaunchQuizDialog(false);
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("liveQuizBuffer_")) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleLaunchLiveQuiz = useCallback(async () => {
    if (!activeSession) {
      liveQuizCheckpoint("launch_quiz:blocked", { reason: "no_active_session" });
      toast.error("Start a live teaching session before launching a quiz.");
      return;
    }
    if (!attendanceMarked) {
      liveQuizCheckpoint("launch_quiz:blocked", { reason: "attendance_not_marked", liveSessionId: activeSession.id });
      toast.error("Submit attendance first. Only present students can take the quiz.");
      return;
    }
    if (liveQuizLaunching) return;
    setLiveQuizLaunching(true);
    liveQuizCheckpoint("launch_quiz:start", { liveSessionId: activeSession.id, classId: activeSession.classId });
    try {
      // Clear any existing polling loop
      if (liveQuizLeaderboardRef.current) {
        clearInterval(liveQuizLeaderboardRef.current);
        liveQuizLeaderboardRef.current = null;
      }

      // Create/get quiz session (one quiz per live session)
      const created = await createLiveQuiz({
        teacherId: activeSession.teacherId,
        classId: activeSession.classId,
        chapterId: activeSession.chapterId,
        topicId: activeSession.topicId,
        topicName: activeSession.topicName,
        subjectId: activeSession.subjectId,
        liveSessionId: activeSession.id,
      });
      liveQuizCheckpoint("launch_quiz:quiz_created", {
        liveQuizSessionId: created.id,
        questionCount: created.questions?.length ?? 0,
      });
      setLiveQuizSession({ id: created.id, questions: created.questions });
      setLiveQuizCaptureMode("manual");
      setManualQuestionNo(1);
      setManualSelections({});
      setManualSubmittingStudentId(null);
      try {
        const qr = await getLiveQuizTeacherQr(created.id);
        setLiveQuizTeacherQr(qr.dataUrl || null);
      } catch {
        setLiveQuizTeacherQr(null);
      }
      try {
        const st = await fetchLiveQuizStatus(created.id);
        liveQuizCheckpoint("launch_quiz:initial_status", {
          liveQuizSessionId: created.id,
          students: st.students,
          attendanceDate: st.attendanceDate,
          attendanceReady: st.attendanceReady,
          answersCaptured: st.answersCaptured,
          questions: st.questions,
        });
        setLiveQuizStatus({
          started: st.started,
          connectedDevices: st.connectedDevices,
          questions: st.questions,
          students: st.students,
          answersCaptured: st.answersCaptured,
          attendanceReady: st.attendanceReady,
          attendanceDate: st.attendanceDate,
          currentQuestionNo: st.currentQuestionNo,
          progressByQuestion: st.progressByQuestion,
          submitted: st.submitted,
        });
      } catch {
        liveQuizCheckpoint("launch_quiz:initial_status_failed", { liveQuizSessionId: created.id });
        setLiveQuizStatus(null);
      }

      // Fetch leaderboard now and keep it fresh
      try {
        const lb = await getLiveQuizLeaderboard(created.id);
        setLiveQuizLeaderboard(lb.leaderboard || []);
      } catch {
        setLiveQuizLeaderboard([]);
      }
      liveQuizLeaderboardRef.current = setInterval(async () => {
        try {
          const lb = await getLiveQuizLeaderboard(created.id);
          setLiveQuizLeaderboard(lb.leaderboard || []);
        } catch {
          // ignore transient errors
        }
      }, 5000);

      setSessionQuizDone(true);
      setShowLaunchQuizDialog(true);
      liveQuizCheckpoint("launch_quiz:dialog_open");
    } catch (e) {
      liveQuizCheckpoint("launch_quiz:error", { message: e instanceof Error ? e.message : String(e) });
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to launch quiz");
    } finally {
      setLiveQuizLaunching(false);
    }
  }, [activeSession, attendanceMarked, liveQuizLaunching]);

  const handleEndLiveQuiz = useCallback(async () => {
    if (!liveQuizSession) return;
    liveQuizCheckpoint("end_quiz:click", { liveQuizSessionId: liveQuizSession.id, mode: liveQuizCaptureMode });
    if (liveQuizCaptureMode === "qr") {
      try {
        const status = await fetchLiveQuizStatus(liveQuizSession.id);
        if (!status.submitted) {
          liveQuizCheckpoint("end_quiz:blocked", { reason: "not_submitted_from_mobile" });
          toast.error("Mobile scanner has not submitted final answers yet.");
          return;
        }
      } catch {
        liveQuizCheckpoint("end_quiz:status_fetch_failed");
        toast.error("Unable to verify final submission status.");
        return;
      }
    }
    if (liveQuizLeaderboardRef.current) {
      clearInterval(liveQuizLeaderboardRef.current);
      liveQuizLeaderboardRef.current = null;
    }
    try {
      await endLiveQuiz(liveQuizSession.id);
      liveQuizCheckpoint("end_quiz:api_ok");
      setLiveQuizSession(null);
      setLiveQuizLeaderboard([]);
      setLiveQuizTeacherQr(null);
      setLiveQuizStatus(null);
      if (refetch) refetch();
    } catch (e) {
      liveQuizCheckpoint("end_quiz:api_error", { message: e instanceof Error ? e.message : String(e) });
      console.error(e);
    }
  }, [liveQuizSession, refetch, liveQuizCaptureMode]);

  const handleStartLiveQuizCapture = useCallback(async () => {
    if (!liveQuizSession) return;
    liveQuizCheckpoint("start_capture:click", { liveQuizSessionId: liveQuizSession.id });
    try {
      await startLiveQuizCapture(liveQuizSession.id);
      toast.success("Capture started. Mobile scanner can now submit all answers.");
      const st = await fetchLiveQuizStatus(liveQuizSession.id);
      liveQuizCheckpoint("start_capture:status_after", {
        students: st.students,
        attendanceReady: st.attendanceReady,
        attendanceDate: st.attendanceDate,
        started: st.started,
      });
      setLiveQuizStatus({
        started: st.started,
        connectedDevices: st.connectedDevices,
        questions: st.questions,
        students: st.students,
        answersCaptured: st.answersCaptured,
        attendanceReady: st.attendanceReady,
        attendanceDate: st.attendanceDate,
        currentQuestionNo: st.currentQuestionNo,
        progressByQuestion: st.progressByQuestion,
        submitted: st.submitted,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to start capture";
      liveQuizCheckpoint("start_capture:error", { message: msg });
      toast.error(msg);
    }
  }, [liveQuizSession]);

  const manualEligibleStudents = useMemo(
    () => classStudents.filter((s) => sessionAttendance[s.id]),
    [classStudents, sessionAttendance]
  );
  const manualCurrentQuestion = useMemo(() => {
    const list = liveQuizSession?.questions || [];
    if (list.length < 1) return null;
    const idx = Math.min(Math.max(1, manualQuestionNo), list.length) - 1;
    return list[idx] || null;
  }, [liveQuizSession?.questions, manualQuestionNo]);
  const manualCurrentAnswers = useMemo(
    () => manualSelections[String(manualQuestionNo)] || {},
    [manualSelections, manualQuestionNo]
  );

  const handleManualSelectOption = useCallback(
    async (studentId: string, selectedOption: string) => {
      if (!liveQuizSession || !manualCurrentQuestion) return;
      try {
        setManualSubmittingStudentId(studentId);
        await submitLiveQuizAnswer(liveQuizSession.id, studentId, manualCurrentQuestion.id, selectedOption);
        setManualSelections((prev) => ({
          ...prev,
          [String(manualQuestionNo)]: {
            ...(prev[String(manualQuestionNo)] || {}),
            [studentId]: selectedOption,
          },
        }));
        const st = await fetchLiveQuizStatus(liveQuizSession.id);
        setLiveQuizStatus({
          started: st.started,
          connectedDevices: st.connectedDevices,
          questions: st.questions,
          students: st.students,
          answersCaptured: st.answersCaptured,
          attendanceReady: st.attendanceReady,
          attendanceDate: st.attendanceDate,
          currentQuestionNo: st.currentQuestionNo,
          progressByQuestion: st.progressByQuestion,
          submitted: st.submitted,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save answer");
      } finally {
        setManualSubmittingStudentId(null);
      }
    },
    [liveQuizSession, manualCurrentQuestion, manualQuestionNo]
  );

  const handleAutoWorkflow = async (chapterId: string) => {
    setWorkflowLoading(chapterId);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/chapters/${chapterId}/auto-workflow`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Successfully generated ${data.results.length} topics with PPTs and Quizzes!`);
        refetch?.();
      } else {
        toast.error(data.error || "Failed to trigger workflow");
      }
    } catch (e) {
      toast.error("Network error triggering workflow");
    } finally {
      setWorkflowLoading(null);
    }
  };

  useEffect(() => {
    if (!showLaunchQuizDialog || !liveQuizSession) return;
    liveQuizStatusPollSeq.current = 0;
    let t: ReturnType<typeof setInterval> | null = null;
    const refresh = async () => {
      try {
        const st = await fetchLiveQuizStatus(liveQuizSession.id);
        liveQuizStatusPollSeq.current += 1;
        const seq = liveQuizStatusPollSeq.current;
        if (seq === 1 || seq % 5 === 0) {
          liveQuizCheckpoint("dialog_poll:status", {
            pollSeq: seq,
            liveQuizSessionId: liveQuizSession.id,
            students: st.students,
            attendanceDate: st.attendanceDate,
            attendanceReady: st.attendanceReady,
            answersCaptured: st.answersCaptured,
            submitted: st.submitted,
          });
        }
        setLiveQuizStatus({
          started: st.started,
          connectedDevices: st.connectedDevices,
          questions: st.questions,
          students: st.students,
          answersCaptured: st.answersCaptured,
          attendanceReady: st.attendanceReady,
          attendanceDate: st.attendanceDate,
          currentQuestionNo: st.currentQuestionNo,
          progressByQuestion: st.progressByQuestion,
          submitted: st.submitted,
        });
      } catch {
        // ignore transient errors
      }
      try {
        const lb = await getLiveQuizLeaderboard(liveQuizSession.id);
        setLiveQuizLeaderboard(lb.leaderboard || []);
      } catch {
        // ignore transient errors
      }
    };
    refresh();
    t = setInterval(refresh, 3000);
    return () => {
      if (t) clearInterval(t);
      liveQuizStatusPollSeq.current = 0;
    };
  }, [liveQuizSession, showLaunchQuizDialog]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const liveQuizCurrentQuestion = useMemo(() => {
    const list = liveQuizSession?.questions;
    if (!list?.length) return null;
    const rawNo = Number(liveQuizCaptureMode === "manual" ? manualQuestionNo : (liveQuizStatus?.currentQuestionNo ?? 1));
    const qNo = Math.min(Math.max(1, rawNo || 1), list.length);
    return { index: qNo, question: list[qNo - 1] };
  }, [liveQuizSession?.questions, liveQuizStatus?.currentQuestionNo, liveQuizCaptureMode, manualQuestionNo]);

  // Chapter progress based on topics (later-term Jan/Feb chapters stay at 0% until their term is active)
  const getChapterProgress = (chapterId: string) => {
    const ch = chapters.find((c) => sameId(c.id, chapterId));
    if (ch && !isChapterInSyllabusThroughDecember(ch)) return 0;
    const chTopics = topics.filter((t) => sameId(t.chapterId, chapterId));
    if (chTopics.length === 0) return 0;
    const completed = chTopics.filter((t) => (topicStatusState[String(t.id)] || t.status) === "completed").length;
    return Math.round((completed / chTopics.length) * 100);
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleStartSession = async (topic: TopicLike) => {
    if (!teacherId || !selectedClass || !selectedSubject || !currentClass || !currentSubject) return;
    setSessionStartLoading(true);
    resetLiveQuizUiState();
    liveQuizCheckpoint("live_session:start_request", { classId: selectedClass, subjectId: selectedSubject, topicId: topic.id });
    try {
      const created = await startLiveSession({
        teacherId,
        classId: selectedClass,
        subjectId: selectedSubject,
        chapterId: topic.chapterId,
        topicId: topic.id,
        topicName: topic.name,
      });
      const session: LiveSessionLike = {
        id: created.id,
        teacherId: created.teacherId,
        classId: created.classId,
        subjectId: created.subjectId,
        chapterId: created.chapterId ?? topic.chapterId,
        topicId: created.topicId ?? topic.id,
        topicName: created.topicName,
        teacherName: userName || "Teacher",
        className: currentClass.name,
        subjectName: currentSubject.name,
        startTime: created.startTime,
        status: created.status,
        attendanceMarked: created.attendanceMarked,
        quizSubmitted: created.quizSubmitted,
      };
      setActiveSession(session);
      // Check for resume data
      const resumeData = getResumeData(topic.id);
      
      // NAVIGATE to the dedicated lesson page
      navigate(`/teacher/lesson?sessionId=${created.id}`, { state: { session } });
      
      refetch?.();
    } catch (e) {
      liveQuizCheckpoint("live_session:error", { message: e instanceof Error ? e.message : String(e) });
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setSessionStartLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setSessionEnding(true);
    liveQuizCheckpoint("live_session:end_request", { liveSessionId: activeSession.id });
    try {
      const sessionId = activeSession.id;
      if (/^\d+$/.test(sessionId)) {
        await endLiveSession(sessionId);
        liveQuizCheckpoint("live_session:end_ok", { liveSessionId: sessionId });
      }
      setTopicStatusState((prev) => ({ ...prev, [String(activeSession.topicId)]: "completed" }));
      const today = new Date().toISOString().split("T")[0];
      setClassStatusLocal((prev) => [
        { id: `cs_${Date.now()}`, date: today, classId: selectedClass, status: "conducted" as const, teacherId: teacherId || "" },
        ...prev,
      ]);
      setActiveSession(null);
      setSessionTime(0);
      resetLiveQuizUiState();
      refetch?.();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to end session");
    } finally {
      setSessionEnding(false);
    }
  };

  const handlePauseSession = () => {
    if (!activeSession) return;
    if (!sessionPaused) {
      const pauseData = {
        topicId: activeSession.topicId,
        topicName: activeSession.topicName,
        chapterId: activeSession.chapterId,
        elapsedTime: sessionTime,
        timestamp: Date.now(),
      };
      localStorage.setItem(`pausedSession_${activeSession.topicId}`, JSON.stringify(pauseData));
      setSessionPaused(true);
      toast.success("Session paused.");
    } else {
      setSessionPaused(false);
      toast.success("Session resumed.");
    }
  };

  const getResumeData = (topicId: string) => {
    try {
      const raw = localStorage.getItem(`pausedSession_${topicId}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Only valid if paused within last 24 hours
      if (Date.now() - data.timestamp > 86400000) {
        localStorage.removeItem(`pausedSession_${topicId}`);
        return null;
      }
      return data as { topicId: string; topicName: string; elapsedTime: number; timestamp: number };
    } catch { return null; }
  };

  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    
    const userMsg = { role: "user" as const, text: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      const activeChapter = activeSession?.chapterId 
        ? chapters.find(c => sameId(c.id, activeSession.chapterId))
        : null;

      const res = await askAiAssistant({
        question: msg,
        topic: activeSession?.topicName,
        subject: activeSession?.subjectName,
        chapter: activeChapter?.name
      });
      setChatMessages(prev => [...prev, { role: "ai", text: res.answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: "ai", text: "I'm sorry, I'm having trouble connecting to my brain right now. Please ensure the AI server is running." }]);
    } finally {
      setChatLoading(false);
    }
  };


  const handleMarkAttendance = async () => {
    if (!activeSession || !classStudents.length) return;
    const date = getLocalDateYmd();
    const entries = classStudents
      .filter((s) => sessionAttendance[s.id] !== undefined)
      .map((s) => ({
        studentId: s.id,
        status: sessionAttendance[s.id] as "present" | "absent",
      }));
    const presentCount = entries.filter((e) => e.status === "present").length;
    const absentCount = entries.filter((e) => e.status === "absent").length;
    setAttendanceSubmitting(true);
    liveQuizCheckpoint("attendance:submit", {
      liveSessionId: activeSession.id,
      classId: activeSession.classId,
      date,
      presentCount,
      absentCount,
      total: entries.length,
    });
    try {
      await submitAttendance({ classId: activeSession.classId, date, entries, liveSessionId: activeSession.id });
      liveQuizCheckpoint("attendance:ok", { date, liveSessionId: activeSession.id });
      setAttendanceMarked(true);
      refetch?.();
      toast.success("Attendance saved.");
    } catch (e) {
      liveQuizCheckpoint("attendance:error", { message: e instanceof Error ? e.message : String(e) });
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save attendance");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveDate || !leaveReason || !teacherId) return;
    setLeaveError(null);
    setLeaveSubmitting(true);
    try {
      await createLeaveApplication({ teacher_id: teacherId, start_date: leaveDate, reason: leaveReason.trim() });
      setLeaveDate("");
      setLeaveReason("");
      refetch();
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Failed to submit leave");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleFetchRecommendations = useCallback(async () => {
    if (!activeSession) return;
    setRecoLoading(true);
    try {
      const res = await getAiRecommendations({
        topic: activeSession.topicName,
        subject: activeSession.subjectName,
        grade: grade
      });
      setRecommendations(res);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not fetch recommendations.";
      toast.error(msg + " Ensure AI server is running on port 8001.");

    } finally {
      setRecoLoading(false);
    }

  }, [activeSession, grade]);

   const handleChapterStatusChange = (chId: string, newStatus: string) => {

    setChapterStatusState((prev) => ({ ...prev, [chId]: newStatus }));
  };

  if (role === "teacher" && !activeSession && (!selectedClass || !selectedSubject || !currentClass || !currentSubject)) {
    return (
      <DashboardLayout title="Teacher Dashboard">
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  if (activeSession) {
    const sessionTopic = topics.find((t) => t.id === activeSession.topicId);
    const sessionChapter = chapters.find((c) => sameId(c.id, activeSession.chapterId));
    const canEnd = attendanceMarked && sessionQuizDone;

    return (
      <DashboardLayout title="Live Teaching Session">
        {/* Session Header Bar */}
        <div className="bg-gradient-to-r from-primary/10 via-teal-light to-primary/5 rounded-xl p-4 mb-6 border border-primary/10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* End & Return */}
              <Button
                variant="ghost"
                size="sm"
                disabled={sessionEnding}
                onClick={() => {
                  if (canEnd) handleEndSession();
                  else if (confirm("End session without completing requirements?")) handleEndSession();
                }}
                className="gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {sessionEnding ? "Ending…" : "End & Return"}
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">{activeSession.subjectName} → {sessionChapter?.name}</p>
                <h2 className="font-display text-lg font-bold text-foreground">{activeSession.topicName}</h2>
                <p className="text-xs text-muted-foreground">{activeSession.className} • Started {new Date(activeSession.startTime).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* LIVE indicator — flex positioned, no overlap */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse shadow-sm">
                <Radio className="w-3.5 h-3.5" /> LIVE • {formatTime(sessionTime)}
              </div>
              {/* Attendance status badge */}
              <Badge className={`gap-1 text-xs ${attendanceMarked ? "bg-success-light text-success border-success/20" : "bg-amber-light text-amber border-amber/20"}`}>
                {attendanceMarked ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {attendanceMarked ? "Attendance Done" : "Attendance Pending"}
              </Badge>
              {/* Quiz status badge */}
              <Badge className={`gap-1 text-xs ${sessionQuizDone ? "bg-success-light text-success border-success/20" : "bg-amber-light text-amber border-amber/20"}`}>
                {sessionQuizDone ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {sessionQuizDone ? "Quiz Done" : "Quiz Pending"}
              </Badge>
              {/* Attendance top-right button */}
              <Button
                variant={sessionViewMode === "attendance" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setSessionViewMode(sessionViewMode === "attendance" ? "tools" : "attendance")}
              >
                <Users className="w-3.5 h-3.5" />
                {sessionViewMode === "attendance" ? "Back to Tools" : "Attendance"}
              </Button>
            </div>
          </div>
        </div>

        <div className={`grid lg:grid-cols-3 gap-6 ${isFullscreen ? "lg:grid-cols-1" : ""}`}>
          {/* Main workspace */}
          <div className={`${isFullscreen ? "" : "lg:col-span-2"} space-y-4`}>
            <Card ref={sessionContainerRef} className={`shadow-card border-border overflow-hidden ${isFullscreen ? "w-screen h-screen rounded-none border-none flex flex-col justify-center bg-background p-8" : ""}`}>
              <CardContent className="p-4">
                {mainScreenContentUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate min-w-0">{mainScreenTitle}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1 h-7 px-2" onClick={toggleFullscreen}>
                          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="default" size="sm" className="gap-1.5 h-7" onClick={() => { setMainScreenContentUrl(null); setMainScreenTitle(""); setMainScreenDirectUrl(null); }}>
                          <Video className="w-3.5 h-3.5" /> Back to live
                        </Button>
                      </div>
                    </div>
                    <div className={`rounded-xl overflow-hidden border border-border bg-muted ${isFullscreen ? "flex-1 flex items-center justify-center h-full" : "min-h-[320px]"}`}>
                      {mainScreenDirectUrl && /\.pptx?$/i.test(mainScreenDirectUrl) ? (
                        <PptxViewer src={mainScreenContentUrl} width={isFullscreen ? 1280 : 960} height={isFullscreen ? 720 : 540} />
                      ) : (
                        <iframe
                          src={mainScreenContentUrl}
                          title={mainScreenTitle}
                          className={`w-full ${isFullscreen ? "h-full" : "aspect-video min-h-[320px]"}`}
                          allow="fullscreen"
                        />
                      )}
                    </div>
                    {mainScreenDirectUrl && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <a href={mainScreenDirectUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Open in new tab
                        </a>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={`${isFullscreen ? "w-full max-w-2xl mx-auto" : "aspect-video"} bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.07] rounded-xl flex items-center justify-center border border-border relative`}>
                    <div className="text-center space-y-4">
                      <div className={`${isFullscreen ? "w-32 h-32" : "w-20 h-20"} rounded-2xl bg-primary/10 flex items-center justify-center mx-auto transition-all`}>
                        <BookOpen className={`${isFullscreen ? "w-12 h-12" : "w-8 h-8"} text-primary transition-all`} />
                      </div>
                      <div>
                        <p className={`text-foreground font-display font-bold ${isFullscreen ? "text-2xl" : "text-lg"}`}>{sessionChapter?.name}</p>
                        <p className={`${isFullscreen ? "text-lg" : "text-sm"} text-muted-foreground`}>{activeSession.topicName}</p>
                      </div>
                      <p className={`${isFullscreen ? "text-5xl" : "text-3xl"} font-mono text-primary font-bold`}>{formatTime(sessionTime)}</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="outline" size={isFullscreen ? "lg" : "sm"} className="gap-2" onClick={toggleFullscreen}>
                          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-3.5 h-3.5" />}
                          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Materials — PPT opens directly on screen */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm">Topic Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {sessionChapter?.textbookChunkPdfPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const path = sessionChapter.textbookChunkPdfPath!;
                        setMaterialPreviewRelativePath(path);
                        setMaterialPreviewUrl(getMaterialViewerUrl(path));
                        setMaterialPreviewTitle("Textual Reference");
                        setMaterialPreviewOpen(true);
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Textual Reference
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1.5 opacity-60" onClick={() => toast.error("No textual material available for this chapter")}>
                      <BookOpen className="w-3.5 h-3.5" /> Textual Reference
                    </Button>
                  )}
                  {sessionTopic?.topicPptPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        // PPT opens directly on screen — no dialog
                        const path = sessionTopic.topicPptPath!;
                        setMainScreenContentUrl(getMaterialViewerUrl(path));
                        setMainScreenTitle("PPT — " + (sessionTopic?.name ?? "Presentation"));
                        setMainScreenDirectUrl(getMaterialDirectUrl(path));
                      }}
                    >
                      <Presentation className="w-3.5 h-3.5" /> PPT
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1.5 opacity-60" onClick={() => toast.error("No PPT available for this topic")}>
                      <Presentation className="w-3.5 h-3.5" /> PPT
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Tools / Attendance (toggle) */}
          {!isFullscreen && (
            <div className="space-y-4">
              {sessionViewMode === "tools" ? (
                <>
                  {/* Teaching Tools — AI PPT Generator removed */}
                  <Card className="shadow-card border-border hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" /> Teaching Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { icon: QrCode, label: "Launch Quiz", desc: "QR-based quiz for students" },
                        { icon: FileText, label: "Lesson Plan Viewer", desc: "Chapter lesson plan" },
                        { icon: Bot, label: "AI Teaching Assistant", desc: "Get help with this topic" },
                        { icon: Youtube, label: "YouTube Recommendations", desc: "Related videos & notes" },
                      ].map((tool, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                          onClick={() => {
                            if (tool.label === "Launch Quiz") handleLaunchLiveQuiz();
                            if (tool.label === "Lesson Plan Viewer") setLessonPlanOpen(true);
                            if (tool.label === "AI Teaching Assistant") setSessionViewMode("ai_chat");
                            if (tool.label === "YouTube Recommendations") {
                              setSessionViewMode("recommendations");
                              handleFetchRecommendations();
                            }
                          }}
                        >

                          <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
                            <tool.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{tool.label}</p>
                            <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : sessionViewMode === "ai_chat" ? (
                /* Inline AI Chatbot — replaces tools when clicked */
                <Card className="shadow-card border-border flex flex-col h-[500px]">
                  <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-teal-light to-secondary">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-sm flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" /> AI Assistant
                      </CardTitle>
                      <button onClick={() => setSessionViewMode("tools")} className="p-1 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div className="bg-card border border-border p-2.5 rounded-xl rounded-tl-sm shadow-sm text-xs text-foreground max-w-[90%]">
                        Hello! I'm your AI teaching assistant. How can I help you with your session today?
                      </div>
                    </div>

                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "ai" && (
                          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                            <Bot className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <div className={`p-2.5 rounded-xl shadow-sm text-xs max-w-[90%] ${msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border text-foreground rounded-tl-sm"
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex gap-2 animate-pulse">
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                          <Bot className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <div className="bg-card border border-border p-2.5 rounded-xl rounded-tl-sm shadow-sm text-[10px] text-muted-foreground">
                          Thinking...
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-3 border-t border-border bg-card">
                    <div className="flex items-center gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask for lesson tips..."
                        className="text-xs h-8 flex-1 rounded-full bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                        onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      />
                      <Button size="icon" className="h-8 w-8 rounded-full shrink-0 shadow-sm" onClick={handleSendChat} disabled={!chatInput.trim()}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : sessionViewMode === "recommendations" ? (
                /* Recommendations View — replaces tools when clicked */
                <Card className="shadow-card border-border flex flex-col h-[500px]">
                  <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-teal-light to-secondary">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-sm flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-primary" /> Recommendations
                      </CardTitle>
                      <button onClick={() => setSessionViewMode("tools")} className="p-1 hover:bg-black/5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                    {recoLoading ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">Finding best resources...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendations?.videos && recommendations.videos.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Youtube className="w-3 h-3" /> YouTube Videos
                            </h4>
                            {recommendations.videos.map((vid, i) => (
                              <button
                                key={i}
                                className="w-full text-left p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all group"
                                onClick={() => {
                                  // Open in main session screen if it's a youtube embeddable link
                                  const videoIdMatch = vid.url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/);
                                  if (videoIdMatch) {
                                    const embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
                                    setMainScreenContentUrl(embedUrl);
                                    setMainScreenTitle(vid.title);
                                    setMainScreenDirectUrl(vid.url);
                                  } else {
                                    window.open(vid.url, "_blank");
                                  }
                                }}
                              >
                                <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary">{vid.title}</p>
                                {vid.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{vid.description}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {recommendations?.resources && recommendations.resources.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <ExternalLink className="w-3 h-3" /> E-Resources
                            </h4>
                            {recommendations.resources.map((res, i) => (
                              <a
                                key={i}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary">{res.title}</p>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                                {res.snippet && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{res.snippet}</p>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        {!recommendations?.videos?.length && !recommendations?.resources?.length && (
                          <div className="text-center py-10">
                            <p className="text-xs text-muted-foreground">No recommendations found for this topic.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={handleFetchRecommendations}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (

                /* Attendance UI — replaces tools when toggled */
                <Card className="shadow-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-info" /> Attendance ({Object.values(sessionAttendance).filter(v => v === 'present').length}/{classStudents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!attendanceMarked && (
                      <div className="mb-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            const allPresent = Object.fromEntries(classStudents.map((s) => [s.id, 'present' as const]));
                            setSessionAttendance(allPresent);
                          }}
                        >
                          Mark all present
                        </Button>
                        <span className="text-[11px] text-muted-foreground">
                          Then uncheck only absentees.
                        </span>
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {classStudents.map((s) => {
                        const status = sessionAttendance[s.id];
                        return (
                          <div key={s.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-secondary transition-colors">
                            <span className="text-xs text-foreground font-medium">{s.rollNo}. {s.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant={status === "present" ? "default" : "outline"}
                                className={`h-7 w-7 p-0 rounded-full transition-all ${status === "present" ? "bg-success hover:bg-success/90 shadow-sm" : "hover:bg-success/10 hover:text-success"}`}
                                disabled={attendanceMarked}
                                onClick={() => setSessionAttendance(prev => ({ ...prev, [s.id]: status === "present" ? undefined : "present" } as any))}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 ${status === "present" ? "text-white" : ""}`} />
                              </Button>
                              <Button
                                size="sm"
                                variant={status === "absent" ? "default" : "outline"}
                                className={`h-7 w-7 p-0 rounded-full transition-all ${status === "absent" ? "bg-destructive hover:bg-destructive/90 shadow-sm" : "hover:bg-destructive/10 hover:text-destructive"}`}
                                disabled={attendanceMarked}
                                onClick={() => setSessionAttendance(prev => ({ ...prev, [s.id]: status === "absent" ? undefined : "absent" } as any))}
                              >
                                <XCircle className={`w-3.5 h-3.5 ${status === "absent" ? "text-white" : ""}`} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!attendanceMarked && (
                      <Button size="sm" className="w-full mt-3" onClick={handleMarkAttendance} disabled={attendanceSubmitting}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {attendanceSubmitting ? "Saving…" : "Submit Attendance"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pause + End Session buttons */}
              <div className="space-y-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-amber/30 text-amber hover:bg-amber-light hover:text-amber transition-colors"
                  onClick={handlePauseSession}
                >
                  {sessionPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  {sessionPaused ? "Resume Session" : "Pause Session"}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={handleEndSession}
                  disabled={!canEnd}
                >
                  <VideoOff className="w-5 h-5" /> End Session
                </Button>
                {!canEnd && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete attendance & quiz before ending session
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Launch Quiz — fully internal scanner flow (no external redirect/iframe) */}
        <Dialog open={showLaunchQuizDialog} onOpenChange={setShowLaunchQuizDialog}>
          <DialogContent
            className="w-[min(98vw,1240px)] max-w-[98vw] h-[min(92dvh,860px)] max-h-[92dvh] p-4 sm:p-6 flex flex-col gap-0 overflow-hidden"
            aria-describedby={undefined}
          >
            <DialogHeader className="flex-shrink-0 pr-10 sm:pr-12 text-left">
              <DialogTitle className="font-display">Live Quiz — Internal QR Scanner</DialogTitle>
              <DialogDescription id="quiz-dialog-desc">
                Step 1: scan this QR from mobile. Step 2: wait for device connection signal. Step 3: start capture and scan all 10 questions for all students from mobile.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-y-auto overflow-x-hidden py-2 pr-1">
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display">Teacher Session QR</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    {liveQuizTeacherQr ? (
                      <img
                        src={liveQuizTeacherQr}
                        alt="Live quiz session QR"
                        className="w-[min(42vw,220px)] h-auto aspect-square rounded-md border border-border bg-white p-2"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">QR preview unavailable, scanning still works by manual input.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-display">Capture Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Connected devices: <span className="font-medium text-foreground">{liveQuizStatus?.connectedDevices ?? 0}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Attendance: <span className="font-medium text-foreground">{liveQuizStatus?.attendanceReady ? "Ready" : "Pending"}</span>
                      {liveQuizStatus?.attendanceDate ? ` (${liveQuizStatus.attendanceDate})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capture status: <span className="font-medium text-foreground">{liveQuizStatus?.started ? "Started" : "Waiting to start"}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={liveQuizCaptureMode === "manual" ? "default" : "outline"}
                        onClick={() => setLiveQuizCaptureMode("manual")}
                      >
                        Teacher-only mode
                      </Button>
                      <Button
                        variant={liveQuizCaptureMode === "qr" ? "default" : "outline"}
                        onClick={() => setLiveQuizCaptureMode("qr")}
                      >
                        QR scanner mode
                      </Button>
                    </div>
                    <Button onClick={handleStartLiveQuizCapture} disabled={!!liveQuizStatus?.started || !liveQuizStatus?.attendanceReady} className="w-full">
                      {liveQuizStatus?.started ? "Capture started" : "Start quiz capture"}
                    </Button>
                    {liveQuizCaptureMode === "qr" && (liveQuizStatus?.connectedDevices ?? 0) < 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        No scanner connected yet. You can still start capture; mobile can connect and submit after this.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <Card className="border-border min-h-0">
                <CardHeader className="pb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 space-y-0">
                  <CardTitle className="text-sm font-display">Live Progress</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleEndLiveQuiz} className="w-full sm:w-auto shrink-0">
                    End Quiz
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pb-2">
                  {liveQuizCurrentQuestion?.question && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                        Question {liveQuizCurrentQuestion.index} of {liveQuizSession?.questions?.length ?? "—"}
                      </p>
                      <p className="text-sm text-foreground leading-snug">{liveQuizCurrentQuestion.question.questionText}</p>
                      <ul className="text-xs text-muted-foreground space-y-1 grid gap-1 sm:grid-cols-2">
                        <li>
                          <span className="font-medium text-foreground">A.</span> {liveQuizCurrentQuestion.question.optionA}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">B.</span> {liveQuizCurrentQuestion.question.optionB}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">C.</span> {liveQuizCurrentQuestion.question.optionC}
                        </li>
                        <li>
                          <span className="font-medium text-foreground">D.</span> {liveQuizCurrentQuestion.question.optionD}
                        </li>
                      </ul>
                    </div>
                  )}
                  {liveQuizCaptureMode === "manual" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                      <p className="text-xs font-medium text-foreground">
                        Teacher-only capture: tap one option per present student (no student device needed).
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Eligible (present) students: <span className="font-medium text-foreground">{manualEligibleStudents.length}</span>
                      </p>
                      <div className="space-y-2 pr-1">
                        {manualEligibleStudents.map((s) => {
                          const picked = manualCurrentAnswers[s.id] || "";
                          return (
                            <div key={s.id} className="rounded-md border border-border p-2">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-xs text-foreground font-medium">{s.rollNo}. {s.name}</p>
                                <Badge variant="outline">{picked || "Not set"}</Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                {(["A", "B", "C", "D"] as const).map((opt) => (
                                  <Button
                                    key={`${s.id}_${opt}`}
                                    size="sm"
                                    variant={picked === opt ? "default" : "outline"}
                                    disabled={manualSubmittingStudentId === s.id}
                                    onClick={() => handleManualSelectOption(s.id, opt)}
                                  >
                                    {opt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {manualEligibleStudents.length === 0 && (
                          <p className="text-xs text-muted-foreground">No present students found. Submit attendance first.</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Current question completion: {Object.keys(manualCurrentAnswers).length}/{manualEligibleStudents.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={manualQuestionNo <= 1}
                            onClick={() => setManualQuestionNo((q) => Math.max(1, q - 1))}
                          >
                            Prev
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={manualQuestionNo >= (liveQuizSession?.questions.length || 1)}
                            onClick={() => setManualQuestionNo((q) => Math.min((liveQuizSession?.questions.length || 1), q + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Current question: <span className="font-medium text-foreground">{liveQuizStatus?.currentQuestionNo ?? 1}</span>
                    {liveQuizStatus?.progressByQuestion?.[String(liveQuizStatus?.currentQuestionNo ?? 1)] != null
                      ? ` (${liveQuizStatus?.progressByQuestion?.[String(liveQuizStatus?.currentQuestionNo ?? 1)]}/${liveQuizStatus?.students ?? 0})`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Answers captured: <span className="font-medium text-foreground">{liveQuizStatus?.answersCaptured ?? 0}</span> /{" "}
                    <span className="font-medium text-foreground">{(liveQuizStatus?.questions ?? 0) * (liveQuizStatus?.students ?? 0)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Final submit from mobile: <span className="font-medium text-foreground">{liveQuizStatus?.submitted ? "Done" : "Pending"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Questions: <span className="font-medium text-foreground">{liveQuizStatus?.questions ?? 0}</span> • Students:{" "}
                    <span className="font-medium text-foreground">{liveQuizStatus?.students ?? 0}</span>
                  </p>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-2">Top scores (live)</p>
                    <div className="flex flex-wrap gap-2">
                      {liveQuizLeaderboard.map((e) => (
                        <Badge key={e.studentId} variant="secondary">#{e.rank} {e.studentName}: {e.score}</Badge>
                      ))}
                      {liveQuizLeaderboard.length === 0 && <p className="text-xs text-muted-foreground">No submissions yet.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end gap-2 flex-shrink-0 border-t border-border bg-background pt-3 mt-1">
              <Button variant="outline" onClick={() => setShowLaunchQuizDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lesson Plan Viewer — ongoing chapter only */}
        <Dialog open={lessonPlanOpen} onOpenChange={setLessonPlanOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">Lesson Plan — {sessionChapter?.name ?? "Chapter"}</DialogTitle>
              <DialogDescription id="lesson-plan-desc">
                Chapter-wise micro lesson plan for this session only.
              </DialogDescription>
            </DialogHeader>
            {sessionChapter && (
              <div className="space-y-4">
                {(sessionChapter.monthLabel || sessionChapter.periods != null || sessionChapter.teachingPlanSummary) && (
                  <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
                    {sessionChapter.monthLabel && (
                      <p className="text-sm font-medium text-foreground">{sessionChapter.monthLabel}</p>
                    )}
                    {sessionChapter.periods != null && (
                      <p className="text-xs text-muted-foreground">{sessionChapter.periods} periods</p>
                    )}
                    {sessionChapter.teachingPlanSummary && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{sessionChapter.teachingPlanSummary}</p>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="font-display font-semibold text-foreground text-sm mb-2">Topics (micro lesson plan)</h4>
                  {sessionChapter && !isChapterInSyllabusThroughDecember(sessionChapter) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      This chapter is after December in the annual plan — statuses show as &quot;Yet to complete&quot; until that term is active (same as the Chapters tab).
                    </p>
                  )}
                  <ul className="space-y-2">
                    {topics
                      .filter((t) => sameId(t.chapterId, activeSession.chapterId))
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((t) => (
                        <li key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
                          <span className="text-muted-foreground tabular-nums">{t.order}.</span>
                          <span className="font-medium text-foreground">{t.name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                            {displayTopicSyllabusLabel(sessionChapter, t.id, t.status, topicStatusState)}
                          </Badge>
                          {(t as TopicLike).topicPptPath && (
                            <a
                              href={`${getApiBase()}/uploads/${(t as TopicLike).topicPptPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline ml-1"
                            >
                              PPT
                            </a>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
                {sessionTopic?.topicPptPath && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium gap-1.5"
                      onClick={() => {
                        const path = sessionTopic.topicPptPath!;
                        setMaterialPreviewRelativePath(path);
                        setMaterialPreviewUrl(getMaterialViewerUrl(path));
                        setMaterialPreviewTitle("PPT — " + sessionTopic.name);
                        setMaterialPreviewOpen(true);
                      }}
                    >
                      <Presentation className="w-4 h-4" /> Open topic PPT — {sessionTopic.name}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Material preview (PDF/PPT) — view in dialog, optional Show on screen */}
        <Dialog open={materialPreviewOpen} onOpenChange={setMaterialPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">{materialPreviewTitle}</DialogTitle>
            </DialogHeader>
            {materialPreviewUrl && (
              <>
                <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden bg-muted">
                  {isPptxPath(materialPreviewRelativePath) ? (
                    <PptxViewer
                      src={getMaterialDirectUrl(materialPreviewRelativePath!)}
                      className="w-full"
                      width={960}
                      height={540}
                    />
                  ) : (
                    <iframe
                      src={materialPreviewUrl}
                      title={materialPreviewTitle}
                      className="w-full h-[60vh] min-h-[400px]"
                      allow="fullscreen"
                    />
                  )}
                </div>
                {isPptxPath(materialPreviewRelativePath) && (
                  <p className="text-xs text-muted-foreground pt-2">
                    <a href={getMaterialDirectUrl(materialPreviewRelativePath!)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Open in new tab
                    </a>
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    variant="default"
                    className="gap-1.5"
                    onClick={() => {
                      setMainScreenContentUrl(materialPreviewUrl);
                      setMainScreenTitle(materialPreviewTitle);
                      setMainScreenDirectUrl(materialPreviewRelativePath ? getMaterialViewerUrl(materialPreviewRelativePath) : null);
                      setMaterialPreviewOpen(false);
                    }}
                  >
                    <Monitor className="w-4 h-4" /> Show on screen
                  </Button>
                  <Button variant="outline" onClick={() => setMaterialPreviewOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // Normal dashboard
  return (
    <DashboardLayout title="Teacher Dashboard">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex gap-8">
          {/* Fixed Sidebar */}
          <aside className="w-[200px] flex-shrink-0">
            <TabsList className="flex-col h-auto gap-2 w-full bg-transparent p-0">
              <TabsTrigger value="overview" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Overview</TabsTrigger>
              <TabsTrigger value="chapters" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Chapters & Topics</TabsTrigger>
              <TabsTrigger value="students" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Students</TabsTrigger>
              {/* <TabsTrigger value="classstatus" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Class Status</TabsTrigger> */}
              <TabsTrigger value="timetable" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Timetable</TabsTrigger>
              <TabsTrigger value="self-attendance" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">My Attendance</TabsTrigger>
              <TabsTrigger value="my-assignments" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">My Assignments</TabsTrigger>
              <TabsTrigger value="leave" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Leave</TabsTrigger>
              <TabsTrigger value="cocurricular" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Co-Curricular</TabsTrigger>
            </TabsList>
          </aside>
          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <TabsContent value="overview" className="space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Overview — {currentSubject?.name} • {currentClass?.name}
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{syllabusProgress}%</p>
                    <p className="text-xs text-muted-foreground">Syllabus Progress</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{completedChapterCount}/{filteredChapters.length} chapters</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{completedQuizCount}/{totalQuizCount}</p>
                    <p className="text-xs text-muted-foreground">Quizzes</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Completed / Total</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{conductedSessions}/{scheduledSessions}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Conducted/Scheduled</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="font-display text-2xl font-bold text-foreground">{rankedStudentsByMarks.length}</p>
                    <p className="text-xs text-muted-foreground">Students Ranked</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Based on marks</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" /> Students by Marks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rankedStudentsByMarks.length > 0 ? (
                    rankedStudentsByMarks.map((item, index) => {
                      const isTop3 = index < 3;
                      const medalColors = [
                        "bg-amber-100 border-amber-200 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]", // Gold
                        "bg-slate-100 border-slate-200 text-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.15)]", // Silver
                        "bg-orange-100 border-orange-200 text-orange-700 shadow-[0_0_10px_rgba(194,65,12,0.15)]" // Bronze
                      ];

                      return (
                        <div
                          key={item.student.id}
                          className={`p-4 rounded-2xl flex items-center gap-4 transition-all ${isTop3
                            ? "bg-gradient-to-r from-amber-light/40 to-white/50 border border-amber/10 shadow-sm scale-[1.02] z-10"
                            : "bg-secondary/50 border border-transparent"
                            }`}
                        >
                          <div className={`
                        ${index === 0 ? "w-16 h-16" : isTop3 ? "w-14 h-14" : "w-11 h-11"} 
                        rounded-full flex items-center justify-center shrink-0 border-2 relative transition-all
                        ${isTop3 ? medalColors[index] : "bg-secondary border-border text-muted-foreground"}
                      `}>
                            {isTop3 ? (
                              <div className="relative">
                                <Medal className={`${index === 0 ? "w-9 h-9" : "w-7 h-7"}`} />
                                <span className="absolute -top-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-current shadow-sm">
                                  {index + 1}
                                </span>
                              </div>
                            ) : (
                              <span className="font-display font-bold text-sm">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-display font-bold text-foreground truncate ${index === 0 ? "text-base" : "text-sm"}`}>
                              {item.student.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="opacity-70">Roll No:</span>
                              <span className="font-mono">{item.student.rollNo}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`
                          px-2 py-1 text-xs font-bold rounded-lg
                          ${index === 0 ? "bg-amber text-white ring-4 ring-amber/10" : isTop3 ? "bg-amber/10 text-amber border-amber/20" : "bg-success/10 text-success border-success/20"}
                        `}>
                              {item.percentage}%
                            </Badge>
                            {index === 0 && (
                              <p className="text-[10px] font-bold text-amber mt-1 tracking-wider uppercase">Topper</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No students found for this class.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timetable" className="space-y-4">
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Class Timetable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    School starts at 9:00 AM. Period duration: 40 mins. Breaks: 10:20-10:35 and 2:20-2:35. Lunch: 11:55-1:00.
                  </p>
                  {(() => {
                    const dayNames: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
                    const rows = timetables
                      .filter((t) => t.classId === selectedClass)
                      .filter((t) => (t.subjectId ? t.subjectId === selectedSubject : false))
                      .sort((a, b) => (a.weekDay - b.weekDay) || (a.periodNo - b.periodNo));
                    if (!rows.length) return <p className="text-sm text-muted-foreground">No timetable slots mapped for your subject in this class.</p>;
                    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
                    const grid = new Map<string, { subjectName: string; startTime: string; endTime: string }>();
                    rows.forEach((r) => {
                      grid.set(`${r.weekDay}-${r.periodNo}`, { subjectName: r.subjectName, startTime: r.startTime, endTime: r.endTime });
                    });
                    return (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-secondary border-b border-border">
                              <th className="p-2 text-left font-medium">Day \\ Period</th>
                              {periods.map((p) => <th key={p} className="p-2 text-left font-medium">P{p}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4, 5, 6].map((day) => (
                              <tr key={day} className="border-b border-border last:border-0">
                                <td className="p-2 font-semibold text-foreground">{dayNames[day]}</td>
                                {periods.map((p) => {
                                  const slot = grid.get(`${day}-${p}`);
                                  return (
                                    <td key={`${day}-${p}`} className="p-2 align-top">
                                      {slot ? (
                                        <div className="rounded-md bg-teal-light px-2 py-1.5">
                                          <p className="font-medium text-foreground">{slot.subjectName}</p>
                                          <p className="text-[10px] text-muted-foreground">{String(slot.startTime).slice(0, 5)}-{String(slot.endTime).slice(0, 5)}</p>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chapters" className="space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                {currentSubject?.icon} {currentSubject?.name} — {currentClass?.name}
              </h3>
              <div className="space-y-3">
                {[...filteredChapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((ch) => {
                  const chTopics = topics.filter((t) => sameId(t.chapterId, ch.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                  const inSyllabusScope = isChapterInSyllabusThroughDecember(ch);
                  const status: keyof typeof statusColors = !inSyllabusScope
                    ? "future_syllabus"
                    : chTopics.length > 0
                      ? deriveChapterStatusKey(chTopics, topicStatusState)
                      : normalizeTopicStatus(chapterStatusState[String(ch.id)]);
                  const sc = statusColors[status];
                  const progress = getChapterProgress(ch.id);
                  const isExpanded = selectedChapter === ch.id;

                  return (
                    <Card key={ch.id} className="shadow-card border-border overflow-hidden">
                      {/* Chapter Header */}
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setSelectedChapter(isExpanded ? null : ch.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-10 rounded-full" style={{ backgroundColor: sc.color }} />
                          <div>
                            <h4 className="font-display font-semibold text-foreground text-sm">{ch.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge className={`${sc.bg} ${sc.text} text-xs`}>{sc.label}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {chTopics.length} {chTopics.length === 1 ? "topic" : "topics"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 flex items-center gap-2">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>

                      {/* Topics Dropdown */}
                      {isExpanded && (
                        <div className="border-t border-border bg-secondary/30 p-4 space-y-2">
                          {chTopics.length > 0 ? chTopics.map((topic) => {
                            const tStatusRaw = topicStatusState[String(topic.id)] || topic.status;
                            const tNorm = !inSyllabusScope ? "not_started" : normalizeTopicStatus(tStatusRaw);
                            const tsc = statusColors[tNorm];
                            const isTopicExpanded = expandedTopics[topic.id];

                            return (
                              <div key={topic.id} className="bg-card rounded-xl border border-border overflow-hidden">
                                <div
                                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => toggleTopic(topic.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {tNorm === "completed" ? (
                                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                                    ) : tNorm === "in_progress" ? (
                                      <Clock className="w-4 h-4 text-amber flex-shrink-0" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                                    )}
                                    <span className="text-sm font-medium text-foreground">{topic.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 text-xs gap-1"
                                      disabled={sessionStartLoading}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartSession(topic);
                                      }}
                                    >
                                      <Play className="w-3 h-3" /> {sessionStartLoading ? "Starting…" : "Start Session"}
                                    </Button>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTopicExpanded ? "rotate-180" : ""}`} />
                                  </div>
                                </div>

                                {isTopicExpanded && (
                                  <div className="px-3 pb-3 space-y-2 flex flex-wrap gap-2">
                                    {ch.textbookChunkPdfPath && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs font-medium gap-1.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const path = ch.textbookChunkPdfPath!;
                                          setMaterialPreviewRelativePath(path);
                                          setMaterialPreviewUrl(getMaterialViewerUrl(path));
                                          setMaterialPreviewTitle("Textual material — " + ch.name);
                                          setMaterialPreviewOpen(true);
                                        }}
                                      >
                                        <BookOpen className="w-3.5 h-3.5" /> Watch textual material
                                      </Button>
                                    )}
                                    {topic.topicPptPath && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs font-medium gap-1.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const path = topic.topicPptPath!;
                                          setMaterialPreviewRelativePath(path);
                                          setMaterialPreviewUrl(getMaterialViewerUrl(path));
                                          setMaterialPreviewTitle("PPT — " + topic.name);
                                          setMaterialPreviewOpen(true);
                                        }}
                                      >
                                        <Presentation className="w-3.5 h-3.5" /> Watch PPT
                                      </Button>
                                    )}
                                    {!ch.textbookChunkPdfPath && !topic.topicPptPath && (
                                      <p className="text-xs text-muted-foreground">No textual material or PPT added yet.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }) : (
                            <div className="pt-2">
                              {ch.textbookChunkPdfPath ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                    disabled={!!workflowLoading}
                                    onClick={(e) => { e.stopPropagation(); handleAutoWorkflow(ch.id); }}
                                  >
                                    <Sparkles className={`w-3.5 h-3.5 ${workflowLoading === ch.id ? "animate-spin" : ""}`} />
                                    {workflowLoading === ch.id ? "Processing Chapter..." : "AI Auto-Generate Topics & Quizzes"}
                                  </Button>
                                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                    Click to automatically segment this chapter into topics and generate materials.
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground p-2">No topics defined. Upload a textbook PDF to enable AI auto-generation.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
                {filteredChapters.length === 0 && (
                  <Card className="shadow-card border-border">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No chapters available for this subject and class combination.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* STUDENTS TAB */}
            <TabsContent value="students" className="space-y-4">
              <Card className="shadow-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> {currentClass?.name} — Students ({classStudents.length})
                    </CardTitle>
                    <div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadClassCsv()}>
                        <FileDown className="w-4 h-4" /> Download Students CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className="text-left p-3 font-medium text-muted-foreground">Roll</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Attendance</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Annual Score</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map(s => {
                          const att = studentAttendance.find(a => a.studentId === s.id);
                          return (
                            <tr key={s.id} className="border-b border-border last:border-0">
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
                              <td className="p-3 text-foreground font-medium">
                                {s.score ?? "—"}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer"
                                  onClick={() => setViewingStudent(s.id)}
                                >
                                  View
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SELF ATTENDANCE TAB */}
            <TabsContent value="self-attendance" className="space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" /> My Attendance
              </h3>
              <Card className="shadow-card border-border max-w-md">
                <CardHeader>
                  <CardTitle className="font-display text-base">Mark Today's Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Date: <span className="font-semibold text-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                  </p>
                  <div className="flex gap-3">
                    {(["present", "absent", "leave"] as const).map((s) => {
                      const isSelected = todayAttendance?.marked && todayAttendance.status === s;
                      const isDisabled = todayAttendance?.marked;
                      
                      return (
                        <Button
                          key={s}
                          variant={isSelected || (s === "present" && !todayAttendance?.marked) ? "default" : "outline"}
                          disabled={isDisabled}
                          className={`capitalize flex-1 transition-all ${
                            isSelected 
                              ? (s === "present" ? "bg-green-600 opacity-100 shadow-md" : s === "absent" ? "bg-red-600 text-white opacity-100 shadow-md" : "bg-amber-500 text-white opacity-100 shadow-md")
                              : (s === "present" ? "bg-green-600 hover:bg-green-700" : s === "absent" ? "border-red-300 text-red-600 hover:bg-red-50" : "border-amber-300 text-amber-600 hover:bg-amber-50")
                          } ${isDisabled && !isSelected ? "opacity-40 grayscale-[0.5]" : ""}`}
                          onClick={async () => {
                            if (!teacherId || isDisabled) return;
                            try {
                              await markTeacherSelfAttendance(teacherId, s);
                              setTodayAttendance({ marked: true, status: s });
                              toast.success(`Attendance marked as "${s}" for today.`);
                            } catch (e: any) {
                              toast.error(e.message || "Failed to mark attendance");
                            }
                          }}
                        >
                          {s === "present" ? <CheckCircle2 className="w-4 h-4 mr-1" /> : s === "absent" ? <XCircle className="w-4 h-4 mr-1" /> : <CalendarOff className="w-4 h-4 mr-1" />}
                          {s}
                          {isSelected && <Badge variant="outline" className="ml-1.5 bg-white/20 border-white/40 text-white text-[9px] uppercase">Marked</Badge>}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MY ASSIGNMENTS TAB */}
            <TabsContent value="my-assignments" className="space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> My Assignments
              </h3>
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-base">Assigned Subjects, Classes & Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const [assignData, setAssignData] = useState<{ assigned_subject_ids: number[]; assigned_class_ids: number[]; assigned_section_ids: number[] } | null>(null);
                    const [loadingAssign, setLoadingAssign] = useState(true);
                    useEffect(() => {
                      if (teacherId) {
                        setLoadingAssign(true);
                        fetchTeacherAssignments(teacherId)
                          .then(setAssignData)
                          .catch(() => setAssignData(null))
                          .finally(() => setLoadingAssign(false));
                      }
                    }, [teacherId]);

                    if (loadingAssign) return <p className="text-sm text-muted-foreground py-4">Loading assignments...</p>;
                    if (!assignData) return <p className="text-sm text-muted-foreground py-4">No assignments found.</p>;

                    return (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {assignData.assigned_subject_ids.length > 0
                              ? assignData.assigned_subject_ids.map((id) => (
                                  <Badge key={id} variant="secondary" className="px-3 py-1">Subject ID: {id}</Badge>
                                ))
                              : <span className="text-sm text-muted-foreground">None assigned</span>
                            }
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Classes (Grade IDs)</p>
                          <div className="flex flex-wrap gap-2">
                            {assignData.assigned_class_ids.length > 0
                              ? assignData.assigned_class_ids.map((id) => (
                                  <Badge key={id} variant="secondary" className="px-3 py-1">Grade ID: {id}</Badge>
                                ))
                              : <span className="text-sm text-muted-foreground">None assigned</span>
                            }
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sections</p>
                          <div className="flex flex-wrap gap-2">
                            {assignData.assigned_section_ids.length > 0
                              ? assignData.assigned_section_ids.map((id) => (
                                  <Badge key={id} variant="secondary" className="px-3 py-1">Section ID: {id}</Badge>
                                ))
                              : <span className="text-sm text-muted-foreground">None assigned</span>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* LEAVE TAB */}
            <TabsContent value="leave" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <CalendarOff className="w-5 h-5 text-primary" /> Apply for Leave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {leaveError && <p className="text-sm text-destructive">{leaveError}</p>}
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Enter reason for leave..." className="mt-1" />
                    </div>
                    <Button onClick={handleApplyLeave} disabled={!leaveDate || !leaveReason || leaveSubmitting} className="w-full">
                      {leaveSubmitting ? "Submitting…" : "Submit Leave Application"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ While on leave, your classes will be marked as cancelled and students will be notified.
                    </p>
                  </CardContent>
                </Card>
                {/* ─── Attendance Calendar ─── */}
                <Card className="shadow-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-primary" /> Attendance Overview
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                            else setCalendarMonth(m => m - 1);
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-foreground min-w-[90px] text-center">
                          {new Date(calendarYear, calendarMonth).toLocaleString("default", { month: "long", year: "numeric" })}
                        </span>
                        <button
                          onClick={() => {
                            if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                            else setCalendarMonth(m => m + 1);
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></span> Present
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></span> Absent (Leave)
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block w-3 h-3 rounded-full bg-secondary border border-border"></span> Sunday / Holiday
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {(() => {
                      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
                      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                      const cells: JSX.Element[] = [];
                      // Header row
                      dayNames.forEach((d) => (
                        cells.push(
                          <div key={`h-${d}`} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                        )
                      ));
                      // Empty leading cells
                      for (let i = 0; i < firstWeekday; i++) {
                        cells.push(<div key={`e-${i}`} />);
                      }
                      // Day cells
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const weekday = new Date(calendarYear, calendarMonth, day).getDay();
                        const isSunday = weekday === 0;
                        // leaveByDate keys are already normalised to YYYY-MM-DD
                        const lv = leaveByDate.get(dateStr);
                        // Only "approved" status means teacher is absent on that date
                        const isAbsent = lv?.status === "approved";
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                        const isToday = dateStr === todayStr;
                        const isFuture = new Date(calendarYear, calendarMonth, day) > today;

                        let cellBg = "";
                        let cellText = "text-foreground";
                        let dotColor = "";
                        let title = dateStr;

                        if (isSunday) {
                          cellBg = "bg-secondary/60";
                          cellText = "text-muted-foreground";
                          title = "Sunday – Holiday";
                        } else if (isAbsent) {
                          // Approved leave → absent → red, clickable to cancel
                          cellBg = "bg-red-500/15 hover:bg-red-500/25";
                          cellText = "text-red-600 dark:text-red-400 font-semibold";
                          dotColor = "bg-red-500";
                          title = `Absent – ${lv?.reason || "Approved leave"} (click to cancel)`;
                        } else if (!isFuture) {
                          // Past weekday, no approved leave → present → green
                          cellBg = "bg-emerald-500/10 hover:bg-emerald-500/15";
                          cellText = "text-emerald-700 dark:text-emerald-400";
                          dotColor = "bg-emerald-500";
                          title = "Present";
                        } else {
                          // Future date — no colour
                          cellText = "text-muted-foreground/60";
                        }

                        cells.push(
                          <div
                            key={dateStr}
                            title={title}
                            onClick={() => { if (isAbsent && lv) handleCancelLeave(lv.id); }}
                            className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-xs transition-all duration-150 ${cellBg
                              } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""
                              } ${isAbsent ? "cursor-pointer" : ""}`}
                          >
                            <span className={cellText}>{day}</span>
                            {dotColor && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${dotColor}`} />}
                            {calendarUpdating === lv?.id && (
                              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                                <RotateCcw className="w-3 h-3 animate-spin text-primary" />
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-7 gap-1">{cells}</div>
                      );
                    })()}
                    {/* Approved leaves list — cancel if applied by mistake */}
                    {leaves.filter(lv => lv.status === "approved").length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Approved Leaves — click <span className="text-red-500">×</span> to cancel if applied by mistake</p>
                        {leaves.filter(lv => lv.status === "approved").map(lv => (
                          <div key={lv.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div>
                              <span className="text-xs font-medium text-red-600 dark:text-red-400">{lv.date}</span>
                              <span className="text-xs text-muted-foreground ml-2">{lv.reason}</span>
                            </div>
                            <button
                              onClick={() => handleCancelLeave(lv.id)}
                              disabled={calendarUpdating === lv.id}
                              className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              title="Cancel this leave (applied by mistake)"
                            >
                              <RotateCcw className={`w-3 h-3 ${calendarUpdating === lv.id ? "animate-spin" : ""}`} />
                              Cancel Leave
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Class Status section — visible within Leave tab */}
              {/* {liveSessionsFromApi.filter((ls) => ls.classId === selectedClass && (ls.status === "active" || ls.status === "ongoing")).length > 0 && (
                <Card className="shadow-card border-border border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="font-display text-sm flex items-center gap-2 text-primary">
                      <Radio className="w-4 h-4" /> Live / Ongoing sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {liveSessionsFromApi
                      .filter((ls) => ls.classId === selectedClass && (ls.status === "active" || ls.status === "ongoing"))
                      .map((ls) => (
                        <div key={ls.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                          <span className="text-sm">{ls.subjectName} — {ls.topicName}</span>
                          <Badge className="bg-destructive/10 text-destructive text-xs">Live</Badge>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )} */}
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-primary" /> Class Status — {currentClass?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStatusLocal.map((cs) => (
                          <tr key={cs.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-foreground">{cs.date}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cs.status === "conducted" ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"
                                }`}>
                                {cs.status === "conducted"
                                  ? <><CheckCircle2 className="w-3 h-3" /> Conducted</>
                                  : <><XCircle className="w-3 h-3" /> Cancelled</>
                                }
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{cs.reason || "—"}</td>
                            <td className="p-3">
                              <Select
                                value={cs.status}
                                onValueChange={(val) => {
                                  setClassStatusLocal((prev) =>
                                    prev.map((c) => (c.id === cs.id ? { ...c, status: val as "conducted" | "cancelled" } : c))
                                  );
                                }}
                              >
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="conducted">Conducted</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CO-CURRICULAR TAB */}
            <TabsContent value="cocurricular" className="space-y-4">
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" /> Co-Curricular Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {activities.map(act => (
                      <div key={act.id} className="p-4 bg-secondary rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{act.icon}</span>
                          <div>
                            <h4 className="font-display font-semibold text-foreground text-sm">{act.title}</h4>
                            <Badge className={`text-xs ${act.status === "upcoming" ? "bg-info-light text-info" :
                              act.status === "ongoing" ? "bg-success-light text-success" :
                                "bg-secondary text-muted-foreground"
                              }`}>{act.status}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{act.description}</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{act.date} • {act.registrations} registered</span>
                          </div>
                          {act.status !== "completed" && (
                            <div>
                              <div className="flex gap-2 mb-2">
                                <Button variant="outline" size="sm" className="text-xs flex-1"
                                  onClick={() => beginRegister(act.id)}
                                >
                                  Register Student
                                </Button>
                                <Button variant="outline" size="sm" className="text-xs flex-1"
                                  onClick={() => setViewingActivityRegistrations(act.id)}
                                >
                                  Registered Students ({registrations.filter(r => r.activityId === act.id).length})
                                </Button>
                              </div>
                              {registeringActivity === act.id && (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="text"
                                    placeholder="Student ID"
                                    value={registerStudentId}
                                    onChange={e => setRegisterStudentId(e.target.value)}
                                    className="text-xs w-24"
                                  />
                                  <Button size="sm" onClick={confirmRegister} className="text-xs">
                                    OK
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div> {/* end flex-1 wrapper */}
        </div> {/* end flex wrapper */}
      </Tabs>

      {/* Registered Students modal */}
      <Dialog open={!!viewingActivityRegistrations} onOpenChange={open => { if (!open) setViewingActivityRegistrations(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registered Students</DialogTitle>
            <DialogDescription>
              {activities.find(a => a.id === viewingActivityRegistrations)?.title || ""}
            </DialogDescription>
          </DialogHeader>
          {viewingActivityRegistrations && (
            <div>
              {registrations.filter(r => r.activityId === viewingActivityRegistrations).length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="grid gap-2">
                    {registrations.filter((r) => r.activityId === viewingActivityRegistrations).map((reg) => {
                      const student = students.find((s) => s.id === reg.studentId);
                      return (
                        <div key={`${reg.activityId}-${reg.studentId}`} className="p-3 bg-secondary rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{student?.name || reg.studentId}</p>
                            <p className="text-xs text-muted-foreground">Roll No: {student?.rollNo || "—"}</p>
                          </div>
                          <Badge className="bg-success-light text-success text-xs">{reg.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No students registered yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student performance/details modal */}
      <Dialog open={!!viewingStudent} onOpenChange={open => { if (!open) setViewingStudent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              {detailedStudent ? `${detailedStudent.name} (${detailedStudent.rollNo})` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailedStudent && (
            <div className="space-y-4">
              {/* Performance graph */}
              <div>
                <p className="text-sm font-medium">Subject-wise Scores</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={detailedSubjectPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200,20%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(174,62%,38%)" radius={[4, 4, 0, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Strong/weak areas */}
              {detailedWeak.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-destructive">Weak Areas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detailedWeak.map(a => (
                      <Badge key={a.name} className="bg-destructive/10 text-destructive text-xs">
                        {a.name} ({a.score}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Time spent chart */}
              {detailedUsage.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Time Spent (min)</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {detailedUsage.reduce((a, u) => a + u.minutes, 0)} minutes
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={detailedUsage} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="minutes" fill="hsl(220, 60%, 60%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Co-curricular list */}
              {detailedRegistrations.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Co‑curricular Activities</p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {detailedRegistrations.map((r) => {
                      const act = activities.find((a) => a.id === r.activityId);
                      return (
                        <li key={r.activityId}>
                          {act?.title} ({r.status})
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Material preview (PDF/PPTX) — view in dialog; "Show on screen" only in live session */}
      <Dialog open={materialPreviewOpen} onOpenChange={setMaterialPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-display">{materialPreviewTitle}</DialogTitle>
          </DialogHeader>
          {materialPreviewUrl && (
            <>
              <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden bg-muted">
                {isPptxPath(materialPreviewRelativePath) ? (
                  <PptxViewer
                    src={getMaterialDirectUrl(materialPreviewRelativePath!)}
                    className="w-full"
                    width={960}
                    height={540}
                  />
                ) : (
                  <iframe
                    src={materialPreviewUrl}
                    title={materialPreviewTitle}
                    className="w-full h-[60vh] min-h-[400px]"
                    allow="fullscreen"
                  />
                )}
              </div>
              {isPptxPath(materialPreviewRelativePath) && (
                <p className="text-xs text-muted-foreground pt-2">
                  <a href={getMaterialDirectUrl(materialPreviewRelativePath!)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Open in new tab
                  </a>
                </p>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                {activeSession && (
                  <Button
                    variant="default"
                    className="gap-1.5"
                    onClick={() => {
                      setMainScreenContentUrl(materialPreviewUrl);
                      setMainScreenTitle(materialPreviewTitle);
                      setMainScreenDirectUrl(materialPreviewRelativePath ? getMaterialViewerUrl(materialPreviewRelativePath) : null);
                      setMaterialPreviewOpen(false);
                    }}
                  >
                    <Monitor className="w-4 h-4" /> Show on screen
                  </Button>
                )}
                <Button variant="outline" onClick={() => setMaterialPreviewOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default TeacherDashboard;
