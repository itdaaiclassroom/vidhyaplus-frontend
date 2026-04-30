import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, ScanLine, Trophy, ArrowLeft, CheckCircle2, XCircle, Play, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/contexts/DataContext";
import { 
  createLiveQuiz, 
  getLiveQuizSession, 
  getLiveQuizTeacherQr, 
  fetchLiveQuizStatus, 
  startLiveQuizCapture, 
  getLiveQuizLeaderboard, 
  endLiveQuiz,
  submitLiveQuizAnswer
} from "@/api/client";

// Polling interval
const POLL_INTERVAL = 2000;

const QuizScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data } = useAppData();
  
  const liveSessionId = searchParams.get("sessionId");
  const noOfQuestionsStr = searchParams.get("questions") || "10";
  const mode = searchParams.get("mode") as "qr" | "teacher" || "qr";

  const [initializing, setInitializing] = useState(true);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  // States
  const [phase, setPhase] = useState<"connecting" | "active" | "evaluating" | "finished">("connecting");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [statusPoller, setStatusPoller] = useState<any>(null);
  
  // Live Status
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [scansReceived, setScansReceived] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  
  // Leaderboards
  const [miniLeaderboard, setMiniLeaderboard] = useState<any[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [correctOption, setCorrectOption] = useState<string | null>(null);

  // For teacher mode manual entry
  const [teacherSelectedStudent, setTeacherSelectedStudent] = useState("");

  const activeSession = useMemo(() => {
    if (!liveSessionId || !data.liveSessions) return null;
    return data.liveSessions.find((s: any) => String(s.id) === String(liveSessionId));
  }, [liveSessionId, data.liveSessions]);

  const classStudents = useMemo(() => {
    if (!activeSession || !data.students) return [];
    return data.students.filter((s: any) => String(s.classId) === String(activeSession.classId));
  }, [activeSession, data.students]);

  // Init Quiz
  useEffect(() => {
    const initQuiz = async () => {
      if (!activeSession) return;
      try {
        setInitializing(true);
        // Create or get quiz
        const res = await createLiveQuiz({
          teacherId: activeSession.teacherId,
          classId: activeSession.classId,
          chapterId: activeSession.chapterId || "",
          topicId: activeSession.topicId || "",
          topicName: activeSession.topicName,
          subjectId: activeSession.subjectId,
          liveSessionId: activeSession.id,
          noOfQuestions: parseInt(noOfQuestionsStr),
          mode
        });

        setQuizSessionId(res.id);
        setQuestions(res.questions);
        setTotalStudents(classStudents.length);

        if (mode === "qr") {
          const qrRes = await getLiveQuizTeacherQr(res.id);
          setQrDataUrl(qrRes.dataUrl);
          setPhase("connecting");
        } else {
          // Teacher mode skips QR connect
          await startLiveQuizCapture(res.id);
          setPhase("active");
        }
      } catch (err: any) {
        toast.error(`Failed to initialize quiz: ${err.message}`);
      } finally {
        setInitializing(false);
      }
    };
    initQuiz();
  }, [activeSession, noOfQuestionsStr, mode]);

  // Status Polling
  useEffect(() => {
    if (!quizSessionId) return;

    const poll = async () => {
      try {
        const status = await fetchLiveQuizStatus(quizSessionId);
        setConnectedDevices(status.connectedDevices || 0);
        
        // Track scans for the current question
        if (status.progressByQuestion && questions[currentQIndex]) {
          const qOrderNum = currentQIndex + 1; // Backend uses 1-indexed for some, or order_num
          const qId = questions[currentQIndex].id;
          // Progress is usually keyed by question ID or order. Let's check both or total answers.
          setScansReceived(status.progressByQuestion[qOrderNum] || status.progressByQuestion[qId] || status.answersCaptured || 0);
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    setStatusPoller(interval);
    return () => clearInterval(interval);
  }, [quizSessionId, currentQIndex, questions]);

  const handleStartCapture = async () => {
    if (!quizSessionId) return;
    try {
      await startLiveQuizCapture(quizSessionId);
      setPhase("active");
    } catch (err: any) {
      toast.error(`Error starting capture: ${err.message}`);
    }
  };

  const handleEvaluate = async () => {
    if (!quizSessionId) return;
    try {
      setPhase("evaluating");
      const currentQ = questions[currentQIndex];
      setCorrectOption(currentQ.correctOption);

      // Fetch leaderboard to update the mini-leaderboard
      const res = await getLiveQuizLeaderboard(quizSessionId);
      setMiniLeaderboard(res.leaderboard || []);
    } catch (err: any) {
      toast.error(`Failed to evaluate: ${err.message}`);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setCorrectOption(null);
      setScansReceived(0);
      setPhase("active");
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (!quizSessionId) return;
    try {
      await endLiveQuiz(quizSessionId);
      const res = await getLiveQuizLeaderboard(quizSessionId);
      setFinalLeaderboard(res.leaderboard || []);
      setPhase("finished");
    } catch (err: any) {
      toast.error(`Failed to finish quiz: ${err.message}`);
    }
  };

  const handleTeacherManualSubmit = async (option: string) => {
    if (!quizSessionId || !teacherSelectedStudent) {
      toast.error("Please select a student first.");
      return;
    }
    const currentQ = questions[currentQIndex];
    try {
      const res = await submitLiveQuizAnswer(quizSessionId, teacherSelectedStudent, currentQ.id, option);
      toast.success(res.isCorrect ? "Correct answer submitted!" : "Incorrect answer submitted.");
      // Just visually increment for teacher mode manually
      setScansReceived(prev => prev + 1);
    } catch (err: any) {
      toast.error(`Error submitting answer: ${err.message}`);
    }
  };

  if (!activeSession) {
    return (
      <DashboardLayout title="Live Quiz">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading session details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (initializing) {
    return (
      <DashboardLayout title="Live Quiz">
         <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-bold">Generating Quiz...</p>
          <p className="text-sm text-muted-foreground">AI is creating {noOfQuestionsStr} questions for {activeSession.topicName}.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Final Leaderboard Phase
  if (phase === "finished") {
    return (
      <DashboardLayout title="Quiz Leaderboard">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/teacher/lesson")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Lesson
          </Button>
          <Card className="shadow-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="font-display text-2xl">Final Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {finalLeaderboard.length > 0 ? finalLeaderboard.map((student, i) => (
                  <div
                    key={student.studentId}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      i === 0 ? "bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300 border" :
                      i === 1 ? "bg-slate-100 border-slate-200 border" :
                      i === 2 ? "bg-orange-50 border-orange-200 border" :
                      "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? "bg-amber-500 text-white" : "bg-white text-slate-700 shadow-sm"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-800">{student.studentName}</span>
                    </div>
                    <span className="font-black text-lg text-primary">{student.score} <span className="text-xs text-muted-foreground font-normal">pts</span></span>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">No scores recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <DashboardLayout title="Live Quiz Session">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/teacher/lesson")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit Quiz
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border text-sm font-medium">
              <Users className="w-4 h-4 text-primary" /> {totalStudents} Students
            </div>
            {mode === "qr" && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border text-sm font-medium">
                <ScanLine className={`w-4 h-4 ${connectedDevices > 0 ? "text-success" : "text-amber"}`} />
                {connectedDevices} Scanners Connected
              </div>
            )}
          </div>
        </div>

        {phase === "connecting" && mode === "qr" && (
          <Card className="shadow-lg border-primary/20 text-center overflow-hidden">
            <div className="bg-primary/5 py-8 border-b border-primary/10">
              <h2 className="font-display text-2xl font-bold text-primary mb-2">Connect Your Mobile Scanner</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Scan this QR code with your mobile phone's camera to use it as the classroom scanner.
              </p>
            </div>
            <CardContent className="p-12 flex flex-col items-center">
              {qrDataUrl ? (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-border mb-8">
                  <img src={qrDataUrl} alt="Scanner QR Code" className="w-64 h-64" />
                </div>
              ) : (
                <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-2xl mb-8" />
              )}
              
              <div className="flex gap-4">
                <Button size="lg" onClick={handleStartCapture} className="gap-2 px-8" disabled={connectedDevices === 0}>
                  <Play className="w-5 h-5" />
                  {connectedDevices > 0 ? "Start Quiz Now" : "Waiting for connection..."}
                </Button>
                {connectedDevices === 0 && (
                  <Button variant="outline" size="lg" onClick={handleStartCapture}>
                    Force Start
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {(phase === "active" || phase === "evaluating") && currentQuestion && (
          <div className="space-y-6">
            <Card className="shadow-lg border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} />
              
              <CardHeader className="pb-2 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Question {currentQIndex + 1} of {questions.length}
                  </Badge>
                  {mode === "qr" && (
                    <div className="text-sm font-bold text-slate-600 bg-secondary px-3 py-1 rounded-full">
                      <span className="text-primary">{scansReceived}</span> / {totalStudents} Scanned
                    </div>
                  )}
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground leading-tight">{currentQuestion.questionText}</h3>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const text = currentQuestion[`option${opt}` as keyof typeof currentQuestion];
                    const isCorrectOption = phase === "evaluating" && opt === correctOption;
                    const isWrongOption = phase === "evaluating" && opt !== correctOption;
                    
                    return (
                      <div 
                        key={opt} 
                        className={`relative rounded-xl p-4 min-h-[80px] flex items-center border-2 transition-all ${
                          isCorrectOption ? "bg-success/10 border-success shadow-[0_0_15px_rgba(34,197,94,0.2)]" :
                          isWrongOption ? "bg-secondary/50 border-border opacity-50" :
                          "bg-white border-border hover:border-primary/30 hover:shadow-md"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 ${
                          isCorrectOption ? "bg-success text-white" : "bg-secondary text-slate-500"
                        }`}>
                          {opt}
                        </div>
                        <span className={`font-medium ${isCorrectOption ? "text-success-dark font-bold text-lg" : "text-slate-700"}`}>
                          {text as string}
                        </span>
                        {isCorrectOption && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-success" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {mode === "teacher" && phase === "active" && (
                  <div className="bg-secondary/50 p-4 rounded-xl mb-8 flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-700 whitespace-nowrap">Manual Entry:</div>
                    <select 
                      className="flex-1 h-10 px-3 rounded-md border border-border"
                      value={teacherSelectedStudent}
                      onChange={(e) => setTeacherSelectedStudent(e.target.value)}
                    >
                      <option value="">Select Student...</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}
                    </select>
                    <div className="flex gap-2">
                      {['A','B','C','D'].map(opt => (
                        <Button key={opt} variant="outline" className="w-10 h-10 p-0 font-bold" onClick={() => handleTeacherManualSubmit(opt)}>{opt}</Button>
                      ))}
                    </div>
                  </div>
                )}

                {phase === "evaluating" && currentQuestion.explanation && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
                    <h4 className="font-bold text-blue-800 text-sm mb-1">Explanation</h4>
                    <p className="text-sm text-blue-900/80">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border pt-6">
                  {phase === "active" ? (
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary-dark font-bold text-lg px-12" onClick={handleEvaluate}>
                      Evaluate Question
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 font-bold px-8" onClick={handleNextQuestion}>
                      {currentQIndex < questions.length - 1 ? "Next Question" : "Finish Quiz & View Leaderboard"} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  )}
                  
                  {phase === "active" && mode === "qr" && (
                    <div className="flex items-center text-sm text-muted-foreground animate-pulse">
                      <ScanLine className="w-4 h-4 mr-2" />
                      Scanning responses from teacher's phone...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mini Leaderboard (Top 5) */}
            {miniLeaderboard.length > 0 && (
              <Card className="shadow-sm border-border">
                <CardHeader className="py-3 px-4 bg-secondary/50 border-b border-border">
                  <CardTitle className="font-display text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Current Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {miniLeaderboard.slice(0, 5).map((s, i) => (
                      <div key={s.studentId} className="bg-white border border-border shadow-sm rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-100 text-slate-700':'bg-orange-50 text-orange-700'}`}>
                          #{i + 1}
                        </span>
                        <span className="font-bold text-slate-700 truncate max-w-[100px]">{s.studentName}</span>
                        <span className="font-black text-primary ml-1">{s.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizScreen;
