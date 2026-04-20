import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { lessonContent, curriculum } from "@/data/demo-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LessonScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const slides = lessonContent.slideOutline;

  const slideContents: Record<number, string> = {
    0: "Light is a form of energy that enables us to see objects. It travels in straight lines, which we call rectilinear propagation of light.",
    1: "Light always travels in a straight path. This can be demonstrated using a torch in a dark room — the beam of light goes straight!",
    2: "When a ray of light falls on a smooth, polished surface, it bounces back. This phenomenon is called reflection of light.",
    3: "Law 1: The angle of incidence (∠i) is always equal to the angle of reflection (∠r).\n\nLaw 2: The incident ray, the reflected ray, and the normal at the point of incidence — all lie in the same plane.",
    4: "Regular Reflection: Occurs on smooth surfaces like mirrors — parallel rays remain parallel.\n\nDiffuse Reflection: Occurs on rough surfaces — parallel rays scatter in different directions.",
    5: "Mirrors in homes, periscopes in submarines, kaleidoscopes, dental mirrors, and rear-view mirrors in vehicles all work on the principle of reflection.",
    6: "Let's review what we learned and test your knowledge with a quick quiz!",
  };

  return (
    <DashboardLayout title="Lesson Screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <div className="bg-teal-light rounded-xl p-3 mb-6">
          <p className="text-xs text-muted-foreground">{curriculum.subject} → {curriculum.chapter}</p>
          <h2 className="font-display font-bold text-foreground">{curriculum.topic}</h2>
        </div>

        <Card className="shadow-card border-border mb-6">
          <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
            <div className="text-center mb-6">
              <span className="text-xs text-muted-foreground">Slide {currentSlide + 1} of {slides.length}</span>
              <h3 className="font-display text-2xl font-bold text-foreground mt-2">{slides[currentSlide]}</h3>
            </div>
            <p className="text-muted-foreground text-center whitespace-pre-line max-w-2xl mx-auto">
              {slideContents[currentSlide]}
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide(prev => prev - 1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentSlide ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          {currentSlide < slides.length - 1 ? (
            <Button onClick={() => setCurrentSlide(prev => prev + 1)} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate("/teacher/quiz")} className="gap-2">
              Start Quiz <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LessonScreen;
