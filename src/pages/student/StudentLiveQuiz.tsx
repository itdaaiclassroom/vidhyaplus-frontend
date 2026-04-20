import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLiveQuizSession, submitLiveQuizAnswer, getLiveQuizResult } from "@/api/client";

const StudentLiveQuiz = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data } = useAppData();
  const { studentId } = useAuth();
  const sessions = data.liveQuizSessions || [];
  const sessionFromData = sessions.find((s) => s.id === sessionId);
  const [session, setSession] = useState(sessionFromData || null);
  const [sessionLoading, setSessionLoading] = useState(!sessionFromData && !!sessionId);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (sessionId && !sessionFromData && !session) {
      getLiveQuizSession(sessionId)
        .then((s) => setSession(s as typeof sessionFromData))
        .catch(() => setSession(null))
        .finally(() => setSessionLoading(false));
    } else if (sessionFromData) {
      setSession(sessionFromData);
      setSessionLoading(false);
    }
  }, [sessionId, sessionFromData, session]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ total: number; correct: number; wrong: number; percentage: number; details: Array<{ questionText: string; correctOption: string; selectedOption: string; isCorrect: boolean; explanation: string }> } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || !studentId || !submitted) return;
    getLiveQuizResult(sessionId, studentId)
      .then((r) => setResult({ ...r, details: r.details || [] }))
      .catch(() => setResult(null));
  }, [sessionId, studentId, submitted]);

  if (!sessionId) {
    return (
      <DashboardLayout title="Live Quiz">
        <p className="text-muted-foreground">Invalid quiz link.</p>
        <Button asChild className="mt-4"><Link to="/student">Back to Dashboard</Link></Button>
      </DashboardLayout>
    );
  }

  if (sessionLoading || (!session && sessionId)) {
    return (
      <DashboardLayout title="Live Quiz">
        <p className="text-muted-foreground">Loading session…</p>
        <Button asChild className="mt-4"><Link to="/student">Back to Dashboard</Link></Button>
      </DashboardLayout>
    );
  }
  if (!session) {
    return (
      <DashboardLayout title="Live Quiz">
        <p className="text-muted-foreground">Quiz not found or ended.</p>
        <Button asChild className="mt-4"><Link to="/student">Back to Dashboard</Link></Button>
      </DashboardLayout>
    );
  }

  const questions = session?.questions || [];
  const currentQ = questions[currentIndex];
  const total = questions.length;

  const handleOptionSelect = (opt: string) => {
    if (submitted) return;
    if (currentQ) setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
    else setSubmitted(true);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQ || !studentId || submitted) return;
    const opt = answers[currentQ.id] || "A";
    setLoading(true);
    try {
      await submitLiveQuizAnswer(sessionId, studentId, currentQ.id, opt);
    } finally {
      setLoading(false);
    }
    handleNext();
  };

  if (result) {
    return (
      <DashboardLayout title="Quiz Result">
        <Button variant="ghost" asChild className="mb-4 gap-1">
          <Link to="/student/quiz-results"><ArrowLeft className="w-4 h-4" /> Back to Class-Quiz Results</Link>
        </Button>
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">{session?.topicName} – Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Score: {result.correct}/{result.total} ({result.percentage}%)</p>
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Wrong answers – explanation</p>
              <ul className="space-y-3">
                {result.details.filter((d) => !d.isCorrect).map((d, i) => (
                  <li key={i} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
                    <p className="font-medium">{d.questionText}</p>
                    <p className="text-muted-foreground">Your answer: {d.selectedOption} · Correct: {d.correctOption}</p>
                    <p className="mt-1">{d.explanation}</p>
                  </li>
                ))}
              </ul>
              {result.details.filter((d) => !d.isCorrect).length === 0 && <p className="text-muted-foreground text-sm">All correct!</p>}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (submitted && total > 0) {
    return (
      <DashboardLayout title="Live Quiz">
        <Card className="shadow-card border-border max-w-lg mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">You have answered all questions. Loading your result…</p>
            <Button asChild className="mt-4"><Link to="/student/quiz-results">View in Class-Quiz Results</Link></Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!currentQ) {
    return (
      <DashboardLayout title="Live Quiz">
        <p className="text-muted-foreground">No questions in this quiz.</p>
        <Button asChild className="mt-4"><Link to="/student">Back to Dashboard</Link></Button>
      </DashboardLayout>
    );
  }

  const opts = [
    { key: "A", label: currentQ.optionA },
    { key: "B", label: currentQ.optionB },
    { key: "C", label: currentQ.optionC },
    { key: "D", label: currentQ.optionD },
  ];

  return (
    <DashboardLayout title={`Live Quiz – ${session?.topicName}`}>
      <Button variant="ghost" asChild className="mb-4 gap-1">
        <Link to="/student"><ArrowLeft className="w-4 h-4" /> Back</Link>
      </Button>
      <Card className="shadow-card border-border max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm">Question {currentIndex + 1} of {total}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-foreground">{currentQ.questionText}</p>
          <RadioGroup
            value={answers[currentQ.id] || ""}
            onValueChange={handleOptionSelect}
            className="space-y-2"
          >
            {opts.map((o) => (
              <div key={o.key} className="flex items-start space-x-2">
                <RadioGroupItem value={o.key} id={`q-${o.key}`} />
                <Label htmlFor={`q-${o.key}`} className="text-sm cursor-pointer flex-1 whitespace-normal break-words leading-relaxed">{o.key}. {o.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end gap-2">
            <Button onClick={handleSubmitAnswer} disabled={loading} className="w-full sm:w-auto">
              {currentIndex < total - 1 ? "Next" : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentLiveQuiz;
