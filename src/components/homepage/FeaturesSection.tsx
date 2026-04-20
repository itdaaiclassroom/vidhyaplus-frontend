import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { BookOpen, Bot, QrCode, BarChart3, ClipboardList } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Curriculum-Driven Teaching", desc: "Structured lessons mapped to curriculum topics ensure consistent delivery across all schools." },
  { icon: Bot, title: "AI Teaching Assistant", desc: "On-demand AI support for lesson explanations, simplified concepts, and activity suggestions." },
  { icon: QrCode, title: "Interactive QR Quiz System", desc: "Students respond to quizzes using QR cards. Teachers scan responses for instant evaluation." },
  { icon: BarChart3, title: "Real-Time Monitoring Dashboard", desc: "Administrators track session progress, engagement metrics, and school performance in real-time." },
  { icon: ClipboardList, title: "Activity Logging & Transparency", desc: "Every action is logged with timestamps and GPS for complete audit trail and accountability." },
];

const FeaturesSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Platform Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of tools designed for modern classroom management and monitoring.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border card-hover group"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
