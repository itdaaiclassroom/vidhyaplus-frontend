import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { adminLogin, teacherLogin, studentLogin } from "@/api/client";
import { toast } from "sonner";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as "teacher" | "admin" | "student" | "principal" | null;
  const role: "teacher" | "admin" | "student" | "principal" = roleParam === "student" ? "student" : roleParam === "teacher" ? "teacher" : roleParam === "principal" ? "principal" : "admin";


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacherLoginMode, setTeacherLoginMode] = useState<"email" | "id">("email");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
    setTeacherLoginMode("email");
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "student") {
      try {
        const data = await studentLogin({ student_id: email.trim(), password });
        login("student", data.full_name, data.id);
        navigate("/student");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Login failed");
      }
    } else if (role === "admin") {
      try {
        const data = await adminLogin({ email: email.trim(), password });
        login("admin", data.full_name);
        navigate("/admin");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Login failed");
      }
    } else if (role === "teacher") {
      if (teacherLoginMode === "id") {
        // Teacher ID login — read stored credentials from localStorage
        const storedTeacherId = localStorage.getItem("auth.teacherId");
        const storedEmail = localStorage.getItem("teacher.lastEmail");
        if (!storedTeacherId || !storedEmail) {
          toast.error("Please login once using email before using Teacher ID.");
          return;
        }
        if (email.trim() !== storedTeacherId) {
          toast.error("Teacher ID does not match. Please check your ID.");
          return;
        }
        try {
          const data = await teacherLogin({ email: storedEmail, password });
          login("teacher", data.full_name, undefined, data.id);
          navigate("/teacher/setup");
        } catch (err) {
          alert(err instanceof Error ? err.message : "Login failed");
        }
      } else {
        try {
          const data = await teacherLogin({ email: email.trim(), password });
          // Save email for future Teacher ID login
          localStorage.setItem("teacher.lastEmail", email.trim());
          const actualRole = (data.role as any) || "teacher";
          login(actualRole, data.full_name, undefined, data.id, data.school_id);
          
          if (actualRole === "principal") {
            navigate("/principal");
          } else {
            navigate("/teacher/setup");
          }
        } catch (err) {
          alert(err instanceof Error ? err.message : "Login failed");
        }
      }
    } else if (role === "principal") {
      try {
        const data = await teacherLogin({ email: email.trim(), password });
        const actualRole = (data.role as any) || "principal";
        login(actualRole, data.full_name, undefined, data.id, data.school_id);
        navigate("/principal");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Login failed";
        const friendlyMsg = msg.toLowerCase().includes("teacher not found")
          ? "Principal account not found. Please check your email and password."
          : msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password")
            ? "Invalid email or password. Please try again."
            : `Login failed: ${msg}`;
        alert(friendlyMsg);
      }
    }
  };


  const handleForgotPassword = () => {
    toast.info("Password reset is handled by the administrator. Please contact support.");
  };

  const roleLabels = { teacher: "Teacher", admin: "Admin", student: "Student", principal: "Principal" };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-light via-background to-amber-light p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="bg-card rounded-2xl shadow-hover border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {roleLabels[role]} Login
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "student"
                ? "Sign in with your Student ID and password"
                : role === "teacher"
                  ? teacherLoginMode === "id"
                    ? "Sign in with your Teacher ID and password"
                    : "Sign in with your registered email and password"
                  : "Sign in with your admin email and password"}
            </p>
          </div>

          {/* Teacher login mode toggle */}
          {role === "teacher" && (
            <div className="flex rounded-lg border border-border overflow-hidden mb-5">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  teacherLoginMode === "email"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => { setTeacherLoginMode("email"); setEmail(""); }}
              >
                <Mail className="w-3.5 h-3.5" /> Login with Email
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  teacherLoginMode === "id"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => { setTeacherLoginMode("id"); setEmail(""); }}
              >
                <KeyRound className="w-3.5 h-3.5" /> Login with Teacher ID
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <Label htmlFor="email">
                {role === "student"
                  ? "Student ID"
                  : role === "teacher" && teacherLoginMode === "id"
                    ? "Teacher ID"
                    : "Email"}
              </Label>
              <Input
                id="email"
                type={role === "student" || (role === "teacher" && teacherLoginMode === "id") ? "text" : "email"}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1"
                placeholder={
                  role === "student"
                    ? "e.g. 1"
                    : role === "teacher" && teacherLoginMode === "id"
                      ? "e.g. 7"
                      : ""
                }
                required
              />
              {role === "student" && (
                <p className="text-xs text-muted-foreground mt-1">Use the numeric ID given by your school.</p>
              )}
              {role === "teacher" && teacherLoginMode === "id" && (
                <p className="text-xs text-muted-foreground mt-1">Use the Teacher ID assigned after your first email login.</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" required />
            </div>

            {/* Forgot Password — teacher only */}
            {role === "teacher" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Sign In as {roleLabels[role]}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            All roles require a password. Use the credentials set by your admin or during registration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
