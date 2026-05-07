import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  fetchAssessmentQuestions,
  submitTeacherAssessment,
  type AssessmentQuestion,
  type ChapterGatingStatus,
} from "@/api/client";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  BookOpen,
  Trophy,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TeacherAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  chapterId: string;
  chapterName: string;
  teacherId: string;
  subjectId: string;
  gradeId: string | number;
  classId: string;
  onAssessmentComplete: (passed: boolean) => void;
}

export function TeacherAssessmentDialog({
  open,
  onClose,
  chapterId,
  chapterName,
  teacherId,
  subjectId,
  gradeId,
  classId,
  onAssessmentComplete,
}: TeacherAssessmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    total: number;
    percentage: number;
    passThreshold: number;
    graded: Array<{ questionId: string; selectedOption: string; correctOption: string; isCorrect: boolean }>;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [source, setSource] = useState("");

  // Fetch questions when dialog opens
  useEffect(() => {
    if (!open || !chapterId) return;
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);

    fetchAssessmentQuestions(chapterId)
      .then((data) => {
        setQuestions(data.questions || []);
        setSource(data.source || "quiz_bank");
      })
      .catch((err) => {
        toast.error("Failed to load assessment: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [open, chapterId]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  const selectOption = (questionId: string, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const answerArray = questions.map((q) => ({
        questionId: String(q.id),
        selectedOption: answers[String(q.id)] || "",
      }));
      const res = await submitTeacherAssessment({
        teacherId,
        chapterId,
        subjectId,
        gradeId,
        classId,
        answers: answerArray,
        questions,
      });
      setResult(res);
      setSubmitted(true);
      onAssessmentComplete(res.passed);
      if (res.passed) {
        toast.success(`🎉 Assessment passed! Score: ${res.percentage}%`);
      } else {
        toast.error(`Assessment not passed. Score: ${res.percentage}% (Need ${res.passThreshold}%)`);
      }
    } catch (err) {
      toast.error("Failed to submit: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setResult(null);
    // Re-fetch questions for new randomization
    setLoading(true);
    fetchAssessmentQuestions(chapterId)
      .then((data) => {
        setQuestions(data.questions || []);
        setSource(data.source || "quiz_bank");
      })
      .catch((err) => toast.error("Failed to reload: " + err.message))
      .finally(() => setLoading(false));
  };

  const optionKeys = ["A", "B", "C", "D"] as const;
  const optionLabels: Record<string, string> = {
    A: "optionA",
    B: "optionB",
    C: "optionC",
    D: "optionD",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Chapter Assessment
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              {chapterName}
              {source === "ai_generated" && (
                <Badge className="ml-2 bg-white/20 text-white text-[10px]">AI Generated</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          {!submitted && totalQuestions > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>Question {currentIndex + 1} of {totalQuestions}</span>
                <span>{answeredCount}/{totalQuestions} answered</span>
              </div>
              <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5 bg-white/20" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-muted-foreground">Loading assessment questions...</p>
            </div>
          ) : submitted && result ? (
            /* Results View */
            <div className="space-y-6">
              {/* Score Card */}
              <Card className={`border-2 ${result.passed ? "border-green-500 bg-green-50/50" : "border-red-500 bg-red-50/50"}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {result.passed ? (
                      <Trophy className="w-10 h-10" />
                    ) : (
                      <AlertTriangle className="w-10 h-10" />
                    )}
                  </div>
                  <h3 className={`text-2xl font-bold ${result.passed ? "text-green-700" : "text-red-700"}`}>
                    {result.passed ? "Assessment Passed! 🎉" : "Not Passed"}
                  </h3>
                  <p className="text-lg font-semibold mt-2">
                    {result.score} / {result.total} ({result.percentage}%)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pass threshold: {result.passThreshold}%
                  </p>
                  {result.passed && (
                    <p className="text-sm text-green-600 mt-3 font-medium">
                      ✅ Chapter is now unlocked for teaching!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Question Review */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Review Answers</h4>
                {result.graded.map((g, i) => {
                  const q = questions.find((q) => String(q.id) === String(g.questionId));
                  if (!q) return null;
                  return (
                    <Card key={g.questionId} className={`border ${g.isCorrect ? "border-green-200" : "border-red-200"}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {g.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">Q{i + 1}. {q.questionText}</p>
                            <div className="mt-1 text-[11px]">
                              <span className="text-muted-foreground">Your answer: </span>
                              <span className={g.isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                {g.selectedOption}
                              </span>
                              {!g.isCorrect && (
                                <>
                                  <span className="text-muted-foreground"> • Correct: </span>
                                  <span className="text-green-600 font-semibold">{g.correctOption}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                {!result.passed && (
                  <Button onClick={handleRetry} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <RotateCcw className="w-4 h-4" /> Retry Assessment
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  {result.passed ? "Done" : "Close"}
                </Button>
              </div>
            </div>
          ) : totalQuestions > 0 && currentQuestion ? (
            /* Question View */
            <div className="space-y-6">
              {/* Question */}
              <div>
                <Badge variant="outline" className="mb-2 text-xs">
                  Question {currentIndex + 1}
                </Badge>
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {optionKeys.map((key) => {
                  const optionText = (currentQuestion as any)[optionLabels[key]] || "";
                  const isSelected = answers[String(currentQuestion.id)] === key;
                  return (
                    <button
                      key={key}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-foreground"
                      }`}
                      onClick={() => selectOption(String(currentQuestion.id), key)}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {key}
                      </span>
                      {optionText}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                {/* Question dots */}
                <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                        currentIndex === i
                          ? "bg-indigo-500 text-white scale-110"
                          : answers[String(q.id)]
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                      onClick={() => setCurrentIndex(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                    className="gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!allAnswered || submitting}
                    onClick={handleSubmit}
                    className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</>
                    ) : (
                      `Submit (${answeredCount}/${totalQuestions})`
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No assessment questions available for this chapter.</p>
              <p className="text-xs mt-1">Admin needs to populate the quiz bank for this chapter.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Gating Status Badge for Chapter Cards ─── */
interface ChapterGatingBadgeProps {
  gatingStatus: ChapterGatingStatus | null;
  gatingEnabled: boolean;
}

export function ChapterGatingBadge({ gatingStatus, gatingEnabled }: ChapterGatingBadgeProps) {
  if (!gatingEnabled || !gatingStatus) return null;

  if (gatingStatus.overridden === "unlock") {
    return (
      <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1">
        <Unlock className="w-3 h-3" /> Admin Override
      </Badge>
    );
  }

  if (gatingStatus.isLocked) {
    return (
      <Badge className="bg-red-100 text-red-700 text-[10px] gap-1">
        <Lock className="w-3 h-3" /> Locked
      </Badge>
    );
  }

  if (gatingStatus.teacherPassed) {
    return (
      <Badge className="bg-green-100 text-green-700 text-[10px] gap-1">
        <Unlock className="w-3 h-3" /> Unlocked
      </Badge>
    );
  }

  return null;
}

/* ─── Student Performance Summary Panel ─── */
interface StudentPerformancePanelProps {
  gatingStatus: ChapterGatingStatus;
  studentThreshold: number;
  onReteach?: () => void;
}

export function StudentPerformancePanel({ gatingStatus, studentThreshold, onReteach }: StudentPerformancePanelProps) {
  if (!gatingStatus.teacherPassed) return null;

  const { studentAvgScore, studentThresholdMet, totalStudents, studentsPassed, studentPassPercentage } = gatingStatus;

  if (totalStudents === 0) {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Waiting for student quiz results
        </p>
        <p className="text-[10px] text-amber-600 mt-0.5">
          Students need to complete the chapter quiz before next chapter unlocks
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-4 mb-2 p-4 rounded-xl border-2 shadow-sm transition-all ${
      studentThresholdMet
        ? "bg-green-50 border-green-200"
        : "bg-red-50 border-red-200"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {studentThresholdMet ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-bold ${studentThresholdMet ? "text-green-700" : "text-red-700"}`}>
              {studentThresholdMet ? "Student Threshold Met" : "Student Threshold Not Met"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground ml-7">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Avg Score:</span> {studentAvgScore.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Passing:</span> {studentsPassed}/{totalStudents} students ({studentPassPercentage.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1 opacity-70">
              <span className="font-semibold text-foreground">Goal:</span> {studentThreshold}%
            </span>
          </div>
        </div>
        
        {!studentThresholdMet && onReteach && (
          <div className="flex items-center gap-2 ml-7 sm:ml-0">
            <Button
              size="sm"
              className="h-9 px-4 text-xs gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
              onClick={onReteach}
            >
              <RotateCcw className="w-4 h-4" /> Reteach Chapter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
