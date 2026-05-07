import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import PptxViewer, { type PptxViewerRef } from "@/components/PptxViewer";
import { toast } from "sonner";
import { liveQuizCheckpoint } from "@/lib/liveQuizCheckpoint";
import {
  endLiveSession,
  getAiRecommendations,
  askAiAssistant,
  submitAttendance,
  getStudentAttendance,
  fetchSubjectMaterials,
  getApiBase
} from "@/api/client";

import {
  BookOpen, Play, CheckCircle2, Clock, ArrowLeft, Maximize, Minimize,
  Pause, Send, MessageCircle, Monitor, X, Video, Users, Radio, Sparkles,
  Bot, Lightbulb, FileText, MonitorPlay, Youtube, ExternalLink, RotateCcw, XCircle,
  QrCode, Book, Info, ScanLine, MousePointerClick
} from "lucide-react";

type LiveSessionLike = {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  topicName: string;
  teacherName: string;
  className: string;
  subjectName: string;
  startTime: string;
  status: string;
  attendanceMarked: boolean;
  quizSubmitted: boolean
};

function sameId(a: unknown, b: unknown): boolean {
  return String(a ?? "") === String(b ?? "");
}

const LessonScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { data, refetch } = useAppData();
  const { teacherId } = useAuth();

  const sessionIdFromUrl = searchParams.get("sessionId");
  const initialSession = location.state?.session as LiveSessionLike | undefined;

  const getLocalDateYmd = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [activeSession, setActiveSession] = useState<LiveSessionLike | null>(initialSession || null);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionViewMode, setSessionViewMode] = useState<"tools" | "attendance" | "ai_chat" | "recommendations" | "lesson_plan">("tools");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [sessionQuizDone, setSessionQuizDone] = useState(false);
  const [sessionEnding, setSessionEnding] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  const [isQuizSetupOpen, setIsQuizSetupOpen] = useState(false);
  const [quizSetupQuestions, setQuizSetupQuestions] = useState(10);
  const [quizSetupMode, setQuizSetupMode] = useState<"qr" | "teacher">("qr");

  const [sessionAttendance, setSessionAttendance] = useState<Record<string, "present" | "absent">>({});
  const [sessionSubjectMaterials, setSessionSubjectMaterials] = useState<any[]>([]);

  const [mainScreenContentUrl, setMainScreenContentUrl] = useState<string | null>(null);
  const [mainScreenTitle, setMainScreenTitle] = useState("");
  const [mainScreenDirectUrl, setMainScreenDirectUrl] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [recommendations, setRecommendations] = useState<{ videos: any[], resources: any[] } | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);

  const [pptxCurrentSlide, setPptxCurrentSlide] = useState(0);
  const [pptxTotalSlides, setPptxTotalSlides] = useState(0);

  const sessionContainerRef = useRef<HTMLDivElement>(null);
  const pptxRef = useRef<PptxViewerRef>(null);

  useEffect(() => {
    if (!activeSession && sessionIdFromUrl && data.liveSessions) {
      const found = (data.liveSessions as LiveSessionLike[]).find(s => sameId(s.id, sessionIdFromUrl));
      if (found) {
        setActiveSession(found);
        setAttendanceMarked(found.attendanceMarked);
        setSessionQuizDone(found.quizSubmitted);
        const savedTime = localStorage.getItem(`pausedTime_${found.id}`);
        if (savedTime) setSessionTime(parseInt(savedTime));
      }
    }
  }, [sessionIdFromUrl, data.liveSessions, activeSession]);

  // Fetch existing attendance if already marked for today
  useEffect(() => {
    if (activeSession && Object.keys(sessionAttendance).length === 0) {
      const date = getLocalDateYmd();
      getStudentAttendance(activeSession.classId, date)
        .then(records => {
          if (records.length > 0) {
            const mapped: Record<string, "present" | "absent"> = {};
            records.forEach(r => {
              // Backend returns status like "Present" or "Absent", normalize to lowercase
              mapped[String(r.student_id)] = r.status.toLowerCase() as "present" | "absent";
            });
            setSessionAttendance(mapped);
            setAttendanceMarked(true);
          }
        })
        .catch(err => console.error("Failed to fetch existing attendance:", err));
    }
  }, [activeSession]);

  // Direct fetch for subject materials to ensure they are available even if global context is delayed
  useEffect(() => {
    if (activeSession?.subjectId) {
      fetchSubjectMaterials(activeSession.subjectId)
        .then(mats => {
          console.log("Directly fetched subject materials:", mats);
          setSessionSubjectMaterials(mats || []);
        })
        .catch(err => console.error("Error fetching subject materials:", err));
    }
  }, [activeSession?.subjectId]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const classStudents = useMemo(() => {
    if (!activeSession || !data.students) return [];
    return data.students.filter((s: any) => sameId(s.classId, activeSession.classId));
  }, [data.students, activeSession]);

  const grade = useMemo(() => {
    if (!activeSession || !data.classes) return 10;
    const cls = data.classes.find((c: any) => sameId(c.id, activeSession.classId));
    if (!cls) return 10;
    const gradeStr = String(cls.grade || cls.name || "");
    const match = gradeStr.match(/\d+/);
    return match ? parseInt(match[0]) : 10;
  }, [activeSession, data.classes]);

  useEffect(() => {
    if (!activeSession || sessionPaused) return;
    const timer = setInterval(() => {
      setSessionTime(prev => {
        const next = prev + 1;
        localStorage.setItem(`pausedTime_${activeSession.id}`, next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, sessionPaused]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getMaterialViewerUrl = (relativePath: string) => {
    if (!relativePath) return "";
    // If it's already a full URL (http/https), use it directly
    if (relativePath.startsWith("http")) return relativePath;

    const clean = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
    return `${getApiBase()}/api/materials/view?path=${encodeURIComponent(clean)}`;
  };

  const isPptxPath = (p: string | null) => !!p && /\.pptx?$/i.test(p);

  const handleEndSession = async () => {
    if (!activeSession) return;
    setSessionEnding(true);
    try {
      await endLiveSession(activeSession.id);
      localStorage.removeItem(`pausedTime_${activeSession.id}`);
      refetch();
      toast.success("Session ended successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to end session.");
    } finally {
      setSessionEnding(false);
      const target = `/teacher?tab=chapters&class=${activeSession.classId}&subject=${activeSession.subjectId}`;
      navigate(target);
    }
  };

  const handleMarkAttendance = async () => {
    if (!activeSession || attendanceSubmitting) return;

    // Ensure we have an entry for every student in the class
    const entries = classStudents.map(s => ({
      studentId: s.id,
      status: sessionAttendance[s.id] || "absent"
    }));

    if (entries.length === 0) {
      toast.error("No students found in this class.");
      return;
    }

    setAttendanceSubmitting(true);
    try {
      await submitAttendance({
        classId: activeSession.classId,
        date: new Date().toISOString().split('T')[0],
        entries,
        liveSessionId: activeSession.id
      });
      setAttendanceMarked(true);
      toast.success("Attendance saved successfully!");
      setSessionViewMode("tools");
      refetch(); // Refresh data to update status
    } catch (err: any) {
      console.error("Attendance error:", err);
      toast.error(err.message || "Failed to save attendance.");
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleFetchRecommendations = useCallback(async () => {
    if (!activeSession) return;
    setRecoLoading(true);
    try {
      const activeChapter = data.chapters?.find((c: any) => sameId(c.id, activeSession.chapterId));

      const payload = {
        topic: activeSession.topicName,
        subject: activeSession.subjectName,
        grade: grade,
        chapter: activeChapter?.name || activeSession.topicName
      };
      console.log("[AI Recommend] LessonScreen payload:", JSON.stringify(payload));

      const res = await getAiRecommendations(payload);
      console.log("[AI Recommend] LessonScreen response:", res);
      setRecommendations(res);
    } catch (e) {
      console.error(e);
      toast.error("Could not fetch recommendations.");
    } finally {
      setRecoLoading(false);
    }
  }, [activeSession, grade, data.chapters]);

  useEffect(() => {
    if (sessionViewMode === "recommendations" && !recommendations && !recoLoading) {
      handleFetchRecommendations();
    }
  }, [sessionViewMode, recommendations, recoLoading, handleFetchRecommendations]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      sessionContainerRef.current?.requestFullscreen().catch(err => {
        toast.error(`Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleLaunchQuizClick = () => {
    setIsQuizSetupOpen(true);
  };

  const handleLaunchQuizConfirm = () => {
    if (!activeSession) return;
    setIsQuizSetupOpen(false);
    navigate(`/teacher/quiz?sessionId=${activeSession.id}&questions=${quizSetupQuestions}&mode=${quizSetupMode}`);
  };

  const handleNextPage = () => setPdfPage(p => p + 1);
  const handlePrevPage = () => setPdfPage(p => Math.max(1, p - 1));

  const handleSendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !activeSession) return;
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const chapterName = data.chapters?.find((c: any) => c.id === activeSession.chapterId || c.id === parseInt(activeSession.chapterId))?.name;
      const res = await askAiAssistant({
        question: msg,
        topic: activeSession.topicName,
        subject: activeSession.subjectName,
        chapter: chapterName,
      });
      setChatMessages(prev => [...prev, { role: "ai", text: res.answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: "ai", text: "AI Assistant is currently unavailable." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!activeSession) {
    return (
      <DashboardLayout title="Live Session">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading session details...</p>
        </div>
      </DashboardLayout>
    );
  }

  const sessionChapter = data.chapters?.find((c: any) => sameId(c.id, activeSession.chapterId));

  return (
    <DashboardLayout title="Live Teaching Session">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-border/50 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher?tab=chapters&class=${activeSession.classId}&subject=${activeSession.subjectId}`)} className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Exit
              </Button>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70 leading-tight mb-1">{activeSession.subjectName} • {activeSession.className}</p>
                <h2 className="font-display text-xl font-bold text-foreground leading-tight">{sessionChapter?.name || "Chapter Name"}</h2>
                <p className="text-xs text-muted-foreground">{activeSession.topicName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
                <Radio className={`w-3.5 h-3.5 ${sessionPaused ? "" : "animate-pulse"}`} />
                {sessionPaused ? "PAUSED" : "LIVE"} • {formatTime(sessionTime)}
              </div>

              <Badge variant="outline" className={`gap-1.5 h-8 px-3 ${attendanceMarked ? "bg-success/5 text-success border-success/20" : "bg-amber/5 text-amber border-amber/20"}`}>
                {attendanceMarked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                Attendance: {attendanceMarked ? "Done" : "Pending"}
              </Badge>

              <Badge variant="outline" className={`gap-1.5 h-8 px-3 ${sessionQuizDone ? "bg-success/5 text-success border-success/20" : "bg-amber/5 text-amber border-amber/20"}`}>
                {sessionQuizDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                Quiz: {sessionQuizDone ? "Done" : "Pending"}
              </Badge>

              <div className="flex gap-2 ml-2">
                <Button variant="outline" size="sm" className={`gap-2 h-9 ${sessionPaused ? "bg-amber-light border-amber/30 text-amber" : ""}`} onClick={() => setSessionPaused(!sessionPaused)}>
                  {sessionPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {sessionPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="destructive" size="sm" className="gap-2 h-9 shadow-sm" onClick={handleEndSession}>
                  <XCircle className="w-4 h-4" /> End Session
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-3 space-y-6">
            <div ref={sessionContainerRef} className={`relative overflow-hidden transition-all duration-500 ${isFullscreen ? "fixed inset-0 z-[100] bg-black rounded-none" : "rounded-3xl aspect-video border border-slate-200/50 bg-slate-50/50 shadow-2xl"}`}>
              {mainScreenContentUrl ? (
                <>
                  {isPptxPath(mainScreenDirectUrl) ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
                        <PptxViewer
                          ref={pptxRef}
                          src={mainScreenContentUrl}
                          width={isFullscreen ? window.innerWidth : 1200}
                          height={isFullscreen ? (window.innerHeight - 64) : 675}
                          onSlideChange={(curr, total) => {
                            setPptxCurrentSlide(curr);
                            setPptxTotalSlides(total);
                          }}
                        />
                      </div>
                      <div className={`${isFullscreen ? "h-16" : "h-14"} bg-[#0f172a] text-white flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]`}>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={() => pptxRef.current?.previousSlide()} disabled={pptxCurrentSlide <= 0}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                          </Button>
                          <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">Slide {pptxCurrentSlide + 1} / {pptxTotalSlides}</span>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={() => pptxRef.current?.nextSlide()} disabled={pptxCurrentSlide >= pptxTotalSlides - 1}>
                            Next <Play className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9 gap-2" onClick={toggleFullscreen}>
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={() => { setMainScreenContentUrl(null); setMainScreenTitle(""); setMainScreenDirectUrl(null); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 min-h-0 bg-black">
                        <iframe
                          key={pdfPage}
                          src={mainScreenContentUrl?.toLowerCase().endsWith('.pdf') || mainScreenDirectUrl?.toLowerCase().endsWith('.pdf')
                            ? (mainScreenContentUrl?.includes("#") ? mainScreenContentUrl.split("#")[0] : mainScreenContentUrl) + `#page=${pdfPage}&toolbar=0&navpanes=0&scrollbar=0`
                            : mainScreenContentUrl || ""}
                          title={mainScreenTitle}
                          className="w-full h-full border-none"
                          allow="fullscreen"
                        />
                      </div>
                      <div className={`${isFullscreen ? "h-16" : "h-14"} bg-[#0f172a] text-white flex items-center justify-between px-6 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]`}>
                        <div className="flex items-center gap-4">
                          {(mainScreenContentUrl?.toLowerCase().endsWith('.pdf') || mainScreenDirectUrl?.toLowerCase().endsWith('.pdf')) && (
                            <>
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={handlePrevPage} disabled={pdfPage <= 1}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                              </Button>
                              <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">Page {pdfPage}</span>
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={handleNextPage}>
                                Next <Play className="w-4 h-4 ml-2" />
                              </Button>
                            </>
                          )}
                          {!(mainScreenContentUrl?.toLowerCase().endsWith('.pdf') || mainScreenDirectUrl?.toLowerCase().endsWith('.pdf')) && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-white/10 text-white border-white/20 h-7 text-[10px]">EXTERNAL CONTENT</Badge>
                              <span className="text-xs font-medium text-slate-300 truncate max-w-[300px]">{mainScreenTitle}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9 gap-2" onClick={toggleFullscreen}>
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9" onClick={() => { setMainScreenContentUrl(null); setMainScreenTitle(""); setMainScreenDirectUrl(null); setPdfPage(1); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {/* Floating close button if needed, but we have it in the bar now */}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-6 ring-1 ring-teal-100">
                      <BookOpen className="w-10 h-10 text-teal-600" />
                    </div>
                    <div className="space-y-1 mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{sessionChapter?.name || "Chapter Name"}</h3>
                      <p className="text-sm text-slate-500 font-medium">{activeSession.topicName}</p>
                    </div>

                    <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-9 px-4 rounded-xl shadow-sm" onClick={toggleFullscreen}>
                      <Maximize className="w-4 h-4" /> Fullscreen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="flex flex-col h-full gap-6">
            {/* AI Tools Card */}
            <Card className="border-primary/20 shadow-xl overflow-hidden flex flex-col h-[400px] bg-white">
              <CardHeader className="p-4 bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-display font-bold">AI Teaching Tools</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10" onClick={() => setSessionViewMode(sessionViewMode === "attendance" ? "tools" : "attendance")}>
                  {sessionViewMode === "attendance" ? <X className="w-3.5 h-3.5 mr-1" /> : <Users className="w-3.5 h-3.5 mr-1" />}
                  {sessionViewMode === "attendance" ? "Close" : "Attendance"}
                </Button>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                {sessionViewMode === "attendance" ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 bg-muted/30 flex items-center justify-between">
                      <h4 className="text-xs font-bold">Student List</h4>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => {
                        const allPresent = Object.fromEntries(classStudents.map(s => [s.id, "present" as const]));
                        setSessionAttendance(allPresent);
                      }}>Mark All Present</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {classStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between group">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">{s.name}</span>
                            <span className="text-[10px] text-muted-foreground">Roll: {s.rollNo}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant={sessionAttendance[s.id] === "present" ? "default" : "outline"} className={`h-7 w-7 p-0 rounded-lg ${sessionAttendance[s.id] === "present" ? "bg-success hover:bg-success/90" : ""}`} onClick={() => setSessionAttendance(p => ({ ...p, [s.id]: "present" }))}>P</Button>
                            <Button size="sm" variant={sessionAttendance[s.id] === "absent" ? "default" : "outline"} className={`h-7 w-7 p-0 rounded-lg ${sessionAttendance[s.id] === "absent" ? "bg-destructive hover:bg-destructive/90" : ""}`} onClick={() => setSessionAttendance(p => ({ ...p, [s.id]: "absent" }))}>A</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t bg-white">
                      <Button className="w-full h-10 shadow-sm" onClick={handleMarkAttendance} disabled={attendanceSubmitting}>Submit Attendance</Button>
                    </div>
                  </div>
                ) : sessionViewMode === "ai_chat" ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 bg-primary/5 flex items-center justify-between border-b border-primary/10">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -ml-1 text-primary hover:bg-primary/10" onClick={() => setSessionViewMode("tools")}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Bot className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold text-primary">VidyaPlus Assistant</h4>
                      </div>
                      <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">AI CHAT</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-12 space-y-3">
                          <Bot className="w-10 h-10 text-primary/30 mx-auto" />
                          <p className="text-xs text-muted-foreground">Ask me anything about <br /><span className="font-bold text-foreground">{activeSession.topicName}</span></p>
                        </div>
                      )}
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[~85%] rounded-2xl px-3 py-2.5 text-xs shadow-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm bg-muted text-foreground rounded-tl-none flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t bg-white">
                      <div className="relative">
                        <Input placeholder="Type your question..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendChat()} className="pr-10 rounded-xl h-10 bg-muted/50 border-none focus-visible:ring-primary" />
                        <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8 text-primary" onClick={handleSendChat}><Send className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ) : sessionViewMode === "recommendations" ? (
                  <div className="flex flex-col h-full">
                    <div className="p-4 bg-teal-50/50 flex items-center justify-between border-b border-teal-100">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -ml-1 text-teal-600 hover:bg-teal-100" onClick={() => setSessionViewMode("tools")}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Youtube className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold text-teal-900">Recommended Videos</h4>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600/40 uppercase tracking-widest">YOUTUBE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {recoLoading ? (
                        <div className="flex flex-col items-center justify-center h-32 space-y-2">
                          <RotateCcw className="w-5 h-5 animate-spin text-teal-600" />
                          <p className="text-[10px] text-muted-foreground">Finding the best videos...</p>
                        </div>
                      ) : recommendations?.videos?.length ? (
                        recommendations.videos.map((v, i) => (
                          <div key={i} className="group p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer" onClick={() => {
                            if (v.url.includes("youtube.com") || v.url.includes("youtu.be")) {
                              const vidId = v.url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
                              if (vidId) {
                                setMainScreenContentUrl(`https://www.youtube.com/embed/${vidId}?autoplay=1`);
                                setMainScreenTitle(v.title);
                                setMainScreenDirectUrl(v.url);
                              } else window.open(v.url, "_blank");
                            } else {
                              window.open(v.url, "_blank");
                            }
                          }}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                                <Play className="w-4 h-4 text-teal-600" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-700">{v.title}</h5>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{v.description || "Educational video content"}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 px-4">
                          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">No specific videos found. Try asking the AI Chatbot first!</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t bg-slate-50">
                      <Button variant="outline" className="w-full h-8 text-[10px] gap-2 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={handleFetchRecommendations}>
                        <RotateCcw className="w-3.5 h-3.5" /> Refresh Suggestions
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10" onClick={() => setSessionViewMode("ai_chat")}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5" /></div>
                      <div className="text-left"><p className="text-sm font-bold">AI Chatbot</p><p className="text-[10px] text-muted-foreground">Ask AI anything</p></div>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-teal-light transition-all group border border-transparent hover:border-teal-400/10" onClick={() => setSessionViewMode("recommendations")}>
                      <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform"><Youtube className="w-5 h-5" /></div>
                      <div className="text-left"><p className="text-sm font-bold">YouTube Recommends</p><p className="text-[10px] text-muted-foreground">Find related videos</p></div>
                    </button>
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-all group border border-transparent hover:border-purple-200" onClick={handleLaunchQuizClick}>
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><QrCode className="w-5 h-5" /></div>
                      <div className="text-left"><p className="text-sm font-bold">Launch Quiz</p><p className="text-[10px] text-muted-foreground">QR-based quiz</p></div>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Curriculum Materials Area */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Curriculum Materials</p>

              <Card className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white" onClick={() => {
                // Priority 1: Chapter-specific textbook chunk
                if (sessionChapter?.textbookChunkPdfPath) {
                  setMainScreenContentUrl(getMaterialViewerUrl(sessionChapter.textbookChunkPdfPath));
                  setMainScreenTitle("Textbook Reference");
                  setMainScreenDirectUrl(sessionChapter.textbookChunkPdfPath);
                  return;
                }

                // Priority 2: Subject materials fetched for this session or from global data
                const subMaterial = sessionSubjectMaterials?.find((m: any) =>
                  sameId(m.subject_id || m.subjectId, activeSession.subjectId)
                ) || data.subjectMaterials?.find((m: any) =>
                  sameId(m.subject_id || m.subjectId, activeSession.subjectId)
                ) || sessionSubjectMaterials?.find((m: any) =>
                  String(m.title || "").toLowerCase().includes(String(activeSession.subjectName || "").toLowerCase())
                ) || data.subjectMaterials?.find((m: any) =>
                  String(m.title || "").toLowerCase().includes(String(activeSession.subjectName || "").toLowerCase())
                );

                console.log("Subject Materials (Session):", sessionSubjectMaterials);
                console.log("Subject Materials (Global):", data.subjectMaterials);
                console.log("Active Session:", { subjectId: activeSession.subjectId, subjectName: activeSession.subjectName });
                console.log("Found material:", subMaterial);

                if (subMaterial) {
                  const materialUrl = subMaterial.url || subMaterial.file_path;
                  if (materialUrl) {
                    setMainScreenContentUrl(getMaterialViewerUrl(materialUrl));
                    setMainScreenTitle(subMaterial.title);
                    setMainScreenDirectUrl(materialUrl);
                    return;
                  }
                }

                toast.info("No textbook found for this subject.");
              }}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Book className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs leading-tight">Textbook</h3>
                    <p className="text-[10px] text-muted-foreground">Open chapter material</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white" onClick={() => {
                // Priority 1: Chapter-specific PPT from studyMaterials
                const chapterPpt = data.studyMaterials?.find((m: any) => sameId(m.chapterId, activeSession.chapterId) && isPptxPath(m.url));

                // Priority 2: Global subject PPT from subjectMaterials
                const subjectPpt = sessionSubjectMaterials?.find((m: any) => isPptxPath(m.url || m.file_path)) ||
                  data.subjectMaterials?.find((m: any) => sameId(m.subject_id || m.subjectId, activeSession.subjectId) && isPptxPath(m.url));

                const ppt = chapterPpt || subjectPpt;

                if (ppt) {
                  const pptUrl = ppt.url || ppt.file_path;
                  setMainScreenContentUrl(getMaterialViewerUrl(pptUrl));
                  setMainScreenTitle(ppt.title || "Subject Presentation");
                  setMainScreenDirectUrl(pptUrl);
                } else {
                  toast.info("No PPT found for this lesson.");
                }
              }}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-amber" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs leading-tight">Presentation</h3>
                    <p className="text-[10px] text-muted-foreground">Open topic PPT</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* End Session Warning Dialog */}
      <Dialog open={sessionEnding} onOpenChange={setSessionEnding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Live Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to end this live session?
              <br /><br />
              This will update the topic status to 'completed' and return you to the dashboard.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSessionEnding(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleEndSession}>End Session</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Setup Dialog */}
      <Dialog open={isQuizSetupOpen} onOpenChange={setIsQuizSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <QrCode className="w-4 h-4" />
              </div>
              Launch Live Quiz
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Number of Questions</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={quizSetupQuestions}
                onChange={(e) => setQuizSetupQuestions(parseInt(e.target.value) || 10)}
              />
              <p className="text-[10px] text-muted-foreground">Select how many questions the AI should generate (1-30).</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quiz Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${quizSetupMode === "qr" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-slate-600"}`}
                  onClick={() => setQuizSetupMode("qr")}
                >
                  <ScanLine className="w-6 h-6 mb-2" />
                  <span className="font-bold text-sm">QR Mode</span>
                  <span className="text-[10px] text-center mt-1 opacity-80">Students show QR cards</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${quizSetupMode === "teacher" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50 text-slate-600"}`}
                  onClick={() => setQuizSetupMode("teacher")}
                >
                  <MousePointerClick className="w-6 h-6 mb-2" />
                  <span className="font-bold text-sm">Teacher Mode</span>
                  <span className="text-[10px] text-center mt-1 opacity-80">Manual selection on screen</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsQuizSetupOpen(false)}>Cancel</Button>
              <Button onClick={handleLaunchQuizConfirm} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                Launch Quiz <Play className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LessonScreen;
