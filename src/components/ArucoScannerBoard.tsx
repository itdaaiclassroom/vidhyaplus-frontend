/**
 * ArucoScannerBoard — Full-screen scanning UI for the teacher's Interactive Board.
 *
 * Layout:
 * - Top: Current question display
 * - Middle: 3-column grid (webcam feeds | scanned list | missing list)
 * - Bottom: Progress bar + Submit button with lock mechanism
 *
 * Calls submitLiveQuizScan() for each detected marker — same API the mobile QR scanner used.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useWebcams } from "@/hooks/useWebcams";
import { detectMarkers, type DetectedMarker } from "@/lib/arucoDetector";
import { fromArucoId, toQrRaw } from "@/lib/arucoGenerator";
import { submitLiveQuizScan } from "@/api/client";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  rollNo: number;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

interface ScannedEntry {
  studentId: string;
  studentName: string;
  rollNo: number;
  answer: string;
  timestamp: number;
  isCorrect: boolean;
}

interface ArucoScannerBoardProps {
  quizSessionId: string;
  classStudents: Student[];
  absentRollNos?: number[];
  currentQuestion: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  submitThreshold?: number; // fraction, e.g. 0.9 for 90%
  onComplete: (scanned: Map<number, ScannedEntry>) => void;
  onCancel: () => void;
}

// Audio beep for scan feedback
function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Audio not available
  }
}

const ArucoScannerBoard = ({
  quizSessionId,
  classStudents,
  absentRollNos = [],
  currentQuestion,
  questionIndex,
  totalQuestions,
  submitThreshold = 0.9,
  onComplete,
  onCancel,
}: ArucoScannerBoardProps) => {
  const { devices, streams, activateAll, deactivateAll, error: webcamError } = useWebcams(5);

  const [scanned, setScanned] = useState<Map<number, ScannedEntry>>(new Map()); // keyed by rollNo
  const [scanning, setScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [conflictingRollNos, setConflictingRollNos] = useState<Set<number>>(new Set());

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const pendingSubmitsRef = useRef<Set<number>>(new Set()); // rollNos being submitted
  const warnedAbsentRef = useRef<Set<number>>(new Set());
  const recentScansRef = useRef<Map<number, Map<string, { timestamp: number, id: number }>>>(new Map());

  // Reset warnings when question changes
  useEffect(() => {
    warnedAbsentRef.current.clear();
    recentScansRef.current.clear();
    setConflictingRollNos(new Set());
  }, [questionIndex]);

  // Build rollNo → student lookup
  const rollNoToStudent = useMemo(() => {
    const map = new Map<number, Student>();
    classStudents.forEach((s) => map.set(s.rollNo, s));
    return map;
  }, [classStudents]);

  const activeClassStudents = useMemo(() => {
    return classStudents.filter(s => !absentRollNos.includes(s.rollNo));
  }, [classStudents, absentRollNos]);

  const scannedCount = scanned.size;
  const totalCount = activeClassStudents.length;
  const thresholdCount = Math.ceil(totalCount * submitThreshold);
  const isUnlocked = manualOverride || (totalCount > 0 && scannedCount >= thresholdCount);
  const progressPercent = totalCount > 0 ? (scannedCount / totalCount) * 100 : 0;

  const pendingStudents = useMemo(
    () => activeClassStudents.filter((s) => !scanned.has(s.rollNo)),
    [activeClassStudents, scanned]
  );

  const scannedList = useMemo(
    () => Array.from(scanned.values()).sort((a, b) => a.timestamp - b.timestamp),
    [scanned]
  );

  // Activate cameras on mount
  useEffect(() => {
    if (devices.length > 0) {
      activateAll();
    }
  }, [devices, activateAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      deactivateAll();
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [deactivateAll]);

  // Attach video elements to streams
  const setVideoRef = useCallback(
    (deviceId: string, el: HTMLVideoElement | null) => {
      if (el) {
        videoRefs.current.set(deviceId, el);
        const stream = streams.get(deviceId);
        if (stream && el.srcObject !== stream) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      } else {
        videoRefs.current.delete(deviceId);
      }
    },
    [streams]
  );

  // Process a single video frame
  const processFrame = useCallback(
    async (video: HTMLVideoElement) => {
      if (!canvasRef.current || video.videoWidth === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const markers = detectMarkers(imageData);

      const now = Date.now();

      for (const marker of markers) {
        const { slot, answer } = fromArucoId(marker.id);
        const student = classStudents.find((s) => (s.rollNo % 60) === slot);
        if (!student) continue;

        let studentScans = recentScansRef.current.get(student.rollNo);
        if (!studentScans) {
          studentScans = new Map();
          recentScansRef.current.set(student.rollNo, studentScans);
        }
        studentScans.set(answer, { timestamp: now, id: marker.id });
      }

      for (const student of classStudents) {
        const studentScans = recentScansRef.current.get(student.rollNo);
        if (!studentScans) continue;

        const activeAnswers: { answer: string, id: number }[] = [];
        for (const [ans, data] of studentScans.entries()) {
          if (now - data.timestamp < 1500) {
            activeAnswers.push({ answer: ans, id: data.id });
          } else {
            studentScans.delete(ans);
          }
        }

        if (activeAnswers.length > 1) {
          setConflictingRollNos((prev) => {
            if (!prev.has(student.rollNo)) {
              const next = new Set(prev);
              next.add(student.rollNo);
              return next;
            }
            return prev;
          });
        } else if (activeAnswers.length === 1) {
          setConflictingRollNos((prev) => {
            if (prev.has(student.rollNo)) {
              const next = new Set(prev);
              next.delete(student.rollNo);
              return next;
            }
            return prev;
          });

          const rollNo = student.rollNo;
          const { answer, id: markerId } = activeAnswers[0];

          if (absentRollNos.includes(rollNo)) {
            if (!warnedAbsentRef.current.has(rollNo)) {
              warnedAbsentRef.current.add(rollNo);
              toast.error(`Student ${student.name} (#${rollNo}) is marked absent.`);
            }
            continue;
          }

          if (pendingSubmitsRef.current.has(rollNo)) continue;
          const existingScan = scanned.get(rollNo);
          if (existingScan && existingScan.answer === answer) continue;

          pendingSubmitsRef.current.add(rollNo);

          if (soundEnabled) playBeep();

          submitLiveQuizScan(quizSessionId, {
            questionNo: questionIndex + 1,
            qrRaw: toQrRaw(rollNo, markerId),
          })
          .then((result) => {
            const entry: ScannedEntry = {
              studentId: result.studentId || student.id,
              studentName: result.studentName || student.name,
              rollNo,
              answer,
              timestamp: Date.now(),
              isCorrect: result.isCorrect,
            };

            setScanned((prev) => {
              const next = new Map(prev);
              next.set(rollNo, entry);
              return next;
            });
          })
          .catch((err) => {
            console.warn(`Scan failed for roll ${rollNo}:`, err);
          })
          .finally(() => {
            pendingSubmitsRef.current.delete(rollNo);
          });
        } else {
          setConflictingRollNos((prev) => {
            if (prev.has(student.rollNo)) {
              const next = new Set(prev);
              next.delete(student.rollNo);
              return next;
            }
            return prev;
          });
        }
      }
    },
    [scanned, classStudents, absentRollNos, soundEnabled, quizSessionId, questionIndex]
  );

  // Main scan loop
  useEffect(() => {
    if (!scanning) return;

    let lastTime = 0;
    const TARGET_INTERVAL = 100; // ~10 FPS

    const loop = (time: number) => {
      if (time - lastTime >= TARGET_INTERVAL) {
        lastTime = time;

        // Process each active video
        for (const [, video] of videoRefs.current) {
          if (video.readyState >= 2) {
            processFrame(video);
          }
        }
      }
      scanLoopRef.current = requestAnimationFrame(loop);
    };

    scanLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [scanning, processFrame]);

  // Start scanning when cameras are ready
  useEffect(() => {
    if (streams.size > 0 && !scanning) {
      setScanning(true);
    }
  }, [streams, scanning]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      onComplete(scanned);
    } finally {
      setSubmitting(false);
    }
  };

  const optionColors: Record<string, string> = {
    A: "bg-teal-100 text-teal-700 border-teal-200",
    B: "bg-emerald-100 text-emerald-700 border-emerald-200",
    C: "bg-blue-100 text-blue-700 border-blue-200",
    D: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Question Header */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Question {questionIndex + 1} of {totalQuestions}
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive">
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            {currentQuestion.questionText}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div
                key={opt}
                className={`p-2 rounded-lg border text-sm flex items-center gap-2 bg-white border-border text-slate-600`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-500">
                  {opt}
                </span>
                {currentQuestion[`option${opt}` as keyof QuizQuestion] as string}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Webcam Grid */}
        <div className="lg:col-span-5">
          <Card className="h-full border-border">
            <CardHeader className="py-3 px-4 bg-secondary/30 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Live Cameras ({streams.size})
                {webcamError && (
                  <span className="text-destructive text-xs ml-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {webcamError}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {streams.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No cameras detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect USB webcams and click refresh
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1"
                    onClick={activateAll}
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </Button>
                </div>
              ) : (
                <div
                  className={`grid gap-2 ${
                    streams.size <= 2
                      ? "grid-cols-1"
                      : streams.size <= 4
                        ? "grid-cols-2"
                        : "grid-cols-2"
                  }`}
                >
                  {Array.from(streams.entries()).map(([deviceId], idx) => (
                    <div
                      key={deviceId}
                      className="relative rounded-lg overflow-hidden bg-black border border-border aspect-[4/3]"
                    >
                      <video
                        ref={(el) => setVideoRef(deviceId, el)}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        CAM {idx + 1}
                      </div>
                      {scanning && (
                        <div className="absolute bottom-1 right-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                  {/* If odd number of cameras and >2, add placeholder */}
                  {streams.size > 2 && streams.size % 2 !== 0 && (
                    <div className="rounded-lg bg-secondary/30 border border-dashed border-border flex items-center justify-center aspect-[4/3]">
                      <span className="text-xs text-muted-foreground">Empty Slot</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scanned Column */}
        <div className="lg:col-span-4">
          <Card className="h-full border-success/30">
            <CardHeader className="py-3 px-4 bg-success/5 border-b border-success/20">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Scanned
                </span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-black text-lg px-3">
                  {scannedCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {scannedList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm italic">
                    Waiting for scans...
                  </div>
                ) : (
                  scannedList.map((entry) => (
                    <div
                      key={entry.rollNo}
                      className="p-2.5 px-4 flex items-center justify-between hover:bg-success/5 transition-colors animate-in slide-in-from-left-2 duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-slate-800">
                            {entry.studentName}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5">
                            #{entry.rollNo}
                          </span>
                          {conflictingRollNos.has(entry.rollNo) && (
                            <div className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Drop one card
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-black text-xs ${optionColors[entry.answer] || ""}`}
                      >
                        {entry.answer}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Missing Column */}
        <div className="lg:col-span-3">
          <Card className="h-full border-destructive/20">
            <CardHeader className="py-3 px-4 bg-destructive/5 border-b border-destructive/15">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  Missing
                </span>
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/20 font-black text-lg px-3"
                >
                  {pendingStudents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {pendingStudents.length === 0 ? (
                  <div className="text-center py-8 text-success text-sm font-bold">
                    🎉 All scanned!
                  </div>
                ) : (
                  pendingStudents.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 px-4 flex items-center gap-2 text-sm text-slate-600"
                    >
                      <XCircle className="w-3.5 h-3.5 text-destructive/40 shrink-0" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground">#{s.rollNo}</span>
                        </div>
                        {conflictingRollNos.has(s.rollNo) && (
                          <div className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Drop one card
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Bar: Progress + Submit */}
      <Card className="border-border shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <Progress value={progressPercent} className="h-3" />
              </div>
              <span className="text-lg font-black text-primary whitespace-nowrap min-w-[80px] text-right">
                {scannedCount} / {totalCount}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isUnlocked ? (
                  <Unlock className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                )}
                {isUnlocked
                  ? "Ready to submit"
                  : `Need ${thresholdCount - scannedCount} more scans to unlock`}
              </div>

              <div className="flex items-center gap-2">
                {!isUnlocked && !manualOverride && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManualOverride(true)}
                    className="text-xs"
                  >
                    Override Lock
                  </Button>
                )}

                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!isUnlocked || submitting}
                  className="px-8 gap-2 font-bold"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : isUnlocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Submit Answers
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Locked
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArucoScannerBoard;
