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
import { BarChart3, Trophy, ChevronDown, CheckCircle2, Clock, User, QrCode, X, LayoutGrid, FileSpreadsheet, Printer, Users, UserPlus, FileUp, Contact, CalendarCheck, PanelLeftClose, PanelLeftOpen, Menu, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { usePrincipal, PrincipalProvider } from "@/contexts/PrincipalContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { 
  PrincipalStudent, PrincipalTeacher, 
  PrincipalGrade, PrincipalSection, getApiBase, updateStudent 
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

const navigationGroups = [
  {
    title: "Dashboard",
    items: [
      { value: "overview", label: "Overview", icon: BarChart3 }
    ]
  },
  {
    title: "Student Management",
    items: [
      { value: "student-info", label: "Student Info", icon: Users },
      { value: "register", label: "Student Registration", icon: UserPlus },
      { value: "bulk-upload", label: "Bulk Registration", icon: FileUp },
      { value: "sections", label: "Section Management", icon: Layers }
    ]
  },
  {
    title: "Teacher Management",
    items: [
      { value: "teacher-info", label: "Teacher Info", icon: Contact },
      { value: "teacher-registration", label: "Teacher Registration", icon: UserPlus },
      { value: "teacher-attendance", label: "Teacher Attendance", icon: CalendarCheck }
    ]
  },
  {
    title: "Tools & Utilities",
    items: [
      { value: "id-cards", label: "ID Cards Bulk", icon: Printer },
      { value: "cocurricular", label: "Co-Curricular", icon: Trophy }
    ]
  }
];

const PrincipalDashboardInner: React.FC = () => {
  const { students: realStudents, teachers: realTeachers, grades, sections, loading } = usePrincipal();
  
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboard", "Student Management"]);
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentFilterId, setStudentFilterId] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const sectionsForFilter = React.useMemo(() => {
    if (gradeFilter === "all") return [];
    return sections.filter(s => s.grade_id === Number(gradeFilter));
  }, [sections, gradeFilter]);

  const [selectedStudent, setSelectedStudent] = useState<PrincipalStudent | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<PrincipalStudent | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<PrincipalTeacher | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingClassFilter, setPendingClassFilter] = useState<string | null>(null);

  useEffect(() => {
    if (pendingClassFilter && sectionsForFilter.find(s => String(s.id) === pendingClassFilter)) {
      setClassFilter(pendingClassFilter);
      setPendingClassFilter(null);
    } else if (classFilter !== "all" && !sectionsForFilter.find(s => String(s.id) === classFilter)) {
       setClassFilter("all");
    }
  }, [sectionsForFilter, pendingClassFilter]);

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
        <div className="flex flex-col md:flex-row gap-6 relative">
          
          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden flex items-center justify-between bg-card p-4 rounded-lg shadow-sm mb-4 border border-border print:hidden">
            <span className="font-semibold text-foreground">Navigation</span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full bg-card">
                <div className="p-4 border-b">
                  <span className="font-display font-semibold text-foreground text-lg">Menu</span>
                </div>
                <ScrollArea className="flex-1 py-4">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-6">
                    {navigationGroups.map((group, i) => {
                      const isOpen = openGroups.includes(group.title);
                      return (
                        <div key={i} className="w-full px-3">
                          <div 
                            className="px-4 mb-2 flex items-center justify-between cursor-pointer hover:bg-secondary/50 py-1.5 rounded-md transition-colors"
                            onClick={() => toggleGroup(group.title)}
                          >
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">{group.title}</h4>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", !isOpen && "-rotate-90")} />
                          </div>
                          {isOpen && (
                            <div className="space-y-1 overflow-hidden">
                              {group.items.map(item => (
                                <TabsTrigger 
                                  key={item.value} 
                                  value={item.value} 
                                  className="w-full flex items-center justify-start gap-3 rounded-lg px-4 py-2.5 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary"
                                >
                                  <item.icon className="w-5 h-5 opacity-80" />
                                  <span className="font-medium text-sm">{item.label}</span>
                                </TabsTrigger>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </TabsList>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar */}
          <aside className={cn(
            "hidden md:flex flex-col bg-card rounded-xl border shadow-sm transition-all duration-300 sticky top-[80px]",
            isSidebarCollapsed ? "w-[80px]" : "w-[260px]",
            "h-[calc(100vh-100px)] flex-shrink-0 z-10"
          )}>
            <div className="p-4 border-b flex justify-between items-center h-[60px]">
              {!isSidebarCollapsed && <span className="font-display font-semibold text-foreground truncate">Menu</span>}
              <Button variant="ghost" size="icon" className={cn("shrink-0", isSidebarCollapsed && "mx-auto")} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </Button>
            </div>
            <ScrollArea className="flex-1 py-4 hide-scrollbar">
              <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-6">
                {navigationGroups.map((group, i) => {
                  const isOpen = isSidebarCollapsed || openGroups.includes(group.title);
                  return (
                    <div key={i} className="w-full px-3">
                      {!isSidebarCollapsed && (
                        <div 
                          className="px-4 mb-2 flex items-center justify-between cursor-pointer hover:bg-secondary/50 py-1.5 rounded-md transition-colors"
                          onClick={() => toggleGroup(group.title)}
                        >
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate select-none">{group.title}</h4>
                          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", !isOpen && "-rotate-90")} />
                        </div>
                      )}
                      {isOpen && (
                        <div className="space-y-1 overflow-hidden">
                          {group.items.map(item => (
                            <TabsTrigger 
                              key={item.value} 
                              value={item.value} 
                              className={cn(
                                "w-full flex items-center gap-3 rounded-lg transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary",
                                isSidebarCollapsed ? "justify-center px-0 py-3" : "justify-start px-4 py-2.5"
                              )}
                              title={isSidebarCollapsed ? item.label : undefined}
                            >
                              <item.icon className={cn("w-5 h-5 shrink-0", isSidebarCollapsed ? "" : "opacity-80")} />
                              {!isSidebarCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
                            </TabsTrigger>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsList>
            </ScrollArea>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0">
            <TabsContent value="overview" className="space-y-4 mt-0">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="gradient-primary text-white border-0 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("student-info")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realStudents.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("teacher-info")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{realTeachers.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{grades.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1" onClick={() => setActiveTab("sections")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium uppercase opacity-80">Total Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sections.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Class-wise Distribution Chart */}
            <Card className="mt-6 border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-700">Class-wise Student Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      grades.map(g => ({
                        name: g.grade_label,
                        students: realStudents.filter(s => s.grade_id === g.id).length
                      })).filter(g => g.students > 0)
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="students" fill="#0d9488" radius={[4, 4, 0, 0]}>
                        {grades.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0d9488' : '#0ea5e9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStudentDetails(s)}>
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
                    <div className="mt-4 pt-2 border-t flex justify-end">
                      <Button variant="outline" size="sm">
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
    </DashboardLayout>
  );
};

const PrincipalDashboard: React.FC = () => (
  <PrincipalProvider>
    <PrincipalDashboardInner />
  </PrincipalProvider>
);

export default PrincipalDashboard;
