import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Users, Filter, LayoutGrid, FileText } from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrincipal } from "@/contexts/PrincipalContext";
import { 
  StudentMainCard, 
  StudentOptionCard, 
  TeacherMainCard,
  StudentData,
  OptionLetter
} from "@/components/IdCardSystem";
import { toast } from "sonner";

const IdCardGenerator = () => {
  const { data: globalData } = useAppData();
  const { schoolId, role } = useAuth();
  const isPrincipal = role === "principal";
  
  // Use PrincipalContext if available, fallback to global data
  let principalCtx: any;
  try {
    principalCtx = usePrincipal();
  } catch (e) {
    principalCtx = null;
  }

  const schools = globalData.schools;
  const classes = principalCtx ? principalCtx.sections : globalData.classes;
  const students = principalCtx ? principalCtx.students : globalData.students;
  const grades = principalCtx ? principalCtx.grades : [];

  const [selectedSchool, setSelectedSchool] = useState<string>(schoolId ? String(schoolId) : "");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"main" | "options">("main");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (schoolId) setSelectedSchool(String(schoolId));
  }, [schoolId]);

  const filteredClasses = useMemo(() => {
    if (!selectedSchool) return [];
    let list = classes;
    if (!principalCtx) {
      list = classes.filter(c => String(c.schoolId) === selectedSchool);
    }
    if (isPrincipal && selectedGrade !== "all") {
      list = list.filter((c: any) => c.grade_id === Number(selectedGrade));
    }
    return list;
  }, [classes, selectedSchool, selectedGrade, principalCtx, isPrincipal]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedClass !== "all") {
      list = list.filter(s => String(principalCtx ? s.section_id : s.classId) === selectedClass);
    } else if (isPrincipal && selectedGrade !== "all") {
       // Filter by all sections in this grade
       const sectionIds = filteredClasses.map((c: any) => c.id);
       list = list.filter(s => sectionIds.includes(principalCtx ? s.section_id : Number(s.classId)));
    }
    return list;
  }, [students, selectedClass, selectedGrade, filteredClasses, principalCtx, isPrincipal]);

  const currentSchoolName = useMemo(() => {
    return schools.find(s => String(s.id) === selectedSchool)?.name || "Government High School";
  }, [schools, selectedSchool]);

  const studentsToPrint = useMemo(() => {
    if (selectedStudentIds.size === 0) return filteredStudents;
    return filteredStudents.filter(s => selectedStudentIds.has(String(s.id)));
  }, [filteredStudents, selectedStudentIds]);

  const handlePrint = () => {
    if (studentsToPrint.length === 0) {
      toast.error("No students found in the selected class.");
      return;
    }
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
        
        {/* Controls - Hidden on print */}
        <Card className="print:hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-teal-600" />
              <CardTitle>Selection Filters</CardTitle>
            </div>
            <CardDescription>Select a school and class to generate ID cards</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {!schoolId && (
              <div className="w-full sm:w-64 space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500 ml-1">School</span>
                <Select value={selectedSchool} onValueChange={(val) => { setSelectedSchool(val); setSelectedClass(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isPrincipal && (
              <div className="w-full sm:w-48 space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500 ml-1">Grade</span>
                <Select value={selectedGrade} onValueChange={(val) => { setSelectedGrade(val); setSelectedClass("all"); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((g: any) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.grade_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full sm:w-48 space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500 ml-1">Section / Class</span>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {filteredClasses.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{principalCtx ? c.display_name : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-0.5">
              <Button 
                onClick={handlePrint} 
                className="gap-2 bg-teal-600 hover:bg-teal-700"
                disabled={studentsToPrint.length === 0}
              >
                <Printer className="w-4 h-4" />
                Print Selected ({studentsToPrint.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedClass && filteredStudents.length > 0 && (
          <Card className="print:hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm">Select Students to Print ({selectedStudentIds.size > 0 ? selectedStudentIds.size : filteredStudents.length} selected)</CardTitle>
                  <CardDescription className="text-xs">Select specific students or leave all unchecked to print everyone below.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (selectedStudentIds.size === filteredStudents.length) setSelectedStudentIds(new Set());
                    else setSelectedStudentIds(new Set(filteredStudents.map(s => String(s.id))));
                  }}
                >
                  {selectedStudentIds.size === filteredStudents.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto p-2 border rounded-md">
                {filteredStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-full border cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={selectedStudentIds.has(String(s.id))}
                      onChange={(e) => {
                        const newSet = new Set(selectedStudentIds);
                        if (e.target.checked) newSet.add(String(s.id));
                        else newSet.delete(String(s.id));
                        setSelectedStudentIds(newSet);
                      }}
                    />
                    <span className="font-medium text-slate-700">
                      {principalCtx ? `${s.first_name} ${s.last_name}` : s.name} 
                      <span className="text-slate-400 text-xs ml-1">
                        ({principalCtx ? s.roll_no : (s.rollNo || s.id)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Tabs - Hidden on print */}
        <div className="flex justify-between items-center print:hidden">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Main ID Cards
              </TabsTrigger>
              <TabsTrigger value="options" className="gap-2">
                <FileText className="w-4 h-4" />
                Option QR Cards
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Users className="w-4 h-4" />
            <span>{studentsToPrint.length} Students found</span>
          </div>
        </div>

        {/* Preview Area */}
        {!selectedClass ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 print:hidden">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium italic">Please select a class to preview ID cards</p>
          </div>
        ) : (
          <div className="space-y-12">
            {viewMode === "main" ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-10 print:grid print:grid-cols-2 print:gap-10 print:space-y-0 print:pt-4">
                {studentsToPrint.map((s) => {
                  const displayName = principalCtx ? `${s.first_name} ${s.last_name}` : s.name;
                  const studentData: StudentData = {
                    id: String(s.id),
                    name: displayName,
                    schoolName: currentSchoolName,
                    grade: principalCtx ? (s.grade_label || "Class") : ((s as any).grade || "Class"),
                    section: principalCtx ? s.section_code : (s.section || "A"),
                    rollNo: String(principalCtx ? s.roll_no : (s.rollNo || s.id)),
                    photoUrl: s.profile_image_url
                  };
                  return (
                    <div key={s.id} className="flex justify-center print:break-inside-avoid">
                      <StudentMainCard data={studentData} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-16 py-10 printable-area">
                {studentsToPrint.map((s) => {
                  const displayName = principalCtx ? `${s.first_name} ${s.last_name}` : s.name;
                  const studentData: StudentData = {
                    id: String(s.id),
                    name: displayName,
                    schoolName: currentSchoolName,
                    grade: principalCtx ? (s.grade_label || "Class") : ((s as any).grade || "Class"),
                    section: principalCtx ? s.section_code : (s.section || "A"),
                    rollNo: String(principalCtx ? s.roll_no : (s.rollNo || s.id)),
                    photoUrl: s.profile_image_url
                  };
                  return (
                    <div key={s.id} className="space-y-6 print:space-y-0 print:break-after-page print:h-[297mm] print:w-full print:max-w-[210mm] print:flex print:flex-col print:justify-start print:items-center print:mx-auto print:pt-0">
                      <div className="flex items-center gap-4 border-b pb-2 print:hidden">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                           {displayName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{displayName}</h3>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Option Cards Set</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-6 print:p-0">
                        {(["A", "B", "C", "D"] as OptionLetter[]).map((opt) => (
                          <div key={opt} className="flex justify-center">
                            <StudentOptionCard data={studentData} option={opt} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          /* Show only the printable area and its children */
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          /* Hide non-printable items even inside the printable area if any */
          .print:hidden, .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}} />
    </div>
  );
};

export default IdCardGenerator;
