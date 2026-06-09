import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, Calendar, Trophy, Loader2 } from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { getLiveQuizResult } from "@/api/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentQuizResults = () => {
  const { studentId } = useAuth();
  const { data } = useAppData();
  const { subjects, chapters, students, classes, studentQuizResults } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;

  // Filters state
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterChapter, setFilterChapter] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "self_study" | "live_quiz">("all");

  const myResults = useMemo(() => (student?.id ? studentQuizResults.filter((r) => r.studentId === student.id) : []), [studentQuizResults, student?.id]);

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);
  const subjectChapters = useMemo(
    () => (filterSubject !== "all" ? chapters.filter((ch) => ch.subjectId === filterSubject && ch.grade === grade) : []),
    [chapters, filterSubject, grade]
  );

  // Filtered quiz attempts list
  const filteredAttempts = useMemo(() => {
    return myResults.filter((r) => {
      // 1. Subject filter
      if (filterSubject !== "all") {
        let matchesSubject = false;
        if (r.chapterId) {
          const ch = chapters.find((c) => c.id === r.chapterId);
          if (ch && ch.subjectId === filterSubject) matchesSubject = true;
        } else if (r.subjectId && r.subjectId === filterSubject) {
          matchesSubject = true;
        }
        if (!matchesSubject) return false;
      }

      // 2. Chapter filter
      if (filterChapter !== "all" && r.chapterId !== filterChapter) {
        return false;
      }

      // 3. Quiz type filter
      if (filterType !== "all") {
        const isLive = r.assessmentType === "live_quiz" || r.liveQuizSessionId;
        if (filterType === "live_quiz" && !isLive) return false;
        if (filterType === "self_study" && isLive) return false;
      }

      return true;
    });
  }, [myResults, filterSubject, filterChapter, filterType, chapters]);

  // Solution review state
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const openAttemptSolutions = async (attempt: any) => {
    setSelectedAttempt(attempt);
    setSelectedAttemptDetails(null);
    setLoadingDetails(true);
    try {
      if (attempt.assessmentType === "live_quiz" && attempt.liveQuizSessionId) {
        const res = await getLiveQuizResult(attempt.liveQuizSessionId, student.id);
        setSelectedAttemptDetails(res.details || []);
      } else {
        setSelectedAttemptDetails(attempt.detailedAnswers || []);
      }
    } catch (err) {
      console.error("Failed to load attempt details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <DashboardLayout title="Class-Quiz Results">
      <Button variant="ghost" asChild className="mb-4 gap-1">
        <Link to="/student"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Quiz History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            View details, marks, and explanations of all attempted quizzes.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-card border-border mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          {/* Subject Filter */}
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Subject</label>
            <Select
              value={filterSubject}
              onValueChange={(val) => {
                setFilterSubject(val);
                setFilterChapter("all");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {gradeSubjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter Filter */}
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Chapter</label>
            <Select
              value={filterChapter}
              onValueChange={setFilterChapter}
              disabled={filterSubject === "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {subjectChapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quiz Type Filter */}
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Quiz Type</label>
            <Select
              value={filterType}
              onValueChange={(val: any) => setFilterType(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="self_study">Self-Study Quizzes</SelectItem>
                <SelectItem value="live_quiz">Live Session Quizzes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-sm">No quiz results found matching the selected criteria.</p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/student/quiz">Take a Quiz</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => {
            const isLive = attempt.assessmentType === "live_quiz" || attempt.liveQuizSessionId;
            const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
            
            // Resolve subject and chapter names
            let resolvedSubjectName = "Subject";
            let resolvedChapterName = "Whole Subject";

            if (attempt.chapterId) {
              const ch = chapters.find((c) => c.id === attempt.chapterId);
              resolvedChapterName = ch?.name ?? "Chapter Quiz";
              const sub = ch ? subjects.find((s) => s.id === ch.subjectId) : null;
              resolvedSubjectName = sub?.name ?? "Subject";
            } else if (attempt.subjectId) {
              const sub = subjects.find((s) => s.id === attempt.subjectId);
              resolvedSubjectName = sub?.name ?? "Subject";
            }

            return (
              <Card key={attempt.id || attempt.date} className="shadow-card border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-foreground text-sm">
                        {resolvedSubjectName}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {resolvedChapterName}
                      </Badge>
                      <Badge className={`text-[10px] ${isLive ? "bg-info-light text-info" : "bg-teal-light text-primary"}`}>
                        {isLive ? "Live Quiz" : "Self-Study"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {attempt.date}</span>
                      <span>•</span>
                      <span>Score: <strong>{attempt.score}/{attempt.total}</strong> ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5 max-w-md" />
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openAttemptSolutions(attempt)}>
                      Review Solutions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Solutions Review Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-display font-bold">
                  {selectedAttempt.assessmentType === "live_quiz" ? "Live Session Quiz" : "Self-Study Quiz"} Solutions
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score: {selectedAttempt.score}/{selectedAttempt.total} ({Math.round((selectedAttempt.score / selectedAttempt.total) * 100)}%) • {selectedAttempt.date}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedAttempt(null); setSelectedAttemptDetails(null); }}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm">Loading solutions details...</p>
                </div>
              ) : selectedAttemptDetails ? (
                <div className="space-y-4">
                  {selectedAttemptDetails.map((q: any, i: number) => {
                    const isCorrect = q.isCorrect;
                    const hasOptions = q.optionA && q.optionB && q.optionC && q.optionD;

                    return (
                      <div key={i} className={`p-4 rounded-xl border ${isCorrect ? "bg-success-light border-success/30" : "bg-destructive/5 border-destructive/20"}`}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground mb-2">{i + 1}. {q.questionText}</p>
                            
                            {hasOptions ? (
                              <div className="grid gap-2 mb-3">
                                {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt) => {
                                  const letter = opt.trim().charAt(0);
                                  const isSelected = q.selectedOption === letter;
                                  const isCorrectOption = q.correctOption === letter;
                                  
                                  let bgClass = "bg-secondary/40 border-transparent text-foreground";
                                  if (isSelected && isCorrectOption) bgClass = "bg-success/20 border-success text-success-foreground font-semibold";
                                  else if (isSelected) bgClass = "bg-destructive/10 border-destructive text-destructive font-semibold";
                                  else if (isCorrectOption) bgClass = "bg-success/10 border-success/30 text-success-foreground font-semibold";

                                  return (
                                    <div key={opt} className={`p-2.5 rounded-lg border text-xs leading-relaxed ${bgClass}`}>
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-2 grid gap-1 mb-2">
                                <div>Your answer: <span className="font-semibold text-foreground">{q.selectedOption || "Not answered"}</span></div>
                                <div>Correct answer: <span className="font-semibold text-success">{q.correctOption}</span></div>
                              </div>
                            )}

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
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Could not load solution details.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentQuizResults;
