import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const challenges = [
  { problem: "Inconsistent Lesson Delivery", solution: "Structured curriculum with AI-generated lesson plans ensures every class follows the same standard." },
  { problem: "Low Student Engagement", solution: "Interactive QR-based quizzes and real-time leaderboards make learning fun and competitive." },
  { problem: "Delayed Feedback Loops", solution: "Instant quiz results and session analytics provide immediate insights to teachers and administrators." },
  { problem: "Limited Monitoring Capability", solution: "Real-time dashboards with activity logging give complete visibility into classroom operations." },
];

const ChallengesSection = () => {
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
            Why This Platform Was Built
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Addressing real challenges in government school education with technology-driven solutions.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {challenges.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border card-hover"
            >
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="font-semibold text-foreground">{item.problem}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{item.solution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChallengesSection;
