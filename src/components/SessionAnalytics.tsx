import { useState, useMemo } from "react";
import { useAppData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import {
  BookOpen, Users, Activity, CheckCircle, Clock,
  TrendingUp, BarChart3, Target
} from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

interface SessionAnalyticsProps {
  schoolId: string;
}

export default function SessionAnalytics({ schoolId }: SessionAnalyticsProps) {
  const { data } = useAppData();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Classes belonging to this school
  const schoolClasses = useMemo(
    () => data.classes.filter(c => c.schoolId === schoolId),
    [data.classes, schoolId]
  );

  // Unique grades for this school
  const schoolGrades = useMemo(
    () => Array.from(new Set(schoolClasses.map(c => c.grade))).sort((a, b) => a - b),
    [schoolClasses]
  );

  // Class IDs for the selected class filter (or all school classes)
  const filteredClassIds = useMemo(() => {
    if (selectedClass === "all") return schoolClasses.map(c => c.id);
    return schoolClasses.filter(c => String(c.grade) === selectedClass).map(c => c.id);
  }, [schoolClasses, selectedClass]);

  // Subjects available for selected grade
  const availableSubjects = useMemo(() => {
    if (selectedClass === "all") return data.subjects;
    const grade = Number(selectedClass);
    return data.subjects.filter(s => s.grades?.includes(grade));
  }, [data.subjects, selectedClass]);

  // Students in this school's filtered classes
  const filteredStudents = useMemo(
    () => data.students.filter(s => s.schoolId === schoolId && filteredClassIds.includes(s.classId || "")),
    [data.students, schoolId, filteredClassIds]
  );
  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map(s => s.id)), [filteredStudents]);

  // Live sessions for this school's classes
  const schoolSessions = useMemo(
    () => data.liveSessions.filter(ls => filteredClassIds.includes(ls.classId)),
    [data.liveSessions, filteredClassIds]
  );

  // Further filter by subject
  const filteredSessions = useMemo(() => {
    if (selectedSubject === "all") return schoolSessions;
    return schoolSessions.filter(ls => ls.subjectId === selectedSubject);
  }, [schoolSessions, selectedSubject]);

  // Chapters for the selected subject + grade
  const filteredChapters = useMemo(() => {
    let chaps = data.chapters;
    if (selectedSubject !== "all") chaps = chaps.filter(ch => ch.subjectId === selectedSubject);
    if (selectedClass !== "all") chaps = chaps.filter(ch => ch.grade === Number(selectedClass));
    return chaps;
  }, [data.chapters, selectedSubject, selectedClass]);
  const filteredChapterIds = useMemo(() => new Set(filteredChapters.map(c => c.id)), [filteredChapters]);

  // Topics for the filtered chapters
  const filteredTopics = useMemo(
    () => data.topics.filter(t => filteredChapterIds.has(t.chapterId)),
    [data.topics, filteredChapterIds]
  );

  // Quiz results scoped to filtered students + chapters
  const filteredQuizResults = useMemo(
    () => data.studentQuizResults.filter(r => filteredStudentIds.has(r.studentId) && filteredChapterIds.has(r.chapterId)),
    [data.studentQuizResults, filteredStudentIds, filteredChapterIds]
  );

  // ═══════════════════════════════════════════════════
  // 1. TOPIC-WISE QUIZ ANALYTICS
  // ═══════════════════════════════════════════════════
  const topicQuizData = useMemo(() => {
    const chapterMap = new Map<string, { name: string; totalScore: number; totalMax: number; count: number }>();
    filteredQuizResults.forEach(r => {
      const ch = filteredChapters.find(c => c.id === r.chapterId);
      if (!ch) return;
      const existing = chapterMap.get(ch.id) || { name: ch.name, totalScore: 0, totalMax: 0, count: 0 };
      existing.totalScore += r.score;
      existing.totalMax += r.total;
      existing.count += 1;
      chapterMap.set(ch.id, existing);
    });
    return Array.from(chapterMap.values()).map(v => ({
      name: v.name.length > 18 ? v.name.slice(0, 16) + "…" : v.name,
      fullName: v.name,
      avgScore: v.totalMax > 0 ? Math.round((v.totalScore / v.totalMax) * 100) : 0,
      attempts: v.count,
    }));
  }, [filteredQuizResults, filteredChapters]);

  // ═══════════════════════════════════════════════════
  // 2. SYLLABUS COMPLETION
  // ═══════════════════════════════════════════════════
  const syllabusData = useMemo(() => {
    const totalTopics = filteredTopics.length;
    const completedTopics = filteredTopics.filter(t => t.status === "completed" || t.status === "done").length;
    const inProgress = filteredTopics.filter(t => t.status === "in_progress" || t.status === "active").length;
    const pending = totalTopics - completedTopics - inProgress;
    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return {
      totalTopics,
      completedTopics,
      inProgress,
      pending: pending > 0 ? pending : 0,
      completionRate,
      pieData: [
        { name: "Completed", value: completedTopics, fill: "#10b981" },
        { name: "In Progress", value: inProgress, fill: "#f59e0b" },
        { name: "Pending", value: pending > 0 ? pending : 0, fill: "#e2e8f0" },
      ].filter(d => d.value > 0),
    };
  }, [filteredTopics]);

  // ═══════════════════════════════════════════════════
  // 3. SESSION ANALYTICS
  // ═══════════════════════════════════════════════════
  const sessionStats = useMemo(() => {
    const total = filteredSessions.length;
    const completed = filteredSessions.filter(s => s.status === "ended").length;
    const active = filteredSessions.filter(s => s.status === "active").length;
    const withQuiz = filteredSessions.filter(s => s.quizSubmitted).length;
    const withAttendance = filteredSessions.filter(s => s.attendanceMarked).length;

    // Group by subject for breakdown
    const bySubject = new Map<string, number>();
    filteredSessions.forEach(s => {
      const sName = s.subjectName || "Unknown";
      bySubject.set(sName, (bySubject.get(sName) || 0) + 1);
    });
    const subjectBreakdown = Array.from(bySubject.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, completed, active, withQuiz, withAttendance, subjectBreakdown };
  }, [filteredSessions]);

  // ═══════════════════════════════════════════════════
  // 4. ATTENDANCE ANALYTICS
  // ═══════════════════════════════════════════════════
  const attendanceData = useMemo(() => {
    const studentAttArr = data.studentAttendance.filter(a => filteredStudentIds.has(a.studentId));
    if (studentAttArr.length === 0) return { avgRate: 0, distribution: [], totalPresent: 0, totalDays: 0 };
    const totalPresent = studentAttArr.reduce((s, a) => s + a.present, 0);
    const totalDays = studentAttArr.reduce((s, a) => s + a.total, 0);
    const avgRate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

    // Distribution buckets
    const buckets = [
      { label: "90-100%", min: 90, max: 101, count: 0 },
      { label: "75-89%", min: 75, max: 90, count: 0 },
      { label: "50-74%", min: 50, max: 75, count: 0 },
      { label: "<50%", min: 0, max: 50, count: 0 },
    ];
    studentAttArr.forEach(a => {
      const pct = a.total > 0 ? (a.present / a.total) * 100 : 0;
      const bucket = buckets.find(b => pct >= b.min && pct < b.max);
      if (bucket) bucket.count++;
    });

    return { avgRate, distribution: buckets, totalPresent, totalDays };
  }, [data.studentAttendance, filteredStudentIds]);

  // ═══════════════════════════════════════════════════
  // 5. STUDENT ENGAGEMENT
  // ═══════════════════════════════════════════════════
  const engagementData = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const studentsWithQuiz = new Set(filteredQuizResults.map(r => r.studentId)).size;
    const quizParticipationRate = totalStudents > 0 ? Math.round((studentsWithQuiz / totalStudents) * 100) : 0;

    // Live quiz answer engagement
    const liveQuizAnswers = data.liveQuizAnswers?.filter(a => filteredStudentIds.has(a.studentId)) || [];
    const correctAnswers = liveQuizAnswers.filter(a => a.isCorrect).length;
    const totalAnswers = liveQuizAnswers.length;
    const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Per-subject engagement
    const subjectEngagement = availableSubjects.map(sub => {
      const subChapIds = new Set(data.chapters.filter(ch => ch.subjectId === sub.id).map(ch => ch.id));
      const subResults = filteredQuizResults.filter(r => subChapIds.has(r.chapterId));
      const uniqueStudents = new Set(subResults.map(r => r.studentId)).size;
      const avgScore = subResults.length > 0
        ? Math.round(subResults.reduce((s, r) => s + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / subResults.length)
        : 0;
      return {
        name: sub.name.length > 12 ? sub.name.slice(0, 10) + "…" : sub.name,
        fullName: sub.name,
        participants: uniqueStudents,
        avgScore,
      };
    }).filter(s => s.participants > 0 || s.avgScore > 0);

    return { totalStudents, studentsWithQuiz, quizParticipationRate, accuracyRate, totalAnswers, subjectEngagement };
  }, [filteredStudents, filteredQuizResults, data.liveQuizAnswers, filteredStudentIds, availableSubjects, data.chapters]);

  // No data state
  const hasNoData = schoolClasses.length === 0;

  return (
    <div className="space-y-6">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 w-44">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class</Label>
          <select
            className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubject("all"); }}
          >
            <option value="all">All Classes</option>
            {schoolGrades.map(g => (
              <option key={g} value={String(g)}>Class {g}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 w-48">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</Label>
          <select
            className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {hasNoData ? (
        <div className="text-center py-16 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No classes found for this school</p>
        </div>
      ) : (
        <>
          {/* ── Summary Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat icon={Activity} label="Total Sessions" value={sessionStats.total} color="blue" />
            <MiniStat icon={CheckCircle} label="Completed" value={sessionStats.completed} color="green" />
            <MiniStat icon={Target} label="Syllabus" value={`${syllabusData.completionRate}%`} color="amber" />
            <MiniStat icon={Users} label="Avg Attendance" value={`${attendanceData.avgRate}%`} color="purple" />
          </div>

          {/* ── Row 1: Topic Quiz + Session Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Topic-wise Quiz Analytics */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Topic-wise Quiz Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {topicQuizData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicQuizData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(val: number) => [`${val}%`, "Avg Score"]}
                          labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                        />
                        <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} maxBarSize={36}>
                          {topicQuizData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No quiz data available" />
                )}
              </CardContent>
            </Card>

            {/* Session Analytics Breakdown */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatPill label="Completed" value={sessionStats.completed} total={sessionStats.total} color="emerald" />
                  <StatPill label="Active" value={sessionStats.active} total={sessionStats.total} color="blue" />
                  <StatPill label="With Quiz" value={sessionStats.withQuiz} total={sessionStats.total} color="violet" />
                  <StatPill label="Attendance Marked" value={sessionStats.withAttendance} total={sessionStats.total} color="amber" />
                </div>
                {sessionStats.subjectBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">By Subject</p>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                      {sessionStats.subjectBreakdown.map(sb => (
                        <div key={sb.name} className="flex items-center justify-between">
                          <span className="text-xs text-slate-600">{sb.name}</span>
                          <Badge variant="outline" className="text-[10px] font-bold">{sb.count} sessions</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 2: Syllabus Completion + Attendance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Syllabus Completion */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Syllabus Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {syllabusData.totalTopics > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="h-[180px] w-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={syllabusData.pieData}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {syllabusData.pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: number, name: string) => [val, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="text-center mb-3">
                        <p className="text-3xl font-bold text-slate-800">{syllabusData.completionRate}%</p>
                        <p className="text-xs text-slate-400">Overall Completion</p>
                      </div>
                      <LegendRow color="#10b981" label="Completed" value={syllabusData.completedTopics} />
                      <LegendRow color="#f59e0b" label="In Progress" value={syllabusData.inProgress} />
                      <LegendRow color="#e2e8f0" label="Pending" value={syllabusData.pending} />
                      <p className="text-[10px] text-slate-400 pt-1">Total: {syllabusData.totalTopics} topics</p>
                    </div>
                  </div>
                ) : (
                  <EmptyChart label="No syllabus data available" />
                )}
              </CardContent>
            </Card>

            {/* Attendance Analytics */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" /> Attendance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {attendanceData.distribution.some(b => b.count > 0) ? (
                  <div>
                    <div className="text-center mb-3">
                      <p className="text-3xl font-bold text-slate-800">{attendanceData.avgRate}%</p>
                      <p className="text-xs text-slate-400">Average Attendance Rate</p>
                    </div>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceData.distribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {attendanceData.distribution.map((_, i) => (
                              <Cell key={i} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][i]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <EmptyChart label="No attendance data available" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Row 3: Student Engagement ── */}
          <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-500" /> Student Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <MiniStat icon={Users} label="Total Students" value={engagementData.totalStudents} color="blue" />
                <MiniStat icon={CheckCircle} label="Quiz Participants" value={engagementData.studentsWithQuiz} color="green" />
                <MiniStat icon={Target} label="Participation" value={`${engagementData.quizParticipationRate}%`} color="amber" />
                <MiniStat icon={TrendingUp} label="Accuracy" value={`${engagementData.accuracyRate}%`} color="purple" />
              </div>
              {engagementData.subjectEngagement.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData.subjectEngagement} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label} />
                      <Bar dataKey="participants" name="Participants" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="avgScore" name="Avg Score %" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No engagement data yet" />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    pink: "bg-pink-50 text-pink-600",
  };
  return (
    <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl">
      <div className={`w-8 h-8 rounded-lg ${bg[color] || bg.blue} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{label}</p>
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function StatPill({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500", blue: "bg-blue-500", violet: "bg-violet-500", amber: "bg-amber-500",
  };
  return (
    <div className="p-2.5 bg-slate-50 rounded-xl">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        <span className="text-xs font-bold text-slate-700">{value}/{total}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[color] || colors.emerald}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-slate-600 flex-1">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-slate-300">
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">{label}</p>
      </div>
    </div>
  );
}
