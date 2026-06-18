import React, { useState, useMemo } from "react";
import { 
  School, Users, GraduationCap, Award, 
  MapPin, BarChart3, Activity, CheckCircle2, BookOpen,
  Search, X, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface SchoolsOverviewProps {
  data: {
    schools: any[];
    students: any[];
    classes: any[];
    teachers: any[];
    liveSessions: any[];
    chapters?: any[];
    topics?: any[];
  };
}

export default function SchoolsOverview({ data }: SchoolsOverviewProps) {
  const safeSchools = data?.schools || [];
  const safeStudents = data?.students || [];
  const safeClasses = data?.classes || [];
  const safeTeachers = data?.teachers || [];
  const safeSessions = data?.liveSessions || [];
  const safeChapters = data?.chapters || [];
  const safeTopics = data?.topics || [];

  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedMandal, setSelectedMandal] = useState<string>("all");
  const [schoolSearchText, setSchoolSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [spotlightSchool, setSpotlightSchool] = useState<any>(null);
  const pageSize = 5;

  // Get distinct districts & mandals
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    safeSchools.forEach(s => {
      if (s.district) districts.add(s.district);
    });
    return Array.from(districts).sort();
  }, [safeSchools]);

  const availableMandals = useMemo(() => {
    const mandals = new Set<string>();
    safeSchools.forEach(s => {
      const matchDistrict = selectedDistrict === "all" || s.district === selectedDistrict;
      if (matchDistrict && s.mandal) {
        mandals.add(s.mandal);
      }
    });
    return Array.from(mandals).sort();
  }, [safeSchools, selectedDistrict]);

  // Filtered Schools list
  const filteredSchools = useMemo(() => {
    return safeSchools.filter(s => {
      const matchDistrict = selectedDistrict === "all" || s.district === selectedDistrict;
      const matchMandal = selectedMandal === "all" || s.mandal === selectedMandal;
      return matchDistrict && matchMandal;
    });
  }, [safeSchools, selectedDistrict, selectedMandal]);

  const filteredSchoolIds = useMemo(() => new Set(filteredSchools.map(s => String(s.id))), [filteredSchools]);

  // 1. Rankings & Curriculum Completion per School
  const schoolRankings = useMemo(() => {
    const rankings = filteredSchools.map(school => {
      const schoolIdStr = String(school.id);
      
      // Classes belonging to this school
      const schoolClasses = safeClasses.filter(c => String(c.schoolId) === schoolIdStr);
      const activeClassesCount = schoolClasses.length;

      // Grade levels taught in this school
      const schoolGrades = Array.from(new Set(schoolClasses.map(c => c.grade)));
      
      // Chapters for those grade levels
      const schoolChapters = safeChapters.filter(ch => schoolGrades.includes(ch.grade));
      const schoolChapterIds = new Set(schoolChapters.map(ch => ch.id));

      // Topics for those chapters
      const schoolTopics = safeTopics.filter(t => schoolChapterIds.has(t.chapterId));
      const totalTopicsCount = schoolTopics.length;

      // Completed topics for this school (at least 1 session ended)
      const completedTopicsCount = schoolTopics.filter(t => {
        return safeSessions.some(ls => {
          if (String(ls.topicId) !== String(t.id)) return false;
          if (ls.status !== "ended" && ls.status !== "completed" && ls.status !== "done") return false;
          const sessionClass = safeClasses.find(c => String(c.id) === String(ls.classId));
          return sessionClass && String(sessionClass.schoolId) === schoolIdStr;
        });
      }).length;

      const syllabusProgress = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;
      const sessions = school.sessionsCompleted || 0;
      const principalName = school.principalName || "Not Assigned";

      return {
        id: school.id,
        name: school.name,
        principalName,
        studentsCount: school.students,
        teachersCount: school.teachers,
        sessionsCount: sessions,
        syllabusProgress,
        activeClassesCount,
        activeStatus: school.activeStatus
      };
    });

    // Find max sessions among the list to compute a ratio (max ratio score = 40)
    const maxSessions = Math.max(...rankings.map(r => r.sessionsCount), 1);

    // Compute composite score:
    // Score = (SyllabusProgress * 0.6) + (Sessions / MaxSessions * 40)
    const scoredRankings = rankings.map(r => {
      const progressContribution = r.syllabusProgress * 0.6;
      const sessionsContribution = (r.sessionsCount / maxSessions) * 40;
      const compositeScore = Math.round(progressContribution + sessionsContribution);

      return {
        ...r,
        compositeScore
      };
    });

    // Sort by composite score desc
    return scoredRankings.sort((a, b) => b.compositeScore - a.compositeScore);
  }, [filteredSchools, safeClasses, safeChapters, safeTopics, safeSessions]);
  
  // Search & Pagination Logic
  const searchedSchools = useMemo(() => {
    return schoolRankings.filter(s => 
      s.name.toLowerCase().includes(schoolSearchText.toLowerCase()) ||
      s.principalName.toLowerCase().includes(schoolSearchText.toLowerCase())
    );
  }, [schoolRankings, schoolSearchText]);

  const totalPages = Math.max(1, Math.ceil(searchedSchools.length / pageSize));
  
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedSchools.slice(start, start + pageSize);
  }, [searchedSchools, currentPage]);

  // 2. KPI Calculations
  const metrics = useMemo(() => {
    const totalSchools = filteredSchools.length;
    const activeSchools = filteredSchools.filter(s => s.activeStatus).length;
    
    let totalSessions = 0;
    filteredSchools.forEach(s => {
      totalSessions += (s.sessionsCompleted || 0);
    });

    // Avg syllabus progress across all listed schools
    const avgSyllabusProgress = schoolRankings.length > 0
      ? Math.round(schoolRankings.reduce((sum, r) => sum + r.syllabusProgress, 0) / schoolRankings.length)
      : 0;

    return {
      totalSchools,
      activeSchools,
      activePct: totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 0,
      totalSessions,
      avgSyllabusProgress
    };
  }, [filteredSchools, schoolRankings]);

  // 3. Chart Data: Curriculum Coverage % by School
  const coverageChartData = useMemo(() => {
    return schoolRankings
      .map(r => ({
        name: r.name.replace("School", "Sch.").replace("High School", "H.S."),
        coverage: r.syllabusProgress
      }))
      .slice(0, 8); // Top 8 schools
  }, [schoolRankings]);

  // 4. Chart Data: Sessions Completed by School
  const sessionChartData = useMemo(() => {
    return schoolRankings
      .map(s => ({
        name: s.name.replace("School", "Sch.").replace("High School", "H.S."),
        sessions: s.sessionsCount
      }))
      .slice(0, 8); // Top 8 schools
  }, [schoolRankings]);

  // 5. Chart Data: Schools by Mandal Distribution
  const mandalChartData = useMemo(() => {
    const mandalCounts: Record<string, number> = {};
    filteredSchools.forEach(s => {
      if (s.mandal) {
        mandalCounts[s.mandal] = (mandalCounts[s.mandal] || 0) + 1;
      }
    });

    return Object.entries(mandalCounts)
      .map(([mandal, count]) => ({ mandal, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSchools]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" /> Schools Analytics Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Analyze district performance, session workloads, and ranking across all schools.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Search School
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={schoolSearchText}
                onChange={(e) => { setSchoolSearchText(e.target.value); setCurrentPage(1); }}
                placeholder="Search name or principal..."
                className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all text-slate-700 shadow-xs"
              />
              {schoolSearchText && (
                <button
                  onClick={() => { setSchoolSearchText(""); setCurrentPage(1); }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="w-44">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              District
            </label>
            <Select value={selectedDistrict} onValueChange={(val) => { setSelectedDistrict(val); setSelectedMandal("all"); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-indigo-500">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {availableDistricts.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Mandal
            </label>
            <Select value={selectedMandal} onValueChange={(val) => { setSelectedMandal(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-100 rounded-xl shadow-sm focus:ring-indigo-500">
                <SelectValue placeholder="All Mandals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mandals</SelectItem>
                {availableMandals.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(schoolSearchText || selectedDistrict !== "all" || selectedMandal !== "all") && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-transparent select-none uppercase tracking-widest ml-1 mb-1.5 block">
                Reset
              </label>
              <button
                onClick={() => {
                  setSchoolSearchText("");
                  setSelectedDistrict("all");
                  setSelectedMandal("all");
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
        {/* Total Schools Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <School className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Schools</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalSchools}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Onboarded in selected area</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Schools Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Schools</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {metrics.activeSchools} <span className="text-sm font-bold text-emerald-500">({metrics.activePct}%)</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Running live classes</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Sessions Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-violet-50 text-violet-600 rounded-2xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">District Teaching Vol</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalSessions}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Live classes conducted</p>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Progress Card */}
        <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Syllabus Progress</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.avgSyllabusProgress}%</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">District syllabus coverage</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Syllabus Coverage Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 col-span-1">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Syllabus Coverage Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[260px] w-full">
              {coverageChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-xs font-semibold">No syllabus coverage details</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverageChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: number) => [`${value}%`, "Syllabus Progress"]}
                    />
                    <Bar dataKey="coverage" radius={[4, 4, 0, 0]} name="Coverage">
                      {coverageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#818cf8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions by School Chart */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 col-span-1">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" /> Sessions by School
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[260px] w-full">
              {sessionChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-xs font-semibold">No session logs</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]} name="Sessions">
                      {sessionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#a78bfa"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* School Distribution by Mandal */}
        <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 col-span-1">
          <CardHeader className="border-b border-slate-50 py-5 px-6">
            <CardTitle className="text-slate-800 text-base font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Schools by Mandal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[260px] w-full">
              {mandalChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-xs font-semibold">No schools registered</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mandalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mandal" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Schools">
                      {mandalChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard: School Rankings */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-800">District School Leaderboard & Ranks</CardTitle>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200 text-[10px] font-bold">
                  {searchedSchools.length} of {safeSchools.length} Schools
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Ranked by dynamic syllabus coverage and live teaching sessions conducted</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Rank & School</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Active Classes</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Teachers</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Students</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Syllabus Progress</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Conducted Sessions</th>
                  <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-center">Composite Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSchools.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => setSpotlightSchool(s)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      title="Click to view detailed spotlight analytics"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shadow-sm">
                            #{globalIdx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 animate-pulse-once">
                              {s.name}
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 font-extrabold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                View Spotlight
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {s.principalName}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                        {s.activeClassesCount}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                        {s.teachersCount}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                        {s.studentsCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm font-bold px-3 py-1">
                          {s.syllabusProgress}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-violet-50 text-violet-600 border border-violet-200 shadow-sm font-bold px-3 py-1">
                          {s.sessionsCount} Sessions
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div 
                              className="bg-indigo-600 h-full rounded-full" 
                              style={{ width: `${s.compositeScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-slate-800">{s.compositeScore} / 100</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {searchedSchools.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No schools found matching the selected filters or search query.
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
                Showing {Math.min(searchedSchools.length, (currentPage - 1) * pageSize + 1)}-{Math.min(searchedSchools.length, currentPage * pageSize)} of {searchedSchools.length} schools
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

      {/* School Spotlight Modal Overlay */}
      {(() => {
        if (!spotlightSchool) return null;

        const schoolIdStr = String(spotlightSchool.id);
        const schoolRecord = safeSchools.find(s => String(s.id) === schoolIdStr) || spotlightSchool;
        
        // Classes and Teachers belonging to this school
        const schoolClasses = safeClasses.filter(c => String(c.schoolId) === schoolIdStr);
        const schoolTeachers = safeTeachers.filter(t => String(t.schoolId) === schoolIdStr);
        
        // Grade coverages taught in this school
        const schoolGrades = Array.from(new Set(schoolClasses.map(c => c.grade || c.grade_id))).filter(Boolean);
        const gradeCoverages = schoolGrades.map(grade => {
          const gradeChapters = safeChapters.filter(ch => String(ch.grade) === String(grade) || String(ch.grade_id) === String(grade));
          const chapterIds = new Set(gradeChapters.map(ch => ch.id));
          const gradeTopics = safeTopics.filter(t => chapterIds.has(t.chapterId));
          
          const completedCount = gradeTopics.filter(t => {
            return safeSessions.some(ls => {
              if (String(ls.topicId) !== String(t.id)) return false;
              if (ls.status !== "ended" && ls.status !== "completed" && ls.status !== "done") return false;
              const sessionClass = safeClasses.find(c => String(c.id) === String(ls.classId));
              return sessionClass && String(sessionClass.schoolId) === schoolIdStr;
            });
          }).length;

          const progress = gradeTopics.length > 0 ? Math.round((completedCount / gradeTopics.length) * 100) : 0;
          return { grade, progress, total: gradeTopics.length, completed: completedCount };
        }).sort((a, b) => Number(a.grade) - Number(b.grade));

        // Recent 5 live class sessions
        const schoolClassIds = new Set(schoolClasses.map(c => String(c.id)));
        const schoolSessions = safeSessions
          .filter(ls => schoolClassIds.has(String(ls.classId)))
          .sort((a, b) => new Date(b.startTime || b.created_at).getTime() - new Date(a.startTime || a.created_at).getTime())
          .slice(0, 5);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
                    School Spotlight
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">{spotlightSchool.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Principal: <strong className="text-slate-700">{spotlightSchool.principalName}</strong> | District: <strong className="text-slate-700">{schoolRecord.district || "N/A"}</strong> | Mandal: <strong className="text-slate-700">{schoolRecord.mandal || "N/A"}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setSpotlightSchool(null)}
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Classes</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">{schoolClasses.length} Classes</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Teachers</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">{schoolTeachers.length} Instructors</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">{spotlightSchool.studentsCount} Students</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40 bg-indigo-50/30">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Avg Syllabus Progress</span>
                    <span className="text-xl font-black text-indigo-600 block mt-1">{spotlightSchool.syllabusProgress}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Grade-wise Coverage Progress */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" /> Syllabus Coverage by Class
                    </h4>
                    <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[260px] overflow-y-auto">
                      {gradeCoverages.map(gc => (
                        <div key={gc.grade} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                            <span>Class {gc.grade}</span>
                            <span className="text-indigo-650">{gc.progress}% ({gc.completed}/{gc.total} topics)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-650 h-full rounded-full transition-all duration-300"
                              style={{ width: `${gc.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {gradeCoverages.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-12">No classes registered for syllabus tracking.</p>
                      )}
                    </div>
                  </div>

                  {/* Teachers Assigned */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Onboarded Instructors
                    </h4>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[260px] overflow-y-auto space-y-2.5">
                      {schoolTeachers.map(teacher => (
                        <div key={teacher.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-150/50 hover:shadow-xs transition-shadow">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{teacher.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{teacher.phone || "No phone contact"}</div>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 text-[9px] uppercase tracking-wide">
                            {teacher.subjects && Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : "General"}
                          </Badge>
                        </div>
                      ))}
                      {schoolTeachers.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-12">No teachers assigned to this school.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Recent Session History */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-600" /> Recent Live Sessions
                  </h4>
                  <div className="border border-slate-150/60 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-150/40">
                        <tr>
                          <th className="px-5 py-3.5 font-bold text-slate-500">Subject</th>
                          <th className="px-5 py-3.5 font-bold text-slate-500">Topic Title</th>
                          <th className="px-5 py-3.5 font-bold text-slate-500">Start Time</th>
                          <th className="px-5 py-3.5 font-bold text-slate-500 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schoolSessions.map(session => (
                          <tr key={session.id} className="hover:bg-slate-50/30">
                            <td className="px-5 py-3.5 font-bold text-slate-700">{session.subjectName || "General"}</td>
                            <td className="px-5 py-3.5 text-slate-600 font-medium">{session.topicName || "N/A"}</td>
                            <td className="px-5 py-3.5 text-slate-500 font-medium">
                              {session.startTime ? new Date(session.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                session.status === "ended" || session.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}>
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {schoolSessions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-medium">
                              No recent teaching activity logged for this school.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setSpotlightSchool(null)}
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
