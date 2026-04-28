// API base: VITE_API_URL or same origin; in dev (ports 8080, 8081, 5173) defaults to http://localhost:3001.
const DEV_FRONTEND_PORTS = ["8080", "8081", "5173"];
function resolveApiBase(): string {
  const fromEnv =
    typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL).trim()
      : "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    const port = window.location.port || (window.location.protocol === "https:" ? "443" : "80");
    if (import.meta.env?.DEV && DEV_FRONTEND_PORTS.includes(port)) return "http://localhost:3001";
    return window.location.origin;
  }
  return "";
}
const API_BASE = resolveApiBase();
const AI_API_BASE = import.meta.env.VITE_AI_API_URL || "http://localhost:8001";



export interface AllDataResponse {
  schools: Array<{ id: string; name: string; code: string; district: string; mandal?: string; teachers: number; students: number; classes: number; sessionsCompleted: number; activeStatus: boolean }>;
  classes: Array<{ id: string; schoolId: string; name: string; section: string; grade: number; studentCount: number }>;
  teachers: Array<{ id: string; name: string; email: string; schoolId: string; classIds: string[]; subjects: string[] }>;
  students: Array<{ 
    id: string; 
    name: string; 
    rollNo: number; 
    section?: string; 
    classId: string | null; 
    schoolId: string; 
    score: number;
    profile_image_path?: string | null;
    profile_image_url?: string | null;
    village?: string;
    mandal?: string;
    district?: string;
    state?: string;
    pincode?: string;
    address?: string;
    is_hosteller?: boolean;
    phone_number?: string;
  }>;
  subjects: Array<{ id: string; name: string; icon: string; grades: number[] }>;
  chapters: Array<{
    id: string;
    subjectId: string;
    name: string;
    grade: number;
    order: number;
    chapterNo?: number | null;
    monthLabel?: string | null;
    periods?: number | null;
    teachingPlanSummary?: string | null;
    concepts?: string | null;
    textbookChunkPdfPath?: string | null;
  }>;
  topics: Array<{ id: string; chapterId: string; name: string; order: number; status: string; topicPptPath?: string | null; materials: Array<{ id: string; type: string; title: string; url: string }>; microLessons?: Array<{ id: string; periodNo: number; conceptText: string; planText: string }> }>;
  studentQuizResults: Array<{ studentId: string; chapterId: string; score: number; total: number; date: string | null; answers: unknown[] }>;
  activityLogs: Array<{ id: string; user: string; role: string; action: string; school: string; class: string; timestamp: string; gps: string }>;
  classStatus: Array<{ id: string; date: string; classId: string; subjectId?: string | null; status: string; teacherId: string; reason: string | null }>;
  leaveApplications: Array<{ id: string; teacherId: string; date: string; reason: string; status: string; appliedOn: string }>;
  classRecordings: Array<{ id: string; teacherId: string; classId: string; subject: string; chapter: string; date: string; duration: string; size: string; status: string }>;
  homework: Array<{ id: string; classId: string; subjectName: string; chapterName: string; title: string; dueDate: string | null; assignedDate: string | null; submissions: number; totalStudents: number }>;
  studentAttendance: Array<{ studentId: string; present: number; total: number; percentage: number }>;
  studyMaterials: Array<{ id: string; chapterId: string; type: string; title: string; url: string }>;
  liveSessions: Array<{ id: string; teacherId: string; classId: string; subjectId: string; chapterId: string; topicId: string; topicName: string; teacherName: string; className: string; subjectName: string; startTime: string; status: string; attendanceMarked: boolean; quizSubmitted: boolean; recordingId: string | null }>;
  chapterQuizzes: Array<{ id: string; chapterId: string; question: string; options: string[]; correct: string }>;
  impactMetrics: { schoolsOnboarded: number; teachersActive: number; studentsReached: number; sessionsCompleted: number; quizParticipation: number };
  teacherEffectiveness: unknown[];
  weakTopicHeatmap: unknown[];
  engagementMetrics: { dailyActiveStudents: unknown[]; materialViews: Record<string, number>; quizCompletionRate: number; avgSessionDuration: number };
  curriculum: unknown;
  studentUsageLogs: unknown[];
  admins: Array<{ id: string; email: string; full_name: string; role: string }>;
  topicRecommendations?: Array<{
    id: string;
    topicId: string;
    chapterId: string;
    subjectId: string;
    grade: number;
    topicName: string;
    classId?: string | null;
    schoolId?: string | null;
    createdAt: string | null;
    links: Array<{ id: string; type: string; title: string; url: string; description: string; orderNum: number }>;
  }>;
  liveQuizSessions?: Array<{
    id: string;
    teacherId: string;
    classId: string;
    chapterId: string;
    topicId: string;
    topicName: string;
    subjectId: string;
    status: string;
    createdAt: string | null;
    questions: Array<{
      id: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      orderNum: number;
    }>;
  }>;
  liveQuizAnswers?: Array<{
    id: string;
    liveQuizSessionId: string;
    studentId: string;
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    createdAt: string | null;
  }>;
  timetables?: Array<{
    classId: string;
    weekDay: number;
    periodNo: number;
    subjectName: string;
    subjectId?: string | null;
    teacherId?: string | null;
    startTime: string;
    endTime: string;
  }>;
  coCurricularActivities?: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    status: string;
    icon: string;
    registrations: number;
    classId?: string | null;
    teacherId?: string | null;
  }>;
}

