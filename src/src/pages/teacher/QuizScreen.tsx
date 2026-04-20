import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizQuestions, students } from "@/data/demo-data";
import { QrCode, ScanLine, Trophy, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const classStudents = students.filter(s => s.classId === "c1");

const QuizScreen = () => {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scannedStudents, setScannedStudents] = useState<string[]>([]);
  const [lastScan, setLastScan] = useState<{ name: string; correct: boolean } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const question = quizQuestions[currentQ];

  const simulateScan = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      const unscanned = classStudents.filter(s => !scannedStudents.includes(s.id));
      if (unscanned.length === 0) {
        setScanning(false);
        return;
      }
      const student = unscanned[Math.floor(Math.random() * unscanned.length)];
      const answers = ["A", "B", "C", "D"];
      const studentAnswer = Math.random() > 0.3 ? question.correct : answers[Math.floor(Math.random() * 4)];
      const isCorrect = studentAnswer === question.correct;

      setScannedStudents(prev => [...prev, student.id]);
      if (isCorrect) {
        setScores(prev => ({ ...prev, [student.id]: (prev[student.id] || 0) + 1 }));
      }
      setLastScan({ name: student.name, correct: isCorrect });
      setScanning(false);
    }, 1200);
  }, [scannedStudents, question]);

  const nextQuestion = () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setScannedStudents([]);
      setLastScan(null);
    } else {
      setShowLeaderboard(true);
    }
  };

  const sortedLeaderboard = classStudents
    .map(s => ({ ...s, score: scores[s.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  if (showLeaderboard) {
    return (
      <DashboardLayout title="Quiz Leaderboard">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <Card className="shadow-card border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">Leaderboard 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedLeaderboard.map((student, i) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      i === 0 ? "gradient-primary text-primary-foreground" :
                      i === 1 ? "bg-amber-light" :
                      i === 2 ? "bg-teal-light" :
                      "bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? "bg-primary-foreground/20" : "bg-background"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm">{student.name}</span>
                    </div>
                    <span className="font-display font-bold">{student.score}/{quizQuestions.length}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Quiz Mode">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        {!quizStarted ? (
          <Card className="shadow-card border-border text-center">
            <CardContent className="p-12">
              <div className="w-20 h-20 rounded-2xl bg-amber-light flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-10 h-10 text-amber" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Ready to Launch Quiz?</h2>
              <p className="text-muted-foreground mb-6">{quizQuestions.length} questions • {classStudents.length} students</p>
              <Button size="lg" onClick={() => setQuizStarted(true)}>Launch Quiz</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {quizQuestions.length}</span>
                  <span className="text-xs text-muted-foreground">{scannedStudents.length}/{classStudents.length} scanned</span>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-display text-lg font-bold text-foreground mb-4">{question.question}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {question.options.map((opt, i) => (
                    <div key={i} className="bg-secondary rounded-xl p-3 text-sm text-foreground font-medium text-center whitespace-normal break-words leading-relaxed min-h-[52px] flex items-center justify-center">
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Button
                    onClick={simulateScan}
                    disabled={scanning || scannedStudents.length >= classStudents.length}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <ScanLine className="w-4 h-4" />
                    {scanning ? "Scanning..." : "Scan QR Response"}
                  </Button>
                  <Button variant="outline" onClick={nextQuestion} className="w-full sm:w-auto">
                    {currentQ < quizQuestions.length - 1 ? "Next Question" : "View Leaderboard"}
                  </Button>
                </div>

                {lastScan && (
                  <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                    lastScan.correct ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {lastScan.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {lastScan.name} — {lastScan.correct ? "Correct!" : "Incorrect"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mini leaderboard */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber" /> Live Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sortedLeaderboard.slice(0, 5).map((s, i) => (
                    <div key={s.id} className="bg-secondary rounded-lg px-3 py-1.5 text-xs font-medium text-foreground">
                      #{i + 1} {s.name}: {s.score}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizScreen;
