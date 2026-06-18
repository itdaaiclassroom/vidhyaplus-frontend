import React, { useState, useMemo } from "react";
import { 
  Users, Award, TrendingUp, School, BookOpen, 
  BarChart3, Calendar, GraduationCap, CheckCircle2, Star,
  Search, X, ChevronLeft, ChevronRight, Check, ChevronsUpDown
} from "lucide-react";
import { StudentSpotlightModal } from "@/components/StudentSpotlightModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentsOverviewProps {
  data: {
    schools: any[];
    students: any[];
    classes: any[];
    studentAttendance?: any[];
    studentQuizResults?: any[];
    rawAttendance?: any[];
  };
}

export default function StudentsOverview({ data }: StudentsOverviewProps) {
  const safeSchools = data?.schools || [];
  const safeStudents = data?.students || [];
  const safeClasses = data?.classes || [];
  const safeAttendance = data?.studentAttendance || [];
  const safeQuizzes = data?.studentQuizResults || [];
  const safeRawAttendance = data?.rawAttendance || [];

  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedPerformanceTier, setSelectedPerformanceTier] = useState<string>("all");
  const [studentSearchText, setStudentSearchText] = useState("");
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [spotlightStudent, setSpotlightStudent] = useState<any>(null);
  const pageSize = 5;

  // Get distinct grades from classes
  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    safeClasses.forEach(c => {
      if (c.grade_id) grades.add(c.grade_id);
      if (c.grade) grades.add(c.grade);
    });
    return Array.from(grades).sort((a, b) => a - b);
  }, [safeClasses]);

  // Get distinct sections from classes
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    safeClasses.forEach(c => {
      if (c.section) sections.add(c.section);
    });
    return Array.from(sections).sort();
  }, [safeClasses]);

  // 1. Filtered Students
  const filteredStudents = useMemo(() => {
    return safeStudents.filter(student => {
      const matchSchool = selectedSchool === "all" || String(student.schoolId) === selectedSchool;
      if (!matchSchool) return false;
      
      const studentClass = safeClasses.find(c => String(c.id) === String(student.classId));
      
      if (selectedGrade !== "all") {
        const studentGrade = studentClass ? String(studentClass.grade_id || studentClass.grade) : null;
        if (studentGrade !== selectedGrade) return false;
      }

      if (selectedSection !== "all") {
        const studentSection = studentClass ? studentClass.section : null;
        if (studentSection !== selectedSection) return false;
      }

      if (selectedPerformanceTier !== "all") {
        const score = student.score || 0;
        if (selectedPerformanceTier === "excellent" && score < 90) return false;
        if (selectedPerformanceTier === "good" && (score < 75 || score >= 90)) return false;
        if (selectedPerformanceTier === "average" && (score < 50 || score >= 75)) return false;
        if (selectedPerformanceTier === "needs_imp" && score >= 50) return false;
      }

      return true;
    });
  }, [safeStudents, safeClasses, selectedSchool, selectedGrade, selectedSection, selectedPerformanceTier]);

  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map(s => String(s.id))), [filteredStudents]);

  // 2. KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalStudents = filteredStudents.length;

    // Avg Attendance
    const relevantAttendance = safeAttendance.filter(a => filteredStudentIds.has(String(a.studentId)));
    const avgAttendance = relevantAttendance.length > 0
      ? Math.round(relevantAttendance.reduce((sum, a) => sum + (a.percentage || 0), 0) / relevantAttendance.length)
      : 0;

    // Avg Quiz Score & Assessed Students
    const relevantQuizzes = safeQuizzes.filter(q => filteredStudentIds.has(String(q.studentId)) && q.total > 0);
    const assessedStudents = new Set(relevantQuizzes.map(q => String(q.studentId))).size;
    
    let totalScore = 0;
    let totalMax = 0;
    relevantQuizzes.forEach(q => {
      totalScore += (q.score || 0);
      totalMax += (q.total || 0);
    });
    const avgQuizScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return {
      totalStudents,
      avgAttendance,
      avgQuizScore,
      assessedStudents,
      assessedPct: totalStudents > 0 ? Math.round((assessedStudents / totalStudents) * 100) : 0
    };
  }, [filteredStudents, filteredStudentIds, safeAttendance, safeQuizzes]);

  // 3. Area Chart Data: Real Daily Attendance Trend aggregated from database records
  const attendanceTrendData = useMemo(() => {
    const dailyCounts: Record<string, { present: number; total: number }> = {};
    
    safeRawAttendance.forEach(a => {
      if (filteredStudentIds.has(String(a.studentId))) {
        const d = a.date;
        if (!d) return;
        if (!dailyCounts[d]) {
          dailyCounts[d] = { present: 0, total: 0 };
        }
        dailyCounts[d].total += 1;
        if (a.status === "present") {
          dailyCounts[d].present += 1;
        }
      }
    });

    const sortedDates = Object.keys(dailyCounts).sort();
    
    if (sortedDates.length === 0) {
      return [
        { date: "No Data", attendance: 0 }
      ];
    }

    return sortedDates.slice(-14).map(d => {
      const parts = d.split("-");
      let formattedDate = d;
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const tempDate = new Date(year, month, day);
        if (!isNaN(tempDate.getTime())) {
          formattedDate = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
      }
      const counts = dailyCounts[d];
      return {
        date: formattedDate,
        attendance: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0
      };
    });
  }, [safeRawAttendance, filteredStudentIds]);

  // 4. Bar Chart Data: Quiz Performance Distribution
  const performanceDistributionData = useMemo(() => {
    const bins = {
      "Excellent (90-100%)": 0,
      "Good (75-89%)": 0,
      "Average (50-74%)": 0,
      "Needs Imp. (<50%)": 0,
    };

    filteredStudents.forEach(student => {
      const studentQuizzes = safeQuizzes.filter(q => String(q.studentId) === String(student.id) && q.total > 0);
      if (studentQuizzes.length === 0) return;
      
      const score = studentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
      const total = studentQuizzes.reduce((sum, q) => sum + (q.total || 0), 0);
      const pct = Math.round((score / total) * 100);

      if (pct >= 90) bins["Excellent (90-100%)"]++;
      else if (pct >= 75) bins["Good (75-89%)"]++;
      else if (pct >= 50) bins["Average (50-74%)"]++;
      else bins["Needs Imp. (<50%)"]++;
    });

    return [
      { category: "Excellent (90-100%)", count: bins["Excellent (90-100%)"], color: "#10b981" },
      { category: "Good (75-89%)", count: bins["Good (75-89%)"], color: "#3b82f6" },
      { category: "Average (50-74%)", count: bins["Average (50-74%)"], color: "#f59e0b" },
      { category: "Needs Imp. (<50%)", count: bins["Needs Imp. (<50%)"], color: "#ef4444" },
    ];
  }, [filteredStudents, safeQuizzes]);

  // 5. Advanced Search & Paginated Directory
  const searchedStudents = useMemo(() => {
    const list = filteredStudents.map(student => {
      const studentQuizzes = safeQuizzes.filter(q => String(q.studentId) === String(student.id) && q.total > 0);
      const score = studentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
      const total = studentQuizzes.reduce((sum, q) => sum + (q.total || 0), 0);
      const quizPct = total > 0 ? Math.round((score / total) * 100) : 0;

      const att = safeAttendance.find(a => String(a.studentId) === String(student.id));
      const attPct = att ? att.percentage : 0;

      const school = safeSchools.find(s => String(s.id) === String(student.schoolId));
      const studentClass = safeClasses.find(c => String(c.id) === String(student.classId));
      const gradeLabel = studentClass ? `Class ${studentClass.grade_id || studentClass.grade}` : "N/A";

      return {
        id: student.id,
        name: student.name,
        schoolName: school ? school.name : "Unknown",
        schoolId: student.schoolId,
        grade: gradeLabel,
        quizPct,
        attPct
      };
    });

    // Apply search query filter
    const searched = list.filter(s => 
      s.name.toLowerCase().includes(studentSearchText.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(studentSearchText.toLowerCase()) ||
      s.grade.toLowerCase().includes(studentSearchText.toLowerCase())
    );

    // Sort by quiz performance descending, then attendance descending
    return searched.sort((a, b) => {
      if (b.quizPct !== a.quizPct) return b.quizPct - a.quizPct;
      return b.attPct - a.attPct;
    });
  }, [filteredStudents, safeQuizzes, safeAttendance, safeSchools, safeClasses, studentSearchText]);

  const totalPages = Math.max(1, Math.ceil(searchedStudents.length / pageSize));
  
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedStudents.slice(start, start + pageSize);
  }, [searchedStudents, currentPage]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" /> Students Analytics Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track student onboarding, attendance, and quiz performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-60">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Search Student
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={studentSearchText}
                onChange={(e) => { setStudentSearchText(e.target.value); setCurrentPage(1); }}
                placeholder="Search name or grade..."
                className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all text-slate-700 shadow-xs"
              />
              {studentSearchText && (
                <button
                  onClick={() => { setStudentSearchText(""); setCurrentPage(1); }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Filter by School
            </label>
            <Popover open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={schoolPopoverOpen}
                  className="w-48 justify-between bg-slate-50 border-slate-100 hover:bg-slate-100 hover:text-slate-900 transition-all font-medium text-left shadow-sm h-10 rounded-xl text-slate-700 text-xs"
                >
                  <span className="truncate">
                    {selectedSchool === "all" ? "All Schools" : (safeSchools.find(s => String(s.id) === selectedSchool)?.name || "All Schools")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 shadow-lg border-slate-100 rounded-xl overflow-hidden bg-white z-50" align="end">
                <Command>
                  <div className="flex items-center border-b px-2.5 bg-slate-50/50">
                    <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    <CommandInput placeholder="Search school..." className="h-9 border-0 focus:ring-0 outline-hidden w-full bg-transparent text-xs text-slate-800" />
                  </div>
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty className="py-4 text-center text-xs text-slate-500">No school found.</CommandEmpty>
                    <CommandGroup heading="Available Schools" className="text-[10px] font-bold text-slate-400">
                      <CommandItem
                        value="All Schools"
                        onSelect={() => {
                          setSelectedSchool("all");
                          setSchoolPopoverOpen(false);
                          setCurrentPage(1);
                        }}
                        className="cursor-pointer flex items-center py-2 px-2.5 mb-0.5 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-900 text-xs"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">All Schools</span>
                          {selectedSchool === "all" && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                        </div>
                      </CommandItem>
                      {safeSchools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name}
                          onSelect={() => {
                            setSelectedSchool(String(school.id));
                            setSchoolPopoverOpen(false);
                            setCurrentPage(1);
                          }}
                          className="cursor-pointer flex items-center py-2 px-2.5 mb-0.5 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-900 text-xs"
                        >
                          <div className="flex items-center justify-between w-full truncate">
                            <span className="font-medium truncate">{school.name}</span>
                            {selectedSchool === String(school.id) && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-1" />}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-32">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Grade
            </label>
            <Select value={selectedGrade} onValueChange={(val) => { setSelectedGrade(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-indigo-500 text-slate-700 text-xs font-semibold">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {availableGrades.map(g => (
                  <SelectItem key={g} value={String(g)}>
                    Class {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Section
            </label>
            <Select value={selectedSection} onValueChange={(val) => { setSelectedSection(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-indigo-500 text-slate-700 text-xs font-semibold">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map(sec => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Performance Tier
            </label>
            <Select value={selectedPerformanceTier} onValueChange={(val) => { setSelectedPerformanceTier(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-indigo-500 text-slate-700 text-xs font-semibold">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance Tiers</SelectItem>
                <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                <SelectItem value="good">Good (75-89%)</SelectItem>
                <SelectItem value="average">Average (50-74%)</SelectItem>
                <SelectItem value="needs_imp">Needs Imp. (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(studentSearchText || selectedSchool !== "all" || selectedGrade !== "all" || selectedSection !== "all" || selectedPerformanceTier !== "all") && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-transparent select-none uppercase tracking-widest ml-1 mb-1.5 block">
                Reset
              </label>
              <button
                onClick={() => {
                  setStudentSearchText("");
                  setSelectedSchool("all");
                  setSelectedGrade("all");
                  setSelectedSection("all");
                  setSelectedPerformanceTier("all");
                  setCurrentPage(1);
                }}
                className="h-10 px-4 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center border border-slate-200 hover:border-slate-300"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalStudents}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Registered matching filters</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Attendance Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Attendance</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.avgAttendance}%
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Across all sessions</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Quiz Score Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Quiz Score</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.avgQuizScore}%</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cumulative performance</p>
            </div>
          </CardContent>
        </Card>

        {/* Assessed Students Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessed Students</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.assessedStudents} <span className="text-sm font-bold text-violet-500">({metrics.assessedPct}%)</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Attempted at least 1 quiz</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Recent Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              {metrics.avgAttendance === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No attendance logged</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      labelStyle={{ fontWeight: "bold", color: "#334155" }}
                      formatter={(value: number) => [`${value}%`, "Attendance"]}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" name="Avg Attendance" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution Bar Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Quiz Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              {metrics.assessedStudents === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No quiz scores available</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      labelStyle={{ fontWeight: "bold", color: "#334155" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                      {performanceDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard: Top Performers */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-800">Top Performing Students</CardTitle>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-[10px] font-bold">
                  {searchedStudents.length} of {safeStudents.length} Students
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Ranked by highest average quiz score and attendance</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Avg Attendance</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Quiz Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => setSpotlightStudent(s)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      title="Click to view student spotlight analytics"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shadow-sm">
                            #{globalIdx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 animate-pulse-once">
                              {s.name}
                              <span className="text-[9px] text-indigo-650 bg-indigo-50 font-extrabold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                View Spotlight
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600">{s.grade}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{s.schoolName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm font-bold px-3 py-1">
                          {s.attPct}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm font-bold px-3 py-1">
                          {s.quizPct}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {searchedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No student performance data recorded yet for the selected filters or search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {Math.min(searchedStudents.length, (currentPage - 1) * pageSize + 1)}-{Math.min(searchedStudents.length, currentPage * pageSize)} of {searchedStudents.length} students
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(page); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentSpotlightModal
        spotlightStudent={spotlightStudent}
        onClose={() => setSpotlightStudent(null)}
        safeRawAttendance={safeRawAttendance}
        safeQuizzes={safeQuizzes}
      />
    </div>
  );
}
