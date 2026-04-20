import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Trophy, TrendingUp, Calendar,
  ClipboardCheck, Bell, ChevronRight, AlertTriangle, Target,
  CheckCircle2, Award, Medal
} from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
const StudentDashboard = () => {
  const { studentId } = useAuth();
  const { data } = useAppData();
  const {
    students,
    subjects,
    chapters,
    topics,
    studentQuizResults,
    classStatus,
    classes,
    schools,
    studentAttendance,
  } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0] ?? null, [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const studentSchool = useMemo(() => (student ? schools.find((s) => s.id === student.schoolId) : undefined), [schools, student]);
  const grade = studentClass?.grade ?? 8;

  const myResults = useMemo(() => (student?.id ? studentQuizResults.filter((r) => r.studentId === student.id) : []), [studentQuizResults, student?.id]);
  const totalScore = myResults.reduce((a, r) => a + r.score, 0);
  const totalQuestions = myResults.reduce((a, r) => a + r.total, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  const gradeChapters = useMemo(() => chapters.filter((ch) => ch.grade === grade), [chapters, grade]);
  const classStudents = useMemo(() => (student?.classId ? students.filter((s) => s.classId === student.classId) : []), [students, student?.classId]);
  const classPerformance = useMemo(
    () =>
      classStudents.map((cs) => {
        const csResults = studentQuizResults.filter((r) => r.studentId === cs.id);
        const csTotalScore = csResults.reduce((a, r) => a + r.score, 0);
        const csTotalQ = csResults.reduce((a, r) => a + r.total, 0);
        const pct = csTotalQ > 0 ? Math.round((csTotalScore / csTotalQ) * 100) : 0;
        return { id: cs.id, name: cs.name, pct };
      }).sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name)),
    [classStudents, studentQuizResults]
  );
  const classRank = student?.id ? classPerformance.findIndex((p) => p.id === student.id) + 1 || 0 : 0;

  const recentQuizzes = useMemo(
    () => [...myResults].sort((a, b) => new Date((b.date || "").toString()).getTime() - new Date((a.date || "").toString()).getTime()).slice(0, 3),
    [myResults]
  );

  const myAttendance = student?.id ? studentAttendance.find((a) => a.studentId === student.id) : undefined;

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);

  const myBadges: Array<{ id: string; studentId: string; icon?: string; title?: string; description?: string }> = [];
  const myCertificates: Array<{ id: string; studentId: string; type?: string; date?: string; title?: string; issuer?: string }> = [];

  const subjectPerformance = useMemo(
    () =>
      gradeSubjects.map((sub) => {
        const subChapters = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade);
        const subResults = myResults.filter((r) => subChapters.some((ch) => ch.id === r.chapterId));
        const score = subResults.reduce((a, r) => a + r.score, 0);
        const total = subResults.reduce((a, r) => a + r.total, 0);
        return { name: sub.name, score: total > 0 ? Math.round((score / total) * 100) : 0, fullMark: 100 };
      }),
    [gradeSubjects, chapters, grade, myResults]
  );

  const weakAreas = useMemo(
    () => subjectPerformance.filter((s) => s.score > 0 && s.score < 60).sort((a, b) => a.score - b.score),
    [subjectPerformance]
  );

  const myChapters = useMemo(
    () => gradeSubjects.flatMap((sub) => chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade)),
    [gradeSubjects, chapters, grade]
  );
  const completedChapters = useMemo(
    () =>
      myChapters.filter((ch) => {
        const chTopics = topics.filter((t) => t.chapterId === ch.id);
        return chTopics.length > 0 && chTopics.every((t) => t.status === "completed");
      }).length,
    [myChapters, topics]
  );
  const totalChapters = myChapters.length;
  const chapterProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const myTopics = useMemo(() => myChapters.flatMap((ch) => topics.filter((t) => t.chapterId === ch.id)), [myChapters, topics]);
  const completedTopics = myTopics.filter((t) => t.status === "completed").length;
  const topicProgress = myTopics.length > 0 ? Math.round((completedTopics / myTopics.length) * 100) : 0;

  // pieData no longer needed (class status removed)

  if (!student) {
    return (
      <DashboardLayout title="Student Portal">
        <div className="mb-6 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
          No student profile found. Please log in or contact your admin.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Portal">
      {/* Welcome & Overview */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Welcome, {student.name}! 👋</h2>
        <p className="text-sm text-muted-foreground">{studentClass?.name} • {studentSchool?.name}</p>
      </div>

      {/* Stats Cards: only overall, quizzes done, remaining quizzes, attendance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
            <Card className="shadow-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">#{classRank}</p>
                  <p className="text-xs text-muted-foreground">Class Rank</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{overallPct}%</p>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-info-light flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{myResults.length}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Done</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{myAttendance?.percentage || 0}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </CardContent>
            </Card>
          </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Subject-wise Performance Chart */}
        <Card className="shadow-card border-border lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Subject-wise Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(174, 62%, 38%)" radius={[6, 6, 0, 0]} name="Score %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent quizzes (styled like the lower card) */}
        <Card className="shadow-card border-border">
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Recent Quiz Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentQuizzes.length > 0 ? recentQuizzes.map((r, i) => {
              const ch = chapters.find((c) => c.id === r.chapterId);
              const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
              return (
                <div key={i} className="p-3 bg-secondary rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{ch?.name || r.chapterId}</span>
                    <span className="text-sm font-bold text-primary">{r.score}/{r.total}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{r.date} • {pct}%</p>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No quizzes attempted yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weak Areas Detection */}
      {weakAreas.length > 0 && (
        <Card className="shadow-card mb-6 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> Weak Areas Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {weakAreas.map((area) => (
                <div key={area.name} className="flex items-center gap-2 p-2 px-3 bg-destructive/5 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{area.name}</span>
                  <Badge className="bg-destructive/10 text-destructive text-xs">{area.score}%</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">💡 Focus more on these subjects to improve your overall performance.</p>
          </CardContent>
        </Card>
      )}

      {/* Digital Badges */}
      {myBadges.length > 0 && (
        <Card className="shadow-card border-border mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Medal className="w-4 h-4 text-accent" /> My Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {myBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{badge.title}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions and certificate wallet side-by-side */}
      {/* Quick actions row; certificates placed below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/student/subjects">
          <Card className="shadow-card border-border card-hover cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="text-2xl">📚</div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Study Materials</h3>
                <p className="text-xs text-muted-foreground">Browse subjects & topics</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/student/quiz">
          <Card className="shadow-card border-border card-hover cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="text-2xl">📝</div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Take Quiz</h3>
                <p className="text-xs text-muted-foreground">Chapter-wise quizzes</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/student/quiz-results">
          <Card className="shadow-card border-border card-hover cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Class-Quiz Results</h3>
                <p className="text-xs text-muted-foreground">Marks, correct/wrong & solutions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/activities">
          <Card className="shadow-card border-border card-hover cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="text-2xl">🎭</div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">Activities</h3>
                <p className="text-xs text-muted-foreground">Co-curricular events</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-6">
        <Card className="shadow-card border-border">
          <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Certificate Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {myCertificates.length > 0 ? myCertificates.map((cert) => (
              <div key={cert.id} className="p-3 bg-secondary rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs capitalize">{cert.type}</Badge>
                  <span className="text-xs text-muted-foreground">{cert.date}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.issuer}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No certificates yet</p>
            )}
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  );
};

export default StudentDashboard;
