import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Settings, BookOpen, QrCode, BarChart3 } from "lucide-react";

const steps = [
  { icon: Settings, label: "Admin Plans", desc: "Configure curriculum, assign lessons" },
  { icon: BookOpen, label: "Teacher Teaches", desc: "Deliver AI-assisted lessons" },
  { icon: QrCode, label: "Students Interact", desc: "Respond via QR quiz cards" },
  { icon: BarChart3, label: "Data Monitored", desc: "Real-time analytics & logs" },
];

const WorkflowSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
        </motion.div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-4"
            >
              <div className="flex flex-col items-center text-center w-40">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-soft">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">{step.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block w-12 h-0.5 bg-border mx-2 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
