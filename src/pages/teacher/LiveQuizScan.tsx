import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { connectLiveQuizScanner, fetchLiveQuizStatus, submitLiveQuizScan } from "@/api/client";
import { useAppData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

function getDeviceId() {
  const key = "liveQuizDeviceId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(key, id);
  return id;
}

const LiveQuizScan = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session") || "";
  const { data } = useAppData();
  const [questionNo, setQuestionNo] = useState(1);
  const [scanRaw, setScanRaw] = useState("");
  const [status, setStatus] = useState<{ started: boolean; connectedDevices: number; questions: number; students: number; answersCaptured: number; attendanceReady?: boolean; attendanceDate?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; text: string; ok: boolean }>>([]);

  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [activeCameraIds, setActiveCameraIds] = useState<string[]>([]);
  const [absentRollNos, setAbsentRollNos] = useState<string[]>([]);
  const absentRollNosRef = useRef<string[]>([]);

  const activeSession = useMemo(() => {
    return data.liveSessions?.find((s: any) => String(s.id) === String(sessionId));
  }, [data.liveSessions, sessionId]);

  useEffect(() => {
    absentRollNosRef.current = absentRollNos;
  }, [absentRollNos]);

  useEffect(() => {
    if (!activeSession) return;
    const fetchAttendance = async () => {
      try {
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const { getStudentAttendance } = await import('@/api/client');
        const records = await getStudentAttendance(activeSession.classId, date);
        if (records.length > 0) {
          const absentIds = records.filter((r: any) => r.status.toLowerCase() === "absent").map((r: any) => String(r.student_id));
          const absentRolls = data.students?.filter((s: any) => absentIds.includes(String(s.id))).map((s: any) => String(s.rollNo)) || [];
          setAbsentRollNos(absentRolls);
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      }
    };
    fetchAttendance();
  }, [activeSession, data.students]);

  const expected = useMemo(() => (status ? status.questions * status.students : 0), [status]);

  const scannersRef = useRef<Map<string, Html5Qrcode>>(new Map());
  const lastScannedRef = useRef<string>("");
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ questionNo, sessionId });

  useEffect(() => {
    stateRef.current = { questionNo, sessionId };
  }, [questionNo, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const deviceId = getDeviceId();
    connectLiveQuizScanner(sessionId, deviceId).catch(() => {
      // status polling handles connection visibility
    });
    let t: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      try {
        const s = await fetchLiveQuizStatus(sessionId);
        setStatus({
          started: s.started,
          connectedDevices: s.connectedDevices,
          questions: s.questions,
          students: s.students,
          answersCaptured: s.answersCaptured,
          attendanceReady: s.attendanceReady,
          attendanceDate: s.attendanceDate,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to fetch status";
        toast.error(msg);
      }
    };
    load();
    t = setInterval(load, 3000);
    return () => {
      if (t) clearInterval(t);
    };
  }, [sessionId]);

  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to environment camera if available, otherwise first device
        const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        setActiveCameraIds([backCam ? backCam.id : devices[0].id]);
      }
    }).catch(console.error);

    return () => {
      scannersRef.current.forEach(scanner => {
        if (scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(console.error);
        }
      });
    };
  }, []);

  useEffect(() => {
    // Stop removed cameras
    for (const [id, scanner] of scannersRef.current.entries()) {
      if (!activeCameraIds.includes(id)) {
        if (scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(console.error);
        }
        scannersRef.current.delete(id);
      }
    }

    // Start new cameras
    activeCameraIds.forEach(id => {
      if (!scannersRef.current.has(id)) {
        const startScanner = async () => {
          try {
            const scanner = new Html5Qrcode(`qr-reader-${id}`);
            scannersRef.current.set(id, scanner);
            await scanner.start(
              id,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              async (decodedText) => {
                if (decodedText && decodedText !== lastScannedRef.current) {
                  lastScannedRef.current = decodedText;
                  
                  let scanRollNo = "";
                  if (decodedText.startsWith("stu")) {
                    scanRollNo = decodedText.substring(3).split('_')[0];
                  } else {
                    scanRollNo = decodedText.split('_')[0];
                  }

                  if (absentRollNosRef.current.includes(scanRollNo)) {
                    toast.error(`Student #${scanRollNo} is marked absent.`);
                    setLogs((prev) => [{ id: `${Date.now()}`, text: `Blocked absent student #${scanRollNo}`, ok: false }, ...prev].slice(0, 30));
                    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = setTimeout(() => {
                      lastScannedRef.current = "";
                      setScanRaw("");
                    }, 2500);
                    return;
                  }

                  setScanRaw(decodedText);
                  
                  const sRef = stateRef.current;
                  if (!sRef.sessionId) return;
                  
                  toast.success(`Scanned: ${decodedText}`);
                  
                  try {
                    const r = await submitLiveQuizScan(sRef.sessionId, { questionNo: sRef.questionNo, qrRaw: decodedText.trim() });
                    setLogs((prev) => [{ id: `${Date.now()}`, text: r.confirmation, ok: true }, ...prev].slice(0, 30));
                    
                    fetchLiveQuizStatus(sRef.sessionId).then(s => {
                      setStatus((prev: any) => ({ ...prev, ...s }));
                    }).catch(() => {});

                  } catch (e: any) {
                    const msg = e.message || "Scan failed";
                    toast.error(msg);
                    setLogs((prev) => [{ id: `${Date.now()}`, text: msg, ok: false }, ...prev].slice(0, 30));
                  }

                  if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                  scanTimeoutRef.current = setTimeout(() => {
                    lastScannedRef.current = "";
                    setScanRaw("");
                  }, 2500);
                }
              },
              () => {}
            );
          } catch (err) {
            console.error("Camera start error for", id, err);
            toast.error("Failed to open a camera.");
            setActiveCameraIds(prev => prev.filter(c => c !== id));
            scannersRef.current.delete(id);
          }
        };

        // Delay starting slightly to ensure the div is rendered by React
        setTimeout(startScanner, 50);
      }
    });
  }, [activeCameraIds]);

  const handleSubmit = async () => {
    if (!sessionId || !scanRaw.trim()) return;

    let scanRollNo = "";
    if (scanRaw.startsWith("stu")) {
      scanRollNo = scanRaw.substring(3).split('_')[0];
    } else {
      scanRollNo = scanRaw.split('_')[0];
    }

    if (absentRollNosRef.current.includes(scanRollNo)) {
      toast.error(`Student #${scanRollNo} is marked absent.`);
      setLogs((prev) => [{ id: `${Date.now()}`, text: `Blocked absent student #${scanRollNo}`, ok: false }, ...prev].slice(0, 30));
      return;
    }

    setSubmitting(true);
    try {
      const r = await submitLiveQuizScan(sessionId, { questionNo, qrRaw: scanRaw.trim() });
      setLogs((prev) => [{ id: `${Date.now()}`, text: r.confirmation, ok: true }, ...prev].slice(0, 30));
      setScanRaw("");
      const s = await fetchLiveQuizStatus(sessionId);
      setStatus({
        started: s.started,
        connectedDevices: s.connectedDevices,
        questions: s.questions,
        students: s.students,
        answersCaptured: s.answersCaptured,
        attendanceReady: s.attendanceReady,
        attendanceDate: s.attendanceDate,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Scan failed";
      setLogs((prev) => [{ id: `${Date.now()}`, text: msg, ok: false }, ...prev].slice(0, 30));
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Live Quiz Scanner">
      <div className="max-w-xl mx-auto space-y-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session {sessionId || "N/A"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Connected devices: <b>{status?.connectedDevices ?? 0}</b></p>
            <p>Attendance: <b>{status?.attendanceReady ? "Ready" : "Pending"}</b>{status?.attendanceDate ? ` (${status.attendanceDate})` : ""}</p>
            <p>Capture started: <b>{status?.started ? "Yes" : "No (wait for teacher)"}</b></p>
            <p>Progress: <b>{status?.answersCaptured ?? 0}</b> / <b>{expected}</b></p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameras.length > 0 && (
              <div>
                <Label className="mb-2 block">Active Cameras</Label>
                <div className="flex flex-wrap gap-2">
                  {cameras.map(cam => {
                    const isActive = activeCameraIds.includes(cam.id);
                    return (
                      <Button
                        key={cam.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isActive) {
                            setActiveCameraIds(prev => prev.filter(id => id !== cam.id));
                          } else {
                            setActiveCameraIds(prev => [...prev, cam.id]);
                          }
                        }}
                      >
                        {cam.label || `Camera ${cam.id.substring(0, 8)}`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className={`grid gap-4 ${activeCameraIds.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {activeCameraIds.map(id => (
                <div key={id} id={`qr-reader-${id}`} className="w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black min-h-[250px]"></div>
              ))}
              {activeCameraIds.length === 0 && (
                <div className="w-full max-w-sm mx-auto flex items-center justify-center rounded-lg bg-slate-100 min-h-[250px] text-muted-foreground text-sm">
                  Select a camera to start scanning
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scan Student QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Question number</Label>
              <Input type="number" min={1} value={questionNo} onChange={(e) => setQuestionNo(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div>
              <Label>Scanned value</Label>
              <Input
                placeholder="2601100001_B"
                value={scanRaw}
                onChange={(e) => setScanRaw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting || !scanRaw.trim() || !status?.started || !status?.attendanceReady}>
              {submitting ? "Submitting..." : "Submit scan"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 && <p className="text-xs text-muted-foreground">No scans yet.</p>}
            {logs.map((l) => (
              <div key={l.id} className={`text-xs rounded-md px-2 py-1 ${l.ok ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"}`}>
                {l.text}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LiveQuizScan;
