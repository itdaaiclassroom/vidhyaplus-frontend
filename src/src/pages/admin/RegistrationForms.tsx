import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { registerStudent, registerTeacher } from "@/api/client";

type School = { id: string; name: string };
type ClassItem = { id: string; name: string; schoolId: string; grade: number };

type StudentFormProps = {
  onClose?: () => void;
  schools?: School[];
  classes?: ClassItem[];
  onSuccess?: () => void;
};

export const StudentForm: React.FC<StudentFormProps> = ({ onClose, schools = [], classes = [], onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schoolList = schools ?? [];
  const classList = classes ?? [];
  const classesForSchool = schoolId ? classList.filter((c) => c.schoolId === schoolId) : classList;
  const classGradesForSchool = Array.from(new Set(classesForSchool.map((c) => String(c.grade)))).sort((a, b) => Number(a) - Number(b));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || "Student";
    if (!schoolId?.trim()) {
      setError("Please select a school.");
      return;
    }
    if (!section || (section !== "A" && section !== "B" && section !== "C")) {
      setError("Please select a section (A, B, or C).");
      return;
    }
    const gradeNum = Number(classGrade);
    if (!classGrade || Number.isNaN(gradeNum)) {
      setError("Please select a class (grade 6–10).");
      return;
    }
    if (!password.trim()) {
      setError("Password is required for student login.");
      return;
    }
    setSubmitting(true);
    try {
      await registerStudent({
        full_name,
        section: section.trim(),
        school_id: schoolId.trim(),
        grade_id: gradeNum,
        password: password.trim(),
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register student.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
          <div className="space-y-2">
            <Label>School (required)</Label>
            <Select value={schoolId} onValueChange={(v) => { setSchoolId(v); setClassGrade(""); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schoolList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section (required)</Label>
            <Select value={section || "__none__"} onValueChange={(v) => setSection(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select section</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Full name (required)</Label>
            <div className="flex gap-2">
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Password (required for login)</Label>
            <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label>Class (required)</Label>
            <Select value={classGrade || "__none__"} onValueChange={(v) => setClassGrade(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select class</SelectItem>
                {classGradesForSchool.map((g) => (
                  <SelectItem key={g} value={g}>{`Class ${g}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Register Student"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

type TeacherFormProps = {
  onClose?: () => void;
  schools: School[];
  onSuccess?: () => void;
};

export const TeacherForm: React.FC<TeacherFormProps> = ({ onClose, schools, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || "Teacher";
    if (!schoolId) {
      setError("Please select a school.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    const fullNameCheck = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    if (!fullNameCheck) {
      setError("First name and last name are required.");
      return;
    }
    setSubmitting(true);
    try {
      await registerTeacher({
        full_name,
        email: email.trim(),
        school_id: schoolId,
        password: password.trim(),
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
          <div className="space-y-2">
            <Label>School (required)</Label>
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email (required)</Label>
            <Input type="email" placeholder="e.g. teacher@school.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label>Full name (required)</Label>
            <div className="flex gap-2">
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Password (required)</Label>
            <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Register Teacher"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default {} as any;
