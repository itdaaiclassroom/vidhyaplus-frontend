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
import { 
  StudentMainCard, 
  StudentOptionCard, 
  TeacherMainCard,
  StudentData,
  OptionLetter
} from "@/components/IdCardSystem";
import { toast } from "sonner";

const IdCardGenerator = () => {
  const { data } = useAppData();
  const { schools, classes, students } = data;

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [viewMode, setViewMode] = useState<"main" | "options">("main");

  const filteredClasses = useMemo(() => {
    if (!selectedSchool) return [];
    return classes.filter(c => String(c.schoolId) === selectedSchool);
  }, [classes, selectedSchool]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => String(s.classId) === selectedClass);
  }, [students, selectedClass]);

  const currentSchoolName = useMemo(() => {
    return schools.find(s => String(s.id) === selectedSchool)?.name || "Government High School";
  }, [schools, selectedSchool]);

  const handlePrint = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students found in the selected class.");
      return;
    }
    window.print();
  };

  return (
    <DashboardLayout title="ID Card Generator">
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

            <div className="w-full sm:w-64 space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500 ml-1">Class</span>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-0.5">
              <Button 
                onClick={handlePrint} 
                className="gap-2 bg-teal-600 hover:bg-teal-700"
                disabled={!selectedClass || filteredStudents.length === 0}
              >
                <Printer className="w-4 h-4" />
                Print All Cards
              </Button>
            </div>
          </CardContent>
        </Card>

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
            <span>{filteredStudents.length} Students found</span>
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 print:block print:space-y-10">
                {filteredStudents.map((s) => {
                  const studentData: StudentData = {
                    id: String(s.id),
                    name: s.name,
                    schoolName: currentSchoolName,
                    grade: (s as any).grade || "N/A",
                    section: s.section || "A",
                    rollNo: String(s.rollNo || s.id),
                    validUpto: "31-03-2026",
                    photoUrl: s.profile_image_url
                  };
                  return (
                    <div key={s.id} className="flex justify-center print:mb-10 print:break-inside-avoid">
                      <StudentMainCard data={studentData} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-16">
                {filteredStudents.map((s) => {
                  const studentData: StudentData = {
                    id: String(s.id),
                    name: s.name,
                    schoolName: currentSchoolName,
                    grade: (s as any).grade || "N/A",
                    section: s.section || "A",
                    rollNo: String(s.rollNo || s.id),
                    validUpto: "31-03-2026",
                    photoUrl: s.profile_image_url
                  };
                  return (
                    <div key={s.id} className="space-y-6 print:break-after-page print:pt-10">
                      <div className="flex items-center gap-4 border-b pb-2 print:hidden">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                           {s.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{s.name}</h3>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Option Cards Set</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid print:grid-cols-2 print:gap-10">
                        {(["A", "B", "C", "D"] as OptionLetter[]).map((opt) => (
                          <div key={opt} className="flex justify-center print:break-inside-avoid">
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
      </div>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </DashboardLayout>
  );
};

export default IdCardGenerator;
