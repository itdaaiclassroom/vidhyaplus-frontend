import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  StudentIdentityCard,
  splitSchoolNameForCard,
  formatStudentIdDisplay,
  academicYearLabel,
  validTillMarchLabel,
} from "@/components/StudentIdentityCard";

interface Student {
  id: string;
  name: string;
  rollNo: number;
  classId: string;
  schoolId: string;
  section?: string;
}

interface StudentQRCardProps {
  student: Student;
  schoolName: string;
  /** School short code (e.g. from `schools.code`) for formatted Student ID */
  schoolCode?: string;
  className: string;
  /** Optional grade when not inferable from `className` */
  grade?: number | null;
  /** Section letter/code if not on `student.section` */
  section?: string;
}

const StudentQRCard = ({
  student,
  schoolName,
  schoolCode = "",
  className: classLabel,
  grade: gradeProp,
  section: sectionProp,
}: StudentQRCardProps) => {
  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        student_id: student.id,
        name: student.name,
        roll: student.rollNo,
        class: classLabel,
      }),
    [student, classLabel]
  );

  const grade = gradeProp ?? null;
  const section = sectionProp ?? student.section ?? "";

  const [line1, line2] = splitSchoolNameForCard(schoolName || "School");
  const course =
    grade != null
      ? `Class ${grade}${section ? ` — Section ${section}` : ""}`
      : section
        ? `Section ${section}`
        : classLabel || "—";

  const displayId = formatStudentIdDisplay(schoolCode, grade, section, String(student.rollNo), student.id);

  return (
    <div className="flex flex-col items-center gap-3 print:break-inside-avoid">
      <StudentIdentityCard
        compact
        schoolLine1={line1 || schoolName || "School"}
        schoolLine2={line2}
        studentName={student.name}
        studentIdDisplay={displayId}
        course={course}
        yearLabel={academicYearLabel()}
        validTill={validTillMarchLabel()}
        qrValue={qrPayload}
      />
      <Button type="button" variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
        <Printer className="w-3.5 h-3.5" /> Print card
      </Button>
    </div>
  );
};

export default StudentQRCard;
