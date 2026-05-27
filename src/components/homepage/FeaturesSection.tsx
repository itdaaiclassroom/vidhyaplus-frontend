// @ts-nocheck
import React from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628", text2: "#4A6274", offwhite: "#F0FBF7",
  gold: "#FFB830", sky: "#4FB8F0", purple: "#7C6FEE",
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

const feats = [
  { color: G.teal, title: "Curriculum-Driven Teaching", desc: "Structured lessons mapped to curriculum topics ensure consistent, standardized delivery across every school.", emoji: "📚" },
  { color: G.purple, title: "AI Teaching Assistant", desc: "On-demand AI support for lesson explanations, simplified concepts, and instant doubt clarification.", emoji: "🤖" },
  { color: G.gold, title: "Interactive QR Quiz System", desc: "Students respond using physical QR cards. Teachers scan for instant evaluation — no devices needed.", emoji: "🔲" },
  { color: G.sky, title: "Real-Time Monitoring Dashboard", desc: "Administrators track session progress, teacher attendance, and school performance live across the district.", emoji: "📡" },
  { color: "#10B981", title: "Smart Study Materials", desc: "PPTs, notes, YouTube videos, images and interactive simulations — organised by subject and topic.", emoji: "🎥" },
];

const FeaturesSection = () => {
  return (
    <section id="features" style={{ padding: "6rem 0", background: G.offwhite }}>
      <div className="container-max" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SectionTag icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />} label="Platform Features" />
        <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: G.navy, marginBottom: ".75rem" }}>Built for <span style={{ color: G.teal }}>Modern Classrooms</span></h2>
        <p style={{ color: G.text2, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 560, marginBottom: "3rem" }}>A comprehensive suite of tools designed for seamless classroom management, transparent monitoring, and engaging learning experiences.</p>
        <div className="features-grid">
          {feats.map(({ color, title, desc, emoji }) => (
            <div key={title} className="feat-card" style={{ "--fc": color } as React.CSSProperties}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: color, transform: "scaleX(0)", transition: "transform .3s", transformOrigin: "left" }} />
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}14`, border: `1.5px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", fontSize: "1.6rem" }}>{emoji}</div>
              <h3 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: "1rem", color: G.navy, marginBottom: ".5rem" }}>{title}</h3>
              <p style={{ fontSize: ".83rem", color: G.text2, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
