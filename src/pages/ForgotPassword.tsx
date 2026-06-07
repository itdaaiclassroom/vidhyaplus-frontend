import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { forgotPassword } from "@/api/client";

const G = {
  teal: "#00B98A",
  teal2: "#00D4A0",
  tealDark: "#007A5C",
  navy: "#0A1628",
  text2: "#4A6274",
  text3: "#7A94A8",
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      setSubmitted(true);
      toast.success(response.message || "Reset link sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link.");
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
        <button onClick={() => navigate(-1)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: G.text3, textDecoration: "none", fontSize: ".85rem", fontWeight: 600,
          marginBottom: "1.5rem", transition: "color .2s", background: "none", border: "none", cursor: "pointer"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>

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
                Forgot Password
              </h1>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: ".85rem", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>
          </div>

          <div style={{ padding: "1.75rem 2rem 2rem" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,185,138,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G.teal} strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <h3 style={{ margin: "0 0 0.5rem", color: G.navy }}>Check Your Email</h3>
                <p style={{ color: G.text2, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    width: "100%", padding: "0.9rem",
                    background: `linear-gradient(135deg,${G.teal},${G.teal2})`,
                    color: "white", border: "none", borderRadius: 12,
                    fontFamily: "Poppins,sans-serif", fontWeight: 700, fontSize: "0.95rem",
                    cursor: "pointer", transition: "all .25s",
                  }}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetRequest} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label htmlFor="email" style={labelStyle}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email address"
                      style={{ ...inputStyle, paddingLeft: "2.4rem" }}
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
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
