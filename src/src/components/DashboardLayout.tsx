import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Home } from "lucide-react";

const DashboardLayout = ({ children, title, userDisplayName }: { children: ReactNode; title: string; userDisplayName?: string }) => {
  const { userName, role, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = userDisplayName ?? userName;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{displayName} ({role})</span>
            <Link to="/">
              <Button variant="ghost" size="icon"><Home className="w-4 h-4" /></Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
