import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { usePrincipal } from "@/contexts/PrincipalContext";
import { registerTeacher, fetchAll } from "@/api/client";
import { uploadFileToR2 } from "@/services/uploadService";
import { toast } from "sonner";

type StepKey = "personal" | "address" | "teaching" | "summary";

interface TeacherForm {
  teacherName: string;
  dob: string;
  gender: string;
  caste: string;
  religion: string;
  motherTongue: string;
  address: string;
  subjectsHandled: string[];
  classesCanHandle: string[];
  phoneNumber: string;
  email: string;
  photo: File | null;
  password: string;
}

const steps: { key: StepKey; title: string; desc?: string }[] = [
  { key: "personal", title: "Personal Details" },
  { key: "address", title: "Address Details" },
  { key: "teaching", title: "Teaching Details" },
  { key: "summary", title: "Summary" },
];

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkUpload from "@/components/BulkUpload";

const TeacherRegistration: React.FC = () => {
  const { schoolId, role, permissions } = useAuth();
  const { grades: principalGrades, refetchTeachers, schoolId: principalSchoolId } = usePrincipal();
  const effectiveSchoolId = principalSchoolId || schoolId;
  const isReadOnly = role === "admin" && permissions?.teachers === "read";
  const [current, setCurrent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string, name: string }>>([]);
  
  const grades = React.useMemo(() => {
    if (principalGrades && principalGrades.length > 0) {
      return principalGrades.map(g => ({ id: String(g.id), label: g.grade_label }));
    }
    return [
      { id: "6", label: "Class 6" },
      { id: "7", label: "Class 7" },
      { id: "8", label: "Class 8" },
      { id: "9", label: "Class 9" },
      { id: "10", label: "Class 10" },
    ];
  }, [principalGrades]);

  useEffect(() => {
    fetchAll().then(data => {
      if (data.subjects) {
        setSubjects(data.subjects);
      }
    }).catch(console.error);
  }, []);

  const [successModalData, setSuccessModalData] = useState<{ id: string; name: string } | null>(null);

  const [form, setForm] = useState<TeacherForm>({
    teacherName: "",
    dob: "",
    gender: "",
    caste: "",
    religion: "",
    motherTongue: "",
    address: "",
    subjectsHandled: [],
    classesCanHandle: [],
    phoneNumber: "",
    email: "",
    photo: null,
    password: "",
  });

  const handleChange = (k: keyof TeacherForm, v: string | File | null) =>
    setForm((s: TeacherForm) => ({ ...s, [k]: v }));

  const toggleSubject = (subject: string) => {
    setForm((s) => ({
      ...s,
      subjectsHandled: s.subjectsHandled.includes(subject)
        ? s.subjectsHandled.filter((x) => x !== subject)
        : [...s.subjectsHandled, subject],
    }));
  };

  const toggleClass = (cls: string) => {
    setForm((s) => ({
      ...s,
      classesCanHandle: s.classesCanHandle.includes(cls)
        ? s.classesCanHandle.filter((x) => x !== cls)
        : [...s.classesCanHandle, cls],
    }));
  };

  const next = () => setCurrent((c) => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleSubmit = async () => {
    if (!effectiveSchoolId) {
      toast.error("School ID not found. Please log in again.");
      return;
    }
    if (!form.teacherName || !form.email) {
      toast.error("Name and Email are required.");
      return;
    }
    
    setLoading(true);
    try {
      // Upload photo to R2 if selected
      let photoUrl: string | undefined;
      if (form.photo) {
        toast.info("Uploading photo...");
        try {
          photoUrl = await uploadFileToR2(form.photo, 'teacher-photos');
        } catch (uploadErr) {
          console.error("Photo upload failed:", uploadErr);
          toast.warning("Photo upload failed, continuing without photo.");
        }
      }

      const selectedSubjectIds = form.subjectsHandled
        .map(name => subjects.find(s => s.name === name)?.id)
        .filter((id): id is string => id !== undefined);

      const res = await registerTeacher({
        school_id: String(effectiveSchoolId),
        full_name: form.teacherName,
        email: form.email,
        password: form.password || "teach123",
        subjects: selectedSubjectIds,
        dob: form.dob,
        gender: form.gender,
        caste: form.caste,
        religion: form.religion,
        mother_tongue: form.motherTongue,
        address: form.address,
        phone_number: form.phoneNumber,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });
      
      refetchTeachers();
      setSuccessModalData({ id: (res as any).teacher_id || "Generated", name: form.teacherName });
      setCurrent(0);
      setForm({
        teacherName: "", dob: "", gender: "", caste: "", religion: "", motherTongue: "",
        address: "", subjectsHandled: [], classesCanHandle: [], phoneNumber: "",
        email: "", photo: null, password: "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to register teacher";
      if (msg.includes("Unauthorized") || msg.includes("Token required")) {
        toast.error("Session expired or token missing. Please log out and log back in.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = (): React.ReactNode => {
    const key = steps[current].key;
    switch (key) {
      case "personal":
        return (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <Input value="Auto-generated after save" disabled className="h-10 bg-muted text-muted-foreground border-primary/30" />
                <Input
                  placeholder="Teacher name"
                  value={form.teacherName}
                  onChange={(e) => handleChange("teacherName", e.target.value)}
                  className="h-10"
                />
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="h-10"
                />
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Contact Number"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className="h-10"
                />
                <Input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="h-10"
                  autoComplete="off"
                  name="teacher-email-new"
                />
                <Input
                  type="password"
                  required
                  placeholder="Password (for login)"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-10"
                  autoComplete="new-password"
                  name="teacher-password-new"
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Input
                  placeholder="Caste"
                  value={form.caste}
                  onChange={(e) => handleChange("caste", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="Religion"
                  value={form.religion}
                  onChange={(e) => handleChange("religion", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="Mother Tongue"
                  value={form.motherTongue}
                  onChange={(e) => handleChange("motherTongue", e.target.value)}
                  className="h-10"
                />
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Profile Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("photo", e.target.files?.[0] || null)}
                    className="border border-input rounded-md px-2 py-2 h-10 text-xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer file:font-medium hover:file:bg-primary/90 w-full"
                  />
                </div>
              </div>
            </div>
            {form.photo && (
              <div className="flex items-center gap-4 pt-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={URL.createObjectURL(form.photo)} />
                </Avatar>
                <div className="text-sm text-muted-foreground">Photo selected</div>
              </div>
            )}
          </div>
        );

      case "address":
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <Textarea
              placeholder="Full Address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        );

      case "teaching":
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">Subjects Can Teach</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    if (form.subjectsHandled.length === subjects.length) {
                      setForm((s) => ({ ...s, subjectsHandled: [] }));
                    } else {
                      setForm((s) => ({ ...s, subjectsHandled: subjects.map((sub) => sub.name) }));
                    }
                  }}
                >
                  {form.subjectsHandled.length === subjects.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subj-${s.id}`}
                      checked={form.subjectsHandled.includes(s.name)}
                      onCheckedChange={() => toggleSubject(s.name)}
                    />
                    <label
                      htmlFor={`subj-${s.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {s.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">Classes Can Handle</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    if (form.classesCanHandle.length === grades.length) {
                      setForm((s) => ({ ...s, classesCanHandle: [] }));
                    } else {
                      setForm((s) => ({ ...s, classesCanHandle: grades.map((g) => g.label) }));
                    }
                  }}
                >
                  {form.classesCanHandle.length === grades.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {grades.map((g) => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${g.id}`}
                      checked={form.classesCanHandle.includes(g.label)}
                      onCheckedChange={() => toggleClass(g.label)}
                    />
                    <label
                      htmlFor={`grade-${g.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {g.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="space-y-5 max-w-3xl mx-auto">
            <h4 className="font-semibold text-lg">Review & Submit</h4>
            <div className="bg-gray-50 p-6 rounded-lg space-y-6">
              {/* Personal Details */}
              <div>
                <h5 className="font-semibold text-sm mb-3 text-primary">Personal Details</h5>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Name</div>
                    <div className="font-medium">{form.teacherName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">DOB</div>
                    <div className="font-medium">{form.dob || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Gender</div>
                    <div className="font-medium">{form.gender || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Phone</div>
                    <div className="font-medium">{form.phoneNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Email</div>
                    <div className="font-medium">{form.email || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Password</div>
                    <div className="font-medium">{form.password || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Teaching Details */}
              <div>
                <h5 className="font-semibold text-sm mb-3 text-primary">Teaching Details</h5>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-2">Subjects</div>
                    <div className="flex flex-wrap gap-2">
                      {form.subjectsHandled.length > 0 ? (
                        form.subjectsHandled.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None selected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium mb-2">Classes</div>
                    <div className="flex flex-wrap gap-2">
                      {form.classesCanHandle.length > 0 ? (
                        form.classesCanHandle.map((c) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md shadow-2xl p-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-6">Teacher <span className="font-semibold text-foreground">{successModalData.name}</span> has been successfully registered.</p>
            {successModalData.id !== "Generated" && (
              <div className="bg-muted rounded-lg p-4 mb-6 text-center">
                <span className="block text-sm text-muted-foreground mb-1">ID NO.</span>
                <span className="block text-3xl font-mono font-bold text-primary">{successModalData.id}</span>
              </div>
            )}
            <Button className="w-full" size="lg" onClick={() => setSuccessModalData(null)}>Done</Button>
          </Card>
        </div>
      )}

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
          <TabsTrigger value="manual">Manual Registration</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card className="w-full border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex min-h-[600px]">
                {/* Left sidebar with steps */}
                <nav className="w-1/4 bg-gray-50 px-6 py-12 space-y-8 border-r">
                  <h3 className="font-bold text-lg text-foreground mb-4">Teacher Registration</h3>
                  {isReadOnly && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg text-xs font-semibold mb-6 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Read-only access
                    </div>
                  )}
                  <div className="space-y-2">
                    {steps.map((s, i) => (
                      <div
                        key={s.key}
                        className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                          i === current
                            ? "bg-white border-l-4 border-primary text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setCurrent(i)}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            i === current ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="whitespace-nowrap font-medium text-sm">{s.title}</div>
                      </div>
                    ))}
                  </div>
                </nav>

                {/* Right content area */}
                <main className="flex-1 px-12 py-16 flex flex-col justify-between">
                  <div className="pb-6">{renderStep()}</div>

                  <div className="flex justify-between items-center pt-8 border-t">
                    <div>{current > 0 && <Button variant="outline" onClick={prev}>Back</Button>}</div>
                    <div className="text-sm text-muted-foreground">
                      Step {current + 1} of {steps.length}
                    </div>
                    <div>
                      {current < steps.length - 1 ? (
                        <Button onClick={next}>Next</Button>
                      ) : (
                        <Button 
                          onClick={handleSubmit} 
                          disabled={loading || isReadOnly}
                          title={isReadOnly ? "You have read-only access" : ""}
                        >
                          {loading ? "Registering..." : "Submit"}
                        </Button>
                      )}
                    </div>
                  </div>
                </main>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="w-full border-0 shadow-lg p-6 relative">
            {isReadOnly && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-amber-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Read-Only Access</h4>
                    <p className="text-xs text-slate-500">You do not have permission to bulk upload.</p>
                  </div>
                </div>
              </div>
            )}
            <BulkUpload />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherRegistration;
