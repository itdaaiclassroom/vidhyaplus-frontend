import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentRegistrationWizard from "./StudentRegistrationWizard";
import TeacherRegistration from "./TeacherRegistration";
import CoCurricularActivityRegistration from "./CoCurricularActivityRegistration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Trophy, ChevronDown, CheckCircle2, Clock, User, QrCode, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPrincipalStudents, fetchPrincipalTeachers, PrincipalStudent, PrincipalTeacher, getApiBase } from "@/api/client";

const PrincipalDashboard: React.FC = () => {
  const { schoolId } = useAuth();
  const [studentFilterId, setStudentFilterId] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [realStudents, setRealStudents] = useState<PrincipalStudent[]>([]);
  const [realTeachers, setRealTeachers] = useState<PrincipalTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<PrincipalStudent | null>(null);

  useEffect(() => {
    if (schoolId) {
      setLoading(true);
      Promise.all([
        fetchPrincipalStudents(schoolId),
        fetchPrincipalTeachers(schoolId)
      ]).then(([sData, tData]) => {
        setRealStudents(sData);
        setRealTeachers(tData);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [schoolId]);

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
    const matchesClass = classFilter !== "all"
      ? String(s.section_id) === classFilter
      : true;
    return matchesId && matchesClass;
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
      <Tabs defaultValue="overview" className="w-full">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="w-[200px] flex-shrink-0">
          <TabsList className="flex-col h-auto gap-2 w-full bg-transparent p-0">
            <TabsTrigger value="overview" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Overview</TabsTrigger>
            <TabsTrigger value="register" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Student Registration</TabsTrigger>
            <TabsTrigger value="teacher-registration" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Teacher Registration</TabsTrigger>
            <TabsTrigger value="teacher-attendance" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Teacher Attendance</TabsTrigger>
            <TabsTrigger value="student-info" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Student Info</TabsTrigger>
            <TabsTrigger value="cocurricular" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Co-Curricular</TabsTrigger>
            <TabsTrigger value="qrcodes" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">QR Codes</TabsTrigger>
          </TabsList>
        </aside>

        <section className="md:col-span-3">
          <TabsContent value="overview" className="space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="gradient-primary text-white border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realStudents.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realTeachers.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border shadow-sm">
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
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-10 w-48">
                    <SelectValue placeholder="Filter by Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map((clsId) => {
                      const s = realStudents.find(st => st.section_id === clsId);
                      return (
                        <SelectItem key={String(clsId)} value={String(clsId)}>
                          {s ? `Class ${s.grade_id}-${s.section_code}` : clsId}
                        </SelectItem>
                      );
                    })}
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
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
