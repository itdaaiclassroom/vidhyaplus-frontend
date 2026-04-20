import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { downloadStudentQrCodesZip } from "@/api/client";
import { ArrowLeft, Trophy, Download } from "lucide-react";

const StudentsAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data } = useAppData();
  const { userName } = useAuth();
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);
  const admins = data.admins ?? [];
  const adminDisplayName = (admins?.length && admins[0]?.full_name) ? admins[0].full_name : userName;
  const schools = data.schools ?? [];
  const classes = data.classes ?? [];
  const students = data.students ?? [];
  const studentQuizResults = data.studentQuizResults ?? [];
  const studentAttendance = data.studentAttendance ?? [];
  const studentUsageLogs = (data.studentUsageLogs ?? []) as Array<{ studentId: string; minutes?: number }>;

  const schoolId = searchParams.get("schoolId") || "";
  const classId = searchParams.get("classId") || "";
  const mandal = searchParams.get("mandal") || "";
  const village = searchParams.get("village") || "";

  const selectedSchool = useMemo(() => schools.find((item) => item.id === schoolId), [schoolId, schools]);
  const selectedClass = useMemo(() => classes.find((item) => item.id === classId), [classId, classes]);

  const filteredStudents = useMemo(() => {
    if (!schoolId || !classId) return [];
    const base = students.filter((student) => student.schoolId === schoolId && student.classId === classId);

    if (!village.trim()) return base;
    if (!selectedSchool) return [];

    const schoolVillage = selectedSchool.district.toLowerCase();
    const villageMatches = schoolVillage.includes(village.trim().toLowerCase());
    return villageMatches ? base : [];
  }, [schoolId, classId, village, selectedSchool]);

  const studentPerformance = useMemo(() => {
    const metrics = filteredStudents.map((student) => {
      const quizEntries = studentQuizResults.filter((entry) => entry.studentId === student.id && entry.total > 0);
      const totalScore = quizEntries.reduce((sum, entry) => sum + entry.score, 0);
      const totalQuestions = quizEntries.reduce((sum, entry) => sum + entry.total, 0);
      const quizPercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      const attendanceEntry = studentAttendance.find((entry) => entry.studentId === student.id);
      const attendancePercent = attendanceEntry?.percentage || 0;

      const usageEntries = studentUsageLogs.filter((entry) => entry.studentId === student.id);
      const usageMinutes = usageEntries.length
        ? Math.round(usageEntries.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0) / usageEntries.length)
        : 0;

      return {
        student,
        quizPercent,
        attendancePercent,
        usageMinutes,
      };
    });

    const ranked = [...metrics].sort((left, right) => {
      if (right.quizPercent !== left.quizPercent) return right.quizPercent - left.quizPercent;
      if (right.attendancePercent !== left.attendancePercent) return right.attendancePercent - left.attendancePercent;
      return left.student.rollNo - right.student.rollNo;
    });

    const rankMap = new Map<string, number>();
    ranked.forEach((item, index) => {
      rankMap.set(item.student.id, index + 1);
    });

    return metrics
      .map((item) => ({
        ...item,
        topPerformerRank: rankMap.get(item.student.id) || 0,
      }))
      .sort((left, right) => left.student.rollNo - right.student.rollNo);
  }, [filteredStudents]);

  const handleDownloadQrCodes = async (studentId: string) => {
    setDownloadingQrId(studentId);
    try {
      const blob = await downloadStudentQrCodesZip(studentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student_${studentId}_qrcodes.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error already surfaced or silent fail
    } finally {
      setDownloadingQrId(null);
    }
  };

  return (
    <DashboardLayout title="Student Details Analytics" userDisplayName={adminDisplayName}>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={() => navigate("/admin/students-filter")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Filter
        </Button>
        <div className="flex gap-2 flex-wrap">
          {selectedSchool && <Badge variant="outline">School: {selectedSchool.name}</Badge>}
          {selectedClass && <Badge variant="outline">Class: {selectedClass.name}</Badge>}
          {mandal && <Badge variant="outline">Mandal: {mandal}</Badge>}
          {village && <Badge variant="outline">Village: {village}</Badge>}
        </div>
      </div>

      <div className="space-y-3">
        {studentPerformance.map((item) => (
          <Card key={item.student.id} className="shadow-card border-border">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-8 gap-3 items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium text-foreground">{item.student.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{item.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium text-foreground">
                    {classes.find((c) => c.id === item.student.classId)?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-medium text-foreground">
                    {schools.find((s) => s.id === item.student.schoolId)?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quiz</p>
                  <p className="font-medium text-foreground">{item.quizPercent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="font-medium text-foreground">{item.attendancePercent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Performer No.</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-amber-500" /> #{item.topPerformerRank}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">QR Codes</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={downloadingQrId === item.student.id}
                    onClick={() => handleDownloadQrCodes(item.student.id)}
                  >
                    <Download className="w-4 h-4" />
                    {downloadingQrId === item.student.id ? "…" : "Download"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {studentPerformance.length === 0 && (
        <Card className="shadow-card border-border mt-4">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No student details found for the selected filters. Please check school/class/village and try again.
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default StudentsAnalytics;
