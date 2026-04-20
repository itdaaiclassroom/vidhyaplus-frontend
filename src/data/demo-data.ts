export const schools = [
  {
    id: "s1",
    name: "Government High School, Adilabad",
    code: "GHS-ADL",
    district: "Adilabad",
    teachers: 2,
    students: 10,
    classes: 2,
    sessionsCompleted: 24,
    activeStatus: true,
  },
  {
    id: "s2",
    name: "Tribal Welfare School, Utnoor",
    code: "TWS-UTN",
    district: "Utnoor",
    teachers: 2,
    students: 10,
    classes: 2,
    sessionsCompleted: 18,
    activeStatus: true,
  },
];

export const classes = [
  { id: "c1", schoolId: "s1", name: "Class 8-A", section: "A", grade: 8, studentCount: 10 },
  { id: "c2", schoolId: "s2", name: "Class 9-B", section: "B", grade: 9, studentCount: 10 },
  { id: "c3", schoolId: "s1", name: "Class 6-A", section: "A", grade: 6, studentCount: 8 },
  { id: "c4", schoolId: "s2", name: "Class 7-A", section: "A", grade: 7, studentCount: 9 },
];

export const teachers = [
  { id: "t1", name: "Rajesh Kumar", email: "rajesh@demo.com", schoolId: "s1", classIds: ["c1", "c3"], subjects: ["Science", "Mathematics"] },
  { id: "t2", name: "Priya Sharma", email: "priya@demo.com", schoolId: "s2", classIds: ["c2", "c4"], subjects: ["Science", "Mathematics"] },
];

