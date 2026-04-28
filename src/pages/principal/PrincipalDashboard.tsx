import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentRegistrationWizard from "./StudentRegistrationWizard";
import TeacherRegistration from "./TeacherRegistration";
import SectionManagement from "./SectionManagement";
import BulkUpload from "@/components/BulkUpload";
import CoCurricularActivityRegistration from "./CoCurricularActivityRegistration";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Trophy, ChevronDown, CheckCircle2, Clock, User, QrCode, X, LayoutGrid, FileSpreadsheet, Printer, Users, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchPrincipalStudents, fetchPrincipalTeachers, fetchPrincipalGrades, 
  fetchPrincipalSections, PrincipalStudent, PrincipalTeacher, 
  PrincipalGrade, PrincipalSection, getApiBase, updateStudent,
  fetchTeacherAttendanceSummary, fetchStudentAttendanceSummary,
  fetchPrincipalSubjects
} from "@/api/client";
import { toast } from "sonner";
import { Edit2, Save, XCircle } from "lucide-react";
import { 
  StudentMainCard, 
  StudentOptionCard, 
  OptionLetter,
  StudentData 
} from "@/components/IdCardSystem";
import IdCardGenerator from "../admin/IdCardGenerator";
import { cn } from "@/lib/utils";

const InfoItem = ({ label, value, isCapitalize }: { label: string, value: string, isCapitalize?: boolean }) => (
  <div>
    <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{label}</span>
    <p className={cn("font-semibold text-slate-700 text-[15px] mt-1.5", isCapitalize && "capitalize")}>{value}</p>
  </div>
);

