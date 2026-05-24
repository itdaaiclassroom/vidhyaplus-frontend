// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628", text2: "#4A6274", offwhite: "#F0FBF7",
};

function SectionTag({ icon, label }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,rgba(0,185,138,.08),rgba(0,185,138,.04))", border: "1.5px solid rgba(0,185,138,.2)", borderRadius: 50, padding: "6px 16px", marginBottom: "1rem" }}>
      <div style={{ width: 22, height: 22, background: G.teal, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
      </div>
      <span style={{ fontSize: ".75rem", fontWeight: 700, color: G.tealDark, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function CheckIcon({ color = "#00B98A", size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const portals = [
  {
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    icon: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M9 10h1" /><path d="M14 10h1" /><path d="M9 14h1" /><path d="M14 14h1" /></>,
    title: "Principal Portal", sub: "School-wide oversight — monitor class progress, approve teacher leaves, track quiz stats, and view real-time activity logs.",
    color: "#10B981", ctaLabel: "Access Principal Portal",
    ctaBg: "rgba(16,185,129,.08)", ctaBorder: "rgba(16,185,129,.25)", ctaColor: "#059669",
    features: ["School performance & attendance dashboard", "Class-wise syllabus & chapter completion tracking", "Teacher leave approval & management system", "Real-time classroom session logging", "Quiz performance & live leaderboard reports", "Publish school announcements & notifications"],
    path: "/login?role=principal",
  },
  {
    gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8" /><path d="M8 11h6" /></>,
    title: "Teacher Portal", sub: "Conduct live AI-assisted sessions, launch QR quizzes, and monitor your class performance in real time.",
    color: "#7C6FEE", ctaLabel: "Access Teacher Portal",
    ctaBg: "rgba(124,111,238,.08)", ctaBorder: "rgba(124,111,238,.25)", ctaColor: "#6366F1",
    features: ["Live session with AI chatbot & YouTube", "Attendance marking during sessions", "Launch QR quiz & view live leaderboard", "Syllabus & chapter completion tracking", "Student Activity Enrollment Management System", "Teacher Quiz-Based Evaluation Process", "Student result entry & promotion system"],
    path: "/login?role=teacher",
  },
  {
    gradient: "linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)",
    icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /><path d="M12 22v-4" /></>,
    title: "Student Portal", sub: "Learn, track progress, and grow with AI-powered tools — everything a student needs in one place.",
    color: "#00B98A", ctaLabel: "Access Student Portal",
    ctaBg: "rgba(0,185,138,.08)", ctaBorder: "rgba(0,185,138,.25)", ctaColor: "#007A5C",
    features: ["Dashboard with class rank & attendance", "Subject-wise performance bar charts", "Study materials: PPTs, videos, simulations", "Student Academic Weakness Tracking System", "AI Tutor chatbot for instant doubt clearing", "Student Portal Event Enrollment Feature", "Certificate wallet & badge collection"],
    path: "/login?role=student",
  },
];

const PortalsSection = () => {
  return (
    <section id="portals" style={{ padding: "6rem 0", background: G.offwhite }}>
      <div className="container-max" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SectionTag icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>} label="Three Portals" />
        <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: G.navy, marginBottom: ".75rem" }}>One Platform, <span style={{ color: G.teal }}>Every Role</span></h2>
        <p style={{ color: G.text2, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 560, marginBottom: "3rem" }}>Dedicated dashboards for principals, teachers, and students — each purpose-built for their specific daily workflows.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
          {portals.map(({ gradient, icon, title, sub, color, ctaLabel, ctaBg, ctaBorder, ctaColor, features, path }) => (
            <div key={title} className="portal-card" style={{ "--hover-glow": `${color}22`, "--hover-border": `${color}55` } as React.CSSProperties}>
              {/* Header */}
              <div style={{ background: gradient, padding: "2.5rem 2rem 1.75rem", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, opacity: .08, background: "radial-gradient(circle at 80% 20%, white, transparent 60%)" }} />
                <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">{icon}</svg>
                </div>
                <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "white", marginBottom: ".4rem" }}>{title}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: ".82rem", lineHeight: 1.6 }}>{sub}</div>
              </div>
              {/* Body */}
              <div style={{ padding: "1.75rem 2rem", background: "white", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                  {features.map(feat => (
                    <div key={feat} className="pf-item">
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: `${color}14`, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <CheckIcon color={color} size={11} />
                      </div>
                      <span style={{ fontSize: ".85rem", color: G.text2, lineHeight: 1.5 }}>{feat}</span>
                    </div>
                  ))}
                </div>
                <Link to={path} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "2rem", padding: ".75rem 1.4rem", borderRadius: 50, fontSize: ".85rem", fontWeight: 700, background: ctaBg, color: ctaColor, border: `1.5px solid ${ctaBorder}`, cursor: "pointer", transition: "all .2s", textDecoration: "none" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${ctaBorder}`; }} onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  {ctaLabel} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortalsSection;
