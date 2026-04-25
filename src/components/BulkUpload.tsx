import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  registerStudent, 
  registerTeacher, 
  fetchPrincipalGrades, 
  fetchPrincipalSections,
  PrincipalGrade,
  PrincipalSection
} from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle
} from "lucide-react";

type UploadType = "students" | "teachers";

interface LogEntry {
  row: number;
  name: string;
  status: "success" | "error";
  message: string;
}

const BulkUpload: React.FC = () => {
  const { schoolId } = useAuth();
  const [type, setType] = useState<UploadType>("students");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const downloadSample = () => {
    const headers = type === "students" 
      ? [["First Name", "Last Name", "Grade", "Section", "Password", "Gender", "Category", "Date of Birth", "Father Name", "Mother Name", "Phone", "Aadhaar", "Address", "Village", "Mandal", "District", "State", "Pincode", "Hostel Status", "Disabilities"]]
      : [["Full Name", "Email", "Password", "Subjects", "Role", "Date of Birth", "Gender", "Caste", "Religion", "Nationality", "Mother Tongue", "Phone Number", "Emergency Contact", "Address", "Village", "Mandal", "District", "State", "Pincode", "Aadhaar Number", "Disabilities"]];
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${type}_bulk_template.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseFile(selected);
    }
  };

  const parseFile = (file: File) => {
    setParsing(true);
    setLogs([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json);
        toast.success(`Parsed ${json.length} rows successfully.`);
      } catch (err) {
        toast.error("Failed to parse Excel file.");
        console.error(err);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processBulk = async () => {
    if (!schoolId) {
      toast.error("School ID not found.");
      return;
    }
    if (parsedData.length === 0) {
      toast.error("No data to process.");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setLogs([]);

    try {
      // For students, we need to map Grade + Section names to section_id
      let sectionMap: Record<string, number> = {};
      if (type === "students") {
        const { sections } = await fetchPrincipalSections();
        sections.forEach(s => {
          // Key: "10-A" or "6-B"
          const key = `${s.grade_id}-${s.section_code}`.toUpperCase();
          sectionMap[key] = s.id;
        });
      }

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const rowNum = i + 2; // 1-indexed + header row
        
        try {
          if (type === "students") {
            const firstName = row["First Name"] || row["first_name"];
            const lastName = row["Last Name"] || row["last_name"];
            const grade = row["Grade"] || row["grade"];
            const sectionCode = row["Section"] || row["section"];
            const password = String(row["Password"] || row["password"] || "123456");
            
            if (!firstName || !grade || !sectionCode) {
              throw new Error("Missing required fields (First Name, Grade, or Section)");
            }

            const sectionKey = `${grade}-${sectionCode}`.toUpperCase();
            const sectionId = sectionMap[sectionKey];

            if (!sectionId) {
              throw new Error(`Section "${sectionCode}" not found for Grade ${grade}`);
            }

            await registerStudent({
              school_id: schoolId,
              section_id: String(sectionId),
              first_name: firstName,
              last_name: lastName || "Student",
              password: password,
              category: row["Category"] || row["category"] || "General",
              joined_at: new Date().toISOString().slice(0, 10),
              grade_id: Number(grade),
              // Additional fields
              father_name: row["Father Name"] || row["father_name"],
              mother_name: row["Mother Name"] || row["mother_name"],
              phone: String(row["Phone"] || row["phone"] || ""),
              aadhaar: String(row["Aadhaar"] || row["aadhaar"] || ""),
              address: row["Address"] || row["address"],
              village: row["Village"] || row["village"],
              mandal: row["Mandal"] || row["mandal"],
              district: row["District"] || row["district"],
              state: row["State"] || row["state"],
              pincode: String(row["Pincode"] || row["pincode"] || ""),
              hostel_status: row["Hostel Status"] || row["hostel_status"] || "no",
              disabilities: row["Disabilities"] || row["disabilities"],
              gender: row["Gender"] || row["gender"],
              dob: row["Date of Birth"] || row["dob"]
            });

            setLogs(prev => [...prev, { row: rowNum, name: firstName, status: "success", message: "Registered successfully" }]);
          } else {
            // Teachers
            const fullName = row["Full Name"] || row["full_name"];
            const email = row["Email"] || row["email"];
            const password = String(row["Password"] || row["password"] || "123456");
            const subjectsStr = row["Subjects"] || row["subjects"] || "";

            if (!fullName || !email) {
              throw new Error("Missing required fields (Full Name or Email)");
            }

            await registerTeacher({
              school_id: schoolId,
              full_name: fullName,
              email: email,
              password: password,
              subjects: subjectsStr.split(",").map((s: string) => s.trim()).filter(Boolean),
              role: row["Role"] || row["role"] || "teacher",
              // Additional fields
              dob: row["Date of Birth"] || row["dob"],
              gender: row["Gender"] || row["gender"],
              caste: row["Caste"] || row["caste"],
              religion: row["Religion"] || row["religion"],
              nationality: row["Nationality"] || row["nationality"],
              mother_tongue: row["Mother Tongue"] || row["mother_tongue"],
              phone_number: String(row["Phone Number"] || row["phone_number"] || ""),
              emergency_contact: String(row["Emergency Contact"] || row["emergency_contact"] || ""),
              address: row["Address"] || row["address"],
              village: row["Village"] || row["village"],
              mandal: row["Mandal"] || row["mandal"],
              district: row["District"] || row["district"],
              state: row["State"] || row["state"],
              pincode: String(row["Pincode"] || row["pincode"] || ""),
              aadhaar_number: String(row["Aadhaar Number"] || row["aadhaar_number"] || ""),
              disabilities: row["Disabilities"] || row["disabilities"]
            });

            setLogs(prev => [...prev, { row: rowNum, name: fullName, status: "success", message: "Registered successfully" }]);
          }
        } catch (err) {
          const name = row["First Name"] || row["Full Name"] || "Unknown";
          setLogs(prev => [...prev, { row: rowNum, name, status: "error", message: err instanceof Error ? err.message : "Registration failed" }]);
        }

        setProgress(Math.round(((i + 1) / parsedData.length) * 100));
      }

      toast.success("Bulk processing completed.");
    } catch (err) {
      toast.error("Critical error during bulk processing.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Bulk Registration
          </h3>
          <p className="text-sm text-muted-foreground">Upload an Excel sheet to register multiple users at once.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
            <Download className="w-4 h-4" /> Download Sample
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Upload Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Registration Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={type === "students" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => { setType("students"); setFile(null); setParsedData([]); setLogs([]); }}
                  disabled={processing}
                >
                  Students
                </Button>
                <Button 
                  variant={type === "teachers" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => { setType("teachers"); setFile(null); setParsedData([]); setLogs([]); }}
                  disabled={processing}
                >
                  Teachers
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Excel File</label>
              <div className="relative border-2 border-dashed border-secondary rounded-lg p-6 hover:border-primary/50 transition-colors text-center cursor-pointer group">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={processing}
                />
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                <p className="text-xs font-medium">{file ? file.name : "Click to select or drag and drop"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">XLSX or XLS only</p>
              </div>
            </div>

            {parsedData.length > 0 && !processing && (
              <Button className="w-full gap-2" onClick={processBulk}>
                <CheckCircle2 className="w-4 h-4" /> Register {parsedData.length} {type}
              </Button>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="text-[10px] text-center text-muted-foreground animate-pulse">Please do not close this tab</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden flex flex-col max-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3">
            <CardTitle className="text-sm">Activity Logs</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Success: {logs.filter(l => l.status === "success").length}
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Errors: {logs.filter(l => l.status === "error").length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  {parsing ? (
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  ) : (
                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                  )}
                  <p className="text-xs">{parsing ? "Parsing Excel..." : "No activity yet. Upload a file to start."}</p>
                </div>
              ) : (
                <div className="divide-y text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 ${log.status === "error" ? "bg-red-50/30" : ""}`}>
                      <div className="w-8 text-center text-muted-foreground font-mono">#{log.row}</div>
                      {log.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{log.name}</p>
                        <p className={`text-[10px] ${log.status === "error" ? "text-red-600" : "text-muted-foreground"}`}>
                          {log.message}
                        </p>
                      </div>
                    </div>
                  )).reverse()}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkUpload;
