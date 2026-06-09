import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Loader2
} from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { getStudentQuizQuestions, saveStudentMarks } from "@/api/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEVEL_LABELS: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

const StudentQuiz = () => {
  const [searchParams] = useSearchParams();
  const quizLevelRaw = (searchParams.get("level") || searchParams.get("rate") || "").toLowerCase();
  const quizLevelLabel = LEVEL_LABELS[quizLevelRaw] || null;

  const { studentId } = useAuth();
  const { data, refetch } = useAppData();
  const { subjects, chapters, topics, students, classes } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [quizScope, setQuizScope] = useState<"subject" | "chapter" | "topic">("subject");
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; options: string[]; correct: string; explanation: string }>>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);
  const subjectChapters = useMemo(
    () => (selectedSubject ? chapters.filter((ch) => ch.subjectId === selectedSubject && ch.grade === grade) : []),
    [chapters, selectedSubject, grade]
  );
  const chapterTopics = useMemo(
    () => (selectedChapter ? topics.filter((t) => t.chapterId === selectedChapter) : []),
    [topics, selectedChapter]
  );

  const currentQuestion = questions[currentQ];

  const handleAnswer = (optionLetter: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionLetter }));
  };

  const handleStartQuiz = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getStudentQuizQuestions(
        selectedSubject,
        quizScope !== "subject" ? selectedChapter : null,
        quizScope === "topic" ? selectedTopic : null,
        10 // limit
      );
      if (!res.questions || res.questions.length === 0) {
        setErrorMessage("No questions found for this selection in the quiz bank. Try selecting another chapter or subject!");
        setLoading(false);
        return;
      }
      
      const mapped = res.questions.map((q) => ({
        id: String(q.id),
        question: q.question_text,
        options: [
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d
        ],
        correct: q.correct_option,
        explanation: q.explanation || ""
      }));

      setQuestions(mapped);
      setQuizStarted(true);
      setCurrentQ(0);
      setAnswers({});
      setSubmitted(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setSaving(true);
    try {
      const score = questions.filter(q => answers[q.id] === q.correct).length;
      const detailedAnswers = questions.map((q) => ({
        questionText: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        selectedOption: answers[q.id] || "",
        correctOption: q.correct,
        isCorrect: answers[q.id] === q.correct,
        explanation: q.explanation
      }));

      await saveStudentMarks({
        studentId: student.id,
        subjectId: selectedSubject!,
        chapterId: quizScope !== "subject" ? selectedChapter : null,
        score,
        total: questions.length,
        assessmentType: "self_study",
        detailedAnswers
      });
      refetch();
    } catch (err) {
      console.error("Failed to save student quiz marks:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
  };

  const handleBack = () => {
    setQuizStarted(false);
    setAnswers({});
    setSubmitted(false);
    setCurrentQ(0);
    setQuestions([]);
  };

  const currentSubjectObj = subjects.find(s => s.id === selectedSubject);

  // Quiz in progress
  if (quizStarted && questions.length > 0) {
    if (submitted) {
      const pct = Math.round((questions.filter(q => answers[q.id] === q.correct).length / questions.length) * 100);
      const score = questions.filter(q => answers[q.id] === q.correct).length;
      return (
        <DashboardLayout title="Quiz Results">
          <Button variant="ghost" onClick={handleBack} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Setup
          </Button>
          <Card className="shadow-card border-border max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">{pct}%</h2>
              <p className="text-muted-foreground mb-4">You scored {score} out of {questions.length}</p>
              <Progress value={pct} className="h-3 mb-6" />

              {saving && (
                <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving attempt details...
                </p>
              )}

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
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                          <div className="text-xs text-muted-foreground mt-2 grid gap-1">
                            <div>Your answer: <span className="font-semibold text-foreground">{userAnswer || "Not answered"}</span></div>
                            <div>Correct answer: <span className="font-semibold text-success">{q.correct}</span></div>
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2 italic">
                              💡 {q.explanation}
                            </p>
                          )}
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
                <Button onClick={handleBack}>Back to Setup</Button>
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

        <Card className="shadow-card border-border max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-sm">Question {currentQ + 1} of {questions.length}</CardTitle>
              <Badge variant="outline">{Object.keys(answers).length}/{questions.length} answered</Badge>
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
    <DashboardLayout title="Dynamic Quizzes">
      {!selectedSubject ? (
        <>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">📝 Select Subject for Quiz</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {gradeSubjects.map((sub) => {
              const subChapters = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade);
              return (
                <Card
                  key={sub.id}
                  className="shadow-card border-border card-hover cursor-pointer min-w-[220px] flex-shrink-0"
                  onClick={() => setSelectedSubject(sub.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{sub.icon}</div>
                    <h3 className="font-display font-semibold text-foreground">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{subChapters.length} chapters available</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => { setSelectedSubject(null); setSelectedChapter(null); setSelectedTopic(null); setErrorMessage(null); }} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Subjects
          </Button>
          
          <div className="max-w-xl mx-auto">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span>{currentSubjectObj?.icon}</span>
                  <span>{currentSubjectObj?.name} Quiz Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 1. Quiz Scope Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">1. Select Quiz Scope</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={quizScope === "subject" ? "default" : "outline"}
                      onClick={() => { setQuizScope("subject"); setSelectedChapter(null); setSelectedTopic(null); setErrorMessage(null); }}
                      className="text-xs py-2 h-auto"
                    >
                      Whole Subject
                    </Button>
                    <Button
                      variant={quizScope === "chapter" ? "default" : "outline"}
                      onClick={() => { setQuizScope("chapter"); setSelectedTopic(null); setErrorMessage(null); }}
                      className="text-xs py-2 h-auto"
                    >
                      Chapter-wise
                    </Button>
                    <Button
                      variant={quizScope === "topic" ? "default" : "outline"}
                      onClick={() => { setQuizScope("topic"); setErrorMessage(null); }}
                      className="text-xs py-2 h-auto"
                    >
                      Topic-wise
                    </Button>
                  </div>
                </div>

                {/* 2. Chapter Select (if chapter or topic scope) */}
                {quizScope !== "subject" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">2. Select Chapter</label>
                    <Select
                      value={selectedChapter || ""}
                      onValueChange={(val) => { setSelectedChapter(val); setSelectedTopic(null); setErrorMessage(null); }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a chapter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectChapters.map((ch) => (
                          <SelectItem key={ch.id} value={ch.id}>
                            {ch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 3. Topic Select (if topic scope and chapter selected) */}
                {quizScope === "topic" && selectedChapter && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">3. Select Topic</label>
                    <Select
                      value={selectedTopic || ""}
                      onValueChange={(val) => { setSelectedTopic(val); setErrorMessage(null); }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a topic..." />
                      </SelectTrigger>
                      <SelectContent>
                        {chapterTopics.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Error messages */}
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs leading-relaxed">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Submit/Start Button */}
                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={
                    loading ||
                    (quizScope === "chapter" && !selectedChapter) ||
                    (quizScope === "topic" && (!selectedChapter || !selectedTopic))
                  }
                  onClick={handleStartQuiz}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Fetching questions...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" /> Start Quiz
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentQuiz;
