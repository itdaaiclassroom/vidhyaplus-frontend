import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { registerStudent, fetchAll } from "@/api/client";
import { toast } from "sonner";

type StepKey = "personal" | "family" | "contact" | "summary";

interface StudentForm {
  fullName: string;
  dob: string;
  gender: string;
  classId: string;
  schoolName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  emergencyContact: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  aadhaar: string;
  hostelStatus: string;
  disabilities: string;
  motherTongue?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  photo: File | null;
}

const steps: { key: StepKey; title: string; desc?: string }[] = [
  { key: "personal", title: "Personal Details" },
  { key: "family", title: "Family Details" },
  { key: "contact", title: "Address & Contact" },
  { key: "summary", title: "Summary" },
];

const StudentRegistrationWizard: React.FC = () => {
  const { schoolId } = useAuth();
  const [current, setCurrent] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Array<{ id: string, name: string }>>([]);
  
  useEffect(() => {
    fetchAll().then(data => {
      if (data.classes && schoolId) {
        setSections(data.classes.filter(c => c.schoolId === schoolId));
      }
    }).catch(console.error);
  }, [schoolId]);

  const [form, setForm] = useState<StudentForm>({
    fullName: "",
    dob: "",
    gender: "",
    classId: "",
    schoolName: "",
    fatherName: "",
    motherName: "",
    phone: "",
    emergencyContact: "",
    address: "",
    village: "",
    mandal: "",
    district: "",
    state: "",
    pincode: "",
    aadhaar: "",
    hostelStatus: "no",
    disabilities: "",
    motherTongue: "",
    nationality: "",
    religion: "",
    caste: "",
    photo: null,
  });

  const schoolOptions = ["DAV School", "St. Mary's Academy", "Government School", "Public School", "Bharatiya Vidya Bhavan"];

  const handleChange = (k: keyof StudentForm, v: string | File | null) => setForm((s: StudentForm) => ({ ...s, [k]: v }));

  const next = () => setCurrent((c) => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleSubmit = async () => {
    if (!schoolId) {
      toast.error("School ID not found. Please log in again.");
      return;
    }
    if (!form.fullName || !form.classId) {
      toast.error("Name and Class are required.");
      return;
    }
    
    setLoading(true);
    try {
      const nameParts = form.fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';

      await registerStudent({
        school_id: schoolId,
        section_id: form.classId,
        first_name: firstName,
        last_name: lastName,
        category: form.caste || 'General',
        joined_at: new Date().toISOString().slice(0, 10)
      });
      
      toast.success("Student registered successfully!");
      setCurrent(0);
      setForm({
        fullName: "", dob: "", gender: "", classId: "", schoolName: "", fatherName: "",
        motherName: "", phone: "", emergencyContact: "", address: "", village: "",
        mandal: "", district: "", state: "", pincode: "", aadhaar: "", hostelStatus: "no",
        disabilities: "", motherTongue: "", nationality: "", religion: "", caste: "", photo: null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register student");
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
                <Input placeholder="Student name" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} className="h-10" />
                <Input type="date" placeholder="Date of Birth" value={form.dob} onChange={(e) => handleChange("dob", e.target.value)} className="h-10" />
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="School name" value={form.schoolName} onChange={(e) => handleChange("schoolName", e.target.value)} className="h-10" />
                <Select value={form.classId} onValueChange={(v) => handleChange("classId", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Class/Section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Input placeholder="Caste" value={form.caste || ""} onChange={(e) => handleChange("caste", e.target.value)} className="h-10" />
                <Input placeholder="Religion" value={form.religion || ""} onChange={(e) => handleChange("religion", e.target.value)} className="h-10" />
                <Input placeholder="Mother Tongue" value={form.motherTongue || ""} onChange={(e) => handleChange("motherTongue", e.target.value)} className="h-10" />
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Profile Photo</label>
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

      case "family":
        return (
          <div className="space-y-5 max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-6">
              <Input placeholder="Father's name" value={form.fatherName} onChange={(e) => handleChange("fatherName", e.target.value)} className="h-10" />
              <Input placeholder="Mother's name" value={form.motherName} onChange={(e) => handleChange("motherName", e.target.value)} className="h-10" />
            </div>
            <Textarea placeholder="Any disabilities / special requirements" value={form.disabilities} onChange={(e) => handleChange("disabilities", e.target.value)} />
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <Input placeholder="Phone number" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="h-10" />
                <Input placeholder="Village" value={form.village} onChange={(e) => handleChange("village", e.target.value)} className="h-10" />
                <Input placeholder="Mandal" value={form.mandal} onChange={(e) => handleChange("mandal", e.target.value)} className="h-10" />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Input placeholder="Pincode" value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} className="h-10" />
                <Input placeholder="District" value={form.district} onChange={(e) => handleChange("district", e.target.value)} className="h-10" />
                <Input placeholder="State" value={form.state} onChange={(e) => handleChange("state", e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-foreground min-w-fit">Hostler :</label>
              <Select value={form.hostelStatus} onValueChange={(v) => handleChange("hostelStatus", v)}>
                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Select option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="space-y-5 max-w-2xl mx-auto">
            <h4 className="font-semibold text-lg">Review & Submit</h4>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Name</div>
                  <div className="font-medium">{form.fullName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">DOB</div>
                  <div className="font-medium">{form.dob}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">School</div>
                  <div className="font-medium">{form.schoolName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Class</div>
                  <div className="font-medium">{form.classId}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Phone</div>
                  <div className="font-medium">{form.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Gender</div>
                  <div className="font-medium">{form.gender}</div>
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
          <nav className="w-1/4 bg-gray-50 px-6
           py-12 space-y-8 border-r">
            <h3 className="font-bold text-lg text-foreground mb-8">Student Registration</h3>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${i === current ? "bg-white border-l-4 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setCurrent(i)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === current ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  <div className="whitespace-nowrap font-medium text-sm">{s.title}</div>
                </div>
              ))}
            </div>
          </nav>

          {/* Right content area */}
          <main className="flex-1 px-12 py-16 flex flex-col justify-between">
            <div className="pb-6">{renderStep()}</div>

            <div className="flex justify-between items-center pt-8 border-t">
              <div>
                {current > 0 && <Button variant="outline" onClick={prev}>Back</Button>}
              </div>
              <div className="text-sm text-muted-foreground">
                Step {current + 1} of {steps.length}
              </div>
              <div className="flex items-center gap-3">
                {current < steps.length - 1 ? (
                  <Button onClick={next} className="px-8">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="px-8">
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

export default StudentRegistrationWizard;