export interface PrincipalStudent {
  id: number;
  school_id: number;
  section_id: number;
  first_name: string;
  last_name: string;
  roll_no: number;
  category: string;
  joined_at: string;
  grade_id: number;
  section_code: string;
  qr_codes: Array<{ type: string; path: string | null }>;
  profile_image_path?: string | null;
  profile_image_url?: string | null;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pincode?: string;
  address?: string;
  is_hosteller?: number;
  phone_number?: string;
  phone?: string;
  aadhaar?: string;
  father_name?: string;
  mother_name?: string;
  dob?: string;
  gender?: string;
  disabilities?: string;
}

export interface PrincipalTeacher {
  id: number;
  full_name: string;
  email: string;
  role: string;
  subject_ids: string | null;
}

export async function fetchAll(): Promise<AllDataResponse> {
  if (!API_BASE) throw new Error("API URL not set.");
  const res = await fetch(`${API_BASE}/api/all`);
  if (res.status === 404) {
    throw new Error("API not found. Ensure backend is running.");
  }
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = await res.json();
  console.log("API DATA:", data);
  console.log("schools:", data.schools);
  console.log("classes:", data.classes);
  console.log("teachers:", data.teachers);
  console.log("students:", data.students);
  console.log("subjects:", data.subjects);
  console.log("chapters:", data.chapters);
  console.log("topics:", data.topics);
  console.log("studentQuizResults:", data.studentQuizResults);
  console.log("activityLogs:", data.activityLogs);
  console.log("classStatus:", data.classStatus);
  console.log("leaveApplications:", data.leaveApplications);
  console.log("classRecordings:", data.classRecordings);
  console.log("homework:", data.homework);
  console.log("studentAttendance:", data.studentAttendance);
  console.log("studyMaterials:", data.studyMaterials);
  console.log("liveSessions:", data.liveSessions);
  console.log("chapterQuizzes:", data.chapterQuizzes);
  console.log("impactMetrics:", data.impactMetrics);
  console.log("teacherEffectiveness:", data.teacherEffectiveness);
  console.log("weakTopicHeatmap:", data.weakTopicHeatmap);
  console.log("engagementMetrics:", data.engagementMetrics);
  console.log("curriculum:", data.curriculum);
  console.log("studentUsageLogs:", data.studentUsageLogs);
  console.log("admins:", data.admins);
  console.log("topicRecommendations:", data.topicRecommendations);
  console.log("liveQuizSessions:", data.liveQuizSessions);
  console.log("liveQuizAnswers:", data.liveQuizAnswers);
  console.log("timetables:", data.timetables);
  console.log("coCurricularActivities:", data.coCurricularActivities);

  return data as AllDataResponse;
}

export function getApiBase(): string {
  return API_BASE;
}

function getAuthHeaders() {
  const token = localStorage.getItem("auth.token");
  const teacherId = localStorage.getItem("auth.teacherId");
  const schoolId = localStorage.getItem("auth.schoolId");
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  // Attach JWT token if available
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Fallback: legacy header-based auth
  if (teacherId) headers["x-principal-id"] = teacherId;
  if (schoolId) headers["x-school-id"] = schoolId;
  return headers;
}

