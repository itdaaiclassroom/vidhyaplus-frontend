import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { connectLiveQuizScanner, fetchLiveQuizStatus, submitLiveQuizScan } from "@/api/client";
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
  const [questionNo, setQuestionNo] = useState(1);
  const [scanRaw, setScanRaw] = useState("");
  const [status, setStatus] = useState<{ started: boolean; connectedDevices: number; questions: number; students: number; answersCaptured: number; attendanceReady?: boolean; attendanceDate?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<Array<{ id: string; text: string; ok: boolean }>>([]);

  const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const expected = useMemo(() => (status ? status.questions * status.students : 0), [status]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
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
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    }).catch(console.error);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedCameraId) return;

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        } else if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.start(
          selectedCameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (decodedText && decodedText !== lastScannedRef.current) {
              lastScannedRef.current = decodedText;
              setScanRaw(decodedText);
              
              const sRef = stateRef.current;
              if (!sRef.sessionId) return;
              
              toast.success(`Scanned: ${decodedText}`);
              
              try {
                const r = await submitLiveQuizScan(sRef.sessionId, { questionNo: sRef.questionNo, qrRaw: decodedText.trim() });
                setLogs((prev) => [{ id: `${Date.now()}`, text: r.confirmation, ok: true }, ...prev].slice(0, 30));
                
                // Refresh status
                fetchLiveQuizStatus(sRef.sessionId).then(s => {
                  setStatus((prev: any) => ({ ...prev, ...s }));
                }).catch(() => {});

              } catch (e: any) {
                const msg = e.message || "Scan failed";
                toast.error(msg);
                setLogs((prev) => [{ id: `${Date.now()}`, text: msg, ok: false }, ...prev].slice(0, 30));
              }

              // Allow re-scanning the same code after 2.5 seconds
              if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
              scanTimeoutRef.current = setTimeout(() => {
                lastScannedRef.current = "";
                setScanRaw("");
              }, 2500);
            }
          },
          () => {} // ignore continuous scan errors
        );
      } catch (err) {
        console.error("Camera start error:", err);
        toast.error("Failed to open the selected camera.");
      }
    };

    startScanner();
  }, [selectedCameraId]);

  const handleSubmit = async () => {
    if (!sessionId || !scanRaw.trim()) return;
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
                <Label className="mb-2 block">Select Camera</Label>
                <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map(cam => (
                      <SelectItem key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black min-h-[250px]"></div>
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
