// @ts-nocheck
import React, { useEffect, useState } from "react";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628", text2: "#4A6274", text3: "#7A94A8",
};

/* ── tiny animated counter ── */
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = to / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

const HeroSection = () => {
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const pills = [
    { emoji: "🤖", label: "AI Doubt Solver" },
    { emoji: "🔲", label: "QR Quiz Cards" },
    { emoji: "📊", label: "Live Analytics" },
    { emoji: "🏆", label: "Leaderboards" },
  ];

  const stats = [
    { num: 150, suffix: "+", label: "Schools" },
    { num: 1200, suffix: "+", label: "Teachers" },
    { num: 25000, suffix: "+", label: "Students" },
    { num: 98, suffix: "%", label: "Completion" },
  ];

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(160deg,#E8FBF5 0%,#F0FBF7 45%,#E6F3FF 100%)",
      padding: "6rem 1.5rem 4rem",
      fontFamily: "Nunito,sans-serif",
    }}>

      {/* ── grid bg ── */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,185,138,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,185,138,0.06) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* ── blobs ── */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,185,138,0.13),transparent 65%)", top: -120, right: -160, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,184,240,0.1),transparent 65%)", bottom: -80, left: -100, pointerEvents: "none" }} />

      {/* ── content wrapper ── */}
      <div style={{ maxWidth: 1200, width: "100%", position: "relative", zIndex: 1 }}>

        {/* ── TOP BADGE ── */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem", animation: "heroFadeUp .6s ease both" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "white", border: "1.5px solid rgba(0,185,138,0.25)",
            borderRadius: 50, padding: "7px 18px",
            fontSize: ".78rem", fontWeight: 800, color: G.tealDark,
            boxShadow: "0 4px 16px rgba(0,185,138,0.12)",
            letterSpacing: ".04em", textTransform: "uppercase",
          }}>
            <span style={{ width: 8, height: 8, background: G.teal, borderRadius: "50%", animation: "heroPulse 1.5s infinite" }} />
            🏛 Tribal Government Schools · Kumuram Bheem Asifabad
          </span>
        </div>

        {/* ── HEADLINE ── */}
        <h1 style={{
          textAlign: "center", fontWeight: 900,
          fontSize: "clamp(2.6rem,5.5vw,4.4rem)",
          lineHeight: 1.08, color: G.navy,
          marginBottom: "1.25rem",
          animation: "heroFadeUp .7s .1s ease both",
        }}>
          AI-Powered Learning<br />
          <span style={{
            background: `linear-gradient(135deg,${G.teal},${G.teal2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            For Every Classroom
          </span>
        </h1>

        {/* ── SUBTEXT ── */}
        <p style={{
          textAlign: "center", color: G.text2,
          fontSize: "clamp(0.95rem,1.8vw,1.1rem)", lineHeight: 1.8,
          maxWidth: 620, margin: "0 auto 2rem",
          animation: "heroFadeUp .7s .18s ease both",
        }}>
          A complete LMS for tribal government schools — live AI sessions, QR quiz cards,
          real-time monitoring &amp; smart analytics for students, teachers &amp; administrators.
        </p>

        {/* ── PILLS ── */}
        <div style={{
          display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10,
          marginBottom: "2.5rem", animation: "heroFadeUp .7s .25s ease both",
        }}>
          {pills.map(({ emoji, label }) => (
            <span key={label} style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 50, fontSize: ".82rem", fontWeight: 700,
              background: "white", border: "1.5px solid rgba(0,185,138,0.2)",
              color: G.text2, boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <span style={{ fontSize: "1rem" }}>{emoji}</span> {label}
            </span>
          ))}
        </div>

        {/* ── CTA BUTTONS ── */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: "1rem", flexWrap: "wrap", marginBottom: "4rem",
          animation: "heroFadeUp .7s .32s ease both",
        }}>
          <button
            onClick={() => scroll("portals")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: `linear-gradient(135deg,${G.teal},${G.teal2})`,
              color: "white", padding: "1rem 2.4rem", borderRadius: 50,
              fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer",
              fontFamily: "Poppins,sans-serif",
              boxShadow: "0 8px 28px rgba(0,185,138,.4)", transition: "all .25s",
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(0,185,138,.5)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,185,138,.4)"; }}
          >
            Explore the Platform
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <button
            onClick={() => scroll("how")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              color: G.text2, fontWeight: 700, fontSize: ".95rem",
              background: "white", border: "1.5px solid rgba(0,185,138,0.25)",
              padding: ".95rem 2rem", borderRadius: 50, cursor: "pointer",
              fontFamily: "Poppins,sans-serif", transition: "all .25s",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = G.teal; e.currentTarget.style.color = G.tealDark; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(0,185,138,0.25)"; e.currentTarget.style.color = G.text2; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={G.teal}><polygon points="5 3 19 12 5 21 5 3" /></svg>
            How It Works
          </button>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px",
          maxWidth: 680, margin: "0 auto 3.5rem",
          background: "rgba(0,185,138,0.12)", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,185,138,0.1)",
          animation: "heroFadeUp .7s .38s ease both",
        }}>
          {stats.map(({ num, suffix, label }) => (
            <div key={label} style={{
              background: "white", padding: "1.25rem .75rem", textAlign: "center",
            }}>
              <div style={{ fontWeight: 900, fontSize: "clamp(1.5rem,3vw,2rem)", color: G.teal, lineHeight: 1, marginBottom: 4 }}>
                <Counter to={num} suffix={suffix} />
              </div>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: G.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── DASHBOARD MOCKUP PANEL ── */}
        <div style={{
          background: "white", borderRadius: 24,
          border: "1px solid rgba(0,185,138,0.14)",
          boxShadow: "0 32px 80px -16px rgba(0,185,138,0.18), 0 8px 32px rgba(0,0,0,0.06)",
          overflow: "hidden", animation: "heroFadeUp .8s .45s ease both",
        }}>

          {/* Window chrome */}
          <div style={{
            background: "linear-gradient(135deg,#0A1628,#0F2040)",
            padding: ".75rem 1.25rem",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#EF4444","#F59E0B","#22C55E"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)",
                borderRadius: 6, padding: "3px 14px", fontSize: ".72rem", color: "rgba(255,255,255,0.55)",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={G.teal} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /></svg>
                vidhyaplus.gov.in · Student Dashboard
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".65rem", fontWeight: 700, color: G.teal, background: "rgba(0,185,138,0.15)", padding: "3px 10px", borderRadius: 20 }}>
              <div style={{ width: 6, height: 6, background: G.teal, borderRadius: "50%", animation: "heroPulse 1.5s infinite" }} /> LIVE
            </div>
          </div>

          {/* Dashboard content */}
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 0 }}>

            {/* Sidebar */}
            <div style={{ background: "#F8FFFE", borderRight: "1px solid rgba(0,185,138,0.1)", padding: "1.25rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${G.teal},${G.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: ".8rem", color: G.navy }}>VidyaPlus</div>
                  <div style={{ fontSize: ".6rem", color: G.text3 }}>Student Portal</div>
                </div>
              </div>
              {[["🏠","Dashboard",true],["📚","My Subjects",false],["🔲","QR Quiz",false],["📊","Analytics",false],["🏆","Leaderboard",false],["📜","Certificates",false]].map(([icon,label,active]) => (
                <div key={label as string} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8, marginBottom: 3,
                  background: active ? `linear-gradient(135deg,${G.teal},${G.teal2})` : "transparent",
                  color: active ? "white" : G.text2,
                  fontSize: ".75rem", fontWeight: active ? 800 : 600,
                  cursor: "default",
                }}>
                  <span style={{ fontSize: ".85rem" }}>{icon as string}</span> {label as string}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{ padding: "1.25rem", borderRight: "1px solid rgba(0,185,138,0.1)" }}>
              <div style={{ fontWeight: 900, fontSize: ".85rem", color: G.navy, marginBottom: "1rem" }}>Welcome back, Arjun! 👋</div>

              {/* Progress ring + bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#E0FAF3,#F0FBF7)", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
                <svg width="60" height="60" viewBox="0 0 60 60" style={{ flexShrink: 0 }}>
                  <circle cx="30" cy="30" r="24" fill="none" stroke="#E8F5F1" strokeWidth="5" />
                  <circle cx="30" cy="30" r="24" fill="none" stroke="url(#pg2)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray="150.8" strokeDashoffset="33" transform="rotate(-90 30 30)" />
                  <defs><linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={G.teal} /><stop offset="100%" stopColor={G.teal2} />
                  </linearGradient></defs>
                  <text x="30" y="35" textAnchor="middle" fontFamily="Nunito" fontWeight="900" fontSize="12" fill={G.teal}>78%</text>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".7rem", color: G.text2, marginBottom: 3 }}>Overall Progress</div>
                  <div style={{ fontWeight: 900, fontSize: "1.4rem", color: G.teal, lineHeight: 1 }}>78%</div>
                  <div style={{ fontSize: ".62rem", color: G.text3 }}>Class Rank: #2 of 32</div>
                </div>
              </div>

              {[["Math","#00B98A",85],["Science","#4FB8F0",72],["English","#7C6FEE",66]].map(([sub,col,pct]) => (
                <div key={sub as string} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".65rem", fontWeight: 700, color: G.text2, marginBottom: 3 }}>
                    <span>{sub as string}</span><span style={{ color: col as string }}>{pct as number}%</span>
                  </div>
                  <div style={{ height: 5, background: "#EEF2F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct as number}%`, height: "100%", background: col as string, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}

              {/* QR Quiz mini */}
              <div style={{ marginTop: "1rem", background: "white", border: "1px solid rgba(0,185,138,0.15)", borderRadius: 10, padding: ".75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                  <span style={{ fontSize: ".68rem", fontWeight: 800, color: G.navy }}>🔲 Live QR Quiz</span>
                  <span style={{ fontSize: ".58rem", fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: 4 }}>● LIVE</span>
                </div>
                <div style={{ fontSize: ".6rem", color: G.text2, marginBottom: ".5rem" }}>Which is the powerhouse of the cell?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {[["A","Nucleus",false],["B","Mitochondria",true],["C","Ribosome",false],["D","Vacuole",false]].map(([o,l,c]) => (
                    <div key={o as string} style={{ padding: "4px 7px", borderRadius: 6, fontSize: ".58rem", fontWeight: 600,
                      border: `1px solid ${(c as boolean) ? "rgba(0,185,138,.4)" : "rgba(0,185,138,.1)"}`,
                      background: (c as boolean) ? "rgba(0,185,138,.12)" : "transparent",
                      color: (c as boolean) ? G.tealDark : G.text2,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: (c as boolean) ? G.teal : "#E8EDEF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(c as boolean) && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      {l as string}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ padding: "1.25rem" }}>
              {/* Leaderboard */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
                  <span style={{ fontWeight: 900, fontSize: ".8rem", color: G.navy }}>🏆 Leaderboard</span>
                  <span style={{ fontSize: ".58rem", fontWeight: 700, color: G.teal, background: "#E0FAF3", padding: "2px 7px", borderRadius: 4 }}>LIVE</span>
                </div>
                {[
                  ["1","Priya N.","460","linear-gradient(135deg,#FFB830,#FF8C30)"],
                  ["2","Arjun K.","440","linear-gradient(135deg,#94A3B8,#64748B)"],
                  ["3","Rohan V.","420","linear-gradient(135deg,#CD7F32,#A0522D)"],
                  ["4","Kavitha R.","400","rgba(200,210,220,0.6)"],
                ].map(([rank,name,pts,bg]) => (
                  <div key={rank as string} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 8, marginBottom: 3, background: rank === "2" ? "rgba(0,185,138,0.06)" : "transparent" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: bg as string, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".6rem", color: "white", flexShrink: 0 }}>{rank as string}</div>
                    <span style={{ flex: 1, fontSize: ".7rem", fontWeight: 700, color: rank === "2" ? G.teal : G.text2 }}>{name as string}</span>
                    <span style={{ fontSize: ".7rem", fontWeight: 900, color: G.teal }}>{pts as string}</span>
                  </div>
                ))}
              </div>

              {/* Today's schedule */}
              <div style={{ background: "linear-gradient(135deg,#0A1628,#0F2040)", borderRadius: 12, padding: "1rem" }}>
                <div style={{ fontWeight: 900, fontSize: ".75rem", color: "white", marginBottom: ".75rem" }}>📅 Today's Classes</div>
                {[
                  [G.teal,"Mathematics","9:00 AM","Ch.5 Algebra"],
                  ["#4FB8F0","Science","11:00 AM","Cell Biology"],
                  ["#7C6FEE","English","2:00 PM","Grammar"],
                ].map(([col,sub,time,topic]) => (
                  <div key={sub as string} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: col as string, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".65rem", fontWeight: 800, color: "white" }}>{sub as string}</div>
                      <div style={{ fontSize: ".58rem", color: "rgba(255,255,255,0.45)" }}>{topic as string}</div>
                    </div>
                    <span style={{ fontSize: ".58rem", fontWeight: 700, color: col as string }}>{time as string}</span>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontWeight: 900, fontSize: ".75rem", color: G.navy, marginBottom: ".6rem" }}>🎖️ Recent Badges</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["🏅","#E0FAF3"],["⭐","#FEF3C7"],["🎯","#F0EEFF"],["🔥","#E8F3FF"]].map(([em,bg]) => (
                    <div key={em as string} style={{ width: 34, height: 34, borderRadius: 10, background: bg as string, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>{em as string}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SCROLL HINT ── */}
        <div style={{ textAlign: "center", marginTop: "2.5rem", animation: "heroFadeUp .7s .6s ease both" }}>
          <button onClick={() => scroll("about")} style={{ background: "none", border: "none", cursor: "pointer", color: G.text3, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: ".75rem", fontWeight: 600 }}>
            Scroll to explore
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "heroBounce 1.6s infinite" }}>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes heroPulse {
          0%,100%{ transform:scale(1); opacity:1; }
          50%    { transform:scale(1.35); opacity:.6; }
        }
        @keyframes heroBounce {
          0%,100%{ transform:translateY(0); }
          50%    { transform:translateY(5px); }
        }
        @media (max-width:900px){
          .hero-db-grid{ grid-template-columns: 1fr !important; }
          .hero-db-sidebar{ display:none !important; }
          .hero-db-right{ display:none !important; }
        }
        @media (max-width:600px){
          .hero-stats-grid{ grid-template-columns:repeat(2,1fr) !important; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
