import React, { useState, useMemo } from "react";
import { 
  Users, Award, MonitorPlay, TrendingUp, School, Star, 
  BookOpen, ChevronRight, BarChart3, Calendar,
  Search, X, ChevronLeft, Check, ChevronsUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeachersOverviewProps {
  data: {
    schools: any[];
    teachers: any[];
    students: any[];
    liveSessions: any[];
    classes: any[];
    subjects: any[];
    studentQuizResults?: any[];
  };
}

export default function TeachersOverview({ data }: TeachersOverviewProps) {
  const { schools = [], teachers = [], liveSessions = [], subjects = [] } = data;
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [teacherSearchText, setTeacherSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [spotlightTeacher, setSpotlightTeacher] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false);
  const pageSize = 5;

  // Distinct subjects for filtering
  const availableSubjects = useMemo(() => {
    const subNames = new Set<string>();
    subjects.forEach(s => {
      if (s.name) subNames.add(s.name);
    });
    return Array.from(subNames).sort();
  }, [subjects]);

  // Set of all active teacher IDs in the system
  const activeTeacherIds = useMemo(() => {
    const ended = liveSessions.filter(ls => ls.status === "ended" || ls.status === "completed" || ls.status === "done");
    return new Set(ended.map(ls => String(ls.teacherId)));
  }, [liveSessions]);

  // 1. Filtered Teachers and Sessions
  const filteredTeachers = useMemo(() => {
    let list = teachers;
    if (selectedSchool !== "all") {
      list = list.filter(t => String(t.schoolId) === selectedSchool);
    }
    if (selectedSubject !== "all") {
      list = list.filter(t => t.subjects && Array.isArray(t.subjects) && t.subjects.some((subj: string) => subj.toLowerCase() === selectedSubject.toLowerCase()));
    }
    if (selectedStatus === "active") {
      list = list.filter(t => activeTeacherIds.has(String(t.id)));
    } else if (selectedStatus === "inactive") {
      list = list.filter(t => !activeTeacherIds.has(String(t.id)));
    }
    return list;
  }, [teachers, selectedSchool, selectedSubject, selectedStatus, activeTeacherIds]);

  const filteredSessions = useMemo(() => {
    // Only count completed/ended/done sessions
    let ended = liveSessions.filter(ls => ls.status === "ended" || ls.status === "completed" || ls.status === "done");
    if (selectedSchool !== "all") {
      ended = ended.filter(ls => {
        const teacher = teachers.find(t => String(t.id) === String(ls.teacherId));
        return teacher && String(teacher.schoolId) === selectedSchool;
      });
    }
    if (selectedSubject !== "all") {
      ended = ended.filter(ls => ls.subjectName && ls.subjectName.toLowerCase() === selectedSubject.toLowerCase());
    }
    return ended;
  }, [liveSessions, teachers, selectedSchool, selectedSubject]);

  // 2. KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalTeachers = filteredTeachers.length;
    
    // Active teachers (who have completed at least one live session)
    const activeTeachersCount = filteredTeachers.filter(t => activeTeacherIds.has(String(t.id))).length;
    
    const activePct = totalTeachers > 0 ? Math.round((activeTeachersCount / totalTeachers) * 100) : 0;
    const sessionsCompleted = filteredSessions.length;
    
    // Avg sessions per active teacher
    const avgSessions = activeTeachersCount > 0 ? (sessionsCompleted / activeTeachersCount).toFixed(1) : "0";

    return {
      totalTeachers,
      activeTeachersCount,
      activePct,
      sessionsCompleted,
      avgSessions
    };
  }, [filteredTeachers, filteredSessions, activeTeacherIds]);

  // 3. Line Chart Data: Session Trend over Time (Last 14 days)
  const trendChartData = useMemo(() => {
    const sessionsByDate: Record<string, number> = {};
    
    // Group sessions by date
    filteredSessions.forEach(ls => {
      if (!ls.startTime) return;
      const dateObj = new Date(ls.startTime);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;
        sessionsByDate[dateStr] = (sessionsByDate[dateStr] || 0) + 1;
      }
    });

    // Get sorted list of last 14 dates with sessions, or standard dates if empty
    const dates = Object.keys(sessionsByDate).sort();
    
    if (dates.length === 0) {
      // Return empty default state if no data
      return [
        { date: "No Data", sessions: 0 }
      ];
    }

    return dates.slice(-14).map(d => {
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
      return {
        date: formattedDate,
        sessions: sessionsByDate[d]
      };
    });
  }, [filteredSessions]);

  // 4. Bar Chart Data: Sessions by Subject
  const subjectChartData = useMemo(() => {
    const countBySubject: Record<string, number> = {};
    
    filteredSessions.forEach(ls => {
      const subjName = ls.subjectName || "Other";
      countBySubject[subjName] = (countBySubject[subjName] || 0) + 1;
    });

    return Object.entries(countBySubject)
      .map(([subject, count]) => ({ subject, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [filteredSessions]);

  // 5. Advanced Search & Paginated Directory
  const searchedTeachers = useMemo(() => {
    const sessionsCountByTeacher: Record<string, number> = {};
    
    // Calculate sessions completed per teacher
    filteredSessions.forEach(ls => {
      const tId = String(ls.teacherId);
      sessionsCountByTeacher[tId] = (sessionsCountByTeacher[tId] || 0) + 1;
    });

    const list = filteredTeachers.map(t => {
      const school = schools.find(s => String(s.id) === String(t.schoolId));
      return {
        id: t.id,
        name: t.name,
        schoolName: school ? school.name : "Main School",
        schoolId: t.schoolId,
        subjects: t.subjects && Array.isArray(t.subjects) ? t.subjects.join(", ") : "N/A",
        sessions: sessionsCountByTeacher[String(t.id)] || 0,
        phone: t.phone || "No phone",
        email: t.email || "No email"
      };
    });

    // Apply search query filter
    const searched = list.filter(t => 
      t.name.toLowerCase().includes(teacherSearchText.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(teacherSearchText.toLowerCase()) ||
      t.subjects.toLowerCase().includes(teacherSearchText.toLowerCase())
    );

    // Sort by session count descending
    return searched.sort((a, b) => b.sessions - a.sessions);
  }, [filteredTeachers, filteredSessions, schools, teacherSearchText]);

  const totalPages = Math.max(1, Math.ceil(searchedTeachers.length / pageSize));
  
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedTeachers.slice(start, start + pageSize);
  }, [searchedTeachers, currentPage]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Teachers Analytics Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track onboarding progress, live teaching sessions, and active subject workloads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-60">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Search Teacher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={teacherSearchText}
                onChange={(e) => { setTeacherSearchText(e.target.value); setCurrentPage(1); }}
                placeholder="Search name or subject..."
                className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all text-slate-700 shadow-xs"
              />
              {teacherSearchText && (
                <button
                  onClick={() => { setTeacherSearchText(""); setCurrentPage(1); }}
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
                    {selectedSchool === "all" ? "All Schools" : (schools.find(s => String(s.id) === selectedSchool)?.name || "All Schools")}
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
                        className="cursor-pointer flex items-center py-2 px-2.5 mb-0.5 rounded-lg aria-selected:bg-emerald-50 aria-selected:text-emerald-900 text-xs"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">All Schools</span>
                          {selectedSchool === "all" && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </div>
                      </CommandItem>
                      {schools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name}
                          onSelect={() => {
                            setSelectedSchool(String(school.id));
                            setSchoolPopoverOpen(false);
                            setCurrentPage(1);
                          }}
                          className="cursor-pointer flex items-center py-2 px-2.5 mb-0.5 rounded-lg aria-selected:bg-emerald-50 aria-selected:text-emerald-900 text-xs"
                        >
                          <div className="flex items-center justify-between w-full truncate">
                            <span className="font-medium truncate">{school.name}</span>
                            {selectedSchool === String(school.id) && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-36">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Subject
            </label>
            <Select value={selectedSubject} onValueChange={(val) => { setSelectedSubject(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-emerald-500 text-slate-700 text-xs font-semibold">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {availableSubjects.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Status
            </label>
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-emerald-500 text-slate-700 text-xs font-semibold">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(teacherSearchText || selectedSchool !== "all" || selectedSubject !== "all" || selectedStatus !== "all") && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-transparent select-none uppercase tracking-widest ml-1 mb-1.5 block">
                Reset
              </label>
              <button
                onClick={() => {
                  setTeacherSearchText("");
                  setSelectedSchool("all");
                  setSelectedSubject("all");
                  setSelectedStatus("all");
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
        {/* Total Teachers Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Teachers</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalTeachers}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Registered in system</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Teachers Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Teachers</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.activeTeachersCount} <span className="text-sm font-bold text-emerald-500">({metrics.activePct}%)</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Conducted recent classes</p>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Completed Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions Conducted</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.sessionsCompleted}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Live classes ended</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Session Load Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Workload</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.avgSessions}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Avg classes per active teacher</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Live Sessions Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    labelStyle={{ fontWeight: "bold", color: "#334155" }}
                  />
                  <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" name="Sessions Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject wise Distribution Bar Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Subject-wise Live Sessions Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              {subjectChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No subject sessions logged</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      labelStyle={{ fontWeight: "bold", color: "#334155" }}
                    />
                    <Bar dataKey="sessions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sessions">
                      {subjectChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#8b5cf6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard: Top Active Teachers */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-800">Top Active Teachers</CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-bold">
                  {searchedTeachers.length} of {teachers.length} Teachers
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Teachers with the highest live class sessions completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Teacher Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Subject(s)</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Sessions completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTeachers.map((t, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => setSpotlightTeacher(t)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      title="Click to view teacher spotlight analytics"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shadow-sm">
                            #{globalIdx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              {t.name}
                              <span className="text-[9px] text-emerald-600 bg-emerald-50 font-extrabold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                View Spotlight
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{t.schoolName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600">{t.subjects}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm font-bold px-3 py-1">
                          {t.sessions} Sessions
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {searchedTeachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No teachers found matching the selected filters or search query.
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
                Showing {Math.min(searchedTeachers.length, (currentPage - 1) * pageSize + 1)}-{Math.min(searchedTeachers.length, currentPage * pageSize)} of {searchedTeachers.length} teachers
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
                        ? "bg-emerald-650 text-white"
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

      {/* Teacher Spotlight Modal Overlay */}
      {(() => {
        if (!spotlightTeacher) return null;

        const schoolRecord = schools.find(s => String(s.id) === String(spotlightTeacher.schoolId));
        const teacherSessions = filteredSessions.filter(ls => String(ls.teacherId) === String(spotlightTeacher.id));
        
        const sessionsByDate: Record<string, number> = {};
        teacherSessions.forEach(ls => {
          if (!ls.startTime) return;
          const dateObj = new Date(ls.startTime);
          if (!isNaN(dateObj.getTime())) {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${d}`;
            sessionsByDate[dateStr] = (sessionsByDate[dateStr] || 0) + 1;
          }
        });

        const dates = Object.keys(sessionsByDate).sort();
        const spotlightChartData = dates.length > 0
          ? dates.slice(-14).map(d => {
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
              return {
                date: formattedDate,
                sessions: sessionsByDate[d]
              };
            })
          : [{ date: "No Sessions", sessions: 0 }];

        // Unique classes taught by this teacher
        const teacherClassIds = Array.from(new Set(teacherSessions.map(ls => String(ls.classId))));

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-emerald-655 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                    Teacher Spotlight
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">{spotlightTeacher.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    School: <strong className="text-slate-700">{spotlightTeacher.schoolName}</strong> | Email: <strong className="text-slate-700">{spotlightTeacher.email || "N/A"}</strong> | Phone: <strong className="text-slate-700">{spotlightTeacher.phone || "N/A"}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setSpotlightTeacher(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Sessions</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">{teacherSessions.length} Classes</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Classes Taught</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">{teacherClassIds.length} Grades</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Subjects</span>
                    <span className="text-md font-extrabold text-slate-800 block mt-1.5 truncate" title={spotlightTeacher.subjects}>{spotlightTeacher.subjects}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40 bg-emerald-50/30">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Status</span>
                    <span className="text-xl font-black text-emerald-600 block mt-1">
                      {teacherSessions.length > 0 ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Sessions Activity Area Chart */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> Teaching Activity Trend
                    </h4>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spotlightChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTeacherSessions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            labelStyle={{ fontWeight: "bold", color: "#334155" }}
                            formatter={(value: number) => [value, "Sessions"]}
                          />
                          <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTeacherSessions)" name="Sessions Completed" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Completed Sessions Checklist */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-650" /> Completed Topics Checklist
                    </h4>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[220px] overflow-y-auto space-y-2.5">
                      {teacherSessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-150/40">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{session.topicName || "General Session"}</div>
                            <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                              {session.startTime ? new Date(session.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                            </div>
                          </div>
                          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-bold px-1.5 py-0.5">
                            {session.subjectName || "Subject"}
                          </Badge>
                        </div>
                      ))}
                      {teacherSessions.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-12">No classes recorded by this teacher.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setSpotlightTeacher(null)}
                  className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
