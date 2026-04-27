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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Trophy, ChevronDown, CheckCircle2, Clock, User, QrCode, X, LayoutGrid, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchPrincipalStudents, fetchPrincipalTeachers, fetchPrincipalGrades, 
  fetchPrincipalSections, PrincipalStudent, PrincipalTeacher, 
  PrincipalGrade, PrincipalSection, getApiBase, updateStudent 
} from "@/api/client";
import { toast } from "sonner";
import { Edit2, Save, XCircle } from "lucide-react";

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

  useEffect(() => {
    if (schoolId) {
      setLoading(true);
      Promise.all([
        fetchPrincipalStudents(schoolId),
        fetchPrincipalTeachers(schoolId),
        fetchPrincipalGrades()
      ]).then(([sData, tData, gData]) => {
        setRealStudents(sData);
        setRealTeachers(tData);
        setGrades(gData.grades);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [schoolId]);

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
                          {(t as any).subjects && (t as any).subjects.length > 0 ? (t as any).subjects.join(", ") : "None assigned"}
                        </p>
                      </div>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center border-b pb-4 pr-6">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="w-5 h-5 text-primary" />
                Student Full Details
              </DialogTitle>

            </div>
          </DialogHeader>
          {selectedStudentDetails && (
            <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">First Name</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.first_name}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Last Name</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.last_name}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Roll No</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.roll_no}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Class & Section</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.grade_id} - {selectedStudentDetails.section_code}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Category</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.category || 'General'}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Gender</span><p className="font-medium text-sm capitalize mt-1">{selectedStudentDetails.gender || 'N/A'}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Date of Birth</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.dob ? new Date(selectedStudentDetails.dob).toLocaleDateString() : 'N/A'}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Aadhaar</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.aadhaar || 'N/A'}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Phone</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.phone || selectedStudentDetails.phone_number || 'N/A'}</p></div>
                  <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Joined At</span><p className="font-medium text-sm mt-1">{new Date(selectedStudentDetails.joined_at).toLocaleDateString()}</p></div>
                </div>

                <div className="border-t pt-5">
                  <h4 className="font-semibold text-primary mb-4 text-sm flex items-center gap-2"><div className="w-1.5 h-4 bg-primary rounded-full"></div>Family Information</h4>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Father's Name</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.father_name || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Mother's Name</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.mother_name || 'N/A'}</p></div>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <h4 className="font-semibold text-primary mb-4 text-sm flex items-center gap-2"><div className="w-1.5 h-4 bg-primary rounded-full"></div>Address & Additional Info</h4>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="col-span-2"><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Address</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.address || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Village</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.village || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Mandal</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.mandal || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">District</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.district || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">State</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.state || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Pincode</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.pincode || 'N/A'}</p></div>
                    <div><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Hosteller</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.is_hosteller ? 'Yes' : 'No'}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Disabilities</span><p className="font-medium text-sm mt-1">{selectedStudentDetails.disabilities || 'None'}</p></div>
                  </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
