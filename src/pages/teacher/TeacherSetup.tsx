import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTeacherAssignments, type TeacherAssignment } from "@/api/client";

const TeacherSetup = () => {
  const navigate = useNavigate();
  const { userName, teacherId, role } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    if (role !== "teacher" || !teacherId) {
      navigate("/login?role=teacher", { replace: true });
      return;
    }
    getTeacherAssignments(teacherId)
      .then((res) => {
        setAssignments(res.assignments || []);
        if (res.assignments?.length) {
          const first = res.assignments[0];
          setSelectedClass(first.classId);
          setSelectedSubject(first.subjectId);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load assignments"))
      .finally(() => setLoading(false));
  }, [teacherId, role, navigate]);

  const classOptions = assignments.reduce<{ id: string; name: string }[]>((acc, a) => {
    if (!acc.some((c) => c.id === a.classId)) acc.push({ id: a.classId, name: a.className || a.classId });
    return acc;
  }, []);

  const subjectOptions = selectedClass
    ? assignments.filter((a) => a.classId === selectedClass)
    : [];

  const handleContinue = () => {
    if (selectedClass && selectedSubject) {
      navigate(`/teacher?class=${selectedClass}&subject=${selectedSubject}`);
    }
  };

  if (role !== "teacher" || !teacherId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-hover border border-border text-center text-muted-foreground">
          Loading your classes…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-hover border border-border text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-hover border border-border text-center">
          <h2 className="font-display text-xl font-bold mb-2">Welcome {userName || "Teacher"}</h2>
          <p className="text-muted-foreground mb-4">
            You have no class or subject assignments yet. Please contact your administrator to assign you to classes and subjects.
          </p>
          <Button variant="outline" onClick={() => navigate("/login?role=teacher")}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-hover border border-border">
        <h2 className="font-display text-xl font-bold mb-4">Welcome {userName || "Teacher"}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select the class and subject you want to work with.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Class</Label>
            <Select
              value={selectedClass || "__none__"}
              onValueChange={(v) => {
                setSelectedClass(v === "__none__" ? "" : v);
                setSelectedSubject("");
                const first = assignments.find((a) => a.classId === (v === "__none__" ? "" : v));
                if (first) setSelectedSubject(first.subjectId);
              }}
            >
              <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Select
              value={selectedSubject || "__none__"}
              onValueChange={(v) => setSelectedSubject(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjectOptions.map((a) => (
                  <SelectItem key={a.subjectId} value={a.subjectId}>{a.subjectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleContinue}
            disabled={!selectedClass || !selectedSubject}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSetup;
