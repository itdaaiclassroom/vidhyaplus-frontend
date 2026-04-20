import Navbar from "@/components/homepage/Navbar";
import FooterSection from "@/components/homepage/FooterSection";
import { motion } from "framer-motion";
import {
  Eye, Lightbulb, BookOpen, BarChart3, Smartphone, Users
} from "lucide-react";

const items = [
  {
    icon: Eye,
    title: "Vision",
    desc: "To create an inclusive, AI-powered digital learning environment that empowers every student in government schools to achieve academic excellence, regardless of geographical or socio-economic barriers.",
  },
  {
    icon: Lightbulb,
    title: "Mission",
    desc: "Standardize classroom delivery through structured, curriculum-aligned lessons; enhance teacher effectiveness with AI tools; and provide transparent, data-driven monitoring for administrators.",
  },
  {
    icon: BookOpen,
    title: "AI-Powered Learning",
    desc: "Our platform leverages AI to generate lesson summaries, quiz questions, study plans, and personalized feedback — making quality education accessible to every student in every school.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Students, teachers, and administrators all benefit from real-time analytics. Track quiz scores, class attendance, subject progress, and identify areas for improvement instantly.",
  },
  {
    icon: Smartphone,
    title: "Digital Education Advantages",
    desc: "From PPT presentations and video lessons to interactive quizzes and AI chatbots, digital tools make learning engaging, visual, and accessible on any device.",
  },
  {
    icon: Users,
    title: "Improving Student Performance",
    desc: "With chapter-wise quizzes, instant feedback, weak area suggestions, and AI-generated study plans, students receive personalized guidance that adapts to their learning pace.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              About Our Platform
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A digital education initiative transforming how students learn and teachers teach in government schools.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border shadow-card p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-light flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default About;
