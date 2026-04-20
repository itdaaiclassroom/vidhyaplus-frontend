import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginDropdown, setLoginDropdown] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">ITDA Classroom</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
          <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <Link to="/activities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Co-Curricular</Link>

          <div className="relative">
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setLoginDropdown(!loginDropdown)}
            >
              Login <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            {loginDropdown && (
              <>
                <div className="fixed inset-0" onClick={() => setLoginDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-xl shadow-hover p-2 z-50">
                  <Link
                    to="/login?role=student"
                    className="block px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                    onClick={() => setLoginDropdown(false)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Student Login</span>
                      <span className="text-xs text-muted-foreground">Access your Profile</span>
                    </div>
                  </Link>
                  <Link
                    to="/login?role=teacher"
                    className="block px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                    onClick={() => setLoginDropdown(false)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Teacher Login</span>
                      <span className="text-xs text-muted-foreground">Manage your classes</span>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 pb-4 space-y-2">
          <a href="/#about" className="block py-2 text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>About</a>
          <a href="/#features" className="block py-2 text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</a>
          <Link to="/activities" className="block py-2 text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Co-Curricular</Link>
          <div className="border-t border-border pt-2 space-y-2">
            <Link to="/login?role=student" className="block py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>
              <div className="flex flex-col">
                <span className="font-medium">Student Login</span>
                <span className="text-xs text-muted-foreground">Access your Profile</span>
              </div>
            </Link>
            <Link to="/login?role=teacher" className="block py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>
              <div className="flex flex-col">
                <span className="font-medium">Teacher Login</span>
                <span className="text-xs text-muted-foreground">Manage your classes</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
