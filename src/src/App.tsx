import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import Activities from "./pages/Activities";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherSetup from "./pages/teacher/TeacherSetup";
import LessonScreen from "./pages/teacher/LessonScreen";
import QuizScreen from "./pages/teacher/QuizScreen";
import LiveQuizScan from "./pages/teacher/LiveQuizScan";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SchoolsAnalytics from "./pages/admin/SchoolsAnalytics";
import StudentsFilter from "./pages/admin/StudentsFilter";
import StudentsAnalytics from "./pages/admin/StudentsAnalytics";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentQuiz from "./pages/student/StudentQuiz";
import StudentQuizResults from "./pages/student/StudentQuizResults";
import StudentLiveQuiz from "./pages/student/StudentLiveQuiz";
import StudentQrProfile from "./pages/student/StudentQrProfile";
import NotFound from "./pages/NotFound";
import StudentRegistration from "./pages/admin/StudentRegistration";
import TeacherRegistration from "./pages/admin/TeacherRegistration";
import MvpSubmissionHub from "./pages/MvpSubmissionHub";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mvp" element={<MvpSubmissionHub />} />
            <Route path="/about" element={<About />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/teacher/setup" element={<TeacherSetup />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/lesson" element={<LessonScreen />} />
            <Route path="/teacher/quiz" element={<QuizScreen />} />
            <Route path="/teacher/live-quiz-scan" element={<LiveQuizScan />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/schools-analytics" element={<SchoolsAnalytics />} />
            <Route path="/admin/students-filter" element={<StudentsFilter />} />
            <Route path="/admin/students-analytics" element={<StudentsAnalytics />} />
            <Route path="/admin/register/student" element={<StudentRegistration />} />
            <Route path="/admin/register/teacher" element={<TeacherRegistration />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/quiz" element={<StudentQuiz />} />
            <Route path="/student/quiz-results" element={<StudentQuizResults />} />
            <Route path="/student/live-quiz/:sessionId" element={<StudentLiveQuiz />} />
            <Route path="/student/qr/:token" element={<StudentQrProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
