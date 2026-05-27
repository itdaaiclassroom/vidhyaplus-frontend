// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", navy: "#0A1628",
};

const FooterSection = () => {
  const cols = [
    { title: "Features", links: ["QR Quiz System", "AI Teaching Assistant", "Live Monitoring", "Study Materials"] },
    { title: "Platform", links: ["QR Quiz", "Features", "How It Works", "About Us", "Support"] },
    { title: "Portals", links: ["Principal Login", "Teacher Login", "Student Login", "Admin Login"] },
  ];

  const getLinkTarget = (title: string, name: string) => {
    if (title === "Features") {
      if (name === "QR Quiz System") return "/#qr";
      return "/#features";
    }
    if (title === "Portals") {
      if (name === "Principal Login") return "/login?role=principal";
      if (name === "Teacher Login") return "/login?role=teacher";
      if (name === "Student Login") return "/login?role=student";
      if (name === "Admin Login") return "/login?role=admin";
    }
    if (name === "QR Quiz") return "/#qr";
    if (name === "Features") return "/#features";
    if (name === "How It Works") return "/#how";
    if (name === "About Us") return "/#about";
    if (name === "Support") return "/support";
    return "/";
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (path.startsWith("/#") && window.location.pathname === "/") {
      e.preventDefault();
      const id = path.substring(2);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer style={{ background: G.navy, padding: "4rem 2rem 2rem" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
              <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#00B98A,#007A5C)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
              </div>
              <span style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "1.2rem", color: "white" }}>VidyaPlus</span>
            </div>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".82rem", lineHeight: 1.7, maxWidth: 240, marginBottom: "1.5rem" }}>A government-led AI innovation initiative bringing standardized, monitored education to tribal government schools — Classes 5 to 10.</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["twitter", "youtube", "mail"].map(s => (
                <div key={s} className="social-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
                    {s === "twitter" && <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />}
                    {s === "youtube" && <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></>}
                    {s === "mail" && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>}
                  </svg>
                </div>
              ))}
            </div>
          </div>
          {cols.map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: ".8rem", color: "white", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "1.25rem" }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
                {links.map(link => {
                  const target = getLinkTarget(title, link);
                  return (
                    <Link key={link} to={target} onClick={(e) => handleLinkClick(e, target)} className="footer-link">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                      {link}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span style={{ color: "rgba(255,255,255,.25)", fontSize: ".75rem" }}>© 2026 VidyaPlus · AI-Powered School LMS · All rights reserved</span>
          <span style={{ background: "rgba(0,185,138,.08)", border: "1px solid rgba(0,185,138,.15)", borderRadius: 8, padding: "5px 14px", color: "rgba(0,185,138,.7)", fontSize: ".72rem", fontWeight: 600 }}>🏛 Tribal Government Schools · Kumuram Bheem Asifabad</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
