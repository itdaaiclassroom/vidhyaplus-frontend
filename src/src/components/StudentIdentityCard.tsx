import { QRCodeSVG } from "qrcode.react";

export function splitSchoolNameForCard(name: string): [string, string] {
  const t = name.trim();
  if (!t) return ["", ""];
  const mid = Math.floor(t.length / 2);
  const spaceIdx = t.lastIndexOf(" ", Math.min(mid + 12, t.length - 1));
  if (spaceIdx > 0) {
    return [t.slice(0, spaceIdx).trim(), t.slice(spaceIdx + 1).trim()];
  }
  return [t, ""];
}

export function academicYearLabel(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export function validTillMarchLabel(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const endYear = m >= 3 ? y + 1 : y;
  return `March ${endYear}`;
}

export function formatStudentIdDisplay(
  schoolCode: string,
  grade: number | null,
  section: string,
  rollNo: string,
  fallbackId: string
): string {
  const code = (schoolCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const g = grade != null ? String(grade) : "";
  const sec = (section || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const r = (rollNo || "").replace(/\D/g, "");
  const built = `${code}${g}${sec}${r}`;
  return built || `STU${fallbackId}`;
}

const defaultWebsite =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_INSTITUTION_WEBSITE) || "www.itda.ai";

type RowProps = { label: string; value: string };

function FieldRow({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-2 text-sm leading-snug w-full">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground min-w-0 break-normal [overflow-wrap:break-word]">
        <span className="text-muted-foreground/80">: </span>
        {value}
      </span>
    </div>
  );
}

export type StudentIdentityCardProps = {
  schoolLine1: string;
  schoolLine2: string;
  studentName: string;
  studentIdDisplay: string;
  course: string;
  yearLabel: string;
  validTill: string;
  website?: string;
  qrValue: string;
  /** Smaller padding / QR for embedded admin preview */
  compact?: boolean;
};

export function StudentIdentityCard({
  schoolLine1,
  schoolLine2,
  studentName,
  studentIdDisplay,
  course,
  yearLabel,
  validTill,
  website = defaultWebsite,
  qrValue,
  compact,
}: StudentIdentityCardProps) {
  const qrSize = compact ? 112 : 140;
  return (
    <div
      className={
        compact
          ? "w-full max-w-[320px] mx-auto"
          : "w-full max-w-[480px] mx-auto print:shadow-none"
      }
    >
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h1 className="text-center font-semibold text-foreground text-sm sm:text-base leading-tight">
            {schoolLine1}
          </h1>
          {schoolLine2 ? (
            <p className="text-center text-muted-foreground text-xs sm:text-sm mt-0.5">{schoolLine2}</p>
          ) : null}
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.12em] mt-1.5 font-medium">
            Student ID card
          </p>
        </div>

        <div
          className={
            compact
              ? "flex flex-col items-center gap-4 p-4"
              : "flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
          }
        >
          <div className="flex flex-col items-center shrink-0">
            <div className="rounded-lg bg-background p-2.5 border border-border">
              <QRCodeSVG value={qrValue} size={qrSize} level="M" bgColor="#ffffff" fgColor="#0f172a" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-2 text-center max-w-[160px] leading-tight">
              Scan to verify profile
            </span>
          </div>

          <div className={compact ? "w-full space-y-2" : "flex-1 min-w-0 space-y-2 sm:space-y-2.5 w-full"}>
            <FieldRow label="Name" value={studentName} />
            <FieldRow label="Student ID" value={studentIdDisplay} />
            <FieldRow label="Course" value={course} />
            <FieldRow label="Year" value={yearLabel} />
            <FieldRow label="Valid Till" value={validTill} />
            <div className="pt-2 border-t border-border mt-1">
              <p className="text-[11px] text-right text-muted-foreground">{website}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