export const students = [
  { id: "st1", name: "Aarav Reddy", rollNo: 1, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st2", name: "Bhavya Devi", rollNo: 2, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st3", name: "Charan Teja", rollNo: 3, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st4", name: "Divya Sri", rollNo: 4, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st5", name: "Eshan Kumar", rollNo: 5, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st6", name: "Fatima Begum", rollNo: 6, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st7", name: "Ganesh Rao", rollNo: 7, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st8", name: "Harini Priya", rollNo: 8, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st9", name: "Ishaan Verma", rollNo: 9, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st10", name: "Jaya Lakshmi", rollNo: 10, classId: "c1", schoolId: "s1", score: 0, password: "demo123" },
  { id: "st11", name: "Karthik Naidu", rollNo: 1, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st12", name: "Lavanya Kumari", rollNo: 2, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st13", name: "Mohan Das", rollNo: 3, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st14", name: "Nandini Reddy", rollNo: 4, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st15", name: "Om Prakash", rollNo: 5, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st16", name: "Padma Priya", rollNo: 6, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st17", name: "Rahul Sharma", rollNo: 7, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st18", name: "Sita Devi", rollNo: 8, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st19", name: "Tarun Reddy", rollNo: 9, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
  { id: "st20", name: "Uma Shankar", rollNo: 10, classId: "c2", schoolId: "s2", score: 0, password: "demo123" },
];

export const curriculum = {
  subject: "Science",
  chapter: "Light - Reflection and Refraction",
  topic: "Laws of Reflection",
  date: new Date().toISOString().split("T")[0],
  classId: "c1",
};

export const lessonContent = {
  topic: "Laws of Reflection",
  summary: "Light travels in straight lines and when it strikes a smooth surface, it bounces back following specific rules known as the Laws of Reflection. The angle of incidence equals the angle of reflection, and both rays lie in the same plane as the normal.",
  keyPoints: [
    "Light travels in straight lines (rectilinear propagation)",
    "The angle of incidence equals the angle of reflection (∠i = ∠r)",
    "The incident ray, reflected ray, and normal all lie in the same plane",
    "Regular reflection occurs on smooth surfaces like mirrors",
    "Diffuse reflection occurs on rough surfaces",
  ],
  slideOutline: [
    "Introduction to Light",
    "How Light Travels",
    "What is Reflection?",
    "Laws of Reflection",
    "Types of Reflection",
    "Real-World Applications",
    "Summary & Quiz",
  ],
  activities: [
    "Mirror angle experiment with protractor",
    "Torch and mirror reflection demonstration",
    "Draw ray diagrams on the board",
    "Group discussion: Where do we see reflection?",
  ],
};

export const quizQuestions = [
  {
    id: "q1",
    question: "What is the angle of reflection when the angle of incidence is 45°?",
    options: ["A. 30°", "B. 45°", "C. 60°", "D. 90°"],
    correct: "B",
  },
  {
    id: "q2",
    question: "Which surface gives regular reflection?",
    options: ["A. Rough wall", "B. Crumpled paper", "C. Plane mirror", "D. Cardboard"],
    correct: "C",
  },
  {
    id: "q3",
    question: "The incident ray, reflected ray, and normal lie in the ___",
    options: ["A. Different planes", "B. Same plane", "C. Parallel planes", "D. None"],
    correct: "B",
  },
  {
    id: "q4",
    question: "Light travels in ___",
    options: ["A. Curved lines", "B. Zigzag lines", "C. Straight lines", "D. Circular paths"],
    correct: "C",
  },
  {
    id: "q5",
    question: "Diffuse reflection occurs on ___",
    options: ["A. Mirror", "B. Calm water", "C. Polished metal", "D. Rough surface"],
    correct: "D",
  },
];

export const impactMetrics = {
  schoolsOnboarded: 47,
  teachersActive: 156,
  studentsReached: 4830,
  sessionsCompleted: 1247,
  quizParticipation: 18500,
};

export const activityLogs = [
  { id: "a1", user: "Rajesh Kumar", role: "Teacher", action: "Started lesson session", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-22 09:15:00", gps: "19.6640° N, 78.5320° E" },
  { id: "a2", user: "Rajesh Kumar", role: "Teacher", action: "Launched quiz", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-22 09:45:00", gps: "19.6640° N, 78.5320° E" },
  { id: "a3", user: "Rajesh Kumar", role: "Teacher", action: "Scanned QR response - Aarav Reddy", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-22 09:47:00", gps: "19.6640° N, 78.5320° E" },
  { id: "a4", user: "Rajesh Kumar", role: "Teacher", action: "Completed session", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-22 10:00:00", gps: "19.6640° N, 78.5320° E" },
  { id: "a5", user: "Priya Sharma", role: "Teacher", action: "Started lesson session", school: "TWS Utnoor", class: "Class 9-B", timestamp: "2026-02-22 10:15:00", gps: "19.3570° N, 78.9430° E" },
  { id: "a6", user: "Admin", role: "Admin", action: "Updated lesson plan for Class 8-A", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-22 08:30:00", gps: "17.3850° N, 78.4867° E" },
  { id: "a7", user: "Admin", role: "Admin", action: "Added new students to Class 9-B", school: "TWS Utnoor", class: "Class 9-B", timestamp: "2026-02-21 14:00:00", gps: "17.3850° N, 78.4867° E" },
  { id: "a8", user: "Priya Sharma", role: "Teacher", action: "Used AI Assistant", school: "TWS Utnoor", class: "Class 9-B", timestamp: "2026-02-22 10:30:00", gps: "19.3570° N, 78.9430° E" },
  { id: "a9", user: "Rajesh Kumar", role: "Teacher", action: "Started class recording", school: "GHS Adilabad", class: "Class 8-A", timestamp: "2026-02-23 09:00:00", gps: "19.6640° N, 78.5320° E" },
  { id: "a10", user: "Rajesh Kumar", role: "Teacher", action: "Applied for leave", school: "GHS Adilabad", class: "—", timestamp: "2026-02-23 18:00:00", gps: "19.6640° N, 78.5320° E" },
];

// ===================== Student Portal Data =====================

export const subjects = [
  { id: "sub1", name: "Science", icon: "🔬", grades: [6, 7, 8, 9, 10] },
  { id: "sub2", name: "Mathematics", icon: "📐", grades: [5, 6, 7, 8, 9, 10] },
  { id: "sub3", name: "Social Studies", icon: "🌍", grades: [6, 7, 8, 9] },
  { id: "sub4", name: "English", icon: "📚", grades: [5, 6, 7, 8, 9, 10] },
  { id: "sub5", name: "Hindi", icon: "🗣️", grades: [5, 6, 7, 8, 9, 10] },
  { id: "sub6", name: "Telugu", icon: "📖", grades: [5, 6, 7, 8, 9, 10] },
];

export const chapters = [
  { id: "ch1", subjectId: "sub1", name: "Light - Reflection and Refraction", grade: 8, order: 1 },
  { id: "ch2", subjectId: "sub1", name: "Chemical Reactions", grade: 8, order: 2 },
  { id: "ch3", subjectId: "sub1", name: "Electricity and Circuits", grade: 9, order: 1 },
  { id: "ch4", subjectId: "sub1", name: "Human Body Systems", grade: 9, order: 2 },
  { id: "ch5", subjectId: "sub2", name: "Algebra Basics", grade: 8, order: 1 },
  { id: "ch6", subjectId: "sub2", name: "Geometry & Triangles", grade: 8, order: 2 },
  { id: "ch7", subjectId: "sub2", name: "Quadratic Equations", grade: 9, order: 1 },
  { id: "ch8", subjectId: "sub3", name: "Indian Independence Movement", grade: 8, order: 1 },
  { id: "ch9", subjectId: "sub3", name: "The Constitution of India", grade: 8, order: 2 },
  { id: "ch10", subjectId: "sub4", name: "Prose - The Last Leaf", grade: 8, order: 1 },
  { id: "ch11", subjectId: "sub4", name: "Grammar - Tenses", grade: 8, order: 2 },
];

// ===================== TOPICS (NEW — Chapter → Topic hierarchy) =====================

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  order: number;
  status: "completed" | "in_progress" | "not_started";
  materials: TopicMaterial[];
}

export interface TopicMaterial {
  id: string;
  type: "ppt" | "notes" | "doc" | "video" | "ai_video" | "simulation" | "vr" | "image" | "recording";
  title: string;
  url: string;
}

export const topics: Topic[] = [
  // ch1 topics
  {
    id: "tp1", chapterId: "ch1", name: "Introduction to Light", order: 1, status: "completed",
    materials: [
      { id: "tm1", type: "ppt", title: "What is Light? PPT", url: "#" },
      { id: "tm2", type: "notes", title: "Light Basics Notes", url: "#" },
      { id: "tm3", type: "video", title: "Introduction to Light", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
  },
  {
    id: "tp2", chapterId: "ch1", name: "Laws of Reflection", order: 2, status: "completed",
    materials: [
      { id: "tm4", type: "ppt", title: "Laws of Reflection PPT", url: "#" },
      { id: "tm5", type: "ai_video", title: "AI: Reflection Explained", url: "#" },
      { id: "tm6", type: "simulation", title: "Mirror Simulation", url: "#" },
      { id: "tm7", type: "doc", title: "Worksheet: Ray Diagrams", url: "#" },
    ],
  },
  {
    id: "tp3", chapterId: "ch1", name: "Refraction of Light", order: 3, status: "in_progress",
    materials: [
      { id: "tm8", type: "ppt", title: "Refraction PPT", url: "#" },
      { id: "tm9", type: "video", title: "Refraction Experiment", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "tm10", type: "vr", title: "VR: Light through Glass", url: "#" },
    ],
  },
  {
    id: "tp4", chapterId: "ch1", name: "Real-World Applications", order: 4, status: "not_started",
    materials: [
      { id: "tm11", type: "notes", title: "Applications Notes", url: "#" },
      { id: "tm12", type: "image", title: "Optical Instruments Diagram", url: "#" },
    ],
  },
  // ch2 topics
  {
    id: "tp5", chapterId: "ch2", name: "Types of Chemical Reactions", order: 1, status: "in_progress",
    materials: [
      { id: "tm13", type: "ppt", title: "Chemical Reactions Types", url: "#" },
      { id: "tm14", type: "video", title: "Reactions Demonstration", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "tm15", type: "simulation", title: "Virtual Lab: Reactions", url: "#" },
    ],
  },
  {
    id: "tp6", chapterId: "ch2", name: "Balancing Equations", order: 2, status: "not_started",
    materials: [
      { id: "tm16", type: "notes", title: "Balancing Guide", url: "#" },
      { id: "tm17", type: "doc", title: "Practice Problems", url: "#" },
    ],
  },
  // ch5 topics
  {
    id: "tp7", chapterId: "ch5", name: "Variables and Expressions", order: 1, status: "completed",
    materials: [
      { id: "tm18", type: "ppt", title: "Variables PPT", url: "#" },
      { id: "tm19", type: "ai_video", title: "AI: Understanding Variables", url: "#" },
    ],
  },
  {
    id: "tp8", chapterId: "ch5", name: "Solving Linear Equations", order: 2, status: "in_progress",
    materials: [
      { id: "tm20", type: "ppt", title: "Linear Equations PPT", url: "#" },
      { id: "tm21", type: "doc", title: "Exercise Set 3.1", url: "#" },
    ],
  },
  // ch6 topics
  {
    id: "tp9", chapterId: "ch6", name: "Properties of Triangles", order: 1, status: "in_progress",
    materials: [
      { id: "tm22", type: "ppt", title: "Triangle Properties PPT", url: "#" },
      { id: "tm23", type: "simulation", title: "Interactive Triangle Builder", url: "#" },
    ],
  },
  // ch8 topics
  {
    id: "tp10", chapterId: "ch8", name: "Early Nationalist Movement", order: 1, status: "completed",
    materials: [
      { id: "tm24", type: "video", title: "India's Freedom Struggle", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "tm25", type: "notes", title: "Timeline of Events", url: "#" },
    ],
  },
  {
    id: "tp11", chapterId: "ch8", name: "Gandhi and Non-Violence", order: 2, status: "completed",
    materials: [
      { id: "tm26", type: "ppt", title: "Gandhian Movement PPT", url: "#" },
      { id: "tm27", type: "ai_video", title: "AI: Salt March Story", url: "#" },
    ],
  },
];

// ===================== LIVE SESSIONS (NEW) =====================

export interface LiveSession {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  topicName: string;
  teacherName: string;
  className: string;
  subjectName: string;
  startTime: string;
  status: "active" | "ended";
  attendanceMarked: boolean;
  quizSubmitted: boolean;
  recordingId?: string;
}

// Mutable — teacher dashboard will add/remove
export const liveSessions: LiveSession[] = [];

// ===================== STUDENT BADGES & CERTIFICATES =====================

export interface StudentBadge {
  id: string;
  studentId: string;
  title: string;
  icon: string;
  description: string;
  earnedDate: string;
}

export interface StudentCertificate {
  id: string;
  studentId: string;
  title: string;
  issuer: string;
  date: string;
  type: "completion" | "achievement" | "participation";
}

export const studentBadges: StudentBadge[] = [
  { id: "b1", studentId: "st1", title: "Quiz Master", icon: "🏆", description: "Scored 100% in 3 quizzes", earnedDate: "2026-02-20" },
  { id: "b2", studentId: "st1", title: "Perfect Attendance", icon: "⭐", description: "100% attendance for a month", earnedDate: "2026-02-15" },
  { id: "b3", studentId: "st1", title: "Science Star", icon: "🔬", description: "Top scorer in Science", earnedDate: "2026-02-18" },
  { id: "b4", studentId: "st3", title: "Quiz Master", icon: "🏆", description: "Scored 100% in 3 quizzes", earnedDate: "2026-02-20" },
  { id: "b5", studentId: "st2", title: "Consistent Learner", icon: "📚", description: "Completed all chapters on time", earnedDate: "2026-02-22" },
];

export const studentCertificates: StudentCertificate[] = [
  { id: "cert1", studentId: "st1", title: "Science Olympiad - 1st Place", issuer: "ITDA Education Board", date: "2026-02-15", type: "achievement" },
  { id: "cert2", studentId: "st1", title: "Light & Optics Chapter Completion", issuer: "Smart Learning Portal", date: "2026-02-20", type: "completion" },
  { id: "cert3", studentId: "st1", title: "Inter-School Quiz Participant", issuer: "District Education Office", date: "2026-02-10", type: "participation" },
];

// ===================== Existing Data =====================

export const chapterStatuses: Record<string, "completed" | "in_progress" | "not_started"> = {
  ch1: "completed",
  ch2: "in_progress",
  ch3: "not_started",
  ch4: "not_started",
  ch5: "completed",
  ch6: "in_progress",
  ch7: "not_started",
  ch8: "completed",
  ch9: "not_started",
  ch10: "in_progress",
  ch11: "not_started",
};

export const studyMaterials = [
  { id: "m1", chapterId: "ch1", type: "ppt" as const, title: "Laws of Reflection - PPT", url: "#" },
  { id: "m2", chapterId: "ch1", type: "pdf" as const, title: "Reflection & Refraction Notes", url: "#" },
  { id: "m3", chapterId: "ch1", type: "video" as const, title: "Understanding Reflection", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "m4", chapterId: "ch1", type: "image" as const, title: "Ray Diagram Illustrations", url: "#" },
  { id: "m5", chapterId: "ch2", type: "pdf" as const, title: "Chemical Reactions Handbook", url: "#" },
  { id: "m6", chapterId: "ch2", type: "video" as const, title: "Chemical Reactions Explained", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "m7", chapterId: "ch5", type: "ppt" as const, title: "Algebra Fundamentals", url: "#" },
  { id: "m8", chapterId: "ch5", type: "pdf" as const, title: "Practice Problems Set", url: "#" },
  { id: "m9", chapterId: "ch8", type: "video" as const, title: "India's Freedom Struggle", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "m10", chapterId: "ch10", type: "pdf" as const, title: "The Last Leaf - Summary", url: "#" },
  { id: "m11", chapterId: "ch1", type: "ai_video" as const, title: "AI-Generated: Laws of Reflection Visual", url: "#" },
  { id: "m12", chapterId: "ch2", type: "recording" as const, title: "Recorded Class: Chemical Reactions", url: "#" },
  { id: "m13", chapterId: "ch6", type: "doc" as const, title: "Triangle Properties Worksheet", url: "#" },
];

export const chapterQuizzes = [
  ...quizQuestions.map(q => ({ ...q, chapterId: "ch1" })),
  { id: "cq1", chapterId: "ch2", question: "What is a chemical reaction?", options: ["A. Physical change", "B. Transformation of substances", "C. Mixing of liquids", "D. Heating"], correct: "B" },
  { id: "cq2", chapterId: "ch2", question: "Rusting of iron is an example of?", options: ["A. Decomposition", "B. Combination", "C. Oxidation", "D. Displacement"], correct: "C" },
  { id: "cq3", chapterId: "ch2", question: "What is produced when acid reacts with base?", options: ["A. Gas", "B. Salt and water", "C. Metal", "D. Acid"], correct: "B" },
  { id: "cq4", chapterId: "ch5", question: "What is the value of x in 2x + 4 = 10?", options: ["A. 2", "B. 3", "C. 4", "D. 5"], correct: "B" },
  { id: "cq5", chapterId: "ch5", question: "Simplify: 3(x + 2) = ?", options: ["A. 3x + 2", "B. 3x + 6", "C. x + 6", "D. 3x + 5"], correct: "B" },
];

export const studentQuizResults = [
  { studentId: "st1", chapterId: "ch1", score: 4, total: 5, date: "2026-02-20", answers: ["B", "C", "B", "C", "D"] },
  { studentId: "st1", chapterId: "ch2", score: 2, total: 3, date: "2026-02-21", answers: ["B", "C", "A"] },
  { studentId: "st1", chapterId: "ch5", score: 1, total: 2, date: "2026-02-22", answers: ["B", "A"] },
  { studentId: "st2", chapterId: "ch1", score: 3, total: 5, date: "2026-02-20", answers: ["B", "A", "B", "A", "D"] },
  { studentId: "st3", chapterId: "ch1", score: 5, total: 5, date: "2026-02-20", answers: ["B", "C", "B", "C", "D"] },
  { studentId: "st11", chapterId: "ch3", score: 0, total: 0, date: "2026-02-22", answers: [] },
];

// records tracking how much time each student spent on the platform per day
export const studentUsageLogs = [
  { studentId: "st1", date: "2026-02-20", minutes: 45 },
  { studentId: "st1", date: "2026-02-21", minutes: 30 },
  { studentId: "st1", date: "2026-02-22", minutes: 50 },
  { studentId: "st2", date: "2026-02-20", minutes: 20 },
  { studentId: "st2", date: "2026-02-21", minutes: 25 },
  { studentId: "st3", date: "2026-02-20", minutes: 60 },
];

// links between students and co‑curricular activities with participation status
export const coCurricularRegistrations = [
  { studentId: "st1", activityId: "cca3", status: "participated" as const },
  { studentId: "st2", activityId: "cca2", status: "registered" as const },
  { studentId: "st3", activityId: "cca3", status: "participated" as const },
  { studentId: "st4", activityId: "cca2", status: "registered" as const },
  { studentId: "st5", activityId: "cca1", status: "registered" as const },
];

export const classStatus = [
  { id: "cs1", date: "2026-02-24", classId: "c1", status: "conducted" as const, teacherId: "t1" },
  { id: "cs2", date: "2026-02-23", classId: "c1", status: "conducted" as const, teacherId: "t1" },
  { id: "cs3", date: "2026-02-22", classId: "c1", status: "conducted" as const, teacherId: "t1" },
  { id: "cs4", date: "2026-02-21", classId: "c1", status: "cancelled" as const, teacherId: "t1", reason: "Teacher on leave" },
  { id: "cs5", date: "2026-02-20", classId: "c1", status: "conducted" as const, teacherId: "t1" },
  { id: "cs6", date: "2026-02-24", classId: "c2", status: "conducted" as const, teacherId: "t2" },
  { id: "cs7", date: "2026-02-23", classId: "c2", status: "cancelled" as const, teacherId: "t2", reason: "Holiday" },
  { id: "cs8", date: "2026-02-22", classId: "c2", status: "conducted" as const, teacherId: "t2" },
];

export const coCurricularActivities = [
  {
    id: "cca1",
    title: "Essay Writing Competition",
    category: "Literary",
    date: "2026-03-05",
    status: "upcoming" as const,
    description: "Write an essay on 'Digital Education in Rural India' (500-800 words)",
    registrations: 42,
    icon: "✍️",
  },
  {
    id: "cca2",
    title: "Drawing Competition",
    category: "Art",
    date: "2026-02-28",
    status: "ongoing" as const,
    description: "Theme: 'My Dream School'. Submit artwork digitally.",
    registrations: 65,
    icon: "🎨",
  },
  {
    id: "cca3",
    title: "Inter-School Quiz Competition",
    category: "Quiz",
    date: "2026-02-15",
    status: "completed" as const,
    description: "General knowledge quiz across all subjects",
    registrations: 120,
    results: [
      { rank: 1, studentName: "Aarav Reddy", school: "GHS Adilabad", score: 95 },
      { rank: 2, studentName: "Karthik Naidu", school: "TWS Utnoor", score: 88 },
      { rank: 3, studentName: "Divya Sri", school: "GHS Adilabad", score: 82 },
    ],
    icon: "🧠",
  },
  {
    id: "cca4",
    title: "Sports Day - Kho Kho Tournament",
    category: "Sports",
    date: "2026-03-10",
    status: "upcoming" as const,
    description: "Inter-class Kho Kho tournament for all grades",
    registrations: 80,
    icon: "🏃",
  },
  {
    id: "cca5",
    title: "Cultural Program - Annual Day",
    category: "Cultural",
    date: "2026-03-20",
    status: "upcoming" as const,
    description: "Dance, drama, and singing performances",
    registrations: 150,
    icon: "🎭",
  },
];

export const dailyUpdates = [
  { id: "du1", date: "2026-02-24", classId: "c1", message: "Today's topic: Laws of Reflection. Complete the worksheet by tomorrow.", subject: "Science" },
  { id: "du2", date: "2026-02-23", classId: "c1", message: "Algebra practice set uploaded. Solve exercises 1-10.", subject: "Mathematics" },
  { id: "du3", date: "2026-02-24", classId: "c2", message: "Chapter 3 quiz scheduled for tomorrow. Revise Electricity & Circuits.", subject: "Science" },
];

// ===================== Teacher Module Data =====================

export const leaveApplications = [
  { id: "lv1", teacherId: "t1", date: "2026-02-21", reason: "Personal emergency", status: "approved" as const, appliedOn: "2026-02-19" },
  { id: "lv2", teacherId: "t1", date: "2026-03-01", reason: "Medical appointment", status: "pending" as const, appliedOn: "2026-02-24" },
  { id: "lv3", teacherId: "t2", date: "2026-02-23", reason: "Family function", status: "approved" as const, appliedOn: "2026-02-20" },
  { id: "lv4", teacherId: "t2", date: "2026-03-05", reason: "Training workshop", status: "pending" as const, appliedOn: "2026-02-23" },
];

export const classRecordings = [
  { id: "rec1", teacherId: "t1", classId: "c1", subject: "Science", chapter: "Light - Reflection and Refraction", date: "2026-02-24", duration: "42:15", size: "180 MB", status: "uploaded" as const },
  { id: "rec2", teacherId: "t1", classId: "c1", subject: "Science", chapter: "Chemical Reactions", date: "2026-02-23", duration: "38:30", size: "165 MB", status: "uploaded" as const },
  { id: "rec3", teacherId: "t2", classId: "c2", subject: "Science", chapter: "Electricity and Circuits", date: "2026-02-24", duration: "40:00", size: "172 MB", status: "uploaded" as const },
  { id: "rec4", teacherId: "t1", classId: "c1", subject: "Mathematics", chapter: "Algebra Basics", date: "2026-02-22", duration: "35:20", size: "150 MB", status: "uploaded" as const },
];

export const homework = [
  { id: "hw1", classId: "c1", subject: "Science", chapter: "Light - Reflection and Refraction", title: "Draw ray diagrams for plane mirror", dueDate: "2026-02-25", assignedDate: "2026-02-23", submissions: 7, totalStudents: 10 },
  { id: "hw2", classId: "c1", subject: "Mathematics", chapter: "Algebra Basics", title: "Solve linear equations (Ex 3.1)", dueDate: "2026-02-26", assignedDate: "2026-02-24", submissions: 3, totalStudents: 10 },
  { id: "hw3", classId: "c2", subject: "Science", chapter: "Electricity and Circuits", title: "Circuit diagram worksheet", dueDate: "2026-02-26", assignedDate: "2026-02-24", submissions: 5, totalStudents: 10 },
];

export const studentAttendance = [
  { studentId: "st1", present: 18, total: 20, percentage: 90 },
  { studentId: "st2", present: 16, total: 20, percentage: 80 },
  { studentId: "st3", present: 20, total: 20, percentage: 100 },
  { studentId: "st4", present: 14, total: 20, percentage: 70 },
  { studentId: "st5", present: 19, total: 20, percentage: 95 },
  { studentId: "st6", present: 17, total: 20, percentage: 85 },
  { studentId: "st7", present: 15, total: 20, percentage: 75 },
  { studentId: "st8", present: 20, total: 20, percentage: 100 },
  { studentId: "st9", present: 12, total: 20, percentage: 60 },
  { studentId: "st10", present: 18, total: 20, percentage: 90 },
];

// ===================== Admin Analytics Data =====================

export const teacherEffectiveness = [
  { teacherId: "t1", name: "Rajesh Kumar", classesCompleted: 22, totalScheduled: 24, quizAvgScore: 78, studentEngagement: 85, lessonCompletionRate: 92, rating: 4.5 },
  { teacherId: "t2", name: "Priya Sharma", classesCompleted: 16, totalScheduled: 18, quizAvgScore: 72, studentEngagement: 80, lessonCompletionRate: 88, rating: 4.2 },
];

export const weakTopicHeatmap = [
  { subject: "Science", chapter: "Chemical Reactions", avgScore: 45, attempts: 30, weakStudents: 8 },
  { subject: "Mathematics", chapter: "Quadratic Equations", avgScore: 38, attempts: 22, weakStudents: 12 },
  { subject: "English", chapter: "Grammar - Tenses", avgScore: 52, attempts: 25, weakStudents: 6 },
  { subject: "Science", chapter: "Human Body Systems", avgScore: 55, attempts: 18, weakStudents: 5 },
  { subject: "Social Studies", chapter: "The Constitution of India", avgScore: 48, attempts: 20, weakStudents: 7 },
];

export const engagementMetrics = {
  dailyActiveStudents: [
    { date: "Feb 18", count: 14 },
    { date: "Feb 19", count: 16 },
    { date: "Feb 20", count: 18 },
    { date: "Feb 21", count: 12 },
    { date: "Feb 22", count: 17 },
    { date: "Feb 23", count: 15 },
    { date: "Feb 24", count: 19 },
  ],
  materialViews: { ppt: 120, pdf: 95, video: 210, ai_video: 45, recording: 80 },
  quizCompletionRate: 76,
  avgSessionDuration: 38,
};
