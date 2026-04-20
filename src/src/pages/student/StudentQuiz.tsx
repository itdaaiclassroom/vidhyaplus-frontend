import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw
} from "lucide-react";
import { useAppData } from "@/contexts/DataContext";

const LEVEL_LABELS: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

const StudentQuiz = () => {
  const [searchParams] = useSearchParams();
  const quizLevelRaw = (searchParams.get("level") || searchParams.get("rate") || "").toLowerCase();
  const quizLevelLabel = LEVEL_LABELS[quizLevelRaw] || null;

  const { studentId } = useAuth();
  const { data } = useAppData();
  const { subjects, chapters, chapterQuizzes, students, classes, studentQuizResults } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);
  const subjectChapters = useMemo(
    () => (selectedSubject ? chapters.filter((ch) => ch.subjectId === selectedSubject && ch.grade === grade) : []),
    [chapters, selectedSubject, grade]
  );

  const questions = useMemo(
    () => (selectedChapter ? (chapterQuizzes || []).filter((q) => q.chapterId === selectedChapter) : []),
    [chapterQuizzes, selectedChapter]
  );

  const currentQuestion = questions[currentQ];

  const handleAnswer = (optionLetter: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionLetter }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const score = submitted
    ? questions.filter(q => answers[q.id] === q.correct).length
    : 0;

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
  };

  const handleBack = () => {
    setQuizStarted(false);
    setSelectedChapter(null);
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
  };

  // Quiz in progress
  if (quizStarted && selectedChapter && questions.length > 0) {
    if (submitted) {
      const pct = Math.round((score / questions.length) * 100);
      return (
        <DashboardLayout title="Quiz Results">
          <Button variant="ghost" onClick={handleBack} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Quizzes
          </Button>
          <Card className="shadow-card border-border max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">{pct}%</h2>
              <p className="text-muted-foreground mb-4">You scored {score} out of {questions.length}</p>
              <Progress value={pct} className="h-3 mb-6" />

              <div className="space-y-3 text-left mb-6">
                {questions.map((q, i) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct;
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? "bg-success-light border-success/30" : "bg-destructive/5 border-destructive/20"}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your answer: {userAnswer || "Not answered"} • Correct: {q.correct}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} variant="outline" className="gap-1">
                  <RotateCcw className="w-4 h-4" /> Reattempt
                </Button>
                <Button onClick={handleBack}>Back to Quizzes</Button>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout title="Quiz">
        <Button variant="ghost" onClick={handleBack} className="mb-4 gap-1">
          <ArrowLeft className="w-4 h-4" /> Exit Quiz
        </Button>
        {quizLevelLabel && (
          <p className="text-xs text-muted-foreground mb-2 max-w-2xl mx-auto">
            Quiz rate (demo): <Badge variant="secondary">{quizLevelLabel}</Badge> — same question set; full tiered banks can plug in later.
          </p>
        )}

        <Card className="shadow-card border-border max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-sm">Question {currentQ + 1} of {questions.length}</CardTitle>
              <div className="flex items-center gap-2">
                {quizLevelLabel && <Badge variant="outline">Rate: {quizLevelLabel}</Badge>}
                <Badge variant="outline">{Object.keys(answers).length}/{questions.length} answered</Badge>
              </div>
            </div>
            <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-6">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map(opt => {
                const letter = opt.charAt(0);
                const isSelected = answers[currentQuestion.id] === letter;
                return (
                  <button
                    key={opt}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all whitespace-normal break-words ${
                      isSelected
                        ? "border-primary bg-teal-light"
                        : "border-border hover:border-primary/40 hover:bg-secondary"
                    }`}
                    onClick={() => handleAnswer(letter)}
                  >
                    <span className="text-sm text-foreground leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between mt-6 gap-3">
              <Button
                variant="outline"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(p => p - 1)}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(p => p + 1)} className="w-full sm:w-auto">Next</Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-1 w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4" /> Submit Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Subject/chapter selection
  return (
    <DashboardLayout title="Chapter-wise Quizzes">
      {quizLevelLabel && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Selected quiz rate:</span>
          <Badge>{quizLevelLabel}</Badge>
        </div>
      )}
      {!selectedSubject ? (
        <>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">📝 Select Subject for Quiz</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {gradeSubjects.map((sub) => {
              const subChapters = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade);
              const quizCount = subChapters.reduce(
                (a, ch) => a + (chapterQuizzes || []).filter((q) => q.chapterId === ch.id).length,
                0
              );
              return (
                <Card
                  key={sub.id}
                  className="shadow-card border-border card-hover cursor-pointer min-w-[220px] flex-shrink-0"
                  onClick={() => setSelectedSubject(sub.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{sub.icon}</div>
                    <h3 className="font-display font-semibold text-foreground">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{quizCount} questions available</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => { setSelectedSubject(null); setSelectedChapter(null); }} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Subjects
          </Button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Select Chapter</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[...subjectChapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((ch) => {
              const qCount = (chapterQuizzes || []).filter((q) => q.chapterId === ch.id).length;
              const prevResult = student?.id ? studentQuizResults.find((r) => r.studentId === student.id && r.chapterId === ch.id) : undefined;
              return (
                <Card key={ch.id} className="shadow-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-sm">{ch.name}</h3>
                        <p className="text-xs text-muted-foreground">{qCount} questions</p>
                      </div>
                    </div>
                    {prevResult && (
                      <div className="mb-3 p-2 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          Previous: {prevResult.score}/{prevResult.total} ({Math.round((prevResult.score / prevResult.total) * 100)}%)
                        </p>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={qCount === 0}
                      onClick={() => { setSelectedChapter(ch.id); setQuizStarted(true); }}
                    >
                      {prevResult ? "Reattempt Quiz" : "Start Quiz"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentQuiz;
