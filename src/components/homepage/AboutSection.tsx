// @ts-nocheck
import React from "react";

const G = {
  teal: "#00B98A", tealDark: "#007A5C", navy: "#0A1628", text2: "#4A6274",
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

const cards = [
  { num: "01", bg: "linear-gradient(145deg,#E0FAF3,#C8F5E8)", ibg: "linear-gradient(135deg,#00B98A,#007A5C)", title: "Standardized Delivery", desc: "Consistent, high-quality lesson delivery across all government schools through structured curriculum planning.", icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 1-4 4v14a3 3 0 0 0 3-3h7z" /></> },
  { num: "02", bg: "linear-gradient(145deg,#E8F3FF,#D0E8FF)", ibg: "linear-gradient(135deg,#4FB8F0,#2890CC)", title: "Transparent Monitoring", desc: "Real-time visibility into classroom activities, engagement levels, and session completion for administrators.", icon: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></> },
  { num: "03", bg: "linear-gradient(145deg,#FFF3E0,#FFE8C0)", ibg: "linear-gradient(135deg,#FFB830,#FF8C30)", title: "AI-Assisted Teaching", desc: "Teachers receive AI-generated lesson summaries, activity suggestions, and on-demand explanations instantly.", icon: <><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /><path d="M9 21h6" /><path d="M10 17v1a2 2 0 0 0 4 0v-1" /></> },
  { num: "04", bg: "linear-gradient(145deg,#F0EEFF,#E0D8FF)", ibg: "linear-gradient(135deg,#7C6FEE,#5B4ECC)", title: "Pilot Implementation", desc: "Deployed as an innovation pilot in government schools to bridge educational gaps and improve outcomes.", icon: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" /></> },
];

const AboutSection = () => {
  return (
    <section id="about" style={{ padding: "6rem 0", background: "white" }}>
      <div className="container-max" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SectionTag icon={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} label="About the Initiative" />
        <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: G.navy, marginBottom: ".75rem", lineHeight: 1.2 }}>
          A Innovation For Government Schools of <span style={{ color: G.teal }}>Kumuram Bheem Asifabad</span>
        </h2>
        <p style={{ color: G.text2, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 580, marginBottom: "3rem" }}>Bringing AI-powered standardized teaching and real-time monitoring to every classroom — bridging educational gaps across the district.</p>
        <div className="about-grid">
          {cards.map(({ num, bg, ibg, title, desc, icon }) => (
            <div key={title} className="about-card" style={{ background: bg }}>
              <div style={{ position: "absolute", top: "1rem", right: "1.25rem", fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "3rem", color: "rgba(0,0,0,0.04)", lineHeight: 1 }}>{num}</div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: ibg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </div>
              <h3 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: "1rem", color: G.navy, marginBottom: ".5rem" }}>{title}</h3>
              <p style={{ fontSize: ".83rem", color: G.text2, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
