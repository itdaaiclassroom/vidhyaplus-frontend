// @ts-nocheck
import React from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628", text2: "#4A6274", text3: "#7A94A8",
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

function CheckIcon({ color = "#00B98A", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const problems = [
  { title: "Inconsistent Lesson Delivery", issue: "Teachers follow different standards", solution: "AI-generated structured lesson plans ensure every class follows the same standard across all schools, every day." },
  { title: "Low Student Engagement", issue: "Passive, one-way classroom learning", solution: "Interactive QR quiz cards and real-time leaderboards make every lesson active, competitive, and genuinely fun." },
  { title: "Delayed Feedback Loops", issue: "Results take days; weak areas go unnoticed", solution: "Instant quiz results and session analytics provide immediate performance insights after every single class session." },
  { title: "Limited Monitoring Capability", issue: "Admins have zero visibility into classrooms", solution: "Live session streaming, activity logs, and real-time dashboards give complete transparent oversight." },
];

const ChallengesSection = () => {
  return (
    <section style={{ padding: "6rem 0", background: "white" }}>
      <div className="container-max" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SectionTag icon={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} label="Why This Platform" />
        <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: G.navy, marginBottom: ".75rem" }}>Solving Real <span style={{ color: G.teal }}>Classroom Challenges</span></h2>
        <p style={{ color: G.text2, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 560, marginBottom: "3rem" }}>Technology-driven solutions to the most persistent problems in government school education.</p>
        <div className="problems-grid">
          {problems.map(({ title, issue, solution }) => (
            <div key={title} className="prob-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", border: "1px solid rgba(245,158,11,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.text3} strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E0FAF3", border: "1px solid rgba(0,185,138,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckIcon color={G.teal} size={16} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: ".95rem", color: G.navy, marginBottom: ".5rem" }}>{title}</div>
                  <div style={{ display: "inline-block", background: "#FEF3C7", color: "#92400E", fontSize: ".75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6, marginBottom: ".6rem" }}>⚠ {issue}</div>
                  <div style={{ fontSize: ".83rem", color: G.text2, lineHeight: 1.65 }}>✅ {solution}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChallengesSection;
