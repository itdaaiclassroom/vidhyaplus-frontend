import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, BarChart3, Video, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const heroImage = "/placeholder.svg";

const HeroSection = () => {
  const aiFeatures = [
    { icon: Brain, label: "AI Doubt Solver" },
    { icon: BarChart3, label: "Smart Analytics" },
    { icon: Video, label: "Auto Recording" },
    { icon: BookOpen, label: "AI Quizzes" },
  ];

  return (
    <section className="relative pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-light via-background to-amber-light opacity-60" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered School LMS — Classes 5 to 10
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Smart Student{" "}
              <span className="text-gradient">Learning Portal</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-2 max-w-lg">
              AI-Powered Teaching • Interactive Learning • Real-Time Monitoring
            </p>
            <p className="text-muted-foreground mb-6 max-w-lg">
              A complete Learning Management System with AI-assisted teaching,
              classroom auto-recording, chapter-wise quizzes, and comprehensive
              analytics for students, teachers, and administrators.
            </p>

            {/* AI Features Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {aiFeatures.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm text-foreground shadow-sm"
                >
                  <feat.icon className="w-3.5 h-3.5 text-primary" />
                  {feat.label}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/login?role=student">
                <Button size="lg" className="gap-2">
                  Student Login <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login?role=teacher">
                <Button variant="outline" size="lg" className="gap-2">
                  Teacher Login <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="ghost" size="lg">
                  Explore Features
                </Button>
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-hover border border-border">
              <img
                src={heroImage}
                alt="AI Classroom Dashboard Preview"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl gradient-primary opacity-20 blur-xl" />
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-accent/20 blur-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
