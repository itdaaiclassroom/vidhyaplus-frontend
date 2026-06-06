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
import { cn } from "@/lib/utils";

interface IdCardGeneratorProps {
  isEmbedded?: boolean;
}

const IdCardGenerator = ({ isEmbedded = false }: IdCardGeneratorProps = {}) => {
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

  const activeSchoolId = principalCtx?.schoolId || schoolId;

  const [selectedSchool, setSelectedSchool] = useState<string>(activeSchoolId ? String(activeSchoolId) : "");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"main" | "options">("main");
  const [printLayout, setPrintLayout] = useState<"4-in-1" | "1-per-page">("4-in-1");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (activeSchoolId) setSelectedSchool(String(activeSchoolId));
  }, [activeSchoolId]);

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

  // Group all students by section, sort them, and assign unique slots (0 to 59)
  const studentSlotMap = useMemo(() => {
    const map = new Map<string, number>();
    const studentsBySection: Record<string, any[]> = {};
    
    students.forEach((s: any) => {
      const secId = String(principalCtx ? s.section_id : s.classId);
      if (!studentsBySection[secId]) {
        studentsBySection[secId] = [];
      }
      studentsBySection[secId].push(s);
    });

    Object.keys(studentsBySection).forEach((secId) => {
      const list = studentsBySection[secId];
      const sorted = [...list].sort((a, b) => {
        const rollA = Number(principalCtx ? a.roll_no : (a.rollNo || a.id));
        const rollB = Number(principalCtx ? b.roll_no : (b.rollNo || b.id));
        const isRollANan = isNaN(rollA);
        const isRollBNan = isNaN(rollB);
        if (!isRollANan && !isRollBNan) {
          if (rollA !== rollB) return rollA - rollB;
        } else if (!isRollANan) {
          return -1;
        } else if (!isRollBNan) {
          return 1;
        }
        return String(a.id).localeCompare(String(b.id));
      });

      sorted.forEach((student, index) => {
        map.set(String(student.id), index % 60);
      });
    });

    return map;
  }, [students, principalCtx]);

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

  const content = (
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
              {!activeSchoolId && (
                <div className="w-full sm:w-64 space-y-1.5">
                  <span className="text-xs font-bold uppercase text-slate-500 ml-1">School</span>
                  <Select value={selectedSchool} onValueChange={(val) => { setSelectedSchool(val); setSelectedClass(""); }}>
                    <SelectTrigger className="h-11 bg-slate-50">
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

          {selectedClass && selectedClass !== "all" && filteredStudents.length > 0 && (
            <Card className="print:hidden border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                      <Users className="w-5 h-5 text-teal-600" />
                      Select Students to Print
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {selectedStudentIds.size > 0 ? (
                        <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">{selectedStudentIds.size} of {filteredStudents.length} selected</span>
                      ) : (
                        <span>Leave all unchecked to print everyone below.</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    variant={selectedStudentIds.size === filteredStudents.length ? "secondary" : "outline"}
                    size="sm" 
                    className="rounded-xl h-9 font-semibold transition-all"
                    onClick={() => {
                      if (selectedStudentIds.size === filteredStudents.length) setSelectedStudentIds(new Set());
                      else setSelectedStudentIds(new Set(filteredStudents.map(s => String(s.id))));
                    }}
                  >
                    {selectedStudentIds.size === filteredStudents.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {filteredStudents.map(s => {
                    const isSelected = selectedStudentIds.has(String(s.id));
                    return (
                      <label 
                        key={s.id} 
                        className={cn(
                          "relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden",
                          isSelected 
                            ? "border-teal-500 bg-teal-50/50 shadow-sm" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                            isSelected ? "bg-teal-500 border-teal-500" : "bg-white border-slate-300 group-hover:border-slate-400"
                          )}>
                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className={cn(
                              "text-sm font-bold truncate transition-colors",
                              isSelected ? "text-teal-900" : "text-slate-700"
                            )}>
                              {principalCtx ? `${s.first_name} ${s.last_name}` : s.name} 
                            </span>
                            <span className={cn(
                              "text-xs font-medium truncate transition-colors",
                              isSelected ? "text-teal-600/70" : "text-slate-400"
                            )}>
                              Roll: {principalCtx ? s.roll_no : (s.rollNo || s.id)}
                            </span>
                          </div>
                        </div>
                        {/* Hidden native checkbox */}
                        <input 
                          type="checkbox" 
                          className="absolute opacity-0 w-0 h-0"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedStudentIds);
                            if (e.target.checked) newSet.add(String(s.id));
                            else newSet.delete(String(s.id));
                            setSelectedStudentIds(newSet);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Mode Tabs - Hidden on print */}
          <div className="flex justify-between items-center print:hidden mb-4">
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
            
            <div className="flex items-center gap-4">
              {viewMode === "options" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Layout:</span>
                  <Select value={printLayout} onValueChange={(v: any) => setPrintLayout(v)}>
                    <SelectTrigger className="h-9 text-sm w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-in-1">4 Cards per Page</SelectItem>
                      <SelectItem value="1-per-page">1 Card per Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>{studentsToPrint.length} Students found</span>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          {!selectedClass || selectedClass === "all" ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 print:hidden relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6 relative z-10 border border-slate-100">
                <LayoutGrid className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">Select a Class Section</h3>
              <p className="text-slate-500 font-medium relative z-10 max-w-sm text-center">Please select a specific class section from the filters above to preview and generate ID cards.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {viewMode === "main" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-10 print:grid print:grid-cols-1 print:gap-10 print:space-y-0 print:pt-4 printable-area">
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
                      <div key={s.id}>
                        {printLayout === "4-in-1" && (
                          <div className="flex items-center gap-4 border-b pb-2 print:hidden mb-4">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                               {displayName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">{displayName}</h3>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Option Cards Set</p>
                            </div>
                          </div>
                        )}
                        <div className={cn(
                          "grid gap-6",
                          printLayout === "4-in-1" 
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-2 print:break-after-page print:p-0"
                            : "grid-cols-1 lg:grid-cols-4"
                        )}>
                          {(["A", "B", "C", "D"] as OptionLetter[]).map((opt) => (
                            <div key={opt} className={cn("flex justify-center", printLayout === "1-per-page" && "page-card-wrapper")}>
                              <StudentOptionCard 
                                data={studentData} 
                                option={opt} 
                                printLayout={printLayout} 
                                slot={studentSlotMap.get(String(s.id))}
                              />
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
              @page { size: A4; margin: 0mm; }
              body, html { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              
              /* Force colors even if browser tries to save ink */
              .bg-teal-600 { background-color: #0d9488 !important; -webkit-print-color-adjust: exact !important; }
              .bg-emerald-600 { background-color: #059669 !important; -webkit-print-color-adjust: exact !important; }
              .bg-blue-700 { background-color: #1d4ed8 !important; -webkit-print-color-adjust: exact !important; }
              .bg-purple-700 { background-color: #7e22ce !important; -webkit-print-color-adjust: exact !important; }
              .bg-blue-900 { background-color: #1e3a8a !important; -webkit-print-color-adjust: exact !important; }
              .bg-teal-400 { background-color: #2dd4bf !important; -webkit-print-color-adjust: exact !important; }
              .bg-blue-400 { background-color: #60a5fa !important; -webkit-print-color-adjust: exact !important; }
              
              .text-teal-600 { color: #0d9488 !important; }
              .text-emerald-600 { color: #059669 !important; }
              .text-blue-700 { color: #1d4ed8 !important; }
              .text-purple-700 { color: #7e22ce !important; }
              .text-teal-400 { color: #2dd4bf !important; }
              .text-white { color: white !important; }

              .print\\:hidden { display: none !important; }
              .printable-area { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                display: block !important; 
                margin: 0 !important; 
                padding: 0 !important;
                z-index: 9999;
              }
              /* Strip all spacing from printable-area and its children in print */
              .printable-area > * { margin: 0 !important; padding: 0 !important; }
              .printable-area > * > * { margin: 0 !important; }

              .print\\:grid { display: grid !important; }
              .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              .print\\:gap-10 { gap: 2.5rem !important; }
              .print\\:break-inside-avoid { break-inside: avoid; }
              .print\\:break-after-page { break-after: page !important; page-break-after: always !important; }
              .print\\:flex { display: flex !important; }
              .print\\:flex-col { flex-direction: column !important; }
              .print\\:justify-start { justify-content: flex-start !important; }
              .print\\:items-center { align-items: center !important; }
              .print\\:mx-auto { margin-left: auto; margin-right: auto; }
              .print\\:pt-0 { padding-top: 0 !important; }
              .print\\:w-full { width: 100% !important; }

              /* 1-per-page card wrapper: each card centered on its own A4 page */
              .page-card-wrapper {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                width: 210mm !important;
                height: 297mm !important;
                padding: 0 !important;
                break-after: page !important;
                page-break-after: always !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }

              /* Hide everything else except the printable area */
              body > * {
                visibility: hidden !important;
              }
              
              /* Strip all layout offsets from ancestors so absolute positioning anchors to the actual page */
              body *:not(.printable-area):not(.printable-area *) {
                position: static !important;
                padding: 0 !important;
                margin: 0 !important;
              }

              .printable-area, .printable-area * {
                visibility: visible !important;
              }
          }
        `}} />
      </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <DashboardLayout title="ID Card Generator">
      {content}
    </DashboardLayout>
  );
};

export default IdCardGenerator;
