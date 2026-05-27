// @ts-nocheck
import React from "react";

const items = [
  { marqueeText: "🎓 AI-Powered Teaching" },
  { marqueeText: "🔲 QR Quiz System" },
  { marqueeText: "📊 Real-Time Analytics" },
  { marqueeText: "🏆 Live Leaderboards" },
  { marqueeText: "📡 Classroom Monitoring" },
  { marqueeText: "🤖 AI Doubt Solver" },
  { marqueeText: "📜 Certificate Wallet" },
];

const MarqueeSection = () => {
  const all = [...items, ...items];
  return (
    <div style={{ background: "#00B98A", padding: ".75rem 0", overflow: "hidden" }}>
      <div className="marquee-track">
        {all.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 1.5rem", fontSize: ".82rem", fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>
            {item.marqueeText} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeSection;
