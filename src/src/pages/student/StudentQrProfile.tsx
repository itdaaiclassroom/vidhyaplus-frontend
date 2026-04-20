import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getStudentByQrToken } from "@/api/client";
import {
  StudentIdentityCard,
  splitSchoolNameForCard,
  formatStudentIdDisplay,
  academicYearLabel,
  validTillMarchLabel,
} from "@/components/StudentIdentityCard";

type QrPayload = {
  qrType: string;
  qrCodeValue: string;
  student: {
    id: string;
    name: string;
    rollNo: string;
    schoolId: string;
    schoolName: string;
    schoolCode?: string;
    grade: number | null;
    section: string;
  };
};

function profileQrUrl(token: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  return `${base}/student/qr/${encodeURIComponent(token)}`;
}

const StudentQrProfile = () => {
  const { token = "" } = useParams();
  const [data, setData] = useState<QrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid QR token");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getStudentByQrToken(token)
      .then((res) => setData(res))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to fetch student details"))
      .finally(() => setLoading(false));
  }, [token]);

  const cardProps = useMemo(() => {
    if (!data) return null;
    const { student } = data;
    const [line1, line2] = splitSchoolNameForCard(student.schoolName || "School");
    const courseFixed =
      student.grade != null
        ? `Class ${student.grade}${student.section ? ` — Section ${student.section}` : ""}`
        : student.section
          ? `Section ${student.section}`
          : "—";

    const displayId = formatStudentIdDisplay(
      student.schoolCode || "",
      student.grade,
      student.section,
      student.rollNo,
      student.id
    );

    return {
      schoolLine1: line1 || student.schoolName || "School",
      schoolLine2: line2,
      studentName: student.name,
      studentIdDisplay: displayId,
      course: courseFixed,
      yearLabel: academicYearLabel(),
      validTill: validTillMarchLabel(),
      qrValue: profileQrUrl(token),
    };
  }, [data, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/50 to-background text-muted-foreground">
        Loading student details...
      </div>
    );
  }

  if (error || !data || !cardProps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50/30 to-background p-6 text-center text-destructive">
        {error || "Student data not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-background to-background flex flex-col items-center justify-center p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="print:shadow-none w-full flex flex-col items-center gap-6">
        <StudentIdentityCard {...cardProps} />

        <div className="print:hidden flex gap-3">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print card
          </Button>
        </div>

        <p className="print:hidden text-[11px] text-muted-foreground text-center max-w-md">
          QR type <code className="text-xs bg-muted px-1 rounded">{data.qrType}</code>
          {" · "}
          Token <code className="text-xs bg-muted px-1 rounded break-all">{data.qrCodeValue}</code>
        </p>
      </div>
    </div>
  );
};

export default StudentQrProfile;
