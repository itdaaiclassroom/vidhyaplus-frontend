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
import { registerTeacher, fetchAll, fetchPrincipalGrades } from "@/api/client";
import { uploadFileToR2 } from "@/services/uploadService";
import { toast } from "sonner";

type StepKey = "personal" | "address" | "teaching" | "contact" | "additional" | "summary";

interface TeacherForm {
  teacherName: string;
  dob: string;
  gender: string;
  caste: string;
  religion: string;
  nationality: string;
  motherTongue: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  subjectsHandled: string[];
  classesCanHandle: string[];
  phoneNumber: string;
  emergencyContact: string;
  email: string;
  disabilities: string;
  aadhaarNumber: string;
  photo: File | null;
}

const steps: { key: StepKey; title: string; desc?: string }[] = [
  { key: "personal", title: "Personal Details" },
  { key: "address", title: "Address Details" },
  { key: "teaching", title: "Teaching Details" },
  { key: "contact", title: "Contact Details" },
  { key: "additional", title: "Additional Info" },
  { key: "summary", title: "Summary" },
];

const TeacherRegistration: React.FC = () => {
  const { schoolId } = useAuth();
  const [current, setCurrent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string, name: string }>>([]);
  const [grades, setGrades] = useState<Array<{ id: string, label: string }>>([]);
  
  useEffect(() => {
    fetchAll().then(data => {
      if (data.subjects) {
        setSubjects(data.subjects);
      }
    }).catch(console.error);

    fetchPrincipalGrades().then(data => {
      if (data.grades && data.grades.length > 0) {
        setGrades(data.grades.map(g => ({ id: String(g.id), label: g.grade_label })));
      } else {
        // Fallback static grades
        setGrades([
          { id: "6", label: "Class 6" },
          { id: "7", label: "Class 7" },
          { id: "8", label: "Class 8" },
          { id: "9", label: "Class 9" },
          { id: "10", label: "Class 10" },
        ]);
      }
    }).catch(() => {
      setGrades([
        { id: "6", label: "Class 6" },
        { id: "7", label: "Class 7" },
        { id: "8", label: "Class 8" },
        { id: "9", label: "Class 9" },
        { id: "10", label: "Class 10" },
      ]);
    });
  }, []);

  const [form, setForm] = useState<TeacherForm>({
    teacherName: "",
    dob: "",
    gender: "",
    caste: "",
    religion: "",
    nationality: "",
    motherTongue: "",
    address: "",
    village: "",
    mandal: "",
    district: "",
    state: "",
    pincode: "",
    subjectsHandled: [],
    classesCanHandle: [],
    phoneNumber: "",
    emergencyContact: "",
    email: "",
    disabilities: "",
    aadhaarNumber: "",
    photo: null,
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
    if (!schoolId) {
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

      await registerTeacher({
        school_id: schoolId,
        full_name: form.teacherName,
        email: form.email,
        password: "teach123", // Default password for now
        subjects: selectedSubjectIds,
        dob: form.dob,
        gender: form.gender,
        caste: form.caste,
        religion: form.religion,
        nationality: form.nationality,
        mother_tongue: form.motherTongue,
        address: form.address,
        village: form.village,
        mandal: form.mandal,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        phone_number: form.phoneNumber,
        emergency_contact: form.emergencyContact,
        disabilities: form.disabilities,
        aadhaar_number: form.aadhaarNumber,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });
      
      toast.success("Teacher registered successfully!");
      setCurrent(0);
      setForm({
        teacherName: "", dob: "", gender: "", caste: "", religion: "", nationality: "",
        motherTongue: "", address: "", village: "", mandal: "", district: "", state: "",
        pincode: "", subjectsHandled: [], classesCanHandle: [], phoneNumber: "",
        emergencyContact: "", email: "", disabilities: "", aadhaarNumber: "", photo: null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register teacher");
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
                  placeholder="Caste"
                  value={form.caste}
                  onChange={(e) => handleChange("caste", e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Input
                  placeholder="Religion"
                  value={form.religion}
                  onChange={(e) => handleChange("religion", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="Nationality"
                  value={form.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
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
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
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
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <Textarea
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="min-h-24"
                />
                <Input
                  placeholder="Village"
                  value={form.village}
                  onChange={(e) => handleChange("village", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="Mandal"
                  value={form.mandal}
                  onChange={(e) => handleChange("mandal", e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Input
                  placeholder="District"
                  value={form.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="h-10"
                />
                <Input
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        );

      case "teaching":
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-sm mb-4">Subjects Can Teach</h4>
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
              <h4 className="font-semibold text-sm mb-4">Classes Can Handle</h4>
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

      case "contact":
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <Input
              placeholder="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="h-10"
            />
            <Input
              placeholder="Emergency Contact Number"
              value={form.emergencyContact}
              onChange={(e) => handleChange("emergencyContact", e.target.value)}
              className="h-10"
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-10"
            />
          </div>
        );

      case "additional":
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Disabilities / Special Requirements
              </label>
              <Textarea
                placeholder="Enter any disabilities or special requirements (if any)"
                value={form.disabilities}
                onChange={(e) => handleChange("disabilities", e.target.value)}
                className="min-h-24"
              />
            </div>
            <Input
              placeholder="Aadhaar Number"
              value={form.aadhaarNumber}
              onChange={(e) => handleChange("aadhaarNumber", e.target.value)}
              className="h-10"
            />
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
                    <div className="font-medium">{form.teacherName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">DOB</div>
                    <div className="font-medium">{form.dob}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Gender</div>
                    <div className="font-medium">{form.gender}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Religion</div>
                    <div className="font-medium">{form.religion}</div>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <h5 className="font-semibold text-sm mb-3 text-primary">Address Details</h5>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Village</div>
                    <div className="font-medium">{form.village}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">District</div>
                    <div className="font-medium">{form.district}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">State</div>
                    <div className="font-medium">{form.state}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Pincode</div>
                    <div className="font-medium">{form.pincode}</div>
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

              {/* Contact Details */}
              <div>
                <h5 className="font-semibold text-sm mb-3 text-primary">Contact Details</h5>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Phone</div>
                    <div className="font-medium">{form.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Email</div>
                    <div className="font-medium">{form.email}</div>
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
    <Card className="w-full border-0 shadow-lg">
      <CardContent className="p-0">
        <div className="flex min-h-[600px]">
          {/* Left sidebar with steps */}
          <nav className="w-1/4 bg-gray-50 px-6 py-12 space-y-8 border-r">
            <h3 className="font-bold text-lg text-foreground mb-8">Teacher Registration</h3>
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
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Registering..." : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherRegistration;
