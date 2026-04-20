import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const SchoolsAnalytics = () => {
  const navigate = useNavigate();
  const { data } = useAppData();
  const { userName } = useAuth();
  const admins = data.admins ?? [];
  const adminDisplayName = (admins?.length && admins[0]?.full_name) ? admins[0].full_name : userName;
  const schools = data.schools ?? [];
  const students = data.students ?? [];
  const classes = data.classes ?? [];
  const studentQuizResults = data.studentQuizResults ?? [];
  const studentAttendance = data.studentAttendance ?? [];
  const studentUsageLogs = (data.studentUsageLogs ?? []) as Array<{ studentId: string; date?: string; minutes?: number }>;
  const [searchParams, setSearchParams] = useSearchParams();
  const [schoolSearch, setSchoolSearch] = useState(searchParams.get("school") || "");
  const [dateFrom, setDateFrom] = useState("");
  const schoolFilter = (searchParams.get("school") || "").trim().toLowerCase();

  useEffect(() => {
    setSchoolSearch(searchParams.get("school") || "");
  }, [searchParams]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSearch = schoolSearch.trim();
    if (!trimmedSearch) {
      setSearchParams({});
      return;
    }
    setSearchParams({ school: trimmedSearch });
  };

  const schoolPerformance = useMemo(() => {
    const targetDate = dateFrom ? dateFrom : null; // format YYYY-MM-DD from input
    return schools.map((schoolItem) => {
      const schoolStudents = students.filter((student) => student.schoolId === schoolItem.id);
      const schoolStudentIds = new Set(schoolStudents.map((student) => student.id));

      const schoolQuizEntries = studentQuizResults.filter((result) => {
        if (!schoolStudentIds.has(result.studentId) || result.total === 0) return false;
        if (targetDate) {
          const d = new Date(result.date).toISOString().slice(0, 10);
          if (d !== targetDate) return false;
        }
        return true;
      });
      const totalQuizScore = schoolQuizEntries.reduce((sum, result) => sum + result.score, 0);
      const totalQuizQuestions = schoolQuizEntries.reduce((sum, result) => sum + result.total, 0);
      const quizRate = totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : 0;

      // studentAttendance contains cumulative attendance (no per-day `date` field)
      // so filter only by student membership in this school. Date filter not applicable.
      const schoolAttendanceEntries = studentAttendance.filter((record) => {
        return schoolStudentIds.has(record.studentId);
      });
      const attendanceRate = schoolAttendanceEntries.length
        ? Math.round(
            schoolAttendanceEntries.reduce((sum, record) => sum + record.percentage, 0) /
              schoolAttendanceEntries.length
          )
        : 0;

      const schoolUsageEntries = studentUsageLogs.filter((log) => {
        if (!schoolStudentIds.has(log.studentId)) return false;
        if (targetDate) {
          const d = new Date(log.date).toISOString().slice(0, 10);
          if (d !== targetDate) return false;
        }
        return true;
      });
      const usageByDate = schoolUsageEntries.reduce<Record<string, number>>((accumulator, log) => {
        const d = (log as { date?: string }).date;
        const min = (log as { minutes?: number }).minutes ?? 0;
        if (d) accumulator[d] = (accumulator[d] || 0) + min;
        return accumulator;
      }, {});

      const usageTrend = Object.entries(usageByDate)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, minutes]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          minutes,
        }));

      const avgUsageMinutes = schoolUsageEntries.length
        ? Math.round(schoolUsageEntries.reduce((sum, entry) => sum + ((entry as { minutes?: number }).minutes ?? 0), 0) / schoolUsageEntries.length)
        : 0;

      return {
        schoolId: schoolItem.id,
        quizRate,
        attendanceRate,
        avgUsageMinutes,
        usageTrend,
      };
    });
  }, [dateFrom]);

  const handleDownloadCsv = () => {
    const schoolIds = new Set(filteredSchools.map((s) => s.id));
    const studentsToExport = students.filter((st) => schoolIds.has(st.schoolId));

    const rows: string[] = [];
    const header = ["Student ID", "Name", "Roll No", "Class", "School", "Score", "Password"];
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    rows.push(header.join(","));

    studentsToExport.forEach((st) => {
      const classObj = classes.find((c) => c.id === st.classId);
      const schoolObj = schools.find((s) => s.id === st.schoolId);
      const line = [
        escape(st.id),
        escape(st.name),
        escape(st.rollNo),
        escape(classObj ? classObj.name : st.classId),
        escape(schoolObj ? schoolObj.name : st.schoolId),
        escape(st.score),
        "",
      ];
      rows.push(line.join(","));
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `students_${filteredSchools.length === schools.length ? "all" : filteredSchools.map(s=>s.code||s.id).join("-")}_${new Date().toISOString().slice(0,10)}.csv`;
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredSchools = useMemo(() => {
    if (!schoolFilter) return schools;
    return schools.filter((schoolItem) => schoolItem.name.toLowerCase().includes(schoolFilter));
  }, [schoolFilter]);

  return (
    <DashboardLayout title="Schools Performance Analytics" userDisplayName={adminDisplayName}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
        </Button>

        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-3 md:justify-end flex-wrap">
          <Input
            value={schoolSearch}
            onChange={(event) => setSchoolSearch(event.target.value)}
            placeholder="Search school name"
            className="md:w-80"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36"
            placeholder="Date"
          />
          <Button type="submit">Search School Analytics</Button>
          <Button type="button" variant="outline" onClick={() => handleDownloadCsv()}>
            Download Students CSV
          </Button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredSchools.map((schoolItem) => {
          const schoolKpis = schoolPerformance.find((item) => item.schoolId === schoolItem.id);
          const quizRate = schoolKpis?.quizRate ?? 0;
          const attendanceRate = schoolKpis?.attendanceRate ?? 0;
          const avgUsageMinutes = schoolKpis?.avgUsageMinutes ?? 0;
          const usageTrend = schoolKpis?.usageTrend ?? [];

          return (
            <Card key={schoolItem.id} className="shadow-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-foreground">{schoolItem.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Code: {schoolItem.code}</p>
                    <p className="text-xs text-muted-foreground">Village: {schoolItem.district}</p>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span>{schoolItem.teachers} teacher(s)</span>
                      <span>{schoolItem.students} students</span>
                      <span>{schoolItem.sessionsCompleted} sessions</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                    <div className="text-center">
                      <ResponsiveContainer width={78} height={78}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Quiz", value: quizRate },
                              { name: "Remaining", value: 100 - quizRate },
                            ]}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={32}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="hsl(var(--muted))" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] font-medium text-foreground">{quizRate}% Quiz</p>
                    </div>
                    <div className="text-center">
                      <ResponsiveContainer width={78} height={78}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Attendance", value: attendanceRate },
                              { name: "Remaining", value: 100 - attendanceRate },
                            ]}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={32}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            <Cell fill="hsl(var(--info))" />
                            <Cell fill="hsl(var(--muted))" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] font-medium text-foreground">{attendanceRate}% Attend</p>
                    </div>
                    <div className="text-center">
                      <ResponsiveContainer width={78} height={78}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Usage", value: Math.min(avgUsageMinutes, 100) },
                              { name: "Remaining", value: 100 - Math.min(avgUsageMinutes, 100) },
                            ]}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={32}
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                          >
                            <Cell fill="hsl(var(--accent))" />
                            <Cell fill="hsl(var(--muted))" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] font-medium text-foreground">{avgUsageMinutes}m Usage</p>
                    </div>
                  </div>
                </div>
                {/* usage trend chart removed per request */}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSchools.length === 0 && (
        <Card className="shadow-card border-border mt-4">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No schools found for "{searchParams.get("school")}".
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default SchoolsAnalytics;
