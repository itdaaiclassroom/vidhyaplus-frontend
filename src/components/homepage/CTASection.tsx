// @ts-nocheck
import React from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628",
};

const CTASection = () => {
  return (
    <section id="cta" style={{ padding: "5rem 2rem", background: `linear-gradient(135deg,${G.tealDark},${G.teal},#00C896)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "2px solid rgba(255,255,255,.08)", top: -150, right: -100 }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "2px solid rgba(255,255,255,.06)", bottom: -100, left: -50 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "white", marginBottom: "1rem", lineHeight: 1.2 }}>Empowering Government Schools with Smart Learning</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.8 }}>A district-level government initiative deploying AI-powered teaching, QR-based assessments, and real-time monitoring across government schools of Kumuram Bheem Asifabad — improving accountability and student outcomes every day.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} style={{ border: "2px solid rgba(255,255,255,.5)", color: "white", padding: ".9rem 2.2rem", borderRadius: 50, fontWeight: 700, fontSize: ".95rem", background: "transparent", cursor: "pointer", fontFamily: "Poppins,sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>Learn About the Initiative →</button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
