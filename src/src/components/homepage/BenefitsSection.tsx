import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { GraduationCap, User, Building2 } from "lucide-react";

const benefitGroups = [
  {
    icon: GraduationCap,
    title: "For Students",
    color: "bg-teal-light",
    items: ["Interactive learning experiences", "Visual understanding of concepts", "Immediate feedback through quizzes"],
  },
  {
    icon: User,
    title: "For Teachers",
    color: "bg-amber-light",
    items: ["Structured lesson guidance", "AI-powered teaching support", "Reduced preparation time"],
  },
  {
    icon: Building2,
    title: "For Administration",
    color: "bg-info-light",
    items: ["Complete classroom transparency", "Data-driven analytics", "Scalable monitoring system"],
  },
];

const BenefitsSection = () => {
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
            Benefits for Everyone
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {benefitGroups.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border card-hover"
            >
              <div className={`w-12 h-12 rounded-lg ${g.color} flex items-center justify-center mb-4`}>
                <g.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-4">{g.title}</h3>
              <ul className="space-y-3">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
