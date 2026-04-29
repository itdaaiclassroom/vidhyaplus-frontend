import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { fetchAll, getApiBase, type AllDataResponse } from "@/api/client";
import {
  schools as defaultSchools,
  classes as defaultClasses,
  teachers as defaultTeachers,
  students as defaultStudents,
  subjects as defaultSubjects,
  chapters as defaultChapters,
  topics as defaultTopics,
  activityLogs as defaultActivityLogs,
  classStatus as defaultClassStatus,
  leaveApplications as defaultLeaveApplications,
  classRecordings as defaultClassRecordings,
  homework as defaultHomework,
  studentAttendance as defaultStudentAttendance,
  liveSessions as defaultLiveSessions,
  studentQuizResults as defaultStudentQuizResults,
  studyMaterials as defaultStudyMaterials,
  chapterQuizzes as defaultChapterQuizzes,
  impactMetrics as defaultImpactMetrics,
  teacherEffectiveness as defaultTeacherEffectiveness,
  weakTopicHeatmap as defaultWeakTopicHeatmap,
  engagementMetrics as defaultEngagementMetrics,
  curriculum as defaultCurriculum,
  studentUsageLogs as defaultStudentUsageLogs,
} from "@/data/demo-data";

const SUBJECT_ORDER = ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Biology", "Social Studies"] as const;

function sortSubjects<T extends { name?: string | null }>(subjects: T[]): T[] {
  const rank = new Map<string, number>(SUBJECT_ORDER.map((name, index) => [name, index]));
  return [...subjects].sort((a, b) => {
    const aName = (a.name || "").trim();
    const bName = (b.name || "").trim();
    const aRank = rank.has(aName) ? (rank.get(aName) as number) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(bName) ? (rank.get(bName) as number) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return aName.localeCompare(bName);
  });
}

const emptyData: AllDataResponse = {
  schools: [],
  classes: [],
  teachers: [],
  students: [],
  subjects: [],
  chapters: [],
  topics: [],
  studentQuizResults: [],
  activityLogs: [],
  classStatus: [],
  leaveApplications: [],
  classRecordings: [],
  homework: [],
  studentAttendance: [],
  studyMaterials: [],
  liveSessions: [],
  chapterQuizzes: [],
  impactMetrics: { schoolsOnboarded: 0, teachersActive: 0, studentsReached: 0, sessionsCompleted: 0, quizParticipation: 0 },
  teacherEffectiveness: [],
  weakTopicHeatmap: [],
  engagementMetrics: { dailyActiveStudents: [], materialViews: {}, quizCompletionRate: 0, avgSessionDuration: 0 },
  curriculum: null,
  studentUsageLogs: [],
  admins: [],
  topicRecommendations: [],
  liveQuizSessions: [],
  liveQuizAnswers: [],
  timetables: [],
  coCurricularActivities: [],
};

function toAppData(api: AllDataResponse | null): AllDataResponse {
  if (!api) return emptyData;
  return {
    schools: api.schools ?? emptyData.schools,
    classes: api.classes ?? emptyData.classes,
    teachers: api.teachers ?? emptyData.teachers,
    students: api.students ?? emptyData.students,
    subjects: sortSubjects(api.subjects ?? emptyData.subjects),
    chapters: api.chapters ?? emptyData.chapters,
    topics: api.topics ?? emptyData.topics,
    studentQuizResults: api.studentQuizResults ?? emptyData.studentQuizResults,
    activityLogs: api.activityLogs ?? emptyData.activityLogs,
    classStatus: api.classStatus ?? emptyData.classStatus,
    leaveApplications: api.leaveApplications ?? emptyData.leaveApplications,
    classRecordings: api.classRecordings ?? emptyData.classRecordings,
    homework: api.homework ?? emptyData.homework,
    studentAttendance: api.studentAttendance ?? emptyData.studentAttendance,
    studyMaterials: api.studyMaterials ?? emptyData.studyMaterials,
    liveSessions: api.liveSessions ?? emptyData.liveSessions,
    chapterQuizzes: api.chapterQuizzes ?? emptyData.chapterQuizzes,
    impactMetrics: api.impactMetrics ?? emptyData.impactMetrics,
    teacherEffectiveness: api.teacherEffectiveness ?? emptyData.teacherEffectiveness,
    weakTopicHeatmap: api.weakTopicHeatmap ?? emptyData.weakTopicHeatmap,
    engagementMetrics: api.engagementMetrics ?? emptyData.engagementMetrics,
    curriculum: api.curriculum ?? emptyData.curriculum,
    studentUsageLogs: api.studentUsageLogs ?? emptyData.studentUsageLogs,
    admins: api.admins ?? emptyData.admins,
    topicRecommendations: api.topicRecommendations ?? emptyData.topicRecommendations,
    liveQuizSessions: api.liveQuizSessions ?? emptyData.liveQuizSessions,
    liveQuizAnswers: api.liveQuizAnswers ?? emptyData.liveQuizAnswers,
    timetables: api.timetables ?? emptyData.timetables,
    coCurricularActivities: api.coCurricularActivities ?? emptyData.coCurricularActivities,
  };
}

