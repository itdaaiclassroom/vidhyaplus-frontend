import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectLiveQuizScanner, fetchLiveQuizStatus, submitLiveQuizScan } from "@/api/client";
import { toast } from "sonner";

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

  const expected = useMemo(() => (status ? status.questions * status.students : 0), [status]);

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
