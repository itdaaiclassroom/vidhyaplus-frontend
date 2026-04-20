import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { School, Users, GraduationCap, CalendarCheck, MessageSquare } from "lucide-react";
import { impactMetrics } from "@/data/demo-data";

const counters = [
  { icon: School, label: "Schools Onboarded", value: impactMetrics.schoolsOnboarded },
  { icon: Users, label: "Teachers Active", value: impactMetrics.teachersActive },
  { icon: GraduationCap, label: "Students Reached", value: impactMetrics.studentsReached },
  { icon: CalendarCheck, label: "Sessions Completed", value: impactMetrics.sessionsCompleted },
  { icon: MessageSquare, label: "Quiz Responses", value: impactMetrics.quizParticipation },
];

const AnimatedCounter = ({ target, inView }: { target: number; inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span className="font-display text-3xl md:text-4xl font-bold text-primary">{count.toLocaleString()}</span>;
};

const ImpactSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="py-20 gradient-hero">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Impact & Live Data
          </h2>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Real-time metrics showcasing platform adoption and educational impact.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {counters.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
                <c.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <AnimatedCounter target={c.value} inView={inView} />
              <p className="text-primary-foreground/70 text-sm mt-1">{c.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
