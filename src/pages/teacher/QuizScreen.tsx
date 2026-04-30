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
  const [studentResponses, setStudentResponses] = useState<Record<string, string>>({});

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
          const qOrderNum = currentQIndex + 1;
          setScansReceived(status.progressByQuestion[String(qOrderNum)] || 0);
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
      setStudentResponses({});
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

  const handleTeacherManualSubmit = async (studentId: string, option: string) => {
    if (!quizSessionId) return;
    const currentQ = questions[currentQIndex];
    try {
      // Optimistically update UI
      setStudentResponses(prev => ({ ...prev, [studentId]: option }));
      
      const res = await submitLiveQuizAnswer(quizSessionId, studentId, currentQ.id, option);
      
      // Update count
      const newCount = Object.keys({ ...studentResponses, [studentId]: option }).length;
      setScansReceived(newCount);
      
      if (!res.ok) {
         toast.error("Failed to submit answer to server.");
      }
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
      <DashboardLayout title="Quiz Results & Review">
        <div className="max-w-4xl mx-auto pb-20">
          <Button variant="ghost" onClick={() => navigate(`/teacher/lesson?sessionId=${liveSessionId}`)} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Lesson
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Leaderboard (40% width on desktop) */}
            <div className="md:col-span-5">
              <Card className="shadow-card border-border sticky top-4">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="font-display text-2xl">Final Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-8">
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            i === 0 ? "bg-amber-500 text-white" :
                            i === 1 ? "bg-slate-400 text-white" :
                            i === 2 ? "bg-orange-400 text-white" :
                            "bg-slate-200 text-slate-500"
                          }`}>
                            {i + 1}
                          </div>
                          <span className="font-bold text-slate-800">{student.studentName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-primary">{student.score}</span>
                          <span className="text-[10px] ml-1 text-muted-foreground uppercase font-bold">pts</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground italic">No responses recorded</div>
                    )}
                  </div>
                  <Button className="w-full" onClick={() => navigate(`/teacher/lesson?sessionId=${liveSessionId}`)}>Done</Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Question Review (60% width on desktop) */}
            <div className="md:col-span-7 space-y-4">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                 <CheckCircle2 className="w-5 h-5 text-success" /> Question Review
               </h3>
               {questions.map((q, idx) => (
                 <Card key={q.id} className="border-border overflow-hidden">
                    <div className="bg-secondary/30 p-3 border-b border-border flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question {idx + 1}</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Correct: {q.correctOption}
                      </Badge>
                    </div>
                    <CardContent className="pt-4">
                      <p className="font-bold text-slate-800 mb-4">{q.questionText}</p>
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt} className={`p-2 rounded-lg border text-sm flex items-center gap-2 ${
                            opt === q.correctOption ? 'bg-success/5 border-success/30 text-success-dark font-medium' : 'bg-white border-border text-slate-600'
                          }`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              opt === q.correctOption ? 'bg-success text-white' : 'bg-slate-100 text-slate-400'
                            }`}>{opt}</span>
                            {q[`option${opt}`]}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                          <p className="text-[10px] font-bold text-blue-800 mb-1 uppercase tracking-widest">Explanation</p>
                          <p className="text-xs text-blue-900/70 italic">{q.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <DashboardLayout title="Live Quiz Session">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(`/teacher/lesson?sessionId=${liveSessionId}`)} className="gap-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
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
                
                <CardContent className="pt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const text = currentQuestion[`option${opt}` as keyof typeof currentQuestion];
                      const isCorrectOption = phase === "evaluating" && opt === correctOption;
                      const isWrongOption = phase === "evaluating" && opt !== correctOption;
                      
                      return (
                        <div 
                          key={opt} 
                          className={`relative rounded-xl p-4 min-h-[60px] flex items-center border transition-all ${
                            isCorrectOption ? "bg-success/10 border-success" :
                            isWrongOption ? "bg-secondary/50 border-border opacity-50" :
                            "bg-white border-border"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 shrink-0 ${
                            isCorrectOption ? "bg-success text-white" : "bg-secondary text-slate-500"
                          }`}>
                            {opt}
                          </div>
                          <span className={`font-medium ${isCorrectOption ? "text-success-dark font-bold" : "text-slate-700"}`}>
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
                    <div className="border border-border rounded-xl overflow-hidden mb-8">
                      <div className="bg-secondary/50 p-2 border-b border-border flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Students</h4>
                        <Badge variant="outline" className="bg-white">
                          {Object.keys(studentResponses).length} / {totalStudents}
                        </Badge>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto divide-y divide-border bg-white">
                        {classStudents.map((s) => {
                          const selectedOpt = studentResponses[s.id];
                          return (
                            <div key={s.id} className="p-2 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{s.name}</span>
                                <span className="text-[10px] text-muted-foreground">Roll: {s.rollNo}</span>
                              </div>
                              <div className="flex gap-1">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <Button
                                    key={opt}
                                    variant={selectedOpt === opt ? "default" : "outline"}
                                    size="sm"
                                    className="w-8 h-8 p-0 font-bold"
                                    onClick={() => handleTeacherManualSubmit(s.id, opt)}
                                  >
                                    {opt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border pt-6">
                    {phase === "active" ? (
                      <Button size="lg" className="w-full sm:w-auto px-8" onClick={handleEvaluate}>
                        Evaluate Question
                      </Button>
                    ) : (
                      <Button size="lg" className="w-full sm:w-auto px-8" onClick={handleNextQuestion}>
                        {currentQIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    )}
                    
                    {phase === "active" && mode === "qr" && (
                      <div className="flex items-center text-sm text-muted-foreground animate-pulse">
                        <ScanLine className="w-4 h-4 mr-2" />
                        Scanning responses...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {miniLeaderboard.length > 0 && (
                <Card className="shadow-lg border-primary/20">
                  <CardHeader className="py-4 px-5 bg-primary/5 border-b border-primary/10">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" /> Live Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {miniLeaderboard.slice(0, 5).map((s, i) => (
                        <div key={s.studentId} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              i === 0 ? 'bg-amber-500 text-white' : 
                              i === 1 ? 'bg-slate-400 text-white' : 
                              i === 2 ? 'bg-orange-400 text-white' : 
                              'bg-secondary text-slate-700'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="font-bold text-sm">{s.studentName}</span>
                          </div>
                          <span className="font-black text-primary">{s.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizScreen;
