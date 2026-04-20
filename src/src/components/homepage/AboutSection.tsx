import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Target, Eye, Brain, Rocket } from "lucide-react";

const items = [
  { icon: Target, title: "Standardized Delivery", desc: "Ensuring consistent, high-quality lesson delivery across all government schools through structured curriculum." },
  { icon: Eye, title: "Transparent Monitoring", desc: "Real-time visibility into classroom activities, engagement levels, and session completion for administrators." },
  { icon: Brain, title: "AI-Assisted Teaching", desc: "Teachers receive AI-generated lesson summaries, activity suggestions, and on-demand explanations." },
  { icon: Rocket, title: "Pilot Implementation", desc: "Deployed as an innovation pilot in tribal welfare schools to bridge educational gaps and improve outcomes." },
];

const AboutSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            About the Initiative
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A government-led innovation initiative to bring AI-powered standardized teaching 
            and real-time monitoring to classrooms across tribal welfare schools.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-card card-hover border border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-teal-light flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
