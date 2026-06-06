// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { adminLogin, teacherLogin, studentLogin, principalLogin, teamLogin } from "@/api/client";
import { toast } from "sonner";
import "@/components/homepage/IndexPage.css";

/* ── Colour palette — same as landing page ── */
const G = {
  teal: "#00B98A",
  teal2: "#00D4A0",
  tealDark: "#007A5C",
  tealGlow: "rgba(0,185,138,0.28)",
  navy: "#0A1628",
  navy2: "#0F2040",
  offwhite: "#F0FBF7",
  text2: "#4A6274",
  text3: "#7A94A8",
};

/* ── Role config ── */
const ROLE_CONFIG = {
  student: {
    label: "Student",
    sub: "Learn, track progress & grow with AI-powered tools",
    emoji: "🎓",
    gradient: "linear-gradient(135deg,#0284C7,#06B6D4)",
    accentBg: "rgba(0,185,138,0.08)",
    accentBorder: "rgba(0,185,138,0.25)",
    accentColor: G.tealDark,
  },
  teacher: {
    label: "Teacher",
    sub: "Conduct live sessions, launch QR quizzes & monitor your class",
    emoji: "👨‍🏫",
    gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)",
    accentBg: "rgba(124,111,238,0.08)",
    accentBorder: "rgba(124,111,238,0.25)",
    accentColor: "#6366F1",
  },
  principal: {
    label: "Principal",
    sub: "School-wide oversight, teacher management & analytics",
    emoji: "🏫",
    gradient: "linear-gradient(135deg,#059669,#10B981)",
    accentBg: "rgba(16,185,129,0.08)",
    accentBorder: "rgba(16,185,129,0.25)",
    accentColor: "#059669",
  },
  admin: {
    label: "Admin",
    sub: "Full system control — schools, curriculum & users",
    emoji: "⚙️",
    gradient: "linear-gradient(135deg,#00B98A,#007A5C)",
    accentBg: "rgba(0,185,138,0.08)",
    accentBorder: "rgba(0,185,138,0.25)",
    accentColor: G.tealDark,
  },
  team: {
    label: "Admin Team",
    sub: "Department-level access for management operations",
    emoji: "🛡️",
    gradient: "linear-gradient(135deg,#00B98A,#007A5C)",
    accentBg: "rgba(0,185,138,0.08)",
    accentBorder: "rgba(0,185,138,0.25)",
    accentColor: G.tealDark,
  },
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") as "teacher" | "admin" | "student" | "principal" | "team" | null;
  const role: "teacher" | "admin" | "student" | "principal" | "team" =
    roleParam === "student" ? "student"
    : roleParam === "teacher" ? "teacher"
    : roleParam === "principal" ? "principal"
    : roleParam === "team" ? "team"
    : "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teacherLoginMode, setTeacherLoginMode] = useState<"email" | "id">("email");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
    setTeacherLoginMode("email");
    setShowPassword(false);
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "student") {
        try {
          const data = await studentLogin({ student_id: email.trim(), password });
          login("student", data.full_name, data.id, undefined, undefined, data.token);
          navigate("/student");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Login failed");
        }
      } else if (role === "admin" || role === "team") {
        try {
          let isTeam = role === "team";
          let data: any;

          if (isTeam) {
            data = await teamLogin({ email: email.trim(), password });
          } else {
            try {
              data = await adminLogin({ email: email.trim(), password });
            } catch (err: any) {
              // If admin login fails, try team login automatically
              try {
                data = await teamLogin({ email: email.trim(), password });
                isTeam = true;
              } catch (err2: any) {
                throw err; // Throw the original error if both fail
              }
            }
          }

          if (isTeam) {
            login("team", data.team_name || data.full_name, undefined, undefined, undefined, data.token);
            if (data.role) localStorage.setItem("auth.teamRole", data.role);
          } else {
            login(data.role || "admin", data.full_name, undefined, undefined, undefined, data.token);
            localStorage.removeItem("auth.teamRole");
          }
          navigate("/admin");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Login failed");
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
            login((data.role || "teacher") as any, data.full_name, undefined, data.id, undefined, data.token);
            navigate("/teacher/setup");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed");
          }
        } else {
          try {
            const data = await teacherLogin({ email: email.trim(), password });
            // Save email for future Teacher ID login
            localStorage.setItem("teacher.lastEmail", email.trim());
            login((data.role || "teacher") as any, data.full_name, undefined, data.id, data.school_id, data.token);
            navigate("/teacher/setup");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed");
          }
        }
      } else if (role === "principal") {
        try {
          const data = await principalLogin({ email: email.trim(), password });
          const actualRole = data.role || "principal";
          login(actualRole as any, data.full_name, undefined, data.id, data.school_id, data.token);
          navigate("/principal");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Login failed";
          const friendlyMsg = msg.toLowerCase().includes("teacher not found")
            ? "Principal account not found. Please check your email and password."
            : msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password")
              ? "Invalid email or password. Please try again."
              : `Login failed: ${msg}`;
          toast.error(friendlyMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset is handled by the administrator. Please contact support.");
  };

  const cfg = ROLE_CONFIG[role];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1.5px solid rgba(0,185,138,0.2)",
    background: "#F8FFFE",
    fontSize: "0.9rem",
    color: G.navy,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    fontFamily: "Nunito,sans-serif",
    boxSizing: "border-box" as const,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Nunito,sans-serif",
    fontWeight: 700,
    fontSize: "0.82rem",
    color: G.text2,
    marginBottom: "0.4rem",
    letterSpacing: ".02em",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg,#E8FBF5 0%,#F0FBF7 40%,#E6F3FF 100%)",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Nunito,sans-serif",
    }}>
      {/* Grid background — same as hero */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(0,185,138,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(0,185,138,0.055) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Decorative teal blobs */}
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,185,138,0.12),transparent 70%)", top: -100, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,212,160,0.1),transparent 70%)", bottom: -80, left: -80, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>

        {/* Back link */}
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: G.text3, textDecoration: "none", fontSize: ".85rem", fontWeight: 600,
          marginBottom: "1.5rem", transition: "color .2s",
        }}
          onMouseOver={e => (e.currentTarget.style.color = G.teal)}
          onMouseOut={e => (e.currentTarget.style.color = G.text3)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to Home
        </Link>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 60px -10px rgba(0,185,138,0.15), 0 8px 24px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,185,138,0.12)",
          overflow: "hidden",
        }}>

          {/* Card header — role colour gradient */}
          <div style={{
            background: cfg.gradient,
            padding: "2rem 2rem 1.75rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: 0, opacity: .08, background: "radial-gradient(circle at 80% 20%, white, transparent 60%)" }} />
            <div style={{
              position: "absolute",
              backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)",
              backgroundSize: "18px 18px",
              inset: 0,
            }} />
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "1.25rem" }}>
                <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.18)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.25)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "white", letterSpacing: "-.01em" }}>
                  Vidya<span style={{ opacity: 0.85 }}>Plus</span>
                </span>
              </div>

              {/* Role badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 50, padding: "4px 14px", marginBottom: ".75rem",
              }}>
                <span style={{ fontSize: ".9rem" }}>{cfg.emoji}</span>
                <span style={{ fontSize: ".75rem", fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: ".06em" }}>{cfg.label} Portal</span>
              </div>

              <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "white", margin: "0 0 .35rem", lineHeight: 1.2 }}>
                Welcome Back
              </h1>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: ".82rem", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                {cfg.sub}
              </p>
            </div>
          </div>

          {/* Card body */}
          <div style={{ padding: "1.75rem 2rem 2rem" }}>

            {/* Teacher mode toggle */}
            {role === "teacher" && (
              <div style={{
                display: "flex", borderRadius: 10, overflow: "hidden",
                border: "1.5px solid rgba(0,185,138,0.2)", marginBottom: "1.25rem",
              }}>
                {[
                  { mode: "email" as const, icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6", label: "Email Login" },
                  { mode: "id" as const, icon: "M21 2H3a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6 12H6v-1a6 6 0 0 1 12 0v1z", label: "Teacher ID" },
                ].map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setTeacherLoginMode(mode); setEmail(""); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "0.65rem 0.5rem", fontSize: ".78rem", fontWeight: 700,
                      border: "none", cursor: "pointer", transition: "all .2s",
                      fontFamily: "Nunito,sans-serif",
                      background: teacherLoginMode === mode ? G.teal : "transparent",
                      color: teacherLoginMode === mode ? "white" : G.text2,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {mode === "email"
                        ? <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
                        : <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/></>
                      }
                    </svg>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Email / ID field */}
              <div style={{ marginBottom: "0.25rem" }}>
                <label htmlFor="email" style={labelStyle}>
                  {role === "student" ? "Student ID"
                    : role === "teacher" && teacherLoginMode === "id" ? "Teacher ID"
                      : "Email Address"}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                    {role === "student" || (role === "teacher" && teacherLoginMode === "id") ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    )}
                  </div>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={role === "student" ? "Enter your student ID"
                      : role === "teacher" && teacherLoginMode === "id" ? "Enter your teacher ID"
                        : "Enter your email address"}
                    style={{ ...inputStyle, paddingLeft: "2.4rem" }}
                    onFocus={e => { e.currentTarget.style.borderColor = G.teal; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,185,138,0.12)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,185,138,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                {role === "student" && (
                  <p style={{ fontSize: ".73rem", color: G.text3, marginTop: "0.3rem" }}>Use the numeric ID given by your school.</p>
                )}
                {role === "teacher" && teacherLoginMode === "id" && (
                  <p style={{ fontSize: ".73rem", color: G.text3, marginTop: "0.3rem" }}>Use the Teacher ID assigned after your first email login.</p>
                )}
              </div>

              {/* Password field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label htmlFor="password" style={{ ...labelStyle, margin: 0 }}>Password</label>
                  {role === "teacher" && (
                    <button type="button" onClick={handleForgotPassword} style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: ".75rem", fontWeight: 700, color: G.teal,
                      fontFamily: "Nunito,sans-serif", padding: 0,
                    }}>
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    style={{ ...inputStyle, paddingLeft: "2.4rem", paddingRight: "2.8rem" }}
                    onFocus={e => { e.currentTarget.style.borderColor = G.teal; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,185,138,0.12)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,185,138,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: G.text3, display: "flex", padding: 0 }}
                    tabIndex={-1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {showPassword
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: loading ? "rgba(0,185,138,0.5)" : `linear-gradient(135deg,${G.teal},${G.teal2})`,
                  color: "white", border: "none", borderRadius: 12,
                  fontFamily: "Poppins,sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : `0 6px 20px rgba(0,185,138,0.35)`,
                  transition: "all .25s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: "0.25rem",
                }}
                onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,185,138,0.45)`; } }}
                onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = loading ? "none" : `0 6px 20px rgba(0,185,138,0.35)`; }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing In…
                  </>
                ) : (
                  <>
                    Sign In as {ROLE_CONFIG[role].label}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </form>

            {/* Other portal links */}
            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(0,185,138,0.1)" }}>
              <p style={{ fontSize: ".73rem", color: G.text3, textAlign: "center", marginBottom: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Other Portals</p>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: ".5rem" }}>
                {(["student", "teacher", "principal"] as const).filter(r => r !== role).map(r => (
                  <Link
                    key={r}
                    to={`/login?role=${r}`}
                    style={{
                      fontSize: ".73rem", fontWeight: 700, color: G.text2,
                      textDecoration: "none", padding: "4px 12px",
                      borderRadius: 50, border: "1px solid rgba(0,185,138,0.18)",
                      background: "rgba(0,185,138,0.04)", transition: "all .2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(0,185,138,0.1)"; e.currentTarget.style.color = G.tealDark; e.currentTarget.style.borderColor = "rgba(0,185,138,0.3)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "rgba(0,185,138,0.04)"; e.currentTarget.style.color = G.text2; e.currentTarget.style.borderColor = "rgba(0,185,138,0.18)"; }}
                  >
                    {ROLE_CONFIG[r].emoji} {ROLE_CONFIG[r].label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* District badge */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <span style={{
            background: "rgba(0,185,138,0.08)", border: "1px solid rgba(0,185,138,0.2)",
            borderRadius: 8, padding: "6px 16px",
            color: G.tealDark, fontSize: ".72rem", fontWeight: 700,
          }}>
            🏛 Government Schools · Kumuram Bheem Asifabad
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
