// @ts-nocheck
import React, { useState } from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C", tealGlow: "rgba(0,185,138,0.28)",
  navy: "#0A1628", text2: "#4A6274",
};

const QRSection = () => {
  const [stars] = useState(() =>
    Array.from({ length: 0 }, (_, i) => ({ id: i, size: Math.random() * 2 + 1, top: Math.random() * 100, left: Math.random() * 100, delay: Math.random() * 4, dur: 2 + Math.random() * 3 }))
  );

  return (
    <section id="qr" style={{ padding: "6rem 0", background: "linear-gradient(160deg,#0A1628 0%,#0F2040 50%,#0D3060 100%)", position: "relative", overflow: "hidden" }}>
      {stars.map(s => <div key={s.id} className="star" style={{ width: s.size, height: s.size, top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 50%,rgba(0,185,138,0.08),transparent 50%),radial-gradient(circle at 80% 20%,rgba(79,184,240,0.08),transparent 50%)" }} />

      <div className="container-max qr-grid" style={{ paddingTop: 0, paddingBottom: 0, position: "relative", zIndex: 1 }}>
        {/* Left text */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.06)", border: "1.5px solid rgba(0,185,138,.25)", borderRadius: 50, padding: "6px 16px", marginBottom: "1rem" }}>
            <div style={{ width: 22, height: 22, background: G.teal, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </div>
            <span style={{ fontSize: ".75rem", fontWeight: 700, color: G.teal2, letterSpacing: ".05em", textTransform: "uppercase" }}>Signature Feature</span>
          </div>
          <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.8rem)", color: "white", marginBottom: ".75rem", lineHeight: 1.2 }}>
            Interactive <span style={{ color: G.teal2 }}>QR Quiz</span> System
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: ".95rem", lineHeight: 1.8, marginBottom: "2rem", maxWidth: 480 }}>
            Every student gets 4 physical QR cards (A/B/C/D). Questions appear on the classroom screen, students hold up their card, and the teacher scans to score instantly.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              ["1", "Teacher displays question on digital screen", "AI-generated MCQ displayed in full on the classroom dashboard for all students."],
              ["2", "Students hold up their QR answer card", "Each student has 4 cards (A/B/C/D). They raise the card matching their chosen answer."],
              ["3", "Teacher scans cards — instant results", "Camera scan records each response. Scores update automatically in real time."],
              ["4", "Live leaderboard motivates the class", "Rankings display instantly — creating healthy competition and active engagement."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#00B98A,#007A5C)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: ".9rem", color: "white", flexShrink: 0, boxShadow: `0 4px 14px ${G.tealGlow}` }}>{num}</div>
                <div><div style={{ fontWeight: 700, fontSize: ".92rem", color: "white", marginBottom: 3 }}>{title}</div><div style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Question card */}
          <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: "1.75rem", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,185,138,.15)", border: "1px solid rgba(0,185,138,.25)", borderRadius: 50, padding: "4px 12px", fontSize: ".7rem", fontWeight: 700, color: G.teal2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /></svg>Science · Class 8
              </div>
              <div style={{ background: "rgba(255,184,48,.15)", border: "1px solid rgba(255,184,48,.3)", borderRadius: 50, padding: "4px 12px", fontSize: ".7rem", fontWeight: 700, color: "#FFD080", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>00:18
              </div>
            </div>
            <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: "1rem", color: "white", marginBottom: "1.25rem", lineHeight: 1.5 }}>Which organelle is known as the "powerhouse of the cell"?</div>
            <div className="qr-options-grid">
              {[["A", "Nucleus", false], ["B", "Mitochondria ✓", true], ["C", "Ribosome", false], ["D", "Vacuole", false]].map(([opt, label, correct]) => (
                <div key={opt} style={{ borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: ".78rem", border: `1px solid ${correct ? "rgba(0,185,138,.4)" : "rgba(255,255,255,.08)"}`, background: correct ? "rgba(0,185,138,.18)" : "rgba(255,255,255,.04)", color: correct ? G.teal2 : "rgba(255,255,255,.7)", fontWeight: 500 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: correct ? G.teal : "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".68rem", fontWeight: 800, color: correct ? "white" : "rgba(255,255,255,.5)", flexShrink: 0 }}>{opt}</div>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                <div className="scan-fill" style={{ height: "100%", background: `linear-gradient(90deg,${G.teal},${G.teal2})`, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.4)", flexShrink: 0 }}>28/32 scanned</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: "1.5rem", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: ".95rem", color: "white" }}>🏆 Live Leaderboard</div>
              <div style={{ background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 50, padding: "3px 10px", fontSize: ".62rem", fontWeight: 800, color: "#FCA5A5", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, background: "#EF4444", borderRadius: "50%", animation: "pulse 1.2s infinite" }} />LIVE
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: "1.25rem" }}>
              {[{ name: "Rohan", pts: 420, init: "RV", bg: "linear-gradient(135deg,#94A3B8,#64748B)", barH: 38, rank: 2 }, { name: "Priya", pts: 460, init: "PN", bg: "linear-gradient(135deg,#FFB830,#FF8C30)", barH: 54, rank: 1 }, { name: "Arjun", pts: 440, init: "AK", bg: "linear-gradient(135deg,#CD7F32,#A0522D)", barH: 28, rank: 3 }].map(({ name, pts, init, bg, barH, rank }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: rank === 1 ? 48 : 40, height: rank === 1 ? 48 : 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Nunito,sans-serif", fontWeight: 900, color: "white", fontSize: ".7rem", border: "2px solid rgba(255,255,255,.15)" }}>{init}</div>
                  {rank === 1 && <div style={{ background: "#FFD700", color: "#92400E", fontSize: ".55rem", padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>🥇</div>}
                  <div style={{ fontSize: ".62rem", color: rank === 1 ? "#FFD080" : "rgba(255,255,255,.6)", fontWeight: 600 }}>{name}</div>
                  <div style={{ height: barH, width: rank === 1 ? 48 : 40, borderRadius: "6px 6px 0 0", background: rank === 1 ? "rgba(255,184,48,.2)" : "rgba(255,255,255,.08)", border: `1px solid ${rank === 1 ? "rgba(255,184,48,.3)" : "rgba(255,255,255,.1)"}` }} />
                  <div style={{ fontSize: ".65rem", color: rank === 1 ? G.teal2 : "rgba(255,255,255,.5)", fontWeight: 700 }}>{pts}</div>
                </div>
              ))}
            </div>
            {[["4", "Kavitha R.", "400", 80], ["5", "Sai Kumar", "380", 72], ["6", "Ananya P.", "360", 66]].map(([rank, name, score, pct]) => (
              <div key={rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,.03)", fontSize: ".75rem", marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".62rem", color: "rgba(255,255,255,.4)" }}>{rank}</div>
                <span style={{ color: "rgba(255,255,255,.7)", flex: 1 }}>{name}</span>
                <div style={{ width: 50, height: 4, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${G.teal},${G.teal2})` }} /></div>
                <span style={{ color: G.teal2, fontWeight: 700 }}>{score} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QRSection;
