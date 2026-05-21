import React, { useMemo, useState, useEffect } from 'react';
import { getApiBase } from '@/api/client';
import {
  Download, X, GraduationCap, Trophy, Users, BarChart3, Star,
  CheckCircle2, AlertCircle, TrendingUp, Calendar, BookOpen,
  Target, Award, Lightbulb, MessageSquare, PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';

interface SubjectGrade {
  name: string;
  fa1: number | string;
  fa2: number | string;
  fa3: number | string;
  fa4: number | string;
  sa1: number | string;
  sa2: number | string;
  quiz: number;
  grade: string;
}

interface StudentReportCardProps {
  studentId?: string | number;
  studentName?: string;
  className?: string;
  rollNumber?: string;
  schoolName?: string;
  attendance?: number;
  totalPresent?: number;
  totalDays?: number;
  perfIndex?: number;
  classRank?: string;
  academicYear?: string;
  profilePic?: string;
  subjectGrades?: SubjectGrade[];
  aiReportContent?: string;
  teacherFeedback?: string;
  onClose: () => void;
  onDownload: () => void;
}

const StudentReportCard: React.FC<StudentReportCardProps> = ({
  studentId,
  studentName = "N/A",
  className = "N/A",
  rollNumber = "N/A",
  schoolName = "VidhyaPlus Academy",
  attendance = 0,
  totalPresent = 92,
  totalDays = 100,
  perfIndex = 0,
  classRank = "N/A",
  academicYear = "2023-24",
  profilePic,
  subjectGrades,
  aiReportContent = "",
  teacherFeedback = "",
  onClose,
  onDownload
}) => {
  const [data, setData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loading, setLoading] = useState(!!studentId);

  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [reportRes, aiRes] = await Promise.all([
          fetch(`${getApiBase()}/api/reportcard/${studentId}`).then(res => res.json()),
          fetch(`${getApiBase()}/api/reportcard/${studentId}/generate-insights`, { method: 'POST' }).then(res => res.json())
        ]);
        setData(reportRes);
        if (aiRes.success && aiRes.insights) {
          setAiInsights(aiRes.insights);
        }
      } catch (err) {
        console.error("Failed to fetch report card data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);
  // Mock data for graphs if not provided
  const progressData = [
    { name: 'FA1', score: 50 },
    { name: 'FA2', score: 61.2 },
    { name: 'SA1', score: 65.6 },
    { name: 'SA2', score: 85 },
  ];

  const quizPerformanceData = [
    { name: 'Qui1', score: 55 },
    { name: 'Qui2', score: 70 },
    { name: 'Qui3', score: 68 },
    { name: 'Qui4', score: 80 },
    { name: 'SA2', score: 45 },
  ];

  const defaultSubjectGrades: SubjectGrade[] = [
    { name: "English", fa1: 15, fa2: 14, fa3: 15, fa4: 13, sa1: 42, sa2: 45, quiz: 38, grade: "A" },
    { name: "Mathematics", fa1: 12, fa2: 13, fa3: 12, fa4: 14, sa1: 38, sa2: 40, quiz: 35, grade: "B+" },
    { name: "Science", fa1: 15, fa2: 15, fa3: 15, fa4: 15, sa1: 45, sa2: 48, quiz: 45, grade: "A+" },
    { name: "Social Studies", fa1: 14, fa2: 14, fa3: 13, fa4: 14, sa1: 40, sa2: 42, quiz: 40, grade: "A" },
    { name: "Second Language", fa1: 12, fa2: 12, fa3: 13, fa4: 12, sa1: 35, sa2: 38, quiz: 32, grade: "B" },
    { name: "Computer Science", fa1: 15, fa2: 15, fa3: 15, fa4: 15, sa1: 48, sa2: 50, quiz: 48, grade: "A+" },
  ];

  const displayGrades = subjectGrades || defaultSubjectGrades;

  const displayStudentName = data?.studentDetails?.first_name ? `${data.studentDetails.first_name} ${data.studentDetails.last_name || ''}` : studentName;
  const displayClassName = data?.studentDetails?.grade_id ? `Class ${data.studentDetails.grade_id}-${data.studentDetails.section_code}` : className;
  const displayRollNumber = data?.studentDetails?.roll_no || rollNumber;
  const displaySchoolName = data?.studentDetails?.school_name || schoolName;
  const displayAttendance = data?.performanceSummary?.attendance_percentage || attendance;
  const displayPerfIndex = data?.performanceSummary?.performance_index ? parseFloat(data.performanceSummary.performance_index).toFixed(1) : perfIndex;
  const displayClassRank = data?.performanceSummary?.class_rank || classRank;

  // Map backend academic performance to display format if data exists
  const dynamicSubjectGrades = useMemo(() => {
    if (!data?.academicPerformance) return displayGrades;
    const subjectsMap: Record<string, any> = {};
    data.academicPerformance.forEach((ap: any) => {
       const sub = ap.subject_name;
       if (!subjectsMap[sub]) subjectsMap[sub] = { name: sub, fa1: "-", fa2: "-", fa3: "-", fa4: "-", sa1: "-", sa2: "-", quiz: 0, grade: "-" };
       const type = ap.exam_type.toLowerCase();
       if (type in subjectsMap[sub]) {
          subjectsMap[sub][type] = ap.marks_obtained;
       }
    });
    return Object.values(subjectsMap);
  }, [data, displayGrades]);

  const dynamicProgressData = useMemo(() => {
    if (!data?.academicPerformance) return progressData;
    const exams = ['FA1', 'FA2', 'SA1', 'SA2'];
    return exams.map(exam => {
       const marks = data.academicPerformance.filter((ap: any) => ap.exam_type === exam);
       const totalObtained = marks.reduce((sum: number, ap: any) => sum + ap.marks_obtained, 0);
       const totalMax = marks.reduce((sum: number, ap: any) => sum + ap.max_marks, 0);
       const score = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
       return { name: exam, score: parseFloat(score.toFixed(1)) };
    });
  }, [data, progressData]);

  const dynamicQuizPerformanceData = useMemo(() => {
    if (!data?.academicPerformance) return quizPerformanceData;
    const marks = data.academicPerformance.filter((ap: any) => ap.exam_type === 'QUIZ');
    if (marks.length === 0) return quizPerformanceData;
    return marks.map((ap: any) => {
       const score = ap.max_marks > 0 ? (ap.marks_obtained / ap.max_marks) * 100 : 0;
       return { name: ap.subject_name.substring(0, 4), score: parseFloat(score.toFixed(1)) };
    });
  }, [data, quizPerformanceData]);

  const progressDataToUse = data ? dynamicProgressData : progressData;
  const quizPerformanceDataToUse = data ? dynamicQuizPerformanceData : quizPerformanceData;

  const gradesToUse = data ? dynamicSubjectGrades : displayGrades;

  const narrative = useMemo(() => {
    if (aiInsights) {
       return {
         strengths: aiInsights.strengths || [],
         improvement: aiInsights.areasForImprovement || [],
         summary: aiInsights.summary || "",
         suggestions: aiInsights.personalizedSuggestions || [],
         learningPattern: aiInsights.learningPattern || "N/A"
       };
    }
    const strengthsMatch = aiReportContent.match(/(?:Strengths|STRENGTHS):?\s*([^.]+)/i);
    const improvementMatch = aiReportContent.match(/(?:Areas to improve|Opportunities|Improvement|WEAKNESSES):?\s*([^.]+)/i);

    return {
      strengths: strengthsMatch ? strengthsMatch[1].split(',').map((s: string) => s.trim()) : ["Strong grasp of Scientific concepts", "Good English vocabulary"],
      improvement: improvementMatch ? improvementMatch[1].split(',').map((s: string) => s.trim()) : ["Mathematical problem solving", "Class participation"],
      summary: aiReportContent || "Student shows consistent progress across core subjects.",
      suggestions: [],
      learningPattern: "Consistent"
    };
  }, [aiReportContent, aiInsights]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-[#F8FAFC]">
         <div className="w-12 h-12 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-slate-500 font-medium tracking-wide animate-pulse">Gathering student data and generating AI insights...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F8FAFC]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto"
      >
        {/* Actions - Hidden during PDF export */}
        <div className="flex items-center justify-end gap-3 p-6 pb-0" data-html2canvas-ignore>
          <Button
            onClick={onDownload}
            className="bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl px-5 shadow-lg shadow-teal-900/20 gap-2 border-none h-11"
          >
            <Download className="w-4 h-4" /> DOWNLOAD PDF
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="bg-white/80 hover:bg-white border-slate-200 rounded-xl h-11 w-11"
          >
            <X className="w-5 h-5 text-slate-600" />
          </Button>
        </div>

        {/* Main Report Content */}
        <div className="p-8 pt-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6 bg-white -mx-8 px-8 -mt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#0D9488] rounded-2xl flex items-center justify-center shadow-inner">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#0D9488]">VidhyaPlus<span className="text-slate-400 font-light">+</span></h1>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Academic Performance Report Card</h2>
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-semibold px-3">Academic Year: {academicYear}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-2 pr-6 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-md bg-slate-200">
                {profilePic ? (
                  <img src={profilePic} alt={displayStudentName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-300">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight">{displayStudentName}</p>
                <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7] border-none text-[10px] h-5 mt-1 font-bold">Active</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Student Details */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#0D9488]/10 rounded-lg">
                      <Users className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <h3 className="font-bold text-slate-800">Student Details</h3>
                  </div>
                  <AlertCircle className="w-4 h-4 text-slate-300" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: "Name:", value: displayStudentName },
                      { label: "Class & Sec:", value: displayClassName },
                      { label: "Roll Number:", value: displayRollNumber },
                      { label: "School Name:", value: displaySchoolName },
                      { label: "Attendance %:", value: `${displayAttendance}%` },
                      { label: "Class Rank:", value: displayClassRank },
                      { label: "Performance Index:", value: `${displayPerfIndex}/10` },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-medium">{item.label}</span>
                        <span className="text-slate-900 font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-[#0D9488] rounded-2xl text-white shadow-lg shadow-teal-900/20 relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <Trophy className="w-20 h-20" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Overall</p>
                          <p className="font-black text-sm">Performance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Rank</p>
                        <p className="font-black text-sm">{classRank.split('(')[0]}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column: Subject Table */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7">
                  <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden h-full">
                    <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#0D9488]/10 rounded-lg">
                          <BookOpen className="w-4 h-4 text-[#0D9488]" />
                        </div>
                        <h3 className="font-bold text-slate-800">Subject Performance & Grades</h3>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 text-[9px] uppercase tracking-widest text-slate-400 font-black">
                            <th className="px-4 py-4 border-b border-slate-100">Subject</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">FA1</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">FA2</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">FA3</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">FA4</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">SA1</th>
                            <th className="px-2 py-4 border-b border-slate-100 text-center">SA2</th>
                            <th className="px-3 py-4 border-b border-slate-100 text-center">Quiz (50)</th>
                            <th className="px-4 py-4 border-b border-slate-100 text-right">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {gradesToUse.map((grade, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 border-b border-slate-50 font-bold text-slate-700 text-xs">{grade.name}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.fa1}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.fa2}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.fa3}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.fa4}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.sa1}</td>
                              <td className="px-2 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.sa2}</td>
                              <td className="px-3 py-3 border-b border-slate-50 text-center text-slate-600 font-bold text-xs">{grade.quiz}</td>
                              <td className="px-4 py-3 border-b border-slate-50 text-right">
                                <span className={`font-black text-sm ${grade.grade.startsWith('A') ? 'text-green-600' :
                                    grade.grade.startsWith('B') ? 'text-[#0D9488]' :
                                      'text-amber-600'
                                  }`}>{grade.grade}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="p-5 bg-slate-50/30 flex justify-between items-center">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OVERALL PERFORMANCE</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-slate-800">388/500</span>
                              <span className="text-xs font-bold text-slate-500 text-center">Total Marks</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                            <p className="text-xl font-black text-slate-800">77.6%</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Grade</p>
                            <p className="text-xl font-black text-[#0D9488]">B+</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                          <p className="text-xl font-black text-slate-800">5/40</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-6">
                  {/* Performance Analytics */}
                  <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <div className="bg-slate-50/50 p-5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#0D9488]/10 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-[#0D9488]" />
                        </div>
                        <h3 className="font-bold text-slate-800">Performance Analytics</h3>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                          <p className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#0D9488]" /> Progress Line Graph
                          </p>
                          <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={progressDataToUse}>
                                <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                  dy={10}
                                />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#0D9488"
                                  strokeWidth={4}
                                  dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                  label={{ position: 'top', fontSize: 10, fontWeight: 800, fill: '#334155', dy: -10 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="col-span-1">
                          <p className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#0D9488]" /> Attendance Summary
                          </p>
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 -rotate-90">
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#0D9488" strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - attendance / 100)} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-black">{displayAttendance}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-800 leading-tight">92%</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Present/Total</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 -rotate-90">
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#0D9488" strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - 0.92)} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-black">92%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-800 leading-tight">92%</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Present/Total</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1">
                          <p className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-[#0D9488]" /> Quiz Performance Card
                          </p>
                          <div className="h-28 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={quizPerformanceDataToUse}>
                                <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                                  {quizPerformanceDataToUse.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 4 ? '#94A3B8' : '#0D9488'} fillOpacity={0.8} />
                                  ))}
                                </Bar>
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 8, fontWeight: 700, fill: '#94A3B8' }}
                                />
                                <Tooltip />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Behavior & Competency Tracking */}
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#0D9488]/10 rounded-lg">
                      <Award className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <h3 className="font-bold text-slate-800">Behavior & Competency Tracking</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Scholastic & Personal Skills</span>
                </div>
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { label: "Excellent", color: "bg-[#DCFCE7] text-[#166534]" },
                      { label: "Communication", color: "bg-[#F0FDF4] text-[#15803d]" },
                      { label: "Creativity", color: "bg-[#F0FDF9] text-[#0d9488]" },
                      { label: "Leadership", color: "bg-[#F0F9FF] text-[#0369a1]" },
                      { label: "Confidence", color: "bg-[#FFF7ED] text-[#c2410c]" },
                      { label: "Teamwork", color: "bg-[#F0FDF9] text-[#0d9488]" },
                      { label: "Participation", color: "bg-[#FEFCE8] text-[#854d0e]" },
                      { label: "Needs Support", color: "bg-[#FEF2F2] text-[#991b1b]" },
                    ].map((badge, idx) => (
                      <Badge key={idx} className={`${badge.color} border-none rounded-lg px-4 py-1 text-[11px] font-bold shadow-sm`}>
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100 border-dashed">
                    With 1-line AI remarks: "Demonstrates strong interpersonal skills and active engagement in group discussions."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI-Powered Learning Insights */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">AI-Powered Learning Insights</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">STRENGTHS</p>
                    <ul className="text-xs font-bold space-y-2 list-disc list-inside text-white/90">
                      {narrative.strengths.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">AREAS TO IMPROVE</p>
                    <ul className="text-xs font-bold space-y-2 list-disc list-inside text-white/90">
                      {narrative.improvement.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">LEARNING PATTERN</p>
                    <p className="text-sm font-bold text-white/90 mb-2">{narrative.learningPattern}</p>
                    <div className="h-4 w-full flex items-center">
                      <svg className="w-full h-8 overflow-visible">
                        <path d="M0 20 Q 20 5, 40 15 T 80 10 T 120 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">ATTENTION NEEDED</p>
                    <ul className="text-xs font-bold space-y-2 list-disc list-inside text-white/90">
                      {narrative.suggestions.length > 0 ? (
                        narrative.suggestions.map((item: string, i: number) => <li key={i}>{item}</li>)
                      ) : (
                        <li>Continue with current study plan</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/10 backdrop-blur-md p-5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">AI SUMMARY</p>
                    <p className="text-sm font-medium leading-relaxed opacity-90">{narrative.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden h-full flex flex-col">
                <div className="p-6 flex flex-col flex-1 gap-6">
                  <div className="flex-1 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <PenTool className="w-4 h-4 text-[#0D9488]" />
                      <h4 className="font-black text-sm text-[#0D9488] uppercase tracking-wider">Teacher Feedback</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">{teacherFeedback}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-4 uppercase">Signed</p>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto">
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                    <div className="text-center">
                      <div className="h-px bg-slate-200 mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Teacher Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="h-px bg-slate-200 mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Principal Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="h-px bg-slate-200 mb-2" />
                      <p className="text-[9px] font-black text-slate-400 uppercase">Parent Signature</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-4 px-8 text-center border-t border-slate-200" data-html2canvas-ignore>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            VidhyaPlus+ Education Systems • AI-Generated Performance Report • Confidential
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentReportCard;
