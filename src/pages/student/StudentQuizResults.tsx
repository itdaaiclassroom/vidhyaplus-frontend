import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { getLiveQuizResult } from "@/api/client";

type SubjectResult = {
  subjectId: string;
  subjectName: string;
  correct: number;
  wrong: number;
  total: number;
  pct: number;
  chaptersWithWrong: Array<{ chapterId: string; chapterName: string; correct: number; wrong: number; total: number }>;
};

const StudentQuizResults = () => {
  const { studentId } = useAuth();
  const { data } = useAppData();
  const { subjects, chapters, students, classes, studentQuizResults, liveQuizSessions = [], liveQuizAnswers = [] } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;

  const myResults = useMemo(() => (student?.id ? studentQuizResults.filter((r) => r.studentId === student.id) : []), [studentQuizResults, student?.id]);

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);

  const subjectResults: SubjectResult[] = useMemo(() => {
    return gradeSubjects.map((sub) => {
      const subChapters = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade);
      const subResults = myResults.filter((r) => subChapters.some((ch) => ch.id === r.chapterId));
      const correct = subResults.reduce((a, r) => a + (r.score ?? 0), 0);
      const total = subResults.reduce((a, r) => a + (r.total ?? 0), 0);
      const wrong = total - correct;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const chaptersWithWrong = subResults
        .filter((r) => (r.total ?? 0) > (r.score ?? 0))
        .map((r) => {
          const ch = chapters.find((c) => c.id === r.chapterId);
          return {
            chapterId: r.chapterId,
            chapterName: ch?.name ?? "Chapter",
            correct: r.score ?? 0,
            wrong: (r.total ?? 0) - (r.score ?? 0),
            total: r.total ?? 0,
          };
        });
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        correct,
        wrong,
        total,
        pct,
        chaptersWithWrong,
      };
    }).filter((s) => s.total > 0);
  }, [gradeSubjects, chapters, grade, myResults]);

  const [liveResult, setLiveResult] = useState<{ sessionId: string; topicName: string; total: number; correct: number; wrong: number; percentage: number; details: Array<{ questionText: string; correctOption: string; selectedOption: string; isCorrect: boolean; explanation: string }> } | null>(null);

  const myLiveQuizSessionIds = useMemo(() => {
    if (!studentId) return [];
    const ids = new Set((liveQuizAnswers as Array<{ studentId: string; liveQuizSessionId: string }>).filter((a) => a.studentId === studentId).map((a) => a.liveQuizSessionId));
    return Array.from(ids);
  }, [studentId, liveQuizAnswers]);

  const myLiveQuizSessions = useMemo(() => {
    return (liveQuizSessions as Array<{ id: string; topicName: string; status: string }>).filter((s) => myLiveQuizSessionIds.includes(s.id));
  }, [liveQuizSessions, myLiveQuizSessionIds]);

  const openLiveResult = (sid: string, topicName: string) => {
    if (!studentId) return;
    getLiveQuizResult(sid, studentId).then((r) => setLiveResult({ sessionId: sid, topicName, ...r, details: r.details || [] }));
  };

  return (
    <DashboardLayout title="Class-Quiz Results">
      <Button variant="ghost" asChild className="mb-4 gap-1">
        <Link to="/student"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
      </Button>

      <p className="text-sm text-muted-foreground mb-6">
        Quiz marks per subject, correct vs wrong counts, and explanations where available.
      </p>

      {myLiveQuizSessions.length > 0 && (
        <Card className="shadow-card border-border mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm">Live quiz attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myLiveQuizSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                <span className="text-sm">{s.topicName}</span>
                <Button variant="outline" size="sm" onClick={() => openLiveResult(s.id, s.topicName)}>
                  View result & explanations
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {liveResult && (
        <Card className="shadow-card border-border mb-6">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-sm">Result: {liveResult.topicName}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLiveResult(null)}>Close</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Score: {liveResult.correct}/{liveResult.total} ({liveResult.percentage}%)</p>
            <div>
              <p className="text-xs font-medium mb-2">Wrong answers – explanation</p>
              {liveResult.details.filter((d) => !d.isCorrect).length === 0 ? (
                <p className="text-muted-foreground text-sm">All correct!</p>
              ) : (
                <ul className="space-y-2">
                  {liveResult.details.filter((d) => !d.isCorrect).map((d, i) => (
                    <li key={i} className="p-2 bg-destructive/5 rounded text-xs">
                      <p className="font-medium">{d.questionText}</p>
                      <p className="text-muted-foreground">Your answer: {d.selectedOption} · Correct: {d.correctOption}</p>
                      <p className="mt-1">{d.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {subjectResults.length === 0 && myLiveQuizSessions.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No quiz results yet. Take chapter-wise quizzes from the Take Quiz section.</p>
            <Button asChild className="mt-4"><Link to="/student/quiz">Take Quiz</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subjectResults.length > 0 && subjectResults.map((sr) => (
            <Card key={sr.subjectId} className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center justify-between">
                  <span>{sr.subjectName}</span>
                  <Badge variant={sr.pct >= 60 ? "default" : "secondary"}>{sr.pct}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" /> {sr.correct} correct
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" /> {sr.wrong} wrong
                  </span>
                  <span className="text-muted-foreground">{sr.total} questions total</span>
                </div>
                <Progress value={sr.pct} className="h-2" />
                {sr.chaptersWithWrong.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Chapters with wrong answers:</p>
                    <ul className="text-sm space-y-1 mb-3">
                      {sr.chaptersWithWrong.map((c) => (
                        <li key={c.chapterId}>
                          {c.chapterName} — {c.correct}/{c.total} correct
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </DashboardLayout>
  );
};

export default StudentQuizResults;
