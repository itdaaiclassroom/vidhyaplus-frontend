import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "@/api/client";

const G = {
  teal: "#00B98A",
  teal2: "#00D4A0",
  tealDark: "#007A5C",
  navy: "#0A1628",
  text2: "#4A6274",
  text3: "#7A94A8",
};

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid or missing reset token.");
      navigate("/login");
    }
  }, [token, email, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(email as string, token as string, newPassword);
      toast.success(response.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

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

  if (!token || !email) return null;

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
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(0,185,138,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(0,185,138,0.055) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
        <div style={{
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 60px -10px rgba(0,185,138,0.15), 0 8px 24px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,185,138,0.12)",
          overflow: "hidden",
        }}>
          <div style={{
            background: `linear-gradient(135deg,${G.teal},${G.tealDark})`,
            padding: "2rem 2rem 1.75rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "1.25rem" }}>
                <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.18)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.25)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
              </div>
              <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "white", margin: "0 0 .35rem", lineHeight: 1.2 }}>
                Create New Password
              </h1>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: ".85rem", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                Enter your new password below.
              </p>
            </div>
          </div>

          <div style={{ padding: "1.75rem 2rem 2rem" }}>
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div>
                <label htmlFor="newPassword" style={labelStyle}>New Password</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    style={{ ...inputStyle, paddingLeft: "2.4rem", paddingRight: "2.8rem" }}
                    onFocus={e => { e.currentTarget.style.borderColor = G.teal; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,185,138,0.2)"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: G.text3, padding: 0 }}
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

              <div>
                <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    style={{ ...inputStyle, paddingLeft: "2.4rem", paddingRight: "2.8rem" }}
                    onFocus={e => { e.currentTarget.style.borderColor = G.teal; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,185,138,0.2)"; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: loading ? "rgba(0,185,138,0.5)" : `linear-gradient(135deg,${G.teal},${G.teal2})`,
                  color: "white", border: "none", borderRadius: 12,
                  fontFamily: "Poppins,sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: "0.5rem"
                }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