const PrincipalDashboard: React.FC = () => {
  const { schoolId } = useAuth();
  const [studentFilterId, setStudentFilterId] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [grades, setGrades] = useState<PrincipalGrade[]>([]);
  const [sectionsForFilter, setSectionsForFilter] = useState<PrincipalSection[]>([]);
  const [realStudents, setRealStudents] = useState<PrincipalStudent[]>([]);
  const [realTeachers, setRealTeachers] = useState<PrincipalTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<PrincipalStudent | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<PrincipalStudent | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<PrincipalTeacher | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingClassFilter, setPendingClassFilter] = useState<string | null>(null);
  const [assignTeacher, setAssignTeacher] = useState<PrincipalTeacher | null>(null);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState<{ total_teachers: number, present_today: number, absent_today: number, leave_today: number, present_list: any[], absent_list: any[], leave_list: any[] } | null>(null);
  const [studentStats, setStudentStats] = useState<{ total_students: number, present_today: number, absent_today: number, class_breakdown: any } | null>(null);

  // Drill-down state
  const [drillDownType, setDrillDownType] = useState<"teacher" | "student" | null>(null);
  const [drillDownStatus, setDrillDownStatus] = useState<string | null>(null);
  const [drillDownClass, setDrillDownClass] = useState<string | null>(null);



  const loadSchoolData = () => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      fetchPrincipalStudents(schoolId),
      fetchPrincipalTeachers(schoolId),
      fetchPrincipalGrades(),
      fetchPrincipalSubjects().catch(() => []),
      fetchTeacherAttendanceSummary(schoolId).catch(() => null),
      fetchStudentAttendanceSummary(schoolId).catch(() => null)
    ]).then(([sData, tData, gData, subData, tStats, sStats]) => {
      setRealStudents(sData);
      setRealTeachers(tData);
      setGrades(gData.grades);
      setSubjectsList(Array.isArray(subData) ? subData : []);
      setTeacherStats(tStats);
      setStudentStats(sStats);
      console.log("PRINCIPAL DASHBOARD DATA LOADED:", { tStats, sStats, teacherCount: tData.length, studentCount: sData.length });
    }).catch(console.error).finally(() => setLoading(false));


  };

  useEffect(() => {
    loadSchoolData();
  }, [schoolId]);

  const refreshTeachers = () => {
    if (!schoolId) return;
    fetchPrincipalTeachers(schoolId)
      .then(tData => {
        console.log("REFRESHED TEACHERS:", tData);
        setRealTeachers(tData);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (gradeFilter !== "all") {
      fetchPrincipalSections(Number(gradeFilter))
        .then(data => {
          setSectionsForFilter(data.sections);
          if (pendingClassFilter) {
            setClassFilter(pendingClassFilter);
            setPendingClassFilter(null);
          } else if (classFilter !== "all" && !data.sections.find(s => String(s.id) === classFilter)) {
             setClassFilter("all");
          }
        })
        .catch(console.error);
    } else {
      setSectionsForFilter([]);
      setClassFilter("all");
    }
  }, [gradeFilter, pendingClassFilter]);

  const handleViewStudents = (gradeId: number, sectionId: number) => {
    setActiveTab("student-info");
    setGradeFilter(String(gradeId));
    setPendingClassFilter(String(sectionId));
  };



  const uniqueClasses = Array.from(
    new Set(
      realStudents
        .map((s) => s.section_id)
        .filter(Boolean)
    )
  );

  const filteredStudents = realStudents.filter((s) => {
    const matchesId = studentFilterId.trim()
      ? s.roll_no.toString().toLowerCase().includes(studentFilterId.toLowerCase()) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentFilterId.toLowerCase())
      : true;
    const matchesGrade = gradeFilter !== "all"
      ? s.grade_id === Number(gradeFilter)
      : true;
    const matchesClass = classFilter !== "all"
      ? String(s.section_id) === classFilter
      : true;
    return matchesId && matchesGrade && matchesClass;
  }).sort((a, b) => {
    // 1. Sort by Grade (ascending)
    if (a.grade_id !== b.grade_id) return a.grade_id - b.grade_id;
    // 2. Sort by Section (ascending, alphabetical)
    const sectionA = a.section_code || "";
    const sectionB = b.section_code || "";
    if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
    // 3. Sort by Name (alphabetical)
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const filteredTeachers = realTeachers.filter((t) => {
    return teacherFilter.trim()
      ? t.full_name.toLowerCase().includes(teacherFilter.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherFilter.toLowerCase()) ||
        ((t as any).subjects && (t as any).subjects.join(", ").toLowerCase().includes(teacherFilter.toLowerCase()))
      : true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Principal Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse font-medium">Loading school data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Principal Dashboard">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="w-[200px] flex-shrink-0">
          <TabsList className="flex-col h-auto gap-2 w-full bg-transparent p-0">
            <TabsTrigger value="overview" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Overview</TabsTrigger>
            <TabsTrigger value="register" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Student Registration</TabsTrigger>
            <TabsTrigger value="teacher-registration" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Teacher Registration</TabsTrigger>
            <TabsTrigger value="teacher-info" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Teacher Info</TabsTrigger>
            <TabsTrigger value="teacher-attendance" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Teacher Attendance</TabsTrigger>
            <TabsTrigger value="student-info" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Student Info</TabsTrigger>
            <TabsTrigger value="cocurricular" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Co-Curricular</TabsTrigger>
            <TabsTrigger value="qrcodes" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">QR Codes</TabsTrigger>
            <TabsTrigger value="sections" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Section Management</TabsTrigger>
            <TabsTrigger value="id-cards" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">ID Cards Bulk</TabsTrigger>
            <TabsTrigger value="bulk-upload" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Bulk Registration</TabsTrigger>
          </TabsList>
        </aside>

        <section className="md:col-span-3">
          <TabsContent value="overview" className="space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="gradient-primary text-white border-0 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("student-info")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realStudents.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("teacher-info")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realTeachers.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("sections")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Classes/Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{uniqueClasses.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Teacher Attendance Summary Card */}
              <Card className="shadow-sm border border-border">
                <CardHeader className="pb-3 border-b border-secondary/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Teacher Attendance (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {teacherStats ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-4xl font-bold text-foreground">{teacherStats.present_today}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Teachers Present</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-success-light text-success border-success/20 mb-1">
                            {Math.round((teacherStats.present_today / (teacherStats.total_teachers || 1)) * 100)}% Present
                          </Badge>
                          <p className="text-[10px] text-muted-foreground uppercase">Out of {teacherStats.total_teachers}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 h-3 w-full rounded-full overflow-hidden bg-secondary">
                        <div 
                          className="bg-success h-full transition-all duration-1000" 
                          style={{ width: `${(teacherStats.present_today / (teacherStats.total_teachers || 1)) * 100}%` }}
                        />
                        <div 
                          className="bg-amber h-full transition-all duration-1000" 
                          style={{ width: `${(teacherStats.leave_today / (teacherStats.total_teachers || 1)) * 100}%` }}
                        />
                        <div 
                          className="bg-destructive h-full transition-all duration-1000" 
                          style={{ width: `${(teacherStats.absent_today / (teacherStats.total_teachers || 1)) * 100}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div 
                          className="p-2 rounded-lg bg-success-light/30 border border-success/10 cursor-pointer hover:bg-success-light/50 transition-colors"
                          onClick={() => { setDrillDownType("teacher"); setDrillDownStatus("present"); }}
                        >
                          <p className="text-xs font-bold text-success">{teacherStats.present_today}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Present</p>
                        </div>
                        <div 
                          className="p-2 rounded-lg bg-amber-light/30 border border-amber/10 cursor-pointer hover:bg-amber-light/50 transition-colors"
                          onClick={() => { setDrillDownType("teacher"); setDrillDownStatus("leave"); }}
                        >
                          <p className="text-xs font-bold text-amber">{teacherStats.leave_today}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">On Leave</p>
                        </div>
                        <div 
                          className="p-2 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => { setDrillDownType("teacher"); setDrillDownStatus("absent"); }}
                        >
                          <p className="text-xs font-bold text-destructive">{teacherStats.absent_today}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Absent</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground text-sm italic">
                      No teacher attendance records for today.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Student Attendance Summary Card */}
              <Card className="shadow-sm border border-border">
                <CardHeader className="pb-3 border-b border-secondary/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-info" /> Student Attendance (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {studentStats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-3xl font-bold text-foreground">{studentStats.present_today}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Students Present</p>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-secondary stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-info stroke-current" strokeWidth="3" strokeDasharray={`${(studentStats.present_today / (studentStats.total_students || 1)) * 100}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold">{Math.round((studentStats.present_today / (studentStats.total_students || 1)) * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-white">
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="text-left py-1 font-medium">Class</th>
                              <th className="text-right py-1 font-medium">Present</th>
                              <th className="text-right py-1 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {Object.entries(studentStats.class_breakdown || {}).map(([className, stats]: [string, any]) => {
                              const total = stats.present + stats.absent;
                              const pct = total > 0 ? Math.round((stats.present / total) * 100) : 0;
                              return (
                                <tr 
                                  key={className} 
                                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                                  onClick={() => { setDrillDownType("student"); setDrillDownClass(className); }}
                                >
                                  <td className="py-2 font-medium">{className}</td>
                                  <td className="py-2 text-right">{stats.present}/{total}</td>
                                  <td className="py-2 text-right">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${pct > 80 ? 'bg-success-light text-success' : 'bg-amber-light text-amber'}`}>
                                      {pct}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {(!studentStats.class_breakdown || Object.keys(studentStats.class_breakdown).length === 0) && (
                          <p className="text-[10px] text-center py-4 text-muted-foreground italic">No class-wise data available for today.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground text-sm italic">
                      No student attendance records for today.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Drill-down Dialog */}
            <Dialog open={!!drillDownType} onOpenChange={() => setDrillDownType(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 capitalize">
                    {drillDownType === "teacher" ? (
                      <><Users className="w-5 h-5 text-primary" /> {drillDownStatus} Teachers</>
                    ) : (
                      <><CalendarCheck className="w-5 h-5 text-info" /> {drillDownClass} Attendance</>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto pr-2 mt-4 custom-scrollbar flex-1">
                  {drillDownType === "teacher" && teacherStats && (
                    <div className="grid grid-cols-1 gap-3">
                      {(drillDownStatus === "present" ? (teacherStats.present_list || []) : 
                        drillDownStatus === "absent" ? (teacherStats.absent_list || []) : 
                        (teacherStats.leave_list || [])).map((t: any) => (
                        <div key={t.id} className="p-3 rounded-lg border bg-secondary/10 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm">{t.full_name}</p>
                            <p className="text-xs text-muted-foreground">{t.email}</p>
                          </div>
                          <Badge variant="outline" className={
                            drillDownStatus === "present" ? "bg-success-light text-success border-success/20" :
                            drillDownStatus === "absent" ? "bg-red-50 text-destructive border-red-100" :
                            "bg-amber-light text-amber border-amber/20"
                          }>
                            {drillDownStatus}
                          </Badge>
                        </div>
                      ))}
                      {((drillDownStatus === "present" ? (teacherStats.present_list || []) : 
                         drillDownStatus === "absent" ? (teacherStats.absent_list || []) : 
                         (teacherStats.leave_list || [])).length === 0) && (
                        <p className="text-center py-10 text-muted-foreground italic">No teachers found in this category.</p>
                      )}
                    </div>
                  )}

                  {drillDownType === "student" && studentStats && drillDownClass && studentStats.class_breakdown[drillDownClass] && (
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-secondary/20 p-3 rounded-lg mb-4 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="font-bold text-success">{(studentStats.class_breakdown[drillDownClass].present || 0)}</span> Present
                          <span className="mx-2 text-muted-foreground">|</span>
                          <span className="font-bold text-destructive">{(studentStats.class_breakdown[drillDownClass].absent || 0)}</span> Absent
                        </div>
                        <Badge className="bg-primary text-white">Total: {(studentStats.class_breakdown[drillDownClass].students || []).length}</Badge>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/30">
                          <tr className="text-left text-xs uppercase text-muted-foreground">
                            <th className="p-2 font-bold">Roll No</th>
                            <th className="p-2 font-bold">Name</th>
                            <th className="p-2 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(studentStats.class_breakdown[drillDownClass].students || []).map((s: any) => (
                            <tr key={s.id} className="hover:bg-secondary/10 transition-colors">
                              <td className="p-2 font-medium">{s.roll_no || 'N/A'}</td>
                              <td className="p-2">{s.name}</td>
                              <td className="p-2 text-right">
                                <Badge className={s.status === 'present' ? 'bg-success text-white' : 'bg-destructive text-white'}>
                                  {s.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>


          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="p-0">
              <StudentRegistrationWizard />
            </div>
          </TabsContent>

          <TabsContent value="teacher-registration" className="space-y-4">
            <div className="p-0">
              <TeacherRegistration />
            </div>
          </TabsContent>

          <TabsContent value="teacher-attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Teacher Attendance content */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher-info" className="space-y-4">
            <div className="flex justify-between items-center gap-4 mb-6">
              <div></div>
              <div className="flex gap-4">
                <Input
                  placeholder="Filter by Name, Email or Subject"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="h-10 w-80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((t) => (
                <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTeacher(t)}>
                  <CardHeader className="bg-secondary/30 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{t.full_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{t.email}</p>
                      </div>
                      <Badge variant="outline" className="bg-white capitalize">{t.role || 'Teacher'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                        <p className="font-medium truncate max-w-[150px]" title={(t as any).subjects?.join(", ") || "None"}>
                          {(t as any).subjects && (t as any).subjects.length > 0 ? (t as any).subjects.join(", ") : "No subjects"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={(t as any).class_names?.join(", ") || "None"}>
                          {(t as any).class_names && (t as any).class_names.length > 0 ? (t as any).class_names.join(", ") : "No classes assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t flex justify-end">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setAssignTeacher(t); }}>
                        Assign Subjects/Classes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredTeachers.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No teachers found matching your filter.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="student-info" className="space-y-4">
            <div className="flex justify-between items-center gap-4 mb-6">
              <div></div>
              <div className="flex gap-4">
                <Input
                  placeholder="Filter by Student ID or Name"
                  value={studentFilterId}
                  onChange={(e) => setStudentFilterId(e.target.value)}
                  className="h-10 w-64"
                />
                <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setClassFilter("all"); }}>
                  <SelectTrigger className="h-10 w-40">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.grade_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter} disabled={gradeFilter === "all"}>
                  <SelectTrigger className="h-10 w-40">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sectionsForFilter.map((sec) => (
                      <SelectItem key={sec.id} value={String(sec.id)}>{sec.section_code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((s) => (
                <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStudent(s)}>
                  <CardHeader className="bg-secondary/30 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{s.first_name} {s.last_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Roll No: {s.roll_no}</p>
                      </div>
                      <Badge variant="outline" className="bg-white">Class {s.grade_id}-{s.section_code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-medium">{s.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Identity QR</p>
                        <p className="font-medium text-primary">Click to view</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t flex justify-end">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedStudentDetails(s); }}>
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No students found matching your filters.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cocurricular" className="space-y-4">
            <CoCurricularActivityRegistration />
          </TabsContent>

          <TabsContent value="qrcodes" className="space-y-6">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Generated Student QR Codes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {realStudents.map(s => (
                <Card key={s.id} className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">{s.first_name} {s.last_name} ({s.roll_no})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {s.qr_codes.map(qr => (
                        <div key={qr.type} className="flex-shrink-0 text-center space-y-2">
                          <div className="w-32 h-32 bg-white border rounded p-1 flex items-center justify-center">
                            {qr.path ? (
                              <img 
                                src={`${getApiBase()}${qr.path}`} 
                                alt={`${qr.type} QR`} 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-[10px] text-muted-foreground">Generating...</div>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px] uppercase">{qr.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sections" className="space-y-4">
            <SectionManagement onViewStudents={handleViewStudents} />
          </TabsContent>
          <TabsContent value="bulk-upload" className="space-y-4">
            <BulkUpload />
          </TabsContent>
          <TabsContent value="id-cards" className="space-y-4">
             <IdCardGenerator />
          </TabsContent>
        </section>
      </div>
      </Tabs>

      {/* Student QR Code Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Student Identity & QR
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 pt-2">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedStudent.first_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <p className="text-sm text-muted-foreground">Roll No: {selectedStudent.roll_no}</p>
                  <p className="text-xs text-muted-foreground">Class {selectedStudent.grade_id}-{selectedStudent.section_code} • {selectedStudent.category}</p>
                </div>
              </div>

              {/* Student ID */}
              <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Student ID</p>
                <p className="font-mono text-lg font-bold text-primary">{selectedStudent.id}</p>
              </div>

              {/* QR Codes */}
              {selectedStudent.qr_codes && selectedStudent.qr_codes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">QR Codes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudent.qr_codes.map((qr) => (
                      <div key={qr.type} className="flex flex-col items-center gap-2 p-3 border rounded-xl bg-white">
                        <div className="w-28 h-28 flex items-center justify-center bg-gray-50 rounded-lg">
                          {qr.path ? (
                            <img
                              src={`${getApiBase()}${qr.path}`}
                              alt={`${qr.type} QR`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">Generating...</div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase">{qr.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No QR codes generated yet for this student.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedStudentDetails} onOpenChange={(open) => {
        if (!open) {
          setSelectedStudentDetails(null);
        }
      }}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-50 bg-white border-b px-8 py-4 flex justify-between items-center">
            <DialogHeader className="p-0">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                Student Profile & Identity Cards
              </DialogTitle>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => setSelectedStudentDetails(null)} className="rounded-full">
              <X className="w-6 h-6" />
            </Button>
          </div>

          {selectedStudentDetails && (
            <div className="p-8 space-y-10">
                {/* ID Card Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-primary" />
                      Digital Identity Cards
                    </h4>
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                      <Printer className="w-4 h-4" /> Print Cards
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Main Card */}
                    <div className="lg:col-span-5 flex flex-col items-center gap-4">
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Main Identity Card</p>
                      <StudentMainCard data={{
                        id: String(selectedStudentDetails.id),
                        name: `${selectedStudentDetails.first_name} ${selectedStudentDetails.last_name}`,
                        schoolName: "Government High School",
                        grade: selectedStudentDetails.grade_id,
                        section: selectedStudentDetails.section_code,
                        rollNo: String(selectedStudentDetails.roll_no),
                        validUpto: "31-03-2026",
                        photoUrl: selectedStudentDetails.profile_image_url
                      }} />
                    </div>
                    
                    {/* Option Cards */}
                    <div className="lg:col-span-7 flex flex-col items-center gap-4">
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Option Selection QR Cards</p>
                      <div className="grid grid-cols-2 gap-6 w-full">
                        {(["A", "B", "C", "D"] as OptionLetter[]).map(opt => (
                          <div key={opt} className="scale-[0.8] origin-top">
                            <StudentOptionCard 
                              option={opt}
                              data={{
                                id: String(selectedStudentDetails.id),
                                name: `${selectedStudentDetails.first_name} ${selectedStudentDetails.last_name}`,
                                schoolName: "Government High School",
                                grade: selectedStudentDetails.grade_id,
                                section: selectedStudentDetails.section_code,
                                rollNo: String(selectedStudentDetails.roll_no),
                                validUpto: "31-03-2026",
                                photoUrl: selectedStudentDetails.profile_image_url
                              }} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10 border-t">
                  <div className="space-y-8">
                    <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      <InfoItem label="Full Name" value={`${selectedStudentDetails.first_name} ${selectedStudentDetails.last_name}`} />
                      <InfoItem label="Roll Number" value={String(selectedStudentDetails.roll_no)} />
                      <InfoItem label="Class & Section" value={`${selectedStudentDetails.grade_id} - ${selectedStudentDetails.section_code}`} />
                      <InfoItem label="Category" value={selectedStudentDetails.category || 'General'} />
                      <InfoItem label="Gender" value={selectedStudentDetails.gender || 'N/A'} isCapitalize />
                      <InfoItem label="Date of Birth" value={selectedStudentDetails.dob ? new Date(selectedStudentDetails.dob).toLocaleDateString() : 'N/A'} />
                      <InfoItem label="Aadhaar Number" value={selectedStudentDetails.aadhaar || 'N/A'} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                      Family & Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      <InfoItem label="Father's Name" value={selectedStudentDetails.father_name || 'N/A'} />
                      <InfoItem label="Mother's Name" value={selectedStudentDetails.mother_name || 'N/A'} />
                      <InfoItem label="Phone Number" value={selectedStudentDetails.phone || selectedStudentDetails.phone_number || 'N/A'} />
                      <InfoItem label="Hosteller Status" value={selectedStudentDetails.is_hosteller ? 'Yes' : 'No'} />
                      <InfoItem label="Joined Date" value={new Date(selectedStudentDetails.joined_at).toLocaleDateString()} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                      Location & Other
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      <InfoItem label="Address" value={selectedStudentDetails.address || 'N/A'} />
                      <InfoItem label="Village" value={selectedStudentDetails.village || 'N/A'} />
                      <InfoItem label="Mandal" value={selectedStudentDetails.mandal || 'N/A'} />
                      <InfoItem label="District" value={selectedStudentDetails.district || 'N/A'} />
                      <InfoItem label="State" value={selectedStudentDetails.state || 'N/A'} />
                      <InfoItem label="Disabilities" value={selectedStudentDetails.disabilities || 'None'} />
                    </div>
                  </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teacher Assignment Dialog */}
      {assignTeacher && schoolId && (
        <TeacherAssignmentDialog
          teacher={assignTeacher}
          schoolId={schoolId}
          open={!!assignTeacher}
          onOpenChange={(open) => { if (!open) setAssignTeacher(null); }}
          subjects={subjectsList}
          onSaved={refreshTeachers}
        />
      )}
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
