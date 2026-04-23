import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentRegistrationWizard from "./StudentRegistrationWizard";
import TeacherRegistration from "./TeacherRegistration";
import CoCurricularActivityRegistration from "./CoCurricularActivityRegistration";
import { students, coCurricularActivities, schools, teachers, chapters, topics, leaveApplications } from "@/data/demo-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Trophy, ChevronDown, CheckCircle2, Clock } from "lucide-react";

const PrincipalDashboard: React.FC = () => {
  const [studentFilterId, setStudentFilterId] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");

  const uniqueClasses = Array.from(
    new Set(
      (students || [])
        .map((s) => s?.classId)
        .filter((cls) => cls && typeof cls === "string" && cls.trim())
    )
  );

  const filteredStudents = (students || []).filter((s) => {
    const matchesId = studentFilterId.trim()
      ? s?.id && typeof s.id === "string" && s.id.toLowerCase().includes(studentFilterId.toLowerCase())
      : true;
    const matchesClass = classFilter.trim()
      ? s?.classId === classFilter
      : true;
    return matchesId && matchesClass;
  });

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
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-sm">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Overview intentionally empty */}
              </CardContent>
            </Card>
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
                  placeholder="Filter by Student ID"
                  value={studentFilterId}
                  onChange={(e) => setStudentFilterId(e.target.value)}
                  className="h-10 w-64"
                />
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-10 w-48">
                    <SelectValue placeholder="Filter by Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card>
              <div className="p-4">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-semibold">ID</th>
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length ? (
                        filteredStudents.map((s) => (
                          <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="py-3">{s.id}</td>
                            <td className="py-3">{s.name}</td>
                            <td className="py-3">{s.classId}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-3 text-center text-muted-foreground">
                            No students found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cocurricular" className="space-y-4">
            <CoCurricularActivityRegistration />
          </TabsContent>

          <TabsContent value="qrcodes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {/* QR Codes content */}
              </CardContent>
            </Card>
          </TabsContent>
        </section>
      </div>
      </Tabs>
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
