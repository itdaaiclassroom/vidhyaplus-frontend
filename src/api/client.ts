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
const AI_API_BASE = (import.meta.env.VITE_AI_API_URL || "http://187.127.158.229:8001").replace(/\/$/, "");



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
  studentQuizResults: Array<{ studentId: string; chapterId: string; assessmentType?: string; score: number; total: number; date: string | null; answers: unknown[] }>;
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
  subjectMaterials?: Array<{
    id: string;
    subject_id: string;
    title: string;
    url: string;
    content_type?: string;
    created_at?: string;
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
  score?: number;
  name?: string;
  rollNo?: number;
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
  const res = await fetch(`${API_BASE}/api/all`, { headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
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
  noOfQuestions?: number;
  mode?: 'qr' | 'teacher' | 'aruco';
}): Promise<{
  id: string;
  questions: Array<{ id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string; orderNum: number }>;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function submitLiveQuizAnswer(sessionId: string, studentId: string, questionId: string, selectedOption: string): Promise<{ ok: boolean; isCorrect: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/answer`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, questionId, selectedOption }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizLeaderboard(sessionId: string): Promise<{ leaderboard: Array<{ rank: number; studentId: string; studentName: string; score: number }> }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/leaderboard`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/result?student_id=${encodeURIComponent(studentId)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function endLiveQuiz(sessionId: string): Promise<{ status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/end`, { method: "PUT", headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getLiveQuizTeacherQr(sessionId: string): Promise<{ sessionId: string; token: string; payloadUrl: string; dataUrl: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/teacher-qr`, { headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function connectLiveQuizScanner(sessionId: string, deviceId: string): Promise<{ ok: boolean; sessionId: string; connectedDevices: number; started: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/connect`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/status`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function startLiveQuizCapture(sessionId: string): Promise<{ ok: boolean; sessionId: string; started: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-quiz/${sessionId}/start-capture`, { method: "POST", headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** End a live teaching session; updates DB. */
export async function endLiveSession(sessionId: string): Promise<{ id: string; status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/live-session/${sessionId}/end`, { method: "PUT", headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** Fetch attendance records for a class on a specific date. */
export async function getStudentAttendance(classId: string, date: string): Promise<Array<{ student_id: string; status: string }>> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/students/attendance?class_id=${classId}&attendance_date=${date}`, {
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE}/api/principal/students`, {
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
  const res = await fetch(`${API_BASE}/api/principal/teachers`, {
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

export interface PrincipalProfile {
  id: number;
  email: string;
  full_name: string;
  school_id: number;
  school_name: string;
  role: string;
}

export async function fetchPrincipalProfile(): Promise<PrincipalProfile> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/profile`, {
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
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateSchool(id: string, body: { name?: string; code?: string; district?: string; mandal?: string; sessions_completed?: number; active_status?: boolean; logo_url?: string }): Promise<{ id: string; updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteSchool(id: string): Promise<{ deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "DELETE", headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/students/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateTeacher(id: string, body: { full_name?: string; email?: string; school_id?: string; password?: string }): Promise<{ id: string; updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteTeacher(id: string): Promise<{ deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export type TeacherAssignment = { id: string; teacherId: string; schoolId: string; classId: string; subjectId: string; subjectName: string; className: string; schoolName: string };

export async function getTeacherAssignments(teacherId: string): Promise<{ assignments: TeacherAssignment[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`, { headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
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

export async function teamLogin(body: { email: string; password: string }): Promise<{ id: string; team_name: string; email: string; role: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/auth/login/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const data = await res.json();
  if (data.token && data.user) {
    return { ...data.user, token: data.token };
  }
  return { ...data, token: data.token || '' };
}

export async function teacherLogin(body: { email: string; password: string }): Promise<{ id: string; email: string; full_name: string; school_id: string; role: string; token: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/login/teacher`, {
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
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateLeaveApplicationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<{ ok: boolean; id: string; status: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/leave/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export type StudentQrCode = { id: string; studentId: string; qrType: string; qrCodeValue: string; qrImagePath: string | null; createdAt: string | null };

export async function getStudentQrCodes(studentId: string): Promise<{ qrcodes: StudentQrCode[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/student/${studentId}/qrcodes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function downloadStudentQrCodesZip(studentId: string): Promise<Blob> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/student/${studentId}/qrcodes/download`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/student-qr/${encodeURIComponent(token)}`, { headers: getAuthHeaders() });
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
  const res = await fetch(`${API_BASE}/api/student-marks${q}`, { headers: getAuthHeaders() });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function getAiRecommendations(payload: {
  topic: string;
  subject: string;
  grade: number;
  chapter?: string;
}): Promise<{
  videos: Array<{ title: string; url: string; description?: string; thumbnail?: string; source?: string }>;
  resources: Array<{ title: string; url: string; snippet?: string }>;
  query_used?: string;
  youtube_source?: string;
}> {
  const res = await fetch(`${API_BASE}/api/ai/recommend`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}


export async function askAiAssistant(payload: {
  question: string;
  topic?: string;
  subject?: string;
  chapter?: string;
}): Promise<{ answer: string; source_docs?: string[]; model_used?: string }> {
  const res = await fetch(`${API_BASE}/api/ai/ask`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchSubjectMaterials(subjectId: string, gradeId?: string): Promise<Array<{ id: string; subject_id: string; grade_id?: number; title: string; file_path: string; uploaded_by: string; created_at: string }>> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const q = gradeId ? `?grade_id=${gradeId}` : "";
  const res = await fetch(`${API_BASE}/api/subjects/${subjectId}/materials${q}`, {
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

export async function uploadTopicPpt(topicId: string, payload: { title: string; file: string; filename: string }): Promise<{ ok: boolean; path: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/topics/${topicId}/ppt`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deleteSubjectMaterial(id: string): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/materials/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deleteTopicPpt(topicId: string): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/topics/${topicId}/ppt`, {
    method: "DELETE",
    headers: getAuthHeaders(),
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

export async function fetchSubjectPerformance(): Promise<Array<{ subject: string; avgScore: number; sessions: number }>> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/performance/subjects`, { headers: getAuthHeaders() });
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

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: number;
  actor_id: string;
  actor_role: string;
  actor_name: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: string;
  entity_id: string | null;
  meta: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: "success" | "failure";
  error_msg: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: AuditLogEntry[];
}

export async function fetchAuditLogs(params?: {
  actor_role?: string;
  actor_id?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<AuditLogResponse> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(
    `${API_BASE}/api/admin/audit-logs${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );
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

export async function fetchTeacherAssessments(teacherId: string): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assessments`, {
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

// ============================
// Chapter Gating APIs
// ============================

export interface ChapterGatingStatus {
  chapterId: string;
  chapterNo: number;
  chapterName: string;
  isLocked: boolean;
  assessmentAvailable: boolean;
  teacherPassed: boolean;
  teacherBestScore: number;
  teacherAttempts: number;
  studentAvgScore: number;
  studentPassPercentage: number;
  studentThresholdMet: boolean;
  totalStudents: number;
  studentsPassed: number;
  overridden: string | null;
  lockReason: string;
}

export interface GatingStatusResponse {
  gatingEnabled: boolean;
  teacherPassThreshold: number;
  studentThreshold: number;
  chapters: ChapterGatingStatus[];
}

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
}

export async function fetchChapterGatingStatus(
  teacherId: string,
  classId: string,
  subjectId: string,
  gradeId: string | number
): Promise<GatingStatusResponse> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const params = new URLSearchParams({
    teacher_id: teacherId,
    class_id: classId,
    subject_id: subjectId,
    grade_id: String(gradeId),
  });
  const res = await fetch(`${API_BASE}/api/chapter-gating/status?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchAssessmentQuestions(chapterId: string): Promise<{
  chapterId: string;
  chapterName: string;
  subjectId: string;
  gradeId: number;
  source: string;
  questions: AssessmentQuestion[];
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  questionCount: number;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/assessment/${chapterId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function submitTeacherAssessment(payload: {
  teacherId: string;
  chapterId: string;
  subjectId: string;
  gradeId: string | number;
  classId: string;
  answers: Array<{ questionId: string; selectedOption: string }>;
  questions: AssessmentQuestion[];
}): Promise<{
  passed: boolean;
  score: number;
  total: number;
  scoredMarks: number;
  totalMarks: number;
  passingMarks: number;
  percentage: number;
  passThreshold: number;
  attemptNumber: number;
  graded: Array<{ questionId: string; selectedOption: string; correctOption: string; isCorrect: boolean }>;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/assessment/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function computeStudentPerformance(classId: string, chapterId: string, subjectId: string): Promise<{
  classId: string;
  chapterId: string;
  avgScore: number;
  passPercentage: number;
  totalStudents: number;
  studentsPassed: number;
  thresholdMet: boolean;
  threshold: number;
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/student-performance/compute`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ classId, chapterId, subjectId }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchGatingConfig(): Promise<{ config: Record<string, string>; rows: Array<{ config_key: string; config_value: string; description: string; updated_at: string }> }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/config`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateGatingConfig(payload: {
  teacher_pass_percentage?: string;
  student_threshold_percentage?: string;
  gating_enabled?: string;
  allow_manual_override?: string;
  assessment_question_count?: string;
  assessment_total_marks?: string;
  assessment_passing_marks?: string;
}): Promise<{ updated: number; ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/config`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export interface ChapterAssessmentConfigItem {
  chapterId: number;
  chapterName: string;
  chapterOrder: number;
  gradeId: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  isCustom: boolean;
}

export async function fetchChapterAssessmentConfig(subjectId: string): Promise<{
  subjectId: string;
  globalDefaults: { questionCount: number; totalMarks: number; passingMarks: number };
  chapters: ChapterAssessmentConfigItem[];
}> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/chapter-config/${subjectId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function upsertChapterAssessmentConfig(chapterId: string, payload: {
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
}): Promise<{ ok: boolean; chapterId: string; questionCount: number; totalMarks: number; passingMarks: number }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/chapter-config/${chapterId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createChapterOverride(payload: {
  teacherId: string;
  chapterId: string;
  classId: string;
  overrideType: "unlock" | "lock";
  reason?: string;
  adminId?: string;
}): Promise<{ ok: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/chapter-gating/override`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchChapterOverrides(teacherId?: string, classId?: string): Promise<{ overrides: any[] }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const params = new URLSearchParams();
  if (teacherId) params.append("teacher_id", teacherId);
  if (classId) params.append("class_id", classId);
  const url = `${API_BASE}/api/chapter-gating/overrides${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

// ─── Admin Management CRUD ────────────────────────────────────────────────────

export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface TeamAccount {
  id: number;
  team_name: string;
  email: string;
  role: string;
  district: string | null;
  is_active: number;
  created_by: number | null;
  created_at: string;
}

/** GET /api/admin/management — list all admin accounts */
export async function fetchAdmins(): Promise<AdminAccount[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/management`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** POST /api/admin/management — create a new admin account */
export async function createAdminAccount(body: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<{ ok: boolean; id: string; name: string; email: string; role: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/management`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** PUT /api/admin/management/:id — update an admin account (password optional) */
export async function updateAdminAccount(
  id: number,
  body: { name?: string; email?: string; password?: string; role?: string }
): Promise<{ ok: boolean; id: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/management/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** DELETE /api/admin/management/:id — delete an admin account */
export async function deleteAdminAccount(id: number): Promise<{ ok: boolean; deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/management/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

// ─── Team Management CRUD ─────────────────────────────────────────────────────

/** GET /api/admin/teams — list all department teams */
export async function fetchTeams(): Promise<TeamAccount[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/teams`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** POST /api/admin/teams — create a new department team */
export async function createTeamAccount(body: {
  team_name: string;
  email: string;
  password: string;
  role: string;
  district?: string;
}): Promise<{ ok: boolean; id: string; team_name: string; email: string; role: string; district?: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/teams`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** PUT /api/admin/teams/:id — update a team (password optional, is_active 0|1) */
export async function updateTeamAccount(
  id: number,
  body: { team_name?: string; email?: string; password?: string; role?: string; district?: string; is_active?: number }
): Promise<{ ok: boolean; id: string }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/teams/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** DELETE /api/admin/teams/:id — permanently delete a team */
export async function deleteTeamAccount(id: number): Promise<{ ok: boolean; deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/admin/teams/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

// ─── Question Bank ─────────────────────────────────────────────────────────────

export interface QuestionBankEntry {
  id: number;
  subject_id: number;
  subject_name: string;
  chapter: string | null;
  topic_name: string | null;
  level: "Easy" | "Medium" | "Hard" | null;
  grade: number | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string | null;
  assigned_for: "student" | "teacher" | "both";
  uploaded_by: string | null;
  created_at: string;
}

export interface QuestionBankResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters: {
    subject_id: number | null;
    grade: string | null;
    chapter: string | null;
    topic_name: string | null;
    level: string | null;
  };
  data: QuestionBankEntry[];
}

export interface BulkUploadQuestionsResponse {
  ok: boolean;
  uploaded: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface CreateQuestionBody {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation?: string;
  chapter?: string;
  topic_name?: string;
  level?: "Easy" | "Medium" | "Hard";
  grade?: number;
  assigned_for?: "student" | "teacher" | "both";
}

/** GET /api/subjects/question-bank — system-wide question bank with optional filters */
export async function fetchQuestionBank(params?: {
  subject_id?: number;
  grade?: number;
  chapter?: string;
  topic_name?: string;
  level?: string;
  page?: number;
  limit?: number;
}): Promise<QuestionBankResponse> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const query = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== "" && v !== 0)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await fetch(
    `${API_BASE}/api/subjects/question-bank${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** POST /api/subjects/:id/question-bank — create a single MCQ question */
export async function createQuestion(
  subjectId: number,
  body: CreateQuestionBody
): Promise<{ ok: boolean; id: string; subject_id: number }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/${subjectId}/question-bank`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** PUT /api/subjects/question-bank/:qid — update an existing question (partial) */
export async function updateQuestion(
  qid: number,
  body: Partial<CreateQuestionBody>
): Promise<{ ok: boolean; id: string; updated: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/question-bank/${qid}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** DELETE /api/subjects/question-bank/:qid — delete a question */
export async function deleteQuestion(qid: number): Promise<{ ok: boolean; deleted: boolean }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/subjects/question-bank/${qid}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

/** POST /api/subjects/question-bank/bulk — global bulk upload from base64 Excel/CSV */
export async function bulkUploadQuestions(
  file: File,
  topicId?: number
): Promise<BulkUploadQuestionsResponse> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch(`${API_BASE}/api/subjects/question-bank/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ file: base64, topic_id: topicId }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchSchoolRanking(): Promise<{ rank: number, total: number }> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const res = await fetch(`${API_BASE}/api/principal/dashboard/school-ranking`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchBroadcastMessages(): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const rolePrefix = localStorage.getItem('role') === 'teacher' ? 'teacher' : 'principal';
  const res = await fetch(`${API_BASE}/api/${rolePrefix}/dashboard/broadcast-messages`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchSubjectTopics(subjectId: number, grade?: number): Promise<any[]> {
  if (!API_BASE) throw new Error("VITE_API_URL is not set");
  const url = grade ? `${API_BASE}/api/subjects/${subjectId}/topics?grade=${grade}` : `${API_BASE}/api/subjects/${subjectId}/topics`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}