type DataState = {
  data: AllDataResponse;
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
  refetch: () => void;
};

const DataContext = createContext<DataState | null>(null);

const defaultData: AllDataResponse = toAppData({
  ...emptyData,
  schools: defaultSchools as AllDataResponse["schools"],
  classes: defaultClasses as AllDataResponse["classes"],
  teachers: defaultTeachers as AllDataResponse["teachers"],
  students: defaultStudents as AllDataResponse["students"],
  subjects: defaultSubjects as AllDataResponse["subjects"],
  chapters: defaultChapters as AllDataResponse["chapters"],
  topics: defaultTopics as AllDataResponse["topics"],
  activityLogs: defaultActivityLogs as AllDataResponse["activityLogs"],
  classStatus: defaultClassStatus as AllDataResponse["classStatus"],
  leaveApplications: defaultLeaveApplications as AllDataResponse["leaveApplications"],
  classRecordings: defaultClassRecordings as AllDataResponse["classRecordings"],
  homework: defaultHomework as AllDataResponse["homework"],
  studentAttendance: defaultStudentAttendance as AllDataResponse["studentAttendance"],
  liveSessions: defaultLiveSessions as AllDataResponse["liveSessions"],
  studentQuizResults: defaultStudentQuizResults as AllDataResponse["studentQuizResults"],
  studyMaterials: defaultStudyMaterials as AllDataResponse["studyMaterials"],
  chapterQuizzes: defaultChapterQuizzes as AllDataResponse["chapterQuizzes"],
  impactMetrics: defaultImpactMetrics as AllDataResponse["impactMetrics"],
  teacherEffectiveness: defaultTeacherEffectiveness as AllDataResponse["teacherEffectiveness"],
  weakTopicHeatmap: defaultWeakTopicHeatmap as AllDataResponse["weakTopicHeatmap"],
  engagementMetrics: defaultEngagementMetrics as AllDataResponse["engagementMetrics"],
  curriculum: defaultCurriculum as AllDataResponse["curriculum"],
  studentUsageLogs: defaultStudentUsageLogs as AllDataResponse["studentUsageLogs"],
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [apiData, setApiData] = useState<AllDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = getApiBase();

  const load = useMemo(
    () => () => {
      if (!apiUrl) {
        setApiData(null);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      fetchAll()
        .then((d) => {
          setApiData(d);
          setError(null);
        })
        .catch((e) => {
          setApiData(null);
          setError(e?.message || "Failed to load data");
        })
        .finally(() => setLoading(false));
    },
    [apiUrl]
  );

  useEffect(() => {
    load();
  }, [load]);

  const state: DataState = useMemo(
    () => ({
      data: apiUrl ? toAppData(apiData) : defaultData,
      loading: apiUrl ? loading : false,
      error: apiUrl ? error : null,
      isFromApi: Boolean(apiUrl && apiData && !error),
      refetch: load,
    }),
    [apiData, loading, error, apiUrl, load]
  );

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useAppData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) {
    return {
      data: defaultData,
      loading: false,
      error: null,
      isFromApi: false,
      refetch: () => {},
    };
  }
  return ctx;
}
