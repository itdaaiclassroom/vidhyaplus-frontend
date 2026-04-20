import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminLogin, teacherLogin, studentLogin } from "@/api/client";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as "teacher" | "admin" | "student" | null;
  const role: "teacher" | "admin" | "student" = roleParam === "student" ? "student" : roleParam === "teacher" ? "teacher" : "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
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
      try {
        const data = await teacherLogin({ email: email.trim(), password });
        login("teacher", data.full_name, undefined, data.id);
        navigate("/teacher/setup");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Login failed");
      }
    }
  };

  const roleLabels = { teacher: "Teacher", admin: "Admin", student: "Student" };

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
                  ? "Sign in with your registered email and password"
                  : "Sign in with your admin email and password"}
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <Label htmlFor="email">{role === "student" ? "Student ID" : "Email"}</Label>
              <Input
                id="email"
                type={role === "student" ? "text" : "email"}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1"
                placeholder={role === "student" ? "e.g. 1" : ""}
                required
              />
              {role === "student" && (
                <p className="text-xs text-muted-foreground mt-1">Use the numeric ID given by your school.</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" required />
            </div>

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
