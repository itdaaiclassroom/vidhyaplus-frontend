import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-background">ITDA Classroom</span>
            </div>
            <p className="text-muted-foreground text-sm">
              An educational innovation platform developed in collaboration with institutional stakeholders to enhance classroom experiences.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="text-muted-foreground hover:text-background transition-colors">Features</a></li>
              <li><a href="/#about" className="text-muted-foreground hover:text-background transition-colors">About</a></li>
              <li><Link to="/activities" className="text-muted-foreground hover:text-background transition-colors">Co-Curricular Activities</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Student Portal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login?role=student" className="text-muted-foreground hover:text-background transition-colors">Student Login</Link></li>
              <li><a href="/#impact" className="text-muted-foreground hover:text-background transition-colors">Impact Metrics</a></li>
              <li><a href="/#benefits" className="text-muted-foreground hover:text-background transition-colors">Benefits</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Access</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login?role=teacher" className="text-muted-foreground hover:text-background transition-colors">Teacher Login</Link></li>
              <li><Link to="/login?role=admin" className="text-muted-foreground hover:text-background transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-muted-foreground/20 mt-8 pt-6 text-center">
          <p className="text-muted-foreground text-xs">
            © 2026 ITDA AI Classroom & Monitoring Platform. Developed as an educational innovation initiative.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
