// @ts-nocheck
import React from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", navy: "#0A1628",
  text2: "#4A6274", gold: "#FFB830", sky: "#4FB8F0", purple: "#7C6FEE",
};

function SectionTag({ icon, label }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,rgba(0,185,138,.08),rgba(0,185,138,.04))", border: "1.5px solid rgba(0,185,138,.2)", borderRadius: 50, padding: "6px 16px", marginBottom: "1rem" }}>
      <div style={{ width: 22, height: 22, background: G.teal, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">{icon}</svg>
      </div>
      <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#007A5C", letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

const steps = [
  { num: "01", bg: "linear-gradient(145deg,#E0FAF3,#B8F0E0)", bc: G.teal, color: G.teal, emoji: "⚙️", title: "Admin Plans", desc: "Configure curriculum, assign lessons per class, register schools, teachers & students with auto-generated QR IDs." },
  { num: "02", bg: "linear-gradient(145deg,#E8F3FF,#C8E0FF)", bc: G.sky, color: G.sky, emoji: "🖥️", title: "Teacher Teaches", desc: "Deliver AI-assisted live sessions with built-in chatbot, YouTube videos, simulations, PPTs, and attendance tracking." },
  { num: "03", bg: "linear-gradient(145deg,#FFF3E0,#FFE0A8)", bc: G.gold, color: G.gold, emoji: "🔲", title: "Students Interact", desc: "Respond to quiz questions via QR cards. Web cam scans responses, scores recorded instantly with live leaderboard." },
  { num: "04", bg: "linear-gradient(145deg,#F0EEFF,#DDD8FF)", bc: G.purple, color: G.purple, emoji: "📊", title: "Data Monitored", desc: "Real-time analytics, stamped activity logs give administrators complete visibility into every school, every day." },
];

const WorkflowSection = () => {
  return (
    <section id="how" style={{ padding: "6rem 0", background: "white" }}>
      <div className="container-max" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <SectionTag icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>} label="Workflow" />
          <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: G.navy }}>How It <span style={{ color: G.teal }}>Works</span></h2>
          <p style={{ color: G.text2, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 540, margin: ".75rem auto 0" }}>A seamless four-step cycle running every day in every classroom — from government planning to student interaction.</p>
        </div>
        <div className="how-grid">
          <div className="how-line" style={{ background: `linear-gradient(90deg,${G.teal},${G.sky},${G.gold},${G.purple})` }} />
          {steps.map(({ num, bg, bc, color, emoji, title, desc }) => (
            <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
              <div className="step-circle" style={{ background: bg, boxShadow: "0 8px 28px rgba(0,0,0,.1)" }}>
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px dashed ${bc}`, opacity: .3 }} />
                <div style={{ position: "absolute", top: -6, right: -6, width: 28, height: 28, borderRadius: "50%", background: "white", border: `2px solid ${bc}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: ".75rem", color, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>{num}</div>
                <span style={{ fontSize: "2.2rem" }}>{emoji}</span>
              </div>
              <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: "1rem", color: G.navy, marginBottom: ".5rem" }}>{title}</div>
              <div style={{ fontSize: ".82rem", color: G.text2, lineHeight: 1.65, maxWidth: 200 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
