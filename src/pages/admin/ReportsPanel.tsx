import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Calendar, Download, FileSpreadsheet, TrendingUp, Users, Activity,
  ClipboardList, Award, QrCode, AlertTriangle, CheckCircle2, ArrowUpRight,
  Sparkles, Target, Lightbulb, FileText, School, Search,
  GraduationCap, BookOpen, UserX, TrendingDown, ShieldAlert, ChevronRight,
  Brain, Eye, BarChart3, Loader2, Zap, Database, ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { generateReportSummary, getReportAnalytics } from "@/api/client";

type SchoolMetric = { name: string; value: number; color: string };
type AlertItem = { title: string; description: string; severity: "high" | "med" | "low" };
type ActionItem = { title: string; description: string };

const fallbackSchoolOptions = ["All Schools"];
const fallbackClassOptions = ["All Classes", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

const asRecord = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {} as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
};

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
};

const asDate = (value: unknown) => {
  const parsed = new Date(asString(value, ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: Date | null) => {
  if (!value) {
    return "—";
  }
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatPercent = (value: number) => `${Math.round(value)}%`;

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const pickTop = (items: SchoolMetric[], limit = 3) => items.slice().sort((a, b) => b.value - a.value).slice(0, limit);

const getSchoolName = (record: Record<string, unknown>, fallback: string) =>
  asString(record.name, asString(record.schoolName, asString(record.title, fallback)));

const getClassName = (record: Record<string, unknown>, fallback: string) =>
  asString(record.className, asString(record.class, asString(record.grade, fallback)));

const formatInputDate = (value: Date) => value.toISOString().slice(0, 10);

const parseInputDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getPresetDateRange = (reportType: string): [Date, Date] => {
  const start = new Date();
  if (reportType === "Daily") {
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  } else if (reportType === "Weekly") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  } else if (reportType === "Monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  } else {
    // All Time — span from 2024 to far future
    const allStart = new Date("2024-01-01T00:00:00");
    const allEnd = new Date("2099-12-31T23:59:59");
    return [allStart, allEnd];
  }
};

const buildDayBuckets = (start: Date, end: Date) => {
  const buckets: Array<{ key: string; label: string; date: Date }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    buckets.push({
      key: formatInputDate(cursor),
      label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: new Date(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
};

const buildMonthBuckets = (start: Date, end: Date) => {
  const buckets: Array<{ key: string; label: string; date: Date }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const label = cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    buckets.push({ key, label, date: new Date(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
};

const generateAIAnalysis = (
  engagementRate: number,
  averageScore: number,
  attendanceRate: number,
  quizzesAttempted: number,
  totalStudents: number,
  activeStudents: number,
  weakestTopics: Array<{ topic: string; avg: number }>,
  strongestTopics: Array<{ topic: string; avg: number }>,
  activityData: Array<{ day: string; students: number; quizzes: number }>,
  reportType: string,
): { analysis: string[]; projectStatus: string; healthScore: number } => {
  const analysis: string[] = [];
  
  // Engagement Analysis
  if (engagementRate >= 80) {
    analysis.push(`✨ Exceptional engagement momentum: ${Math.round(engagementRate)}% of students are actively participating, indicating strong platform adoption and teacher effectiveness.`);
  } else if (engagementRate >= 60) {
    analysis.push(`📈 Solid engagement levels at ${Math.round(engagementRate)}%, showing steady progress. Focus on converting inactive users to boost overall participation.`);
  } else if (engagementRate >= 40) {
    analysis.push(`⚠️ Engagement at ${Math.round(engagementRate)}% requires attention. Consider implementing incentive programs and personalized outreach to re-engage users.`);
  } else {
    analysis.push(`🚨 Critical engagement challenge: Only ${Math.round(engagementRate)}% of students are engaged. Immediate intervention needed through school partnerships and teacher training.`);
  }

  // Learning Outcome Analysis
  if (averageScore >= 85) {
    analysis.push(`🎯 Outstanding learning outcomes with an average score of ${Math.round(averageScore)}%. Students have mastered the content; consider introducing advanced/challenge content.`);
  } else if (averageScore >= 70) {
    analysis.push(`✅ Satisfactory learning progress at ${Math.round(averageScore)}% average. ${weakestTopics.length > 0 ? `Focus remediation efforts on ${weakestTopics[0].topic}.` : ""}`);
  } else if (averageScore >= 50) {
    analysis.push(`📊 Students are struggling with average scores at ${Math.round(averageScore)}%. Review curriculum difficulty, teaching methods, and provide additional support resources.`);
  } else {
    analysis.push(`🆘 Critical learning challenge: Average scores below 50%. Implement immediate curriculum review and one-on-one student support interventions.`);
  }

  // Attendance Analysis
  if (attendanceRate >= 85) {
    analysis.push(`🎓 Outstanding QR attendance tracking at ${Math.round(attendanceRate)}%. Demonstrates excellent compliance and classroom participation monitoring.`);
  } else if (attendanceRate >= 60) {
    analysis.push(`✓ Acceptable attendance rate of ${Math.round(attendanceRate)}%. Some students may be evading QR attendance; consider classroom management review.`);
  } else {
    analysis.push(`⚠️ Low QR attendance at ${Math.round(attendanceRate)}%. Investigate technical issues, student buy-in, and ensure proper QR setup in all classrooms.`);
  }

  // Trend Analysis
  if (activityData.length > 1) {
    const recentAvg = activityData.slice(-3).reduce((s, d) => s + d.students, 0) / Math.min(3, activityData.length);
    const earlierAvg = activityData.slice(0, 3).reduce((s, d) => s + d.students, 0) / Math.min(3, activityData.length);
    const trend = earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (trend > 15) {
      analysis.push(`📊 Strong upward trend: Activity increasing by ${Math.round(trend)}% over the reporting period. Momentum is building—capitalize on this engagement surge.`);
    } else if (trend > 0) {
      analysis.push(`📉 Modest positive trend at +${Math.round(trend)}%. Engagement is growing gradually; maintain current initiatives and watch for acceleration.`);
    } else if (trend > -10) {
      analysis.push(`🔄 Relatively stable engagement with slight decline. Monitor closely and prepare contingency plans if trend worsens.`);
    } else {
      analysis.push(`📉📉 Concerning downward trend: Activity declining by ${Math.round(Math.abs(trend))}%. Investigate root causes and re-energize user engagement immediately.`);
    }
  }

  // Quiz Performance Deep Dive
  if (quizzesAttempted > 0) {
    const quizEngagementRate = (quizzesAttempted / (Math.max(1, totalStudents) * 10)) * 100;
    if (quizEngagementRate > 80) {
      analysis.push(`🎯 Exceptional quiz completion rate: ${Math.round(quizEngagementRate)}% of expected quizzes have been attempted. Students are highly focused on assessment.`);
    } else if (quizEngagementRate > 50) {
      analysis.push(`✅ Good quiz participation: ${Math.round(quizEngagementRate)}% of expected attempts. Some students need encouragement to take more quizzes.`);
    } else {
      analysis.push(`⚠️ Low quiz participation: Only ${Math.round(quizEngagementRate)}% engagement. Consider making quizzes more relevant or incentivizing participation.`);
    }
  }

  // Calculate health score (0-100)
  const engagementScore = Math.min(100, (engagementRate / 80) * 100);
  const academicScore = Math.min(100, (averageScore / 85) * 100);
  const attendanceScore = Math.min(100, (attendanceRate / 85) * 100);
  const healthScore = Math.round((engagementScore + academicScore + attendanceScore) / 3);

  let projectStatus = "";
  if (healthScore >= 85) {
    projectStatus = "🌟 THRIVING - Project is exceeding all success metrics";
  } else if (healthScore >= 70) {
    projectStatus = "✅ ON TRACK - Project is progressing well toward goals";
  } else if (healthScore >= 50) {
    projectStatus = "⚠️ AT RISK - Project needs attention to meet objectives";
  } else {
    projectStatus = "🚨 CRITICAL - Immediate action required to prevent setback";
  }

  return { analysis, projectStatus, healthScore };
};

export function ReportsPanel() {
  const { data, loading: isLoading, error, isFromApi } = useAppData();
  const isError = !!error;
  const { userName } = useAuth();
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  const source = data ?? { 
    schools: [], 
    students: [], 
    teachers: [], 
    subjects: [],
    chapters: [],
    liveSessions: [], 
    studentQuizResults: [],
    activityLogs: [],
    classes: [],
    studentAttendance: []
  };

  // Temporary state for selections (before clicking search)
  const [tempReportType, setTempReportType] = useState("Daily");
  const presetRange = getPresetDateRange("Daily");
  const [tempCustomStartDate, setTempCustomStartDate] = useState(formatInputDate(presetRange[0]));
  const [tempCustomEndDate, setTempCustomEndDate] = useState(formatInputDate(presetRange[1]));
  const [tempSchool, setTempSchool] = useState("All Schools");
  const [tempKlass, setTempKlass] = useState("All Classes");
  const [tempSubject, setTempSubject] = useState("All Subjects");

  // Active filters (applied to the report data after clicking search)
  const [reportType, setReportType] = useState("Daily");
  const [customStartDate, setCustomStartDate] = useState(formatInputDate(presetRange[0]));
  const [customEndDate, setCustomEndDate] = useState(formatInputDate(presetRange[1]));
  const [school, setSchool] = useState("All Schools");
  const [klass, setKlass] = useState("All Classes");
  const [subject, setSubject] = useState("All Subjects");

  // Extract subject options dynamically from the source data
  const subjectOptions = useMemo(() => {
    const rawSubjects = Array.isArray(source.subjects) ? source.subjects : [];
    const names = rawSubjects.map((s, index) => {
      const row = asRecord(s);
      return asString(row.name, asString(row.subjectName, asString(row.subject_name, asString(row.title, `Subject ${index + 1}`))));
    });
    return ["All Subjects", ...Array.from(new Set(names))].filter(Boolean);
  }, [source.subjects]);

  const schoolOptions = useMemo(() => {
    const rawSchools = Array.isArray(source.schools) ? source.schools : [];
    const names = rawSchools.map((s, index) => {
      const row = asRecord(s);
      return asString(row.name, asString(row.schoolName, asString(row.school_name, asString(row.title, `School ${index + 1}`))));
    });
    return ["All Schools", ...Array.from(new Set(names))].filter(Boolean);
  }, [source.schools]);

  const classOptions = useMemo(() => {
    const rawSchools = Array.isArray(source.schools) ? source.schools : [];
    const rawClasses = Array.isArray(source.classes) ? source.classes : [];
    
    return [
      "All Classes",
      ...Array.from(new Set(
        rawClasses
          .filter(cl => {
            if (tempSchool === "All Schools") return true;
            const schoolObj = rawSchools.find(s => {
              const sRow = asRecord(s);
              const sName = asString(sRow.name, asString(sRow.schoolName, asString(sRow.school_name, "")));
              return sName.trim().toLowerCase() === tempSchool.trim().toLowerCase();
            });
            const clRow = asRecord(cl);
            const clSchoolId = asString(clRow.schoolId, asString(clRow.school_id, ""));
            return schoolObj ? String(clSchoolId) === String(asRecord(schoolObj as Record<string,unknown>).id) : true;
          })
          .map(cl => {
            const clRow = asRecord(cl);
            // Prefer the full name field e.g. "Class 10-A"
            return asString(clRow.name, `${asString(clRow.grade, "")} - ${asString(clRow.section, "")}`);
          })
      )).sort()
    ];
  }, [tempSchool, source]);

  const handleSchoolChange = (val: string) => {
    setTempSchool(val);
    setTempKlass("All Classes");
  };

  const selectedDateRange = useMemo(() => {
    if (reportType === "Custom") {
      const start = parseInputDate(customStartDate);
      const end = parseInputDate(customEndDate);
      if (start && end) {
        return start <= end ? [start, end] as [Date, Date] : [end, start] as [Date, Date];
      }
    }
    return getPresetDateRange(reportType);
  }, [reportType, customStartDate, customEndDate]);

  const reportModel = useMemo(() => {
    const rawSchools = Array.isArray(source.schools) ? source.schools : [];
    const rawStudents = Array.isArray(source.students) ? source.students : [];
    const rawTeachers = Array.isArray(source.teachers) ? source.teachers : [];
    const rawChapters = Array.isArray(source.chapters) ? source.chapters : [];
    const rawSubjects = Array.isArray(source.subjects) ? source.subjects : [];
    const rawQuizzes = Array.isArray(source.liveSessions) ? source.liveSessions : [];
    const rawQuizResults = Array.isArray(source.studentQuizResults) ? source.studentQuizResults : [];
    const rawActivityLogs = Array.isArray(source.activityLogs) ? source.activityLogs : [];
    const rawClasses = Array.isArray(source.classes) ? source.classes : [];
    const rawStudentAttendance = Array.isArray(source.studentAttendance) ? source.studentAttendance : [];

    // NORMALIZE DATA SETS TO ROBUST CAMELCASE
    const normalizedSchools = rawSchools.map((item, index) => {
      const row = asRecord(item);
      return {
        id: asString(row.id, asString(row._id, "")),
        name: asString(row.name, asString(row.schoolName, asString(row.school_name, asString(row.title, `School ${index + 1}`)))),
        sessionsCompleted: asNumber(row.sessionsCompleted, asNumber(row.sessions_completed, 0)),
      };
    });

    const normalizedClasses = rawClasses.map((item, index) => {
      const row = asRecord(item);
      const clGrade = asString(row.grade, asString(row.grade_id, ""));
      const clSection = asString(row.section, asString(row.section_code, ""));
      const clName = asString(row.name, asString(row.className, asString(row.class_name, `Class ${index + 1}`)));
      let finalGrade = clGrade;
      let finalSection = clSection;
      if (!clGrade || !clSection) {
        const match = clName.match(/Class\s+(\d+)\s*-\s*([A-Za-z])/i);
        if (match) {
          finalGrade = match[1];
          finalSection = match[2].toUpperCase();
        }
      }
      return {
        id: asString(row.id, asString(row._id, "")),
        schoolId: asString(row.schoolId, asString(row.school_id, "")),
        name: clName,
        section: finalSection,
        grade: finalGrade,
        studentCount: asNumber(row.studentCount, asNumber(row.student_count, 0)),
      };
    });
    // Build a classId → schoolId reverse map for session matching
    const classIdToSchoolId = new Map<string, string>(normalizedClasses.map(cl => [cl.id, cl.schoolId]));

    const normalizedStudents = rawStudents.map((item, index) => {
      const row = asRecord(item);
      return {
        id: asString(row.id, asString(row._id, "")),
        name: asString(row.name, (row.first_name ? `${row.first_name} ${row.last_name || ""}`.trim() : `Student ${index + 1}`)),
        schoolId: asString(row.schoolId, asString(row.school_id, "")),
        classId: asString(row.classId, asString(row.class_id, asString(row.section_id, ""))),
        score: asNumber(row.score, 0),
      };
    });

    const normalizedQuizResults = rawQuizResults.map((item) => {
      const row = asRecord(item);
      return {
        studentId: asString(row.studentId, asString(row.student_id, "")),
        chapterId: asString(row.chapterId, asString(row.chapter_id, asString(row.quiz_id, ""))),
        score: asNumber(row.score, 0),
        total: asNumber(row.total, 0),
        date: row.date || row.taken_on || row.assessed_on || row.created_at,
      };
    });

    const subjectIdToName = new Map<string, string>();
    rawSubjects.forEach((item, index) => {
      const row = asRecord(item);
      const subjectId = asString(row.id, asString(row._id, ""));
      const subjectName = asString(row.name, asString(row.title, `Subject ${index + 1}`));
      if (subjectId) {
        subjectIdToName.set(subjectId, subjectName);
      }
    });

    const normalizedQuizzes = rawQuizzes.map((item, index) => {
      const row = asRecord(item);
      const subjectId = asString(row.subjectId, asString(row.subject_id, ""));
      const resolvedSubjectName = subjectIdToName.get(subjectId) || asString(row.subjectName, asString(row.subject_name, asString(row.subject, "")));
      return {
        id: asString(row.id, asString(row._id, "")),
        schoolId: asString(row.schoolId, asString(row.school_id, "")),
        classId: asString(row.classId, asString(row.class_id, asString(row.section_id, ""))),
        subjectId,
        subjectName: resolvedSubjectName,
        chapterId: asString(row.chapterId, asString(row.chapter_id, "")),
        topicId: asString(row.topicId, asString(row.topic_id, "")),
        topicName: asString(row.topicName, asString(row.topic_name, asString(row.title, `Topic ${index + 1}`))),
        createdAt: row.createdAt || row.created_at || row.startTime || row.start_time || row.session_date,
        avgScore: asNumber(row.avgScore, asNumber(row.avg_score, 0)),
        teacherId: asString(row.teacherId, asString(row.teacher_id, "")),
        teacherName: asString(row.teacherName, asString(row.teacher_name, "")),
        attendanceMarked: row.attendanceMarked === true || row.attendance_marked === true,
      };
    });

    const normalizedAttendance = rawStudentAttendance.map((item) => {
      const row = asRecord(item);
      const studentId = asString(row.studentId, asString(row.student_id, ""));
      const present = asNumber(row.present, 0);
      const total = asNumber(row.total, 1);
      const percentage = asNumber(row.percentage, total > 0 ? (present / total) * 100 : 0);
      return { studentId, present, total, percentage };
    });

    const [dateStart, dateEnd] = selectedDateRange;
    // Use monthly buckets for wide date ranges (> 35 days), daily for narrower windows
    const daySpan = Math.round((dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
    const useMonthlyBuckets = daySpan > 35;
    const timelineBuckets = useMonthlyBuckets
      ? buildMonthBuckets(dateStart, dateEnd)
      : buildDayBuckets(dateStart, dateEnd);
    const bucketKeyFn = useMonthlyBuckets
      ? (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : (d: Date) => formatInputDate(d);



    const chapterIdToSubjectId = new Map<string, string>();
    const chapterIdToTopicName = new Map<string, string>();
    rawChapters.forEach((item, index) => {
      const row = asRecord(item);
      const chapterId = asString(row.id, asString(row._id, ""));
      const subjectId = asString(row.subjectId, asString(row.subject_id, ""));
      const topicName = asString(row.name, asString(row.title, `Topic ${index + 1}`));
      if (chapterId) {
        chapterIdToSubjectId.set(chapterId, subjectId);
        chapterIdToTopicName.set(chapterId, topicName);
      }
    });

    const resultRecordsInRange = normalizedQuizResults.filter((row) => {
      const dateValue = asDate(row.date);
      return dateValue ? dateValue >= dateStart && dateValue <= dateEnd : false;
    });

    const sessionsInRange = normalizedQuizzes.filter((row) => {
      const createdAt = asDate(row.createdAt);
      return createdAt ? createdAt >= dateStart && createdAt <= dateEnd : false;
    });

    const selectedStudents = normalizedStudents.filter((student) => {
      const schoolObj = normalizedSchools.find(sc => sc.id === student.schoolId);
      const schoolName = schoolObj ? schoolObj.name : "";
      const classItem = normalizedClasses.find(cl => cl.id === student.classId);
      // Match using the class name field directly (e.g. "Class 10-A")
      const className = classItem ? classItem.name : "";
      
      const matchesSchool = school === "All Schools" || schoolName.trim().toLowerCase() === school.trim().toLowerCase();
      const matchesClass = klass === "All Classes" || className.trim().toLowerCase() === klass.trim().toLowerCase();
      return matchesSchool && matchesClass;
    });

    const selectedStudentIds = new Set(selectedStudents.map((student) => student.id).filter(Boolean));

    const selectedQuizResults = resultRecordsInRange.filter((row) => {
      const studentId = row.studentId;
      const matchesStudent = selectedStudentIds.size === 0 || !studentId || selectedStudentIds.has(studentId);
      
      let matchesSubject = true;
      if (subject !== "All Subjects") {
        const chapterId = row.chapterId;
        const subjectId = chapterIdToSubjectId.get(chapterId) ?? "";
        const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? "") : "";
        matchesSubject = subjectName.toLowerCase() === subject.toLowerCase();
      }
      return matchesStudent && matchesSubject;
    });

    const selectedQuizzes = sessionsInRange.filter((row) => {
      // Sessions may not have schoolId — resolve via classId → schoolId map
      const resolvedSchoolId = row.schoolId || classIdToSchoolId.get(row.classId) || "";
      const schoolObj = normalizedSchools.find(sc => sc.id === resolvedSchoolId);
      const schoolName = schoolObj ? schoolObj.name : "";
      const classItem = normalizedClasses.find(cl => cl.id === row.classId);
      // Match using the class name field directly (e.g. "Class 10-A")
      const className = classItem ? classItem.name : "";
      
      const matchesSchool = school === "All Schools" || schoolName.trim().toLowerCase() === school.trim().toLowerCase();
      const matchesClass = klass === "All Classes" || className.trim().toLowerCase() === klass.trim().toLowerCase();
      
      let matchesSubject = true;
      if (subject !== "All Subjects") {
        const subjectName = row.subjectName;
        matchesSubject = subjectName.toLowerCase() === subject.toLowerCase();
      }
      return matchesSchool && matchesClass && matchesSubject;
    });

    const studentResultDateCounts = new Map<string, number>();
    const sessionDateCounts = new Map<string, number>();
    selectedQuizResults.forEach((row) => {
      const dateValue = asDate(row.date);
      if (dateValue) {
        const key = bucketKeyFn(dateValue);
        studentResultDateCounts.set(key, (studentResultDateCounts.get(key) ?? 0) + 1);
      }
    });
    selectedQuizzes.forEach((row) => {
      const dateValue = asDate(row.createdAt);
      if (dateValue) {
        const key = bucketKeyFn(dateValue);
        sessionDateCounts.set(key, (sessionDateCounts.get(key) ?? 0) + 1);
      }
    });

    const schoolMetrics: SchoolMetric[] = normalizedSchools.map((schoolObj, index) => {
      const name = schoolObj.name;
      const schoolId = schoolObj.id;
      const schoolStudents = normalizedStudents.filter((student) => student.schoolId === schoolId);
      const studentScores = schoolStudents
        .map((student) => student.score)
        .filter((score) => score > 0);
      const sessionsCompleted = schoolObj.sessionsCompleted;

      const schoolStudentIds = new Set(
        schoolStudents.map(s => s.id).filter(Boolean)
      );
      const schoolQuizScores = resultRecordsInRange
        .filter(r => schoolStudentIds.has(r.studentId))
        .map(r => clampPercent((r.score / Math.max(1, r.total)) * 100));

      let value;
      if (schoolQuizScores.length > 0) {
        value = average(schoolQuizScores);
      } else if (studentScores.length > 0) {
        value = average(studentScores);
      } else {
        value = clampPercent((sessionsCompleted / Math.max(1, schoolStudents.length * 2)) * 10);
      }

      return {
        name,
        value: clampPercent(value),
        color: index % 3 === 0 ? "hsl(var(--primary))" : index % 3 === 1 ? "hsl(var(--accent))" : "hsl(173 60% 60%)",
      };
    });

    const comparisonTitle = (() => {
      if (school === "All Schools") return "School Comparison";
      if (klass === "All Classes") return "Class Comparison";
      return "Subject Comparison";
    })();

    const comparisonData = (() => {
      if (school === "All Schools") {
        return schoolMetrics.map(item => ({
          name: item.name,
          value: item.value,
          color: item.color
        })).slice(0, 4);
      }
      
      if (klass === "All Classes") {
        const schoolStudents = normalizedStudents.filter((student) => {
          const schoolObj = normalizedSchools.find(sc => sc.id === student.schoolId);
          return schoolObj && schoolObj.name === school;
        });
        
        const classGroup: Record<string, { total: number; count: number }> = {};
        schoolStudents.forEach((student) => {
          const classItem = normalizedClasses.find(cl => cl.id === student.classId);
          // Use the class name field directly (e.g. "Class 10-A")
          const className = classItem ? classItem.name : "Other";
          if (!classGroup[className]) {
            classGroup[className] = { total: 0, count: 0 };
          }
          const score = student.score;
          if (score > 0) {
            classGroup[className].total += score;
            classGroup[className].count += 1;
          }
        });
        
        return Object.entries(classGroup).map(([name, stat], idx) => ({
          name,
          value: stat.count > 0 ? Math.round(stat.total / stat.count) : 60,
          color: idx % 3 === 0 ? "hsl(var(--primary))" : idx % 3 === 1 ? "hsl(var(--accent))" : "hsl(173 60% 60%)"
        })).sort((a, b) => b.value - a.value).slice(0, 4);
      }
      
      const subjectGroup: Record<string, { total: number; count: number }> = {};
      selectedQuizResults.forEach((resItem) => {
        const chapterId = resItem.chapterId;
        const subjectId = chapterIdToSubjectId.get(chapterId) ?? "";
        const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? `Subject ${subjectId}`) : "General";
        const currentScore = clampPercent((resItem.score / Math.max(1, resItem.total)) * 100);
        if (!subjectGroup[subjectName]) {
          subjectGroup[subjectName] = { total: 0, count: 0 };
        }
        subjectGroup[subjectName].total += currentScore;
        subjectGroup[subjectName].count += 1;
      });
      
      if (Object.keys(subjectGroup).length === 0) {
        selectedQuizzes.forEach((item, index) => {
          const subjectName = item.subjectName;
          if (!subjectGroup[subjectName]) {
            subjectGroup[subjectName] = { total: 0, count: 0 };
          }
          subjectGroup[subjectName].total += item.avgScore || 60;
          subjectGroup[subjectName].count += 1;
        });
      }
      
      return Object.entries(subjectGroup).map(([name, stat]: any, idx) => ({
        name,
        value: stat.count > 0 ? Math.round(stat.total / stat.count) : 60,
        color: idx % 3 === 0 ? "hsl(var(--primary))" : idx % 3 === 1 ? "hsl(var(--accent))" : "hsl(173 60% 60%)"
      })).sort((a, b) => b.value - a.value).slice(0, 4);
    })();

    const selectedSchools = schoolMetrics.filter((item) => school === "All Schools" || item.name === school);

    const activityData = timelineBuckets.map((bucket) => {
      const studentInteractions = (studentResultDateCounts.get(bucket.key) ?? 0) + (sessionDateCounts.get(bucket.key) ?? 0);
      return {
        day: bucket.label,
        students: studentInteractions,
        quizzes: studentResultDateCounts.get(bucket.key) ?? 0,
      };
    });

    const quizPerf = (() => {
      const topicStats = new Map<string, { totalScore: number; attempts: number }>();
      const addAttempt = (topic: string, scorePercent: number) => {
        const current = topicStats.get(topic) ?? { totalScore: 0, attempts: 0 };
        topicStats.set(topic, {
          totalScore: current.totalScore + scorePercent,
          attempts: current.attempts + 1,
        });
      };

      if (selectedQuizResults.length > 0) {
        selectedQuizResults.forEach((item) => {
          const chapterId = item.chapterId;
          const subjectId = chapterIdToSubjectId.get(chapterId) ?? "";
          const topicName = chapterIdToTopicName.get(chapterId) ?? `Chapter ${chapterId || "Unknown"}`;
          const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? `Subject ${subjectId}`) : topicName;
          const score = item.score;
          const total = Math.max(1, item.total);
          addAttempt(topicName, clampPercent((score / total) * 100));
          if (subjectName !== topicName) {
            if (subject === "All Subjects") {
              addAttempt(subjectName, clampPercent((score / total) * 100));
            }
          }
        });
      } else {
        selectedQuizzes.forEach((item, index) => {
          const topicName = item.topicName;
          addAttempt(topicName, item.avgScore || 60);
        });
      }

      return Array.from(topicStats.entries())
        .map(([topic, data]) => ({ topic, avg: data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0, attempts: data.attempts }))
        .sort((a, b) => b.attempts - a.attempts || b.avg - a.avg);
    })();

    const subjectPerf: Array<{ subject: string; avgScore: number; quizzesCount: number }> = (() => {
      const subjectMap = new Map<string, { total: number; count: number }>();
      selectedQuizResults.forEach((item) => {
        const chapterId = item.chapterId;
        const subjectId = chapterIdToSubjectId.get(chapterId) ?? "";
        const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? `Subject ${subjectId}`) : "General";
        const currentScore = clampPercent((item.score / Math.max(1, item.total)) * 100);
        const current = subjectMap.get(subjectName) || { total: 0, count: 0 };
        subjectMap.set(subjectName, {
          total: current.total + currentScore,
          count: current.count + 1,
        });
      });

      if (subjectMap.size === 0) {
        normalizedQuizzes.forEach((item, index) => {
          const subjectName = item.subjectName;
          const current = subjectMap.get(subjectName) || { total: 0, count: 0 };
          subjectMap.set(subjectName, {
            total: current.total + (item.avgScore || 60),
            count: current.count + 1,
          });
        });
      }

      return Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
          subject,
          avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
          quizzesCount: data.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore);
    })();

    const schoolPerf: Array<{ school: string; avgEngagement: number; studentCount: number; teacherCount: number }> = normalizedSchools.map((schoolObj, index) => {
      const schoolName = schoolObj.name;
      const schoolId = schoolObj.id;
      const schoolStudents = normalizedStudents.filter((student) => student.schoolId === schoolId);
      const studentScores = schoolStudents.map((student) => student.score).filter((score) => score > 0);
      const engagement = studentScores.length > 0 ? average(studentScores) : schoolObj.sessionsCompleted;
      const studentCount = schoolStudents.length;
      const teacherCount = rawTeachers.filter((teacher) => asString(asRecord(teacher).schoolId, asString(asRecord(teacher).school_id, "")) === schoolId).length;
      return { school: schoolName, avgEngagement: clampPercent(engagement), studentCount, teacherCount };
    });

    // isFiltered: true when any school/class/subject filter is applied
    const isFiltered = school !== "All Schools" || klass !== "All Classes" || subject !== "All Subjects";

    // totalStudents = students matching the current school/class filter
    const totalStudents = selectedStudents.length || (isFiltered ? 0 : (normalizedStudents.length || rawStudents.length));

    // activeStudents = students who actually submitted quiz results in the selected date range
    const studentIdsWithResultsInRange = new Set(selectedQuizResults.map(r => r.studentId).filter(Boolean));
    const activeStudents = isFiltered
      ? selectedStudents.filter(s => studentIdsWithResultsInRange.has(s.id)).length
      : studentIdsWithResultsInRange.size;

    const engagementRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;

    // quizzesAttempted = ONLY results/sessions within the selected date range
    // Never fall back to rawQuizzes.length (all-time total) — that would show fake data for empty periods
    const quizzesAttempted = selectedQuizResults.length || selectedQuizzes.length;
    
    const averageScore = selectedQuizResults.length > 0
      ? average(selectedQuizResults.map((item) => {
        return clampPercent((item.score / Math.max(1, item.total)) * 100);
      }))
      : (quizPerf.length > 0 ? average(quizPerf.map((point) => point.avg)) : 0);

    const selectedAttendance = normalizedAttendance.filter((att) => {
      return selectedStudentIds.has(att.studentId);
    });

    // IMPORTANT: studentAttendance from the backend is pre-aggregated (lifetime totals, no date breakdown).
    // We must NOT show it when no sessions occurred in the selected period — it would misrepresent
    // attendance for a day/week when no classes ran. Only show attendance when sessions exist in range.
    const hasSessionsInRange = selectedQuizzes.length > 0 || selectedQuizResults.length > 0;
    const attendanceRate = hasSessionsInRange
      ? (selectedAttendance.length > 0
          ? average(selectedAttendance.map(att => att.percentage))
          : (normalizedAttendance.length > 0 ? average(normalizedAttendance.map(att => att.percentage)) : 0))
      : 0;

    const schoolCompare = pickTop(selectedSchools.length > 0 ? selectedSchools : schoolMetrics, 4);
    const weakestTopics = quizPerf.slice().sort((a, b) => a.avg - b.avg).slice(0, 2);
    const strongestTopics = quizPerf.slice().sort((a, b) => b.avg - a.avg).slice(0, 2);
    const lowEngagementSchools = schoolMetrics.filter((item) => item.value > 0 && item.value < 50);
    const pendingTeachers = rawTeachers.filter((item) => {
      const row = asRecord(item);
      return row.setupComplete === false || row.onboarded === false || asString(row.status, "").toLowerCase() === "pending";
    });

    const activityTrendChange = activityData.length > 3
      ? (() => {
        const firstWindow = average(activityData.slice(0, Math.ceil(activityData.length / 2)).map((point) => point.students));
        const secondWindow = average(activityData.slice(Math.floor(activityData.length / 2)).map((point) => point.students));
        if (firstWindow === 0) return 0;
        return ((secondWindow - firstWindow) / firstWindow) * 100;
      })()
      : 0;

    const dateRange = reportType === "All Time"
      ? ["All Time", "All Available Data"]
      : [formatDate(dateStart), formatDate(dateEnd)];

    // Compute real trend deltas from timeline data
    const midpoint = Math.floor(activityData.length / 2);
    const firstHalfAvg = midpoint > 0 ? average(activityData.slice(0, midpoint).map(d => d.students)) : 0;
    const secondHalfAvg = midpoint > 0 ? average(activityData.slice(midpoint).map(d => d.students)) : 0;
    const activityDelta = firstHalfAvg > 0 ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0;
    const deltaBadge = (val: number) => val === 0 ? "—" : (val > 0 ? `+${val}%` : `${val}%`);

    const metrics = [
      { label: "Total Students", value: totalStudents.toLocaleString(), icon: Users, change: totalStudents > 0 ? `${totalStudents} enrolled` : "—", tone: "primary" as const },
      { label: "Active Students", value: activeStudents.toLocaleString(), icon: Activity, change: totalStudents > 0 ? `${Math.round((activeStudents / Math.max(1, totalStudents)) * 100)}% of total` : "—", tone: "primary" as const },
      { label: "Engagement Rate", value: formatPercent(engagementRate), icon: TrendingUp, change: deltaBadge(activityDelta), tone: "success" as const },
      { label: "Quizzes Attempted", value: quizzesAttempted.toLocaleString(), icon: ClipboardList, change: quizzesAttempted > 0 ? "Live" : "—", tone: "primary" as const },
      { label: "Average Score", value: averageScore > 0 ? formatPercent(averageScore) : "—", icon: Award, change: averageScore > 0 ? "Real data" : "No quizzes", tone: "accent" as const },
      { label: "QR Attendance", value: attendanceRate > 0 ? formatPercent(attendanceRate) : "—", icon: QrCode, change: attendanceRate > 0 ? "Tracked" : "No data", tone: "success" as const },
    ];

    const alerts: AlertItem[] = [
      ...(lowEngagementSchools.slice(0, 2).map((item) => ({
        title: "Low engagement cluster",
        description: `${item.name} is operating at ${Math.round(item.value)}% engagement.`,
        severity: "med" as const,
      }))),
      ...(pendingTeachers.slice(0, 2).map((item, index) => {
        const row = asRecord(item);
        const name = asString(row.name, asString(row.fullName, `Teacher ${index + 1}`));
        return {
          title: "Pending teacher onboarding",
          description: `${name} has not completed setup yet.`,
          severity: "low" as const,
        };
      })),
    ];

    const actions: ActionItem[] = [
      {
        title: "Increase targeted support",
        description: `${lowEngagementSchools.length > 0 ? `${lowEngagementSchools.length} schools` : "All schools"} need follow-up interventions this cycle.`,
      },
      {
        title: "Review quiz topics",
        description: strongestTopics.length > 0 ? `Most quiz attempts are concentrated in ${strongestTopics[0].topic}.` : "Quiz performance data is still being collected.",
      },
      {
        title: "Complete onboarding",
        description: pendingTeachers.length > 0 ? `${pendingTeachers.length} teacher accounts still need onboarding.` : "Teacher onboarding is up to date.",
      },
    ];

    const highlights = [
      `${totalStudents.toLocaleString()} students engaged across ${selectedSchools.length > 0 ? selectedSchools.length : schoolMetrics.length} schools`,
      `${quizzesAttempted.toLocaleString()} quizzes attempted`,
      `QR attendance at ${formatPercent(attendanceRate)}`,
    ];

    const executiveSummary = [
      `The ${reportType.toLowerCase()} report from ${dateRange[0]} to ${dateRange[1]} covers ${totalStudents.toLocaleString()} students and ${quizzesAttempted.toLocaleString()} quiz attempts.`,
      `Average quiz performance is ${formatPercent(averageScore)} and QR participation is ${formatPercent(attendanceRate)} across the selected timeline.`,
      activityTrendChange !== 0
        ? `Activity is ${activityTrendChange > 0 ? "rising" : "slowing"} by ${Math.abs(Math.round(activityTrendChange))}% compared with the earlier part of the window.`
        : `Activity is steady across the selected window, with no major spikes or drops detected.`,
    ];

    const recommendations = [
      weakestTopics.length > 0 ? `Strengthen the ${weakestTopics[0].topic} content with extra practice questions.` : "Continue collecting topic-level quiz data.",
      lowEngagementSchools.length > 0 ? `Review support plans for ${lowEngagementSchools[0].name} to improve school-level performance.` : "Maintain current school engagement programs.",
      pendingTeachers.length > 0 ? "Follow up with teachers who still need onboarding completion." : "All teacher onboarding tasks are complete.",
    ];

    const ai = generateAIAnalysis(
      engagementRate,
      averageScore,
      attendanceRate,
      quizzesAttempted,
      totalStudents,
      activeStudents,
      weakestTopics,
      strongestTopics,
      activityData,
      reportType,
    );

    // ══════════════════════════════════════════════════════
    // PHASE 1 — Student Performance Table (Top 5 by risk)
    // ══════════════════════════════════════════════════════
    const studentPerformanceTable = (() => {
      const rows = selectedStudents.map((student) => {
        const att = normalizedAttendance.find(a => a.studentId === student.id);
        const attendancePct = att ? att.percentage : 0;

        const quizResults = selectedQuizResults.filter(r => r.studentId === student.id);
        const quizAvg = quizResults.length > 0
          ? Math.round(average(quizResults.map(r => clampPercent((r.score / Math.max(1, r.total)) * 100))))
          : 0;

        const performanceIndex = Math.round(quizAvg * 0.6 + attendancePct * 0.4);

        const grade = performanceIndex >= 90 ? "A+" : performanceIndex >= 80 ? "A" : performanceIndex >= 70 ? "B+" : performanceIndex >= 60 ? "B" : performanceIndex >= 50 ? "C" : "D";

        const risk: "low" | "medium" | "high" =
          (attendancePct >= 85 && quizAvg >= 70) ? "low"
          : (attendancePct < 60 || quizAvg < 50) ? "high"
          : "medium";

        return {
          id: student.id,
          name: student.name || `Student ${student.id}`,
          attendancePct,
          quizAvg,
          performanceIndex,
          grade,
          risk,
          quizCount: quizResults.length,
        };
      });

      // Sort: high risk first, then medium, then low
      const riskOrder = { high: 0, medium: 1, low: 2 };
      rows.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || a.performanceIndex - b.performanceIndex);
      return rows.slice(0, 5);
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 1 — Attention Needed Section (3 spotlight cards)
    // ══════════════════════════════════════════════════════
    const attentionNeeded = (() => {
      const lowAttendance = selectedStudents.filter(s => {
        const att = normalizedAttendance.find(a => a.studentId === s.id);
        return att && att.percentage < 75;
      }).map(s => s.name || `Student ${s.id}`);

      const studentQuizAvgs = selectedStudents.map(s => {
        const results = selectedQuizResults.filter(r => r.studentId === s.id);
        const avg = results.length > 0 ? average(results.map(r => clampPercent((r.score / Math.max(1, r.total)) * 100))) : -1;
        return { name: s.name || `Student ${s.id}`, avg };
      }).filter(s => s.avg >= 0);

      const overallAvg = studentQuizAvgs.length > 0 ? average(studentQuizAvgs.map(s => s.avg)) : 0;
      const declining = studentQuizAvgs.filter(s => s.avg < overallAvg * 0.8).map(s => s.name);

      const inactive = selectedStudents.filter(s => {
        return !selectedQuizResults.some(r => r.studentId === s.id);
      }).map(s => s.name || `Student ${s.id}`);

      return {
        lowAttendance: { count: lowAttendance.length, names: lowAttendance.slice(0, 3) },
        declining: { count: declining.length, names: declining.slice(0, 3) },
        inactive: { count: inactive.length, names: inactive.slice(0, 3) },
      };
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 1 — AI Insights Panel (4 smart bullets)
    // ══════════════════════════════════════════════════════
    const aiInsights = (() => {
      const weakSubject = subjectPerf.length > 0 ? subjectPerf[subjectPerf.length - 1] : null;
      const recentActivity = activityData.slice(-3);
      const earlierActivity = activityData.slice(0, 3);
      const recentAvg = recentActivity.length > 0 ? average(recentActivity.map(d => d.students)) : 0;
      const earlierAvg = earlierActivity.length > 0 ? average(earlierActivity.map(d => d.students)) : 0;
      const trendText = earlierAvg === 0 ? "Stable activity" : recentAvg > earlierAvg ? "Rising quiz activity" : "Declining quiz activity";
      const bottomChapters = quizPerf.slice().sort((a, b) => a.avg - b.avg).slice(0, 2);
      const highRiskCount = studentPerformanceTable.filter(s => s.risk === "high").length;

      return {
        weakSubject: weakSubject ? weakSubject.subject : "N/A",
        weakSubjectScore: weakSubject ? weakSubject.avgScore : 0,
        learningTrend: trendText,
        revisionTopics: bottomChapters.map(c => c.topic),
        studentsNeedingSupport: highRiskCount + attentionNeeded.declining.count,
      };
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 2 — Improvement Tracker (avg score by month, per subject)
    // ══════════════════════════════════════════════════════
    const improvementTracker = (() => {
      const monthBuckets = new Map<string, Map<string, { total: number; count: number }>>();
      
      selectedQuizResults.forEach(r => {
        const d = asDate(r.date);
        if (!d) return;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const chapterId = r.chapterId;
        const subjectId = chapterIdToSubjectId.get(chapterId) ?? "";
        const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? "Other") : "General";
        const scorePercent = clampPercent((r.score / Math.max(1, r.total)) * 100);
        
        if (!monthBuckets.has(monthKey)) monthBuckets.set(monthKey, new Map());
        const subjects = monthBuckets.get(monthKey)!;
        if (!subjects.has(subjectName)) subjects.set(subjectName, { total: 0, count: 0 });
        const current = subjects.get(subjectName)!;
        current.total += scorePercent;
        current.count += 1;
      });
      
      const allSubjects = new Set<string>();
      monthBuckets.forEach(subjects => subjects.forEach((_, name) => allSubjects.add(name)));
      
      const sortedMonths = Array.from(monthBuckets.keys()).sort();
      
      return {
        data: sortedMonths.map(key => {
          const subjects = monthBuckets.get(key)!;
          const d = new Date(key + "-01");
          const point: Record<string, string | number> = {
            month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          };
          allSubjects.forEach(subj => {
            const stats = subjects.get(subj);
            point[subj] = stats ? Math.round(stats.total / stats.count) : 0;
          });
          return point;
        }),
        subjects: Array.from(allSubjects),
      };
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 2 — Radar Chart Data (per-subject score for selected class)
    // ══════════════════════════════════════════════════════
    const radarData = subjectPerf.slice(0, 6).map(sp => ({
      subject: sp.subject.length > 12 ? sp.subject.slice(0, 10) + "…" : sp.subject,
      fullName: sp.subject,
      score: sp.avgScore,
      fullMark: 100,
    }));

    // ══════════════════════════════════════════════════════
    // PHASE 3 — Class-wise Comparison Table
    // ══════════════════════════════════════════════════════
    const classComparison = (() => {
      const relevantClasses = normalizedClasses.filter(cl => {
        if (school === "All Schools") return true;
        const schoolObj = normalizedSchools.find(sc => sc.name.toLowerCase() === school.toLowerCase());
        return schoolObj ? cl.schoolId === schoolObj.id : true;
      });

      const list = relevantClasses.map(cl => {
        const classStudents = normalizedStudents.filter(s => s.classId === cl.id);
        const classStudentIds = new Set(classStudents.map(s => s.id));
        
        const classAttendance = normalizedAttendance.filter(a => classStudentIds.has(a.studentId));
        const avgAttendance = classAttendance.length > 0 ? Math.round(average(classAttendance.map(a => a.percentage))) : 0;
        
        const classQuizResults = selectedQuizResults.filter(r => classStudentIds.has(r.studentId));
        const avgMarks = classQuizResults.length > 0
          ? Math.round(average(classQuizResults.map(r => clampPercent((r.score / Math.max(1, r.total)) * 100))))
          : 0;
        
        // Find weakest subject for this class
        const subjectScores = new Map<string, { total: number; count: number }>();
        classQuizResults.forEach(r => {
          const subjectId = chapterIdToSubjectId.get(r.chapterId) ?? "";
          const subjectName = subjectId ? (subjectIdToName.get(subjectId) ?? "Other") : "General";
          const current = subjectScores.get(subjectName) || { total: 0, count: 0 };
          current.total += clampPercent((r.score / Math.max(1, r.total)) * 100);
          current.count += 1;
          subjectScores.set(subjectName, current);
        });
        let weakSubject = "N/A";
        let weakScore = Infinity;
        subjectScores.forEach((stats, name) => {
          const avg = stats.total / stats.count;
          if (avg < weakScore) { weakScore = avg; weakSubject = name; }
        });
        
        const riskLevel: "green" | "yellow" | "red" =
          (avgAttendance >= 85 && avgMarks >= 70) ? "green"
          : (avgAttendance < 60 || avgMarks < 50) ? "red"
          : "yellow";

        const score = clampPercent(Math.round(avgMarks * 0.5 + avgAttendance * 0.5));

        return {
          className: cl.name,
          avgAttendance,
          avgMarks,
          weakSubject,
          riskLevel,
          studentCount: classStudents.length,
          score,
          rank: 0,
        };
      }).filter(c => c.studentCount > 0).sort((a, b) => b.score - a.score);

      list.forEach((c, idx) => {
        c.rank = idx + 1;
      });

      return list;
    })();

    // Student performance rankings (sorted by score descending)
    const studentPerformanceRankings = (() => {
      const rows = selectedStudents.map((student) => {
        const att = normalizedAttendance.find(a => a.studentId === student.id);
        const attendancePct = att ? att.percentage : 0;

        const quizResults = selectedQuizResults.filter(r => r.studentId === student.id);
        const quizAvg = quizResults.length > 0
          ? Math.round(average(quizResults.map(r => clampPercent((r.score / Math.max(1, r.total)) * 100))))
          : 0;

        const performanceIndex = Math.round(quizAvg * 0.6 + attendancePct * 0.4);

        const grade = performanceIndex >= 90 ? "A+" : performanceIndex >= 80 ? "A" : performanceIndex >= 70 ? "B+" : performanceIndex >= 60 ? "B" : performanceIndex >= 50 ? "C" : "D";

        return {
          id: student.id,
          name: student.name || `Student ${student.id}`,
          attendancePct,
          quizAvg,
          score: performanceIndex,
          grade,
          rank: 0,
        };
      }).sort((a, b) => b.score - a.score);

      rows.forEach((r, idx) => {
        r.rank = idx + 1;
      });

      return rows;
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 3 — Teacher Activity Analytics
    // ══════════════════════════════════════════════════════
    const teacherActivity = (() => {
      const relevantSessions = selectedQuizzes; // Already filtered by school/class/date/subject
      const uniqueTeachers = new Set(relevantSessions.map(s => s.teacherId).filter(Boolean));
      const totalTeachers = rawTeachers.length;
      const sessionsCount = relevantSessions.length;
      const uniqueSubjects = new Set(relevantSessions.map(s => s.subjectName).filter(Boolean));
      const attendanceMarkedCount = relevantSessions.filter(s => s.attendanceMarked).length;
      const attendanceMarkedPct = sessionsCount > 0 ? Math.round((attendanceMarkedCount / sessionsCount) * 100) : 0;

      return {
        activeTeachers: uniqueTeachers.size,
        totalTeachers,
        sessionsConducted: sessionsCount,
        subjectsCovered: uniqueSubjects.size,
        attendanceMarkedPct,
      };
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 3 — Enhanced Risk & Alert Tiles
    // ══════════════════════════════════════════════════════
    const enhancedAlerts = (() => {
      const lowPerfClasses = classComparison.filter(c => c.avgMarks < 50);
      const attendanceDropClasses = classComparison.filter(c => c.avgAttendance < 70);
      const highRiskStudents = studentPerformanceTable.filter(s => s.risk === "high");

      return {
        lowPerformingClasses: lowPerfClasses.map(c => c.className),
        attendanceDropClasses: attendanceDropClasses.map(c => c.className),
        studentsAtRisk: highRiskStudents.length,
      };
    })();

    // ══════════════════════════════════════════════════════
    // PHASE 4 — School Performance Score (0-100)
    // ══════════════════════════════════════════════════════
    const schoolScores = normalizedSchools.map((schoolObj, idx) => {
      const schoolStudents = normalizedStudents.filter(s => s.schoolId === schoolObj.id);
      const schoolStudentIds = new Set(schoolStudents.map(s => s.id));
      
      const schoolQuizResults = resultRecordsInRange.filter(r => schoolStudentIds.has(r.studentId));
      const quizScore = schoolQuizResults.length > 0
        ? average(schoolQuizResults.map(r => clampPercent((r.score / Math.max(1, r.total)) * 100)))
        : 0;
      
      const schoolAttendance = normalizedAttendance.filter(a => schoolStudentIds.has(a.studentId));
      const attScore = schoolAttendance.length > 0 ? average(schoolAttendance.map(a => a.percentage)) : 0;
      
      const schoolSessions = normalizedQuizzes.filter(s => {
        const resolvedSchoolId = s.schoolId || classIdToSchoolId.get(s.classId) || "";
        return resolvedSchoolId === schoolObj.id;
      });
      const sessionScore = schoolStudents.length > 0 ? Math.min(100, (schoolSessions.length / Math.max(1, schoolStudents.length)) * 20) : 0;
      
      const score = Math.round(quizScore * 0.4 + attScore * 0.3 + sessionScore * 0.3);
      
      return {
        name: schoolObj.name,
        score: clampPercent(score),
        rank: 0,
        quizScore: Math.round(quizScore),
        attScore: Math.round(attScore),
      };
    }).sort((a, b) => b.score - a.score);
    
    schoolScores.forEach((s, i) => { s.rank = i + 1; });

    return {
      activityData,
      quizPerf,
      schoolCompare: comparisonData,
      comparisonTitle,
      comparisonData,
      subjectPerf,
      schoolPerf,
      metrics,
      alerts,
      actions,
      highlights,
      executiveSummary,
      recommendations,
      dateRange,
      strongestTopics,
      weakestTopics,
      aiAnalysis: ai.analysis,
      projectStatus: ai.projectStatus,
      healthScore: ai.healthScore,
      // Phase 1
      studentPerformanceTable,
      attentionNeeded,
      aiInsights,
      // Phase 2
      improvementTracker,
      radarData,
      // Phase 3
      classComparison,
      teacherActivity,
      enhancedAlerts,
      // Phase 4
      schoolScores,
      // Student Rankings
      studentPerformanceRankings,
    };
  }, [school, klass, subject, reportType, customStartDate, customEndDate, selectedDateRange, source]);

  const [aiSummary, setAiSummary] = useState<{
    executiveSummary: string[];
    aiAnalysis: string[];
    projectStatus: string;
    healthScore: number;
    fromCache?: boolean;
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFromCache, setAiFromCache] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    totalRequests: number; cacheHits: number; cacheMisses: number;
    dedupAvoided: number; errors: number; cacheHitRate: number;
    avgGenerationMs: number; tokensSaved: number; tokensUsed: number;
    aiCallsAvoided: number;
  } | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch analytics on mount
  useEffect(() => {
    getReportAnalytics()
      .then((data) => setAnalyticsData(data))
      .catch(() => {});
  }, []);

  // AI generation — user-initiated only (called from handleSearch)
  const triggerAIGeneration = useCallback(async (
    activeReportType: string,
    activeSchool: string,
    activeKlass: string,
    activeSubject: string,
  ) => {
    if (isGeneratingAI) return; // Prevent duplicate
    setIsGeneratingAI(true);
    setAiFromCache(false);
    const toastId = toast.loading("Generating AI Summary...");
    try {
      const payload = {
        reportType: activeReportType,
        metrics: reportModel.metrics.map(m => ({ label: m.label, value: m.value })),
        weakestTopics: reportModel.weakestTopics,
        strongestTopics: reportModel.strongestTopics,
        school: activeSchool,
        klass: activeKlass,
        subject: activeSubject,
        dateRange: reportModel.dateRange,
      };
      const result = await generateReportSummary(payload);
      setAiSummary({
        executiveSummary: result.executiveSummary,
        aiAnalysis: result.aiAnalysis,
        projectStatus: result.projectStatus,
        healthScore: result.healthScore,
        fromCache: result.fromCache,
      });
      setAiFromCache(!!result.fromCache);
      if (result.fromCache) {
        toast.success("Report loaded from cache ⚡", { id: toastId });
      } else if (result.success) {
        toast.success("AI Summary generated successfully 🧠", { id: toastId });
      } else {
        toast.info("Using fallback summary (AI offline)", { id: toastId });
      }
      // Refresh analytics after generation
      getReportAnalytics().then((data) => setAnalyticsData(data)).catch(() => {});
    } catch (err) {
      console.error("Failed to generate AI report summary:", err);
      toast.error("Failed to generate AI summary", { id: toastId });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [isGeneratingAI, reportModel.metrics, reportModel.weakestTopics, reportModel.strongestTopics, reportModel.dateRange]);

  const handleSearch = () => {
    // Apply filters
    setReportType(tempReportType);
    setSchool(tempSchool);
    setKlass(tempKlass);
    setSubject(tempSubject);
    setCustomStartDate(tempCustomStartDate);
    setCustomEndDate(tempCustomEndDate);
    // Trigger AI generation with the new filters
    // Use setTimeout(0) so state updates apply first
    setTimeout(() => {
      triggerAIGeneration(tempReportType, tempSchool, tempKlass, tempSubject);
    }, 0);
  };

  const getDynamicPDFName = () => {
    const parts = ["vidhyaplus"];
    if (school !== "All Schools") {
      parts.push(school);
    }
    if (klass !== "All Classes") {
      parts.push(klass);
    }
    if (subject !== "All Subjects") {
      parts.push(subject);
    }
    parts.push(new Date().toISOString().split("T")[0]);
    
    return parts
      .map(part => part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
      .filter(Boolean)
      .join("-") + ".pdf";
  };

  const handleDownloadPDF = async () => {
    const pages = reportRef.current?.querySelectorAll(".pdf-report-page");
    if (!pages || pages.length === 0) return;

    const toastId = toast.loading("Generating high-fidelity District report...");
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;

        // Capture canvas
        const canvas = await html2canvas(pageElement, {
          scale: 2, // high quality
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        // Draw image A4 scale
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      const filename = getDynamicPDFName();
      pdf.save(filename);
      toast.success("District Report PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report", { id: toastId });
    }
  };

  const handleDownloadExcel = () => {
    const { schoolPerf, subjectPerf } = reportModel;
    let csvContent = `VidhyaPlus - ${reportType} Report\r\nGenerated: ${new Date().toLocaleString()}\r\n\r\n`;

    csvContent += `Reporting Period,${reportModel.dateRange[0]} to ${reportModel.dateRange[1]}\r\n`;
    csvContent += `Selected School,${school}\r\n`;
    csvContent += `Selected Class,${klass}\r\n`;
    csvContent += `Selected Subject,${subject}\r\n`;
    csvContent += `Project Status,${reportModel.projectStatus ?? "N/A"}\r\n`;
    csvContent += `Health Score,${reportModel.healthScore ?? 0}/100\r\n\r\n`;

    csvContent += "EXECUTIVE SUMMARY\r\n";
    reportModel.executiveSummary.forEach((line) => {
      csvContent += `"${line}"\r\n`;
    });

    csvContent += "\r\nAI ANALYSIS\r\n";
    (reportModel.aiAnalysis ?? []).forEach((line) => {
      csvContent += `"${line}"\r\n`;
    });

    csvContent += "SUMMARY METRICS\r\n";
    csvContent += "Metric,Value,Change\r\n";
    reportModel.metrics.forEach((m) => {
      csvContent += `"${m.label}","${m.value}","${m.change}"\r\n`;
    });

    csvContent += "\r\nSCHOOL-WISE PERFORMANCE\r\n";
    csvContent += "School,Engagement %,Students,Teachers\r\n";
    schoolPerf.forEach((s) => {
      csvContent += `"${s.school}",${s.avgEngagement},${s.studentCount},${s.teacherCount}\r\n`;
    });

    csvContent += "\r\nSUBJECT-WISE PERFORMANCE\r\n";
    csvContent += "Subject,Avg Score %,Quizzes\r\n";
    subjectPerf.forEach((s) => {
      csvContent += `"${s.subject}",${s.avgScore},${s.quizzesCount}\r\n`;
    });

    csvContent += "\r\nRECOMMENDATIONS\r\n";
    reportModel.recommendations.forEach((r) => {
      csvContent += `"${r}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vidhyaplus-${reportType.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const displaySummary = aiSummary || {
    executiveSummary: reportModel.executiveSummary,
    aiAnalysis: reportModel.aiAnalysis,
    projectStatus: reportModel.projectStatus,
    healthScore: reportModel.healthScore,
  };

  // Compute whether there is any real data for the current filter
  const hasNoActivityData = !isLoading && !isError &&
    reportModel.metrics[3].value === "0" && // Quizzes Attempted = 0
    reportModel.teacherActivity.sessionsConducted === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-teal-600" /> District Reports & Insights
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Polished, multi-page briefing summaries and learning analytics for administration review.
          </p>
          {/* Live Data / Demo badge */}
          <div className="mt-2">
            {isLoading ? (
              <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-[10px] font-bold animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Connecting...
              </Badge>
            ) : isFromApi ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px] font-bold">
                <Database className="h-3 w-3 mr-1" /> Live Data
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px] font-bold">
                <AlertTriangle className="h-3 w-3 mr-1" /> No API Connection
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 rounded-xl h-11 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm px-4"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" /> Export CSV
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 rounded-xl h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 shadow-lg shadow-teal-600/10"
          >
            <Download className="h-4.5 w-4.5" /> Download Report PDF
          </Button>
        </div>
      </div>

      {isLoading && <div className="p-8 text-center text-slate-500 font-medium">Loading reports...</div>}
      {isError && <div className="p-8 text-center text-rose-500 font-semibold">Failed to load report data</div>}

      {/* Filter Options */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterSelect label="Report Type" value={tempReportType} onChange={setTempReportType} options={["All Time", "Daily", "Weekly", "Monthly", "Custom"]} />
          <FilterSelect label="Select School" value={tempSchool} onChange={handleSchoolChange} options={schoolOptions} />
          <FilterSelect label="Select Class" value={tempKlass} onChange={setTempKlass} options={classOptions} />
          <FilterSelect label="Select Subject" value={tempSubject} onChange={setTempSubject} options={subjectOptions} />
        </div>

        {tempReportType === "Custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Start Date</label>
              <input
                type="date"
                value={tempCustomStartDate}
                onChange={(e) => setTempCustomStartDate(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">End Date</label>
              <input
                type="date"
                value={tempCustomEndDate}
                onChange={(e) => setTempCustomEndDate(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-5 border-t border-slate-100 gap-4">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Calendar className="h-4.5 w-4.5 text-slate-400" />
            <span>Active Reporting Window:</span>
            <span className="text-slate-700 font-bold">
              {tempReportType === "All Time"
                ? "All Available Data"
                : tempReportType === "Custom"
                ? `${tempCustomStartDate ? formatDate(parseInputDate(tempCustomStartDate)) : "—"} — ${tempCustomEndDate ? formatDate(parseInputDate(tempCustomEndDate)) : "—"}`
                : (() => {
                    const [start, end] = getPresetDateRange(tempReportType);
                    return `${formatDate(start)} — ${formatDate(end)}`;
                  })()
              }
            </span>
          </div>
          <Button
            onClick={handleSearch}
            disabled={isGeneratingAI}
            className="w-full sm:w-auto rounded-xl h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingAI ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Search className="h-4 w-4" /> Get Report</>
            )}
          </Button>
        </div>
      </div>

      {/* ── No Activity Empty State ────────────────────────────────── */}
      {hasNoActivityData && !isLoading && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center relative">
            {/* Decorative gradient blob */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <div className="w-72 h-72 rounded-full bg-gradient-to-br from-teal-400 to-blue-500" />
            </div>
            {/* Icon */}
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
              <BarChart3 className="h-9 w-9 text-slate-300" />
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-black">!</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Activity Recorded</h2>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              No classes, quizzes, or attendance entries were found for{" "}
              <span className="font-semibold text-slate-700">
                {reportModel.dateRange[0]}
                {reportModel.dateRange[0] !== reportModel.dateRange[1] ? ` — ${reportModel.dateRange[1]}` : ""}
              </span>.
              <br />
              <span className="text-slate-400 text-xs mt-1 block">
                Data will appear here once teachers start sessions, conduct quizzes, or mark attendance.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Dashboard — only rendered when there IS real activity data */}
      {!hasNoActivityData && (
      <div className="space-y-6">

        {/* Row 1: Executive Summary & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Executive Summary Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={cn("h-5 w-5 text-teal-600", isGeneratingAI ? "animate-spin" : "animate-pulse")} />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Executive Summary</h3>
                </div>
                <div className="flex items-center gap-2">
                  {aiFromCache && !isGeneratingAI && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 border text-[10px] font-bold">
                      <Zap className="h-3 w-3 mr-1" /> From Cache
                    </Badge>
                  )}
                  {!aiFromCache && aiSummary && !isGeneratingAI && aiSummary.fromCache === false && (
                    <Badge className="bg-teal-50 text-teal-700 border-teal-100 border text-[10px] font-bold">
                      <Brain className="h-3 w-3 mr-1" /> Fresh AI
                    </Badge>
                  )}
                  {isGeneratingAI && (
                    <Badge className="bg-teal-50 text-teal-700 border-teal-100 border text-[10px] font-bold animate-pulse">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...
                    </Badge>
                  )}
                </div>
              </div>
              {isGeneratingAI ? (
                <div className="space-y-3 animate-pulse py-2">
                  <div className="h-4 bg-slate-100 rounded-md w-11/12" />
                  <div className="h-4 bg-slate-100 rounded-md w-full" />
                  <div className="h-4 bg-slate-100 rounded-md w-4/5" />
                  <div className="h-4 bg-slate-100 rounded-md w-5/6" />
                </div>
              ) : (
                <>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {displaySummary.executiveSummary.join(" ")}
                  </p>
                  {displaySummary.aiAnalysis && displaySummary.aiAnalysis.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Analytical Insights:</p>
                      <ul className="text-xs text-slate-500 list-disc list-inside mt-2 space-y-1.5 pl-1 leading-relaxed">
                        {displaySummary.aiAnalysis.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Project Health Score Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center min-h-[220px]">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Project Health Score</h3>
              <div className="relative flex items-center justify-center">
                <svg className={cn("w-32 h-32 transform -rotate-90", isGeneratingAI && "animate-pulse")}>
                  <circle cx="64" cy="64" r="54" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle cx="64" cy="64" r="54" stroke="#0ea5e9" strokeWidth="10" fill="transparent"
                    strokeDasharray={339.3}
                    strokeDashoffset={339.3 - (339.3 * (displaySummary.healthScore ?? 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-3xl font-black text-slate-800 font-mono">
                  {isGeneratingAI ? "..." : `${displaySummary.healthScore ?? 0}%`}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <span className="text-xs font-extrabold px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-800 uppercase tracking-widest rounded-full shadow-sm">
                {isGeneratingAI ? "ANALYZING" : (displaySummary.projectStatus ? displaySummary.projectStatus.split(" - ")[0] : "STATUS")}
              </span>
              <p className="text-xs text-slate-400 mt-3 font-medium">Composite District Rating</p>
            </div>
          </div>
        </div>

        {/* Row 2: Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportModel.metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center",
                  m.tone === "primary" && "bg-blue-50 text-blue-600",
                  m.tone === "success" && "bg-emerald-50 text-emerald-600",
                  m.tone === "accent" && "bg-amber-50 text-amber-600",
                )}>
                  <m.icon className="h-5 w-5" />
                </div>
                <Badge className={cn(
                  "border text-xs font-semibold px-2 py-0.5",
                  m.change === "—" || m.change === "No quizzes" || m.change === "No data"
                    ? "bg-slate-50 text-slate-400 border-slate-100 font-mono"
                    : m.change.startsWith("-")
                    ? "bg-rose-50 text-rose-600 border-rose-100 font-mono"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {m.change}
                </Badge>
              </div>
              <div className="mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
                <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Alerts & Directives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Alerts */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Critical Alerts</h4>
            </div>
            <ul className="space-y-3">
              {(reportModel.alerts.length > 0 ? reportModel.alerts : [{ title: "System Operational", description: "No alerts detected in this period.", severity: "low" as const }]).map((alert, idx) => (
                <li key={idx} className="flex gap-3 items-start p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <span className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                    alert.severity === "high" && "bg-rose-500",
                    alert.severity === "med" && "bg-amber-500",
                    alert.severity === "low" && "bg-slate-400",
                  )} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{alert.title}</p>
                    <p className="text-xs text-slate-500 leading-tight mt-1">{alert.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Directives */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Collector Directive Checklist</h4>
            </div>
            <ul className="space-y-3">
              {reportModel.actions.map((action, idx) => (
                <li key={idx} className="flex gap-3 items-start p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{action.title}</p>
                    <p className="text-xs text-slate-500 leading-tight mt-1">{action.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 4: Charts (Activity Timeline & Subject competency Radar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">District Activity Timeline (Students vs Assessments)</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportModel.activityData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorStudentsScreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQuizzesScreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={reportModel.activityData.every(d => d.students === 0 && d.quizzes === 0) ? [0, 4] : [0, 'auto']} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="students" name="Active Students" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudentsScreen)" />
                  <Area type="monotone" dataKey="quizzes" name="Quizzes Taken" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuizzesScreen)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Competency Balance Radar (1/3 width) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Academic Competency Balance</h4>
            <div className="h-[250px] flex items-center justify-center">
              {reportModel.radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={reportModel.radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#475569" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Class Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2.5} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 italic">No subject parameters available</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: School Leaderboard & Teacher Operational Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* School leaderboard */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {klass !== "All Classes" ? "Student Performance Rankings" : school !== "All Schools" ? "Class Performance Rankings" : "School Performance Rankings"}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {klass !== "All Classes" ? "Quiz Avg 60% | Attendance 40%" : school !== "All Schools" ? "Quiz Avg 50% | Attendance 50%" : "Quiz 40% | Attendance 30% | Sessions 30%"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {klass !== "All Classes" ? (
                reportModel.studentPerformanceRankings.slice(0, 6).map((sr) => (
                  <div key={sr.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-3.5 right-4">
                      <span className={cn(
                        "text-xs font-extrabold px-2.5 py-0.5 rounded-full",
                        sr.rank === 1 ? "bg-amber-100 text-amber-700" : 
                        sr.rank === 2 ? "bg-slate-200 text-slate-700" :
                        sr.rank === 3 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"
                      )}>Rank #{sr.rank}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 pr-16 truncate">{sr.name}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${sr.score}%` }} />
                      </div>
                      <span className="text-sm font-mono font-black text-slate-700">{sr.score}/100</span>
                    </div>
                  </div>
                ))
              ) : school !== "All Schools" ? (
                reportModel.classComparison.slice(0, 6).map((cr) => (
                  <div key={cr.className} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-3.5 right-4">
                      <span className={cn(
                        "text-xs font-extrabold px-2.5 py-0.5 rounded-full",
                        cr.rank === 1 ? "bg-amber-100 text-amber-700" : 
                        cr.rank === 2 ? "bg-slate-200 text-slate-700" :
                        cr.rank === 3 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"
                      )}>Rank #{cr.rank}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 pr-16 truncate">{cr.className}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${cr.score}%` }} />
                      </div>
                      <span className="text-sm font-mono font-black text-slate-700">{cr.score}/100</span>
                    </div>
                  </div>
                ))
              ) : (
                reportModel.schoolScores.slice(0, 6).map((ss) => (
                  <div key={ss.name} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-3.5 right-4">
                      <span className={cn(
                        "text-xs font-extrabold px-2.5 py-0.5 rounded-full",
                        ss.rank === 1 ? "bg-amber-100 text-amber-700" : 
                        ss.rank === 2 ? "bg-slate-200 text-slate-700" :
                        ss.rank === 3 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"
                      )}>Rank #{ss.rank}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 pr-16 truncate">{ss.name}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${ss.score}%` }} />
                      </div>
                      <span className="text-sm font-mono font-black text-slate-700">{ss.score}/100</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teacher operational compliance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-50">Teacher Compliance KPI</h4>
            <div className="space-y-3">
              <ComplianceRow label="Active Teachers" value={`${reportModel.teacherActivity.activeTeachers} / ${reportModel.teacherActivity.totalTeachers}`} />
              <ComplianceRow label="Sessions Conducted" value={reportModel.teacherActivity.sessionsConducted} />
              <ComplianceRow label="Subjects Covered" value={reportModel.teacherActivity.subjectsCovered} />
              <ComplianceRow label="QR Attendance Marked" value={`${reportModel.teacherActivity.attendanceMarkedPct}%`} highlight />
            </div>
          </div>
        </div>

        {/* Row 6: Tables (Class comparison matrix & Student Honor roll) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class or Subject Matrix */}
          {klass !== "All Classes" ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-50">Subject Competency Matrix ({klass})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="text-left pb-3">Subject Name</th>
                      <th className="text-center pb-3">Avg Quiz Score</th>
                      <th className="text-center pb-3">Assessments</th>
                      <th className="text-right pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportModel.subjectPerf.map((sp) => {
                      const status = sp.avgScore >= 75 ? "Good" : sp.avgScore >= 60 ? "Watch" : "Remedial";
                      return (
                        <tr key={sp.subject} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-bold text-slate-700">{sp.subject}</td>
                          <td className="text-center py-3 text-slate-600 font-semibold">{sp.avgScore}%</td>
                          <td className="text-center py-3 text-slate-600 font-semibold">{sp.quizzesCount}</td>
                          <td className="text-right py-3">
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                              status === "Good" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                              status === "Watch" && "bg-amber-50 text-amber-700 border border-amber-100",
                              status === "Remedial" && "bg-rose-50 text-rose-700 border border-rose-100",
                            )}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-50">Classroom Activity Matrix</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="text-left pb-3">Class Grade</th>
                      <th className="text-center pb-3">Avg Attendance</th>
                      <th className="text-center pb-3">Quiz Performance</th>
                      <th className="text-center pb-3">Remedial Focus</th>
                      <th className="text-right pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportModel.classComparison.map((cl) => (
                      <tr key={cl.className} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-bold text-slate-700">{cl.className}</td>
                        <td className="text-center py-3 text-slate-600 font-semibold">{cl.avgAttendance}%</td>
                        <td className="text-center py-3 text-slate-600 font-semibold">{cl.avgMarks}%</td>
                        <td className="text-center py-3 text-slate-500 font-medium">{cl.weakSubject}</td>
                        <td className="text-right py-3">
                          <span className={cn(
                            "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                            cl.riskLevel === "green" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                            cl.riskLevel === "yellow" && "bg-amber-50 text-amber-700 border border-amber-100",
                            cl.riskLevel === "red" && "bg-rose-50 text-rose-700 border border-rose-100",
                          )}>
                            {cl.riskLevel === "green" ? "Good" : cl.riskLevel === "yellow" ? "Watch" : "At Risk"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student Honor roll */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-50">Academic Honor Roll & High Performers</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="text-left pb-3">Student Name</th>
                    <th className="text-center pb-3">Attendance</th>
                    <th className="text-center pb-3">Quiz Avg</th>
                    <th className="text-center pb-3">Academic Score</th>
                    <th className="text-center pb-3">Grade</th>
                    <th className="text-right pb-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {reportModel.studentPerformanceTable.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-slate-700">{s.name}</td>
                      <td className="text-center py-3 text-slate-600 font-semibold">{s.attendancePct}%</td>
                      <td className="text-center py-3 text-slate-600 font-semibold">{s.quizAvg}%</td>
                      <td className="text-center py-3 text-slate-600 font-semibold">{s.performanceIndex}</td>
                      <td className="text-center py-3 text-blue-800 font-black font-mono">{s.grade}</td>
                      <td className="text-right py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          s.risk === "low" && "bg-emerald-50 text-emerald-700",
                          s.risk === "medium" && "bg-amber-50 text-amber-700",
                          s.risk === "high" && "bg-rose-50 text-rose-700",
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.risk === "low" && "bg-emerald-500", s.risk === "medium" && "bg-amber-500", s.risk === "high" && "bg-rose-500")} />
                          {s.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 7: Improvement Tracker (Full width line chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Improvement Tracker</h3>
            <span className="text-xs text-slate-400 ml-auto font-medium">Avg score per subject over time</span>
          </div>
          <div className="h-80">
            {reportModel.improvementTracker.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportModel.improvementTracker.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: 16, fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  {reportModel.improvementTracker.subjects.map((subj, idx) => {
                    const colors = ["#0ea5e9", "#00B98A", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
                    return (
                      <Area key={subj} type="monotone" dataKey={subj} name={subj}
                        stroke={colors[idx % colors.length]} fill={colors[idx % colors.length]}
                        fillOpacity={0.05} strokeWidth={2.5} dot={{ r: 3.5 }}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">No improvement data available</div>
            )}
          </div>
        </div>
        {/* Row 8: AI Analytics Panel (Collapsible) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">AI Report Analytics</h4>
              {analyticsData && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border text-[10px] font-bold ml-2">
                  {analyticsData.cacheHitRate}% Cache Hit Rate
                </Badge>
              )}
            </div>
            <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", showAnalytics && "rotate-180")} />
          </button>
          {showAnalytics && analyticsData && (
            <div className="px-6 pb-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total Requests</p>
                  <p className="text-xl font-black text-blue-800 mt-1 font-mono">{analyticsData.totalRequests}</p>
                </div>
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI Calls Avoided</p>
                  <p className="text-xl font-black text-emerald-800 mt-1 font-mono">{analyticsData.aiCallsAvoided}</p>
                </div>
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Tokens Saved</p>
                  <p className="text-xl font-black text-amber-800 mt-1 font-mono">{analyticsData.tokensSaved.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Errors / Fallbacks</p>
                  <p className="text-xl font-black text-rose-800 mt-1 font-mono">{analyticsData.errors}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cache Hits</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{analyticsData.cacheHits}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cache Misses</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{analyticsData.cacheMisses}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Gen Time</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{analyticsData.avgGenerationMs}ms</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Hidden print template for high-fidelity A4 PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "900px", pointerEvents: "none" }}>
        <PrintTemplate
          reportRef={reportRef}
          reportModel={reportModel}
          reportType={reportType}
          school={school}
          klass={klass}
          subject={subject}
          displaySummary={displaySummary}
        />
      </div>
    </div>
  );
}

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-slate-700"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const InsightTile = ({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "warning" | "primary" | "muted" }) => (
  <div className={cn(
    "p-3 rounded-2xl border flex flex-col justify-between h-[68px]",
    tone === "success" && "bg-emerald-50/50 border-emerald-100",
    tone === "warning" && "bg-amber-50/50 border-amber-100",
    tone === "primary" && "bg-blue-50/50 border-blue-100",
    tone === "muted" && "bg-slate-100/50 border-slate-200/60",
  )}>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
    <span className={cn(
      "text-xs font-bold block truncate",
      tone === "success" && "text-emerald-800",
      tone === "warning" && "text-amber-800",
      tone === "primary" && "text-blue-900",
      tone === "muted" && "text-slate-700",
    )} title={value}>{value}</span>
    <span className="text-[9px] text-slate-400 block truncate">{sub}</span>
  </div>
);

const ComplianceRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-2xl shadow-sm">
    <span className="text-slate-500 font-medium text-sm">{label}</span>
    <span className={cn("font-bold text-sm", highlight ? "text-teal-600 font-black" : "text-slate-800")}>{value}</span>
  </div>
);

interface PrintTemplateProps {
  reportRef: React.RefObject<HTMLDivElement>;
  reportModel: any;
  reportType: string;
  school: string;
  klass: string;
  subject: string;
  displaySummary: {
    executiveSummary: string[];
    aiAnalysis: string[];
    projectStatus: string;
    healthScore: number;
  };
}

const PrintTemplate = ({ reportRef, reportModel, reportType, school, klass, subject, displaySummary }: PrintTemplateProps) => {
  return (
    <div ref={reportRef} className="flex flex-col gap-10">
      
      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 1 — EXECUTIVE BRIEFING & CORE METRICS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="pdf-report-page w-[900px] h-[1273px] bg-white p-10 flex flex-col justify-between border border-slate-200 relative overflow-hidden select-none">
        <div className="space-y-6">
          {/* Government Official Style Header */}
          <div className="pb-5 border-b border-slate-200">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase">
              District Administration & School Education Department
            </p>
            <h2 className="text-2xl font-black text-blue-900 mt-1 uppercase tracking-tight font-display">
              Vidhya Plus — Impact & Performance Briefing
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-blue-50 text-blue-800 border-blue-100 border text-[10px] font-bold uppercase rounded-md">
                District Overview
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-md">
                Report Type: {reportType}
              </Badge>
              <Badge className="bg-teal-50 text-teal-800 border border-teal-100 text-[10px] font-bold rounded-md ml-auto">
                Scope: {school} {klass !== "All Classes" ? `| ${klass}` : ""} {subject !== "All Subjects" ? `| ${subject}` : ""}
              </Badge>
            </div>
          </div>

          {/* Health Score & AI Executive Briefing */}
          <div className="grid grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Briefing Summary */}
            <div className="col-span-8 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-3xl p-6 border border-slate-200/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Executive Summary</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {displaySummary.executiveSummary.join(" ")}
                </p>
                {displaySummary.aiAnalysis && displaySummary.aiAnalysis.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-700">Analytical Insights:</p>
                    <ul className="text-[11px] text-slate-500 list-disc list-inside mt-1 space-y-1 pl-1 leading-relaxed">
                      {displaySummary.aiAnalysis.slice(0, 3).map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Health Score Ring */}
            <div className="col-span-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-6 border border-blue-100/60 flex flex-col justify-between items-center text-center">
              <div>
                <h3 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">Project Health</h3>
                <div className="relative flex items-center justify-center mt-3">
                  {/* Ring SVG */}
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#0ea5e9" strokeWidth="8" fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * (displaySummary.healthScore ?? 0)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-slate-800 font-mono">
                    {displaySummary.healthScore ?? 0}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-extrabold px-3 py-1 bg-white border border-blue-100 text-blue-800 uppercase tracking-widest rounded-full shadow-sm">
                  {displaySummary.projectStatus ? displaySummary.projectStatus.split(" - ")[0] : "STATUS"}
                </span>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Compliance & Outcome Metric</p>
              </div>
            </div>
          </div>

          {/* Summary Metrics Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Key Performance Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              {reportModel.metrics.map((m: any) => (
                <div key={m.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center",
                      m.tone === "primary" && "bg-blue-100 text-blue-600",
                      m.tone === "success" && "bg-emerald-100 text-emerald-600",
                      m.tone === "accent" && "bg-amber-100 text-amber-600",
                    )}>
                      <m.icon className="h-4 w-4" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 border text-[9px] font-mono font-bold px-1.5 py-0.5">
                      +{m.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5 font-mono">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alerts & Actions */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Issues & Alerts */}
            <div className="bg-rose-50/30 border border-rose-100 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Critical Alerts</h4>
              </div>
              <ul className="space-y-2">
                {(reportModel.alerts.length > 0 ? reportModel.alerts.slice(0, 3) : [{ title: "System Operational", description: "No alerts detected in this period.", severity: "low" as const }]).map((alert: any, idx: number) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                      alert.severity === "high" && "bg-rose-500",
                      alert.severity === "med" && "bg-amber-500",
                      alert.severity === "low" && "bg-slate-400",
                    )} />
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">{alert.title}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{alert.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions & Next Steps */}
            <div className="bg-teal-50/30 border border-teal-100 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-teal-600" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Collector Directive Checklist</h4>
              </div>
              <ul className="space-y-2">
                {reportModel.actions.slice(0, 3).map((action: any, idx: number) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <div className="h-4 w-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">{action.title}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{action.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>Official Briefing Document</span>
          <span>Generated: {new Date().toLocaleDateString("en-IN")}</span>
          <span>Page 1 of 3</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 2 — ACADEMIC PERFORMANCE & ACTIVITY TRENDS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="pdf-report-page w-[900px] h-[1273px] bg-white p-10 flex flex-col justify-between border border-slate-200 relative overflow-hidden select-none">
        <div className="space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-slate-200">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase">
              Section I: Academic Outcomes & Participation Trends
            </p>
            <h3 className="text-lg font-black text-blue-900 mt-0.5 uppercase tracking-tight">
              Curriculum Analytics & Class Activity
            </h3>
          </div>

          {/* Highlights & Performance Insights */}
          <div className="grid grid-cols-2 gap-6">
            {/* Student Impact Highlights */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">District Impact Measures</h4>
              </div>
              <ul className="space-y-2.5">
                {reportModel.highlights.slice(0, 3).map((hl: any, index: number) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">
                        {index === 0 ? "Engagement Drive" : index === 1 ? "Outcome Mastery" : "Attendance Accuracy"}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{hl}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance Insights Tiles */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Topic Diagnostic Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InsightTile label="Top Topic" value={reportModel.strongestTopics[0]?.topic ?? "N/A"} sub={`Avg score ${reportModel.strongestTopics[0]?.avg ?? 0}%`} tone="success" />
                <InsightTile label="Remedial Topic" value={reportModel.weakestTopics[0]?.topic ?? "N/A"} sub={`Avg score ${reportModel.weakestTopics[0]?.avg ?? 0}%`} tone="warning" />
                <InsightTile label="Top School" value={reportModel.schoolCompare[0]?.name ?? "N/A"} sub={`${Math.round(reportModel.schoolCompare[0]?.value ?? 0)}% eng.`} tone="primary" />
                <InsightTile label="Lowest School" value={reportModel.schoolCompare.slice(-1)[0]?.name ?? "N/A"} sub={`${Math.round(reportModel.schoolCompare.slice(-1)[0]?.value ?? 0)}% eng.`} tone="muted" />
              </div>
            </div>
          </div>

          {/* Student Activity Trend Line Chart */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">District Activity Timeline (Students vs Assessments)</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportModel.activityData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={reportModel.activityData.every(d => d.students === 0 && d.quizzes === 0) ? [0, 4] : [0, 'auto']} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="students" name="Active Students" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" />
                  <Area type="monotone" dataKey="quizzes" name="Quizzes Taken" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuizzes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Subject Chart + Pie Comparison */}
          <div className="grid grid-cols-12 gap-6">
            {/* Radar Chart */}
            <div className="col-span-7 bg-slate-50 rounded-3xl p-5 border border-slate-200/50 flex flex-col justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Academic Competency Balance</h4>
              <div className="h-[210px] flex items-center justify-center">
                {reportModel.radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={reportModel.radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#475569" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Class Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2.5} />
                      <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 italic">No subject parameters available</p>
                )}
              </div>
            </div>

            {/* Pie comparison */}
            <div className="col-span-5 bg-slate-50 rounded-3xl p-5 border border-slate-200/50 flex flex-col justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">{reportModel.comparisonTitle}</h4>
              <div className="h-[140px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportModel.schoolCompare} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={3}>
                      {reportModel.schoolCompare.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 px-1">
                {reportModel.schoolCompare.slice(0, 3).map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-500 truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{Math.round(item.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>District Outcomes Summary</span>
          <span>VidhyaPlus Platform Review</span>
          <span>Page 2 of 3</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 3 — OPERATIONAL RANKINGS & LEADERBOARDS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="pdf-report-page w-[900px] h-[1273px] bg-white p-10 flex flex-col justify-between border border-slate-200 relative overflow-hidden select-none">
        <div className="space-y-6">
          {/* Header */}
          <div className="pb-4 border-b border-slate-200">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase">
              Section II: Operational Audits & Administrative rankings
            </p>
            <h3 className="text-lg font-black text-blue-900 mt-0.5 uppercase tracking-tight">
              School Rankings & Teacher compliance
            </h3>
          </div>

          {/* School leaderboards (Top 3) & Teacher compliance */}
          <div className="grid grid-cols-12 gap-6">
            {/* Leaderboards */}
            <div className="col-span-7 bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {klass !== "All Classes" ? "Student Performance Rankings" : school !== "All Schools" ? "Class Performance Rankings" : "School Performance Rankings"}
                </h4>
                <span className="text-[8px] font-bold text-slate-400 font-mono">
                  {klass !== "All Classes" ? "Quiz Avg 60% | Attendance 40%" : school !== "All Schools" ? "Quiz Avg 50% | Attendance 50%" : "Quiz 40% | Attendance 30% | Sessions 30%"}
                </span>
              </div>
              <div className="space-y-2.5">
                {klass !== "All Classes" ? (
                  reportModel.studentPerformanceRankings.slice(0, 3).map((sr: any) => (
                    <div key={sr.id} className="p-3 rounded-xl bg-white border border-slate-100 relative shadow-sm">
                      <div className="absolute top-2.5 right-3">
                        <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Rank #{sr.rank}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 pr-16 truncate">{sr.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${sr.score}%` }} />
                        </div>
                        <span className="text-xs font-mono font-black text-slate-700">{sr.score}/100</span>
                      </div>
                    </div>
                  ))
                ) : school !== "All Schools" ? (
                  reportModel.classComparison.slice(0, 3).map((cr: any) => (
                    <div key={cr.className} className="p-3 rounded-xl bg-white border border-slate-100 relative shadow-sm">
                      <div className="absolute top-2.5 right-3">
                        <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Rank #{cr.rank}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 pr-16 truncate">{cr.className}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${cr.score}%` }} />
                        </div>
                        <span className="text-xs font-mono font-black text-slate-700">{cr.score}/100</span>
                      </div>
                    </div>
                  ))
                ) : (
                  reportModel.schoolScores.slice(0, 3).map((ss: any) => (
                    <div key={ss.name} className="p-3 rounded-xl bg-white border border-slate-100 relative shadow-sm">
                      <div className="absolute top-2.5 right-3">
                        <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Rank #{ss.rank}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 pr-16 truncate">{ss.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500" style={{ width: `${ss.score}%` }} />
                        </div>
                        <span className="text-xs font-mono font-black text-slate-700">{ss.score}/100</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Teacher compliance */}
            <div className="col-span-5 bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Teacher Operational Compliance</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-slate-500 font-medium">Active Teachers</span>
                  <span className="font-bold text-slate-800">{reportModel.teacherActivity.activeTeachers}/{reportModel.teacherActivity.totalTeachers}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-slate-500 font-medium">Sessions Conducted</span>
                  <span className="font-bold text-slate-800">{reportModel.teacherActivity.sessionsConducted}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-slate-500 font-medium">Subjects Taught</span>
                  <span className="font-bold text-slate-800">{reportModel.teacherActivity.subjectsCovered}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <span className="text-slate-500 font-medium">QR Attendance Marked</span>
                  <span className="font-bold text-teal-600">{reportModel.teacherActivity.attendanceMarkedPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Class-wise or Subject-wise Comparison Table */}
          {klass !== "All Classes" ? (
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Subject Competency Matrix ({klass})</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Subject Name</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Avg Quiz Score</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Assessments</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportModel.subjectPerf.slice(0, 4).map((sp: any) => {
                      const status = sp.avgScore >= 75 ? "Good" : sp.avgScore >= 60 ? "Watch" : "Remedial";
                      return (
                        <tr key={sp.subject} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-700">{sp.subject}</td>
                          <td className="text-center py-2 px-3 text-slate-600 font-semibold">{sp.avgScore}%</td>
                          <td className="text-center py-2 px-3 text-slate-600 font-semibold">{sp.quizzesCount}</td>
                          <td className="text-center py-2 px-3">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                              status === "Good" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                              status === "Watch" && "bg-amber-50 text-amber-700 border border-amber-100",
                              status === "Remedial" && "bg-rose-50 text-rose-700 border border-rose-100",
                            )}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Classroom Activity Matrix</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Class Grade</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Avg Attendance</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Quiz Performance</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Remedial Need</th>
                      <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Status Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportModel.classComparison.slice(0, 4).map((cl: any) => (
                      <tr key={cl.className} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-700">{cl.className}</td>
                        <td className="text-center py-2 px-3 text-slate-600 font-semibold">{cl.avgAttendance}%</td>
                        <td className="text-center py-2 px-3 text-slate-600 font-semibold">{cl.avgMarks}%</td>
                        <td className="text-center py-2 px-3 text-slate-500 font-medium">{cl.weakSubject}</td>
                        <td className="text-center py-2 px-3">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            cl.riskLevel === "green" && "bg-emerald-50 text-emerald-700 border border-emerald-100",
                            cl.riskLevel === "yellow" && "bg-amber-50 text-amber-700 border border-amber-100",
                            cl.riskLevel === "red" && "bg-rose-50 text-rose-700 border border-rose-100",
                          )}>
                            {cl.riskLevel === "green" ? "Good" : cl.riskLevel === "yellow" ? "Watch" : "At Risk"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student Performance Table (Top 5) */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/50 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Academic Honor Roll & High Performers</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</th>
                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Quiz average</th>
                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Academic Score</th>
                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Grade Award</th>
                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {reportModel.studentPerformanceTable.slice(0, 4).map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-700">{s.name}</td>
                      <td className="text-center py-2 px-3 text-slate-600 font-semibold">{s.attendancePct}%</td>
                      <td className="text-center py-2 px-3 text-slate-600 font-semibold">{s.quizAvg}%</td>
                      <td className="text-center py-2 px-3 text-slate-600 font-semibold">{s.performanceIndex}</td>
                      <td className="text-center py-2 px-3 text-blue-800 font-black font-mono">{s.grade}</td>
                      <td className="text-center py-2 px-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                          s.risk === "low" && "bg-emerald-50 text-emerald-700",
                          s.risk === "medium" && "bg-amber-50 text-amber-700",
                          s.risk === "high" && "bg-rose-50 text-rose-700",
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.risk === "low" && "bg-emerald-500", s.risk === "medium" && "bg-amber-500", s.risk === "high" && "bg-rose-500")} />
                          {s.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>District Operational Rankings</span>
          <span>Administrative Audit Log</span>
          <span>Page 3 of 3</span>
        </div>
      </div>
    </div>
  );
};
