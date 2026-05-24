// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const G = {
  teal: "#00B98A", teal2: "#00D4A0", tealDark: "#007A5C",
  navy: "#0A1628", text3: "#7A94A8",
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(20px)", transition: "all .3s",
      borderBottom: "1px solid rgba(0,185,138,0.12)",
      boxShadow: scrolled ? "0 4px 24px rgba(0,185,138,0.1)" : "0 2px 20px rgba(0,185,138,0.06)"
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#00B98A,#007A5C)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,185,138,.35)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </div>
          <span style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: "1.4rem", color: G.navy, whiteSpace: "nowrap" }}>
            Vidya<span style={{ color: G.teal }}>Plus</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="desktop-nav-menu">
          {[["about", "About Us"], ["qr", "QR Quiz"], ["features", "Features"], ["how", "How It Works"]].map(([id, label]) => (
            <button key={id} className="nav-link" onClick={() => scroll(id)} style={{ fontFamily: "Nunito,sans-serif" }}>{label}</button>
          ))}
          <div
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
            style={{ position: "relative" }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowDropdown(!showDropdown);
              }}
              style={{
                background: "linear-gradient(135deg,#00B98A,#007A5C)", color: "white",
                padding: ".65rem 1.6rem", borderRadius: 50, fontWeight: 700, fontSize: ".875rem",
                border: "none", cursor: "pointer", fontFamily: "Poppins,sans-serif",
                boxShadow: "0 4px 14px rgba(0,185,138,.35)", transition: "all .2s",
                display: "inline-block"
              }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={e => (e.currentTarget.style.transform = "none")}
            >
              Login ▾
            </button>
            {showDropdown && (
              <div style={{
                position: "absolute",
                top: "calc(100% - 5px)",
                right: 0,
                paddingTop: "10px",
                width: "180px",
                zIndex: 300,
              }}>
                <div className="login-dropdown-box">
                  <Link to="/login?role=principal" className="login-dropdown-item" onClick={() => setShowDropdown(false)}>Principal Login</Link>
                  <Link to="/login?role=teacher" className="login-dropdown-item" onClick={() => setShowDropdown(false)}>Teacher Login</Link>
                  <Link to="/login?role=student" className="login-dropdown-item" onClick={() => setShowDropdown(false)}>Student Login</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className="mobile-nav-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </div>

      {/* Mobile Nav Collapse Menu */}
      <div className={`mobile-nav-menu ${mobileOpen ? "open" : ""}`}>
        {[["about", "About Us"], ["qr", "QR Quiz"], ["features", "Features"], ["how", "How It Works"]].map(([id, label]) => (
          <button key={id} className="nav-link" onClick={() => scroll(id)} style={{ fontFamily: "Nunito,sans-serif", textAlign: "left", width: "100%", padding: "10px 12px" }}>{label}</button>
        ))}
        <div style={{ borderTop: "1px solid rgba(0,185,138,0.1)", paddingTop: "10px", marginTop: "5px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontWeight: 800, fontSize: ".75rem", color: G.text3, textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: "12px", marginBottom: "4px" }}>Select Portal Login</div>
            <Link to="/login?role=principal" className="login-dropdown-item" style={{ borderRadius: "8px" }} onClick={() => setMobileOpen(false)}>Principal Login</Link>
            <Link to="/login?role=teacher" className="login-dropdown-item" style={{ borderRadius: "8px" }} onClick={() => setMobileOpen(false)}>Teacher Login</Link>
            <Link to="/login?role=student" className="login-dropdown-item" style={{ borderRadius: "8px" }} onClick={() => setMobileOpen(false)}>Student Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