export async function saveTopicRecommendations(payload: {
  topicId: string;
  chapterId: string;
  subjectId: string;
  grade: number;
  topicName: string;
  classId?: string;
  schoolId?: string;
  videos: Array<{ title: string; url: string; description?: string }>;
  resources: Array<{ title: string; url: string; snippet?: string }>;
}): Promise<{ id: string; saved: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/topic-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createLiveQuiz(payload: {
  teacherId: string;
  classId: string;
  chapterId: string;
  topicId: string;
  topicName: string;
  subjectId: string;
  /** Optional: link to live session so only one quiz per session is created */
  liveSessionId?: string;
}): Promise<{
  id: string;
  questions: Array<{ id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string; orderNum: number }>;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizSession(sessionId: string): Promise<{
  id: string;
  topicName: string;
  status: string;
  questions: Array<{ id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string; orderNum: number }>;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function submitLiveQuizAnswer(sessionId: string, studentId: string, questionId: string, selectedOption: string): Promise<{ ok: boolean; isCorrect: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, questionId, selectedOption }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizLeaderboard(sessionId: string): Promise<{ leaderboard: Array<{ rank: number; studentId: string; studentName: string; score: number }> }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/leaderboard`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizResult(sessionId: string, studentId: string): Promise<{
  total: number;
  correct: number;
  wrong: number;
  percentage: number;
  details: Array<{
    questionId: number;
    questionText: string;
    correctOption: string;
    selectedOption: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/result?student_id=${encodeURIComponent(studentId)}`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function endLiveQuiz(sessionId: string): Promise<{ status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/end`, { method: "PUT" });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizTeacherQr(sessionId: string): Promise<{ sessionId: string; token: string; payloadUrl: string; dataUrl: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/teacher-qr`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function submitLiveQuizScan(
  sessionId: string,
  payload: { questionNo: number; qrRaw: string }
): Promise<{
  ok: boolean;
  sessionId: string;
  questionNo: number;
  studentId: string;
  studentName: string;
  rollNo: string;
  selectedOption: string;
  isCorrect: boolean;
  confirmation: string;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function connectLiveQuizScanner(sessionId: string, deviceId: string): Promise<{ ok: boolean; sessionId: string; connectedDevices: number; started: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchLiveQuizStatus(sessionId: string): Promise<{
  sessionId: string;
  started: boolean;
  connectedDevices: number;
  questions: number;
  students: number;
  answersCaptured: number;
  attendanceReady?: boolean;
  attendanceDate?: string;
  currentQuestionNo?: number;
  progressByQuestion?: Record<string, number>;
  submitted?: boolean;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/status`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function startLiveQuizCapture(sessionId: string): Promise<{ ok: boolean; sessionId: string; started: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/start-capture`, { method: "POST" });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Start a live teaching session; stores in DB and returns session with id. */
export async function startLiveSession(payload: {
  teacherId: string;
  classId: string;
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  topicName: string;
}): Promise<{
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  topicName: string;
  startTime: string;
  status: string;
  attendanceMarked: boolean;
  quizSubmitted: boolean;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** End a live teaching session; updates DB. */
export async function endLiveSession(sessionId: string): Promise<{ id: string; status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-session/${sessionId}/end`, { method: "PUT" });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Submit attendance for a class on a date. Replaces any existing attendance for that class+date. */
export async function submitAttendance(payload: {
  classId: string;
  date: string;
  entries: Array<{ studentId: string; status: "present" | "absent" }>;
  /** When set, updates the live_sessions row so quiz eligibility uses the same date + marked flag. */
  liveSessionId?: string;
}): Promise<{ ok: boolean; date: string; count: number }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Admin: set or upload chapter textbook (replaces existing). Pass either path or { file: base64, filename }. */
export async function updateChapterTextbook(
  chapterId: string,
  payload: { path?: string } | { file: string; filename: string }
): Promise<{ path: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapters/${chapterId}/textbook`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Admin: set or upload topic PPT (replaces existing). Pass either path or { file: base64, filename }. */
export async function updateTopicPpt(
  topicId: string,
  payload: { path?: string } | { file: string; filename: string }
): Promise<{ path: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/topics/${topicId}/ppt`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

async function parseErrorResponse(res: Response): Promise<string> {
  const text = await res.text().catch(() => res.statusText);
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json?.error && typeof json.error === "string") return json.error;
  } catch {
    // not JSON
  }
  return text || res.statusText;
}

export async function registerStudent(body: { 
  school_id: string; 
  section_id: string; 
  first_name: string; 
  last_name: string; 
  category?: string;
  joined_at?: string;
  photo_url?: string;
  [key: string]: unknown;
}): Promise<{ ok: boolean; student_id: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principals/students`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function registerTeacher(body: { 
  school_id: string; 
  full_name: string; 
  email: string; 
  password?: string; 
  subjects?: string[];
  photo_url?: string;
  [key: string]: unknown;
}): Promise<{ ok: boolean; teacher_id: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principals/teachers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchPrincipalStudents(schoolId: string): Promise<PrincipalStudent[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/schools/${schoolId}/students`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchPrincipalTeachers(schoolId: string): Promise<PrincipalTeacher[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/schools/${schoolId}/teachers`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

// ΓöÇΓöÇΓöÇ Principal Grade & Section APIs ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export interface PrincipalGrade {
  id: number;
  grade_label: string;
}

export interface PrincipalSection {
  id: number;
  school_id: number;
  grade_id: number;
  grade_label: string;
  section_code: string;
  display_name: string;
  student_count: number;
}

export async function fetchPrincipalGrades(): Promise<{ grades: PrincipalGrade[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/grades`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchPrincipalSections(gradeId?: number): Promise<{ sections: PrincipalSection[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const q = gradeId != null ? `?grade_id=${gradeId}` : "";
  const res = await fetch(`${API_BASE}/api/principal/sections${q}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createPrincipalSection(body: { grade_id: number; section_code: string }): Promise<{ ok: boolean; section: PrincipalSection }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/sections`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updatePrincipalSection(id: number, body: { section_code: string }): Promise<{ ok: boolean; id: number; section_code: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/sections/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deletePrincipalSection(id: number): Promise<{ ok: boolean; deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/sections/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createSchool(body: { 
  name: string; 
  code: string; 
  district: string; 
  mandal?: string; 
  sessions_completed?: number; 
  active_status?: boolean;
  principalName?: string;
  principalEmail?: string;
  principalPassword?: string;
  logo_url?: string;
}): Promise<{ id: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/schools`, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateSchool(id: string, body: { name?: string; code?: string; district?: string; mandal?: string; sessions_completed?: number; active_status?: boolean; logo_url?: string }): Promise<{ id: string; updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteSchool(id: string): Promise<{ deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateStudent(id: number, data: Partial<PrincipalStudent>): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/students/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deleteStudent(id: string): Promise<{ deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateTeacher(id: string, body: { full_name?: string; email?: string; school_id?: string; password?: string }): Promise<{ id: string; updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteTeacher(id: string): Promise<{ deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export type TeacherAssignment = { id: string; teacherId: string; schoolId: string; classId: string; subjectId: string; subjectName: string; className: string; schoolName: string };

export async function getTeacherAssignments(teacherId: string): Promise<{ assignments: TeacherAssignment[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateTeacherAssignments(
  teacherId: string,
  body: { school_id?: string; assignments: Array<{ school_id?: string; class_id: string; subject_id: string }> }
): Promise<{ updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function adminLogin(body: { email: string; password: string }): Promise<{ id: string; email: string; full_name: string; role: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const data = await res.json();
  // Backend returns { token, user: { id, email, full_name, role } }
  if (data.token && data.user) {
    return { ...data.user, token: data.token };
  }
  // Fallback for old response format
  return { ...data, token: data.token || '' };
}

export async function teacherLogin(body: { email: string; password: string }): Promise<{ id: string; email: string; full_name: string; school_id: string; role: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/auth/login/teacher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const data = await res.json();
  // Backend returns { token, user: { id, email, full_name, school_id, role } }
  if (data.token && data.user) {
    return { ...data.user, token: data.token };
  }
  return { ...data, token: data.token || '' };
}

export async function principalLogin(body: { email: string; password: string }): Promise<{ id: string; email: string; full_name: string; school_id: string; role: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const data = await res.json();
  // Backend returns { token, user: { id, email, full_name, school_id, role } }
  if (data.token && data.user) {
    return { ...data.user, token: data.token };
  }
  return { ...data, token: data.token || '' };
}

export async function studentLogin(body: { student_id: string; password: string }): Promise<{ id: string; full_name: string; school_id: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/auth/login/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const data = await res.json();
  // Backend returns { token, user: { id, full_name, school_id } }
  if (data.token && data.user) {
    return { ...data.user, token: data.token };
  }
  return { ...data, token: data.token || '' };
}

export async function createLeaveApplication(body: { teacher_id: string; start_date: string; reason: string }): Promise<{ id: string; teacherId: string; date: string; reason: string; status: string; appliedOn: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateLeaveApplicationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<{ ok: boolean; id: string; status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/leave/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export type StudentQrCode = { id: string; studentId: string; qrType: string; qrCodeValue: string; qrImagePath: string | null; createdAt: string | null };

export async function getStudentQrCodes(studentId: string): Promise<{ qrcodes: StudentQrCode[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/student/${studentId}/qrcodes`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function downloadStudentQrCodesZip(studentId: string): Promise<Blob> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/student/${studentId}/qrcodes/download`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.blob();
}

export async function getStudentByQrToken(token: string): Promise<{
  qrType: string;
  qrCodeValue: string;
  student: {
    id: string;
    name: string;
    rollNo: string;
    schoolId: string;
    schoolName: string;
    schoolCode?: string;
    grade: number | null;
    section: string;
  };
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/student-qr/${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Chapter-level marks (DB `student_marks`); same source as `studentQuizResults` on `fetchAll`. */
export type StudentMarkApiRow = {
  id: number;
  student_id: number;
  chapter_id: number;
  assessment_type: string | null;
  score: number;
  total: number;
  assessed_on: string;
  live_quiz_session_id?: number | null;
  chapter_name?: string;
  subject_name?: string;
};

export async function fetchStudentMarks(studentId?: string): Promise<{ marks: StudentMarkApiRow[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const q = studentId != null && studentId !== "" ? `?studentId=${encodeURIComponent(studentId)}` : "";
  const res = await fetch(`${API_BASE}/api/student-marks${q}`);
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function submitStudentMark(body: {
  studentId: string | number;
  chapterId: string | number;
  score: number;
  total: number;
  assessedOn?: string;
  assessmentType?: string;
  liveQuizSessionId?: string | number;
}): Promise<{ ok: boolean; id: number; studentId: number; chapterId: number; score: number; total: number; assessedOn: string; liveQuizSessionId?: number | null }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/student-marks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getAiRecommendations(payload: {
  topic: string;
  subject: string;
  grade: number;
}): Promise<{
  videos: Array<{ title: string; url: string; description?: string }>;
  resources: Array<{ title: string; url: string; snippet?: string }>;
}> {
  const res = await fetch(`${AI_API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI Recommendation service returned ${res.status}`);
  return res.json();
}


export async function askAiAssistant(payload: {
  question: string;
  topic?: string;
  subject?: string;
  chapter?: string;
}): Promise<{ question: string; answer: string }> {
  const res = await fetch(`${AI_API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI Assistant service returned ${res.status}`);
  return res.json();
}

export async function fetchSubjectMaterials(subjectId: string): Promise<Array<{ id: string; subject_id: string; title: string; file_path: string; uploaded_by: string; created_at: string }>> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/${subjectId}/materials`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function uploadSubjectMaterial(subjectId: string, payload: { title: string; file: string; contentType?: string }): Promise<{ id: string; file_path: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/${subjectId}/materials`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}




export async function fetchAdminOverview(): Promise<{
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  sessionsCompleted: number;
  sessionsTotal: number;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/overview`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchAdminAnalytics(): Promise<{
  students: Array<{ date: string; active: number }>;
  teachers: Array<{ date: string; active: number }>;
  sessions: { completed: number; remaining: number; total: number };
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/analytics`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createAnnouncement(payload: {
  title: string;
  message: string;
  target_role?: string;
  target_school_id?: string;
}): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/announcements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchTeacherLogs(teacherId?: string): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const q = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : "";
  const res = await fetch(`${API_BASE}/api/admin/logs/teachers${q}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchAdmins(): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/management`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function bulkRegisterStudents(body: { students: any[] }): Promise<{ successful: any[]; failed: any[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/students/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function bulkRegisterTeachers(body: { teachers: any[] }): Promise<{ successful: any[]; failed: any[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

// --- Core School Operations (Assignments & Attendance) ---

export async function assignTeacherSubjectsAndClasses(teacherId: string, payload: { assigned_subject_ids?: number[]; assigned_class_ids?: number[]; assigned_section_ids?: number[] }): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/teachers/${teacherId}/assignments`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchTeacherAssignments(teacherId: string): Promise<{ assigned_subject_ids: number[]; assigned_class_ids: number[]; assigned_section_ids: number[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function markTeacherSelfAttendance(teacherId: string, status: "present" | "absent" | "leave"): Promise<{ ok: boolean; status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/attendance`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchTodayTeacherAttendance(teacherId: string): Promise<{ marked: boolean; status?: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/attendance/today`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateStudentAttendanceRecord(attendanceId: string, status: "present" | "absent"): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/students/attendance/${attendanceId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchTeacherAttendanceSummary(schoolId?: string, date?: string): Promise<any> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  let url = `${API_BASE}/api/principal/dashboard/teacher-attendance-summary`;
  const params = new URLSearchParams();
  if (schoolId) params.append("schoolId", schoolId);
  if (date) params.append("date", date);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchStudentAttendanceSummary(schoolId?: string, date?: string): Promise<any> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  let url = `${API_BASE}/api/principal/dashboard/student-attendance-summary`;
  const params = new URLSearchParams();
  if (schoolId) params.append("schoolId", schoolId);
  if (date) params.append("date", date);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchPrincipalSubjects(): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/subjects`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}
