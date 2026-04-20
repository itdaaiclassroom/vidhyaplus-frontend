import { useState } from "react";
import Navbar from "@/components/homepage/Navbar";
import FooterSection from "@/components/homepage/FooterSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { coCurricularActivities } from "@/data/demo-data";
import { Calendar, Users, Trophy, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  upcoming: "bg-info-light text-info",
  ongoing: "bg-success-light text-success",
  completed: "bg-secondary text-muted-foreground",
};

const Activities = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [registered, setRegistered] = useState<string[]>([]);

  const activity = selected ? coCurricularActivities.find(a => a.id === selected) : null;

  const handleRegister = (id: string) => {
    if (!registered.includes(id)) {
      setRegistered(prev => [...prev, id]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              🎭 Co-Curricular Activities
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Participate in competitions, cultural events, and sports tournaments.
            </p>
          </motion.div>

          {!selected ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {coCurricularActivities.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className="shadow-card border-border card-hover cursor-pointer h-full"
                    onClick={() => setSelected(act.id)}
                  >
                    <CardContent className="p-6">
                      <div className="text-4xl mb-3">{act.icon}</div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-semibold text-foreground">{act.title}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Badge className={`${statusColors[act.status]} text-xs mb-3`}>
                        {act.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mb-3">{act.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{act.date}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{act.registrations} registered</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : activity ? (
            <div className="max-w-2xl mx-auto">
              <Button variant="ghost" onClick={() => setSelected(null)} className="mb-4">← Back to Activities</Button>
              <Card className="shadow-card border-border">
                <CardContent className="p-8">
                  <div className="text-5xl mb-4">{activity.icon}</div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">{activity.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={statusColors[activity.status]}>{activity.status}</Badge>
                    <Badge variant="outline">{activity.category}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{activity.description}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{activity.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{activity.registrations} participants</span>
                  </div>

                  {activity.status === "completed" && activity.results && (
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-accent" /> Results
                      </h3>
                      <div className="space-y-2">
                        {activity.results.map(r => (
                          <div key={r.rank} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              r.rank === 1 ? "bg-accent text-accent-foreground" :
                              r.rank === 2 ? "bg-secondary text-foreground border-2 border-border" :
                              "bg-secondary text-muted-foreground border border-border"
                            }`}>
                              {r.rank}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{r.studentName}</p>
                              <p className="text-xs text-muted-foreground">{r.school}</p>
                            </div>
                            <span className="text-sm font-bold text-primary">{r.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.status !== "completed" && (
                    <Button
                      className="w-full"
                      disabled={registered.includes(activity.id)}
                      onClick={() => handleRegister(activity.id)}
                    >
                      {registered.includes(activity.id) ? "✅ Registered" : "Register Now"}
                    </Button>
                  )}

                  {activity.status === "completed" && (
                    <Button variant="outline" className="w-full">
                      📜 Download Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default Activities;
