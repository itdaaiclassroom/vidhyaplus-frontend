import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArucoMarkerSvg } from "@/components/ArucoMarkerSvg";
import { toArucoId } from "@/lib/arucoGenerator";
import { 
  User, 
  School, 
  BookOpen, 
  IdCard, 
  Calendar, 
  Scan, 
  Award,
  BadgeCheck,
  Briefcase,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Branding Components ---

export const ItdaLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col items-start leading-none", className)}>
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center p-1.5">
        <School className="text-white w-full h-full" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-[13px] tracking-tight text-slate-800">ITDA</span>
        <span className="font-bold text-[11px] tracking-widest text-slate-600">UTNOOR</span>
      </div>
    </div>
  </div>
);

export const VidhyaPlusLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col items-end leading-none", className)}>
    <div className="flex items-center gap-0.5">
      <span 
        className="font-display font-black text-[18px] text-teal-600"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
      >
        VidhyaPlus
      </span>
      <span 
        className="font-display font-bold text-[18px] text-teal-400"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
      >
        +
      </span>
    </div>
    <span className="text-[7px] font-bold text-slate-500 tracking-wider uppercase mt-1">Smart Learning Smarter Future</span>
  </div>
);

// --- Helper Components ---

const InfoRow = ({ icon: Icon, label, value, colorClass = "text-slate-600" }: { icon: any, label: string, value: string, colorClass?: string }) => (
  <div className="flex items-center gap-2 py-0.5">
    <div className={cn("p-1 rounded-md bg-slate-100", colorClass)}>
      <Icon className="w-3 h-3" />
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">{label}</span>
      <span className="text-[10px] font-bold text-slate-800 leading-tight">{value}</span>
    </div>
  </div>
);

// --- Main Components ---

export type StudentData = {
  id: string;
  name: string;
  schoolName: string;
  grade: string | number;
  section: string;
  rollNo: string;
  photoUrl?: string | null;
};

export type TeacherData = {
  id: string;
  name: string;
  designation: string;
  subject: string;
  schoolName: string;
  photoUrl?: string | null;
};

// 1. Student Main Card (Horizontal)
export const StudentMainCard = ({ data }: { data: StudentData }) => {
  return (
    <div 
      className="w-[450px] h-[280px] bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border border-slate-200 relative group transition-all duration-300 hover:shadow-2xl"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
    >
      {/* Background decoration */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-teal-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-start relative z-10">
        {/* <ItdaLogo /> */}
        <div />
        <div className="flex flex-col items-end gap-2 ml-auto">
          <VidhyaPlusLogo />
          <div 
            className="bg-teal-600 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-wider uppercase"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#0d9488' } as any}
          >
            Student ID Card
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex gap-6 relative z-10">
        {/* Photo */}
        <div className="w-32 h-36 border-2 border-teal-600 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
               <User className="w-12 h-12 text-slate-400" />
               <span className="text-[8px] font-bold">PHOTO</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <InfoRow icon={User} label="Name" value={data.name} colorClass="text-teal-600" />
          <InfoRow icon={School} label="School" value={data.schoolName} />
          <InfoRow icon={Layers} label="Class" value={`${data.grade && data.grade !== 'N/A' ? `${data.grade}th` : 'Class'} ${data.section ? ` - ${data.section}` : ""}`} />
          <InfoRow icon={IdCard} label="ID No." value={data.rollNo} />
        </div>

        {/* QR & Sign */}
        <div className="w-24 flex flex-col items-center justify-center gap-3">
          <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <QRCodeSVG value={data.rollNo} size={70} level="M" />
          </div>
          <div className="flex flex-col items-center">
             <div className="h-6 flex items-center justify-center">
                <span className="font-serif italic text-slate-400 text-[10px]">Signatory</span>
             </div>
             <div className="w-20 border-t border-slate-300 mt-0.5" />
             <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Authorised Signatory</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="h-10 bg-teal-600 flex items-center justify-center relative mt-auto"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#0d9488' } as any}
      >
        <span className="text-white text-[10px] font-medium tracking-[0.2em] uppercase opacity-90">Empowering Every Student with AI</span>
        <div className="absolute left-0 bottom-0 w-32 h-1 bg-teal-400" />
      </div>
    </div>
  );
};

// 2. Student Option Card (Vertical)
export type OptionLetter = "A" | "B" | "C" | "D";

export const StudentOptionCard = ({ data, option, printLayout = "4-in-1" }: { data: StudentData, option: OptionLetter, printLayout?: "4-in-1" | "1-per-page" }) => {
  const configs = {
    A: { color: "teal", theme: "bg-teal-600", text: "text-teal-600", light: "bg-teal-50", border: "border-teal-200", hex: "#0d9488" },
    B: { color: "green", theme: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", hex: "#059669" },
    C: { color: "blue", theme: "bg-blue-700", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200", hex: "#1d4ed8" },
    D: { color: "purple", theme: "bg-purple-700", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200", hex: "#7e22ce" },
  };

  const config = configs[option];
  const arucoId = toArucoId(Number(data.rollNo), option);

  // ---- 4-in-1 layout (original compact card) ----
  if (printLayout === "4-in-1") {
    return (
      <div 
        className="w-[280px] h-[480px] bg-white rounded-[24px] overflow-hidden flex flex-col border border-slate-100 relative group transition-all duration-300 hover:shadow-2xl shadow-xl print:w-[85mm] print:h-[120mm] print:rounded-xl print:shadow-none"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
      >
        <div className={cn("absolute top-24 right-[-40px] w-32 h-32 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700", config.light)} />
        <div className="px-5 pt-6 pb-4 print:pt-3 print:pb-2 flex justify-between items-start relative z-10">
          <div />
          <VidhyaPlusLogo className="ml-auto" />
        </div>
        <div className="flex flex-col items-center py-2 print:py-3 relative z-10">
           <span className={cn("text-[9px] font-black tracking-[0.3em] uppercase opacity-60 mb-1", config.text)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>Option</span>
           <div className={cn("w-16 h-16 print:w-16 print:h-16 rounded-full flex items-center justify-center text-white text-3xl print:text-3xl font-black shadow-lg ring-4 ring-offset-2 ring-transparent", config.theme)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: config.hex } as any}>{option}</div>
        </div>
        <div className="flex justify-center py-4 print:py-4 relative z-10">
          <div className={cn("p-3 print:p-2 bg-white border rounded-[28px] print:rounded-2xl shadow-inner", config.border)}>
            <ArucoMarkerSvg id={arucoId} size={110} className="print:w-[120px] print:h-[120px]" />
          </div>
        </div>
        <div className="px-6 py-2 print:px-6 print:py-2 print:space-y-1 space-y-0.5 relative z-10">
          <InfoRow icon={User} label="Name" value={data.name} colorClass={config.text} />
          <InfoRow icon={School} label="School" value={data.schoolName} />
          <InfoRow icon={Layers} label="Class" value={`${data.grade && data.grade !== 'N/A' ? `${data.grade}th` : 'Class'} ${data.section ? ` - ${data.section}` : ""}`} />
          <InfoRow icon={IdCard} label="ID No." value={`${data.rollNo}-${option}`} />
        </div>
        <div className={cn("h-12 print:h-10 flex items-center justify-center gap-2 mt-auto", config.theme)} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: config.hex } as any}>
          <Scan className="w-4 h-4 print:w-3 print:h-3 text-white opacity-80" />
          <span className="text-white text-[9px] print:text-[9px] font-bold tracking-widest uppercase opacity-90">Scan to Select Option {option}</span>
        </div>
      </div>
    );
  }

  // ---- 1-per-page layout (full A4 card for print) ----
  return (
    <>
      {/* Print-only styles for the fullpage card - injected once per card render, browser dedupes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .option-card-fullpage {
            width: 190mm !important;
            height: 277mm !important;
            border-radius: 24px !important;
            border: 2px solid #e2e8f0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .option-card-fullpage .fp-header {
            width: 100% !important;
            padding: 20px 28px 12px !important;
          }
          .option-card-fullpage .fp-badge-label {
            font-size: 18px !important;
          }
          .option-card-fullpage .fp-badge-circle {
            width: 80px !important;
            height: 80px !important;
            font-size: 42px !important;
          }
          .option-card-fullpage .fp-details {
            width: 100% !important;
            padding: 16px 36px !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px 32px !important;
          }
          .option-card-fullpage .fp-detail-icon {
            width: 24px !important;
            height: 24px !important;
            padding: 4px !important;
          }
          .option-card-fullpage .fp-detail-icon svg {
            width: 16px !important;
            height: 16px !important;
          }
          .option-card-fullpage .fp-detail-label {
            font-size: 11px !important;
          }
          .option-card-fullpage .fp-detail-value {
            font-size: 16px !important;
          }
          .option-card-fullpage .fp-footer {
            height: 52px !important;
            width: 100% !important;
          }
          .option-card-fullpage .fp-footer-icon {
            width: 20px !important;
            height: 20px !important;
          }
          .option-card-fullpage .fp-footer-text {
            font-size: 13px !important;
          }
        }
      `}} />
      <div 
        className="option-card-fullpage w-[280px] h-[480px] bg-white rounded-[24px] overflow-hidden flex flex-col border border-slate-100 relative group transition-all duration-300 hover:shadow-2xl shadow-xl"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
      >
        {/* Background decoration */}
        <div className={cn("absolute top-24 right-[-40px] w-32 h-32 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700", config.light)} />
        
        {/* Header */}
        <div className="fp-header px-5 pt-6 pb-4 flex justify-between items-start relative z-10">
          <div />
          <VidhyaPlusLogo className="ml-auto" />
        </div>

        {/* Option Badge */}
        <div className="flex flex-col items-center py-3 relative z-10">
           <span 
             className={cn("fp-badge-label text-[9px] font-black tracking-[0.3em] uppercase opacity-60 mb-1", config.text)}
             style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
           >
             Option
           </span>
           <div 
             className={cn("fp-badge-circle w-16 h-16 text-3xl rounded-full flex items-center justify-center text-white font-black shadow-lg ring-4 ring-offset-2 ring-transparent transition-all group-hover:ring-slate-100", config.theme)}
             style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: config.hex } as any}
           >
             {option}
           </div>
        </div>

        {/* QR Code - grows to fill available space, SVG scales to fill container */}
{/* Large ArUco Marker */}
<div className="flex-1 flex items-center justify-center py-4 relative z-10 w-full">
  
  <div
    className={cn(
      "bg-white border shadow-inner transition-transform",
      "group-hover:scale-105",
      "flex items-center justify-center",

      // normal view
      "w-[260px] h-[260px]",

      // print view
      "print:w-[520px] print:h-[520px]",

      // reduced padding
      "p-2 print:p-3",

      "rounded-[24px] print:rounded-[32px]",

      // force child svg to fill
      "[&_div]:!w-full",
      "[&_div]:!h-full",
      "[&_svg]:!w-full",
      "[&_svg]:!h-full",

      config.border
    )}
  >
    <ArucoMarkerSvg
      id={arucoId}
      size={520}
      className="w-full h-full"
    />
  </div>

</div>

        {/* Details - 2 column grid in print */}
        <div className="fp-details px-6 py-2 space-y-0.5 relative z-10">
          <div className="flex items-center gap-2 py-0.5">
            <div className={cn("fp-detail-icon p-1 rounded-md bg-slate-100", config.text)}><User className="w-3 h-3" /></div>
            <div className="flex flex-col"><span className="fp-detail-label text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">Name</span><span className="fp-detail-value text-[10px] font-bold text-slate-800 leading-tight">{data.name}</span></div>
          </div>
          <div className="flex items-center gap-2 py-0.5">
            <div className="fp-detail-icon p-1 rounded-md bg-slate-100 text-slate-600"><School className="w-3 h-3" /></div>
            <div className="flex flex-col"><span className="fp-detail-label text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">School</span><span className="fp-detail-value text-[10px] font-bold text-slate-800 leading-tight">{data.schoolName}</span></div>
          </div>
          <div className="flex items-center gap-2 py-0.5">
            <div className="fp-detail-icon p-1 rounded-md bg-slate-100 text-slate-600"><Layers className="w-3 h-3" /></div>
            <div className="flex flex-col"><span className="fp-detail-label text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">Class</span><span className="fp-detail-value text-[10px] font-bold text-slate-800 leading-tight">{`${data.grade && data.grade !== 'N/A' ? `${data.grade}th` : 'Class'} ${data.section ? ` - ${data.section}` : ""}`}</span></div>
          </div>
          <div className="flex items-center gap-2 py-0.5">
            <div className="fp-detail-icon p-1 rounded-md bg-slate-100 text-slate-600"><IdCard className="w-3 h-3" /></div>
            <div className="flex flex-col"><span className="fp-detail-label text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none">ID No.</span><span className="fp-detail-value text-[10px] font-bold text-slate-800 leading-tight">{`${data.rollNo}-${option}`}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className={cn("fp-footer h-12 flex items-center justify-center gap-2 mt-auto rounded-b-[24px]", config.theme)}
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: config.hex } as any}
        >
          <Scan className="fp-footer-icon w-4 h-4 text-white opacity-80" />
          <span className="fp-footer-text text-white text-[9px] font-bold tracking-widest uppercase opacity-90">Scan to Select Option {option}</span>
        </div>
      </div>
    </>
  );
};

// 3. Teacher Main Card (Horizontal)
export const TeacherMainCard = ({ data }: { data: TeacherData }) => {
  return (
    <div 
      className="w-[450px] h-[280px] bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border border-slate-200 relative group transition-all duration-300 hover:shadow-2xl"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}
    >
      {/* Background decoration */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-start relative z-10">
        {/* <ItdaLogo /> */}
        <div />
        <div className="flex flex-col items-end gap-2 ml-auto">
          <VidhyaPlusLogo />
          <div 
            className="bg-blue-900 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-wider uppercase"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#1e3a8a' } as any}
          >
            Teacher ID Card
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex gap-6 relative z-10">
        {/* Photo */}
        <div className="w-32 h-36 border-2 border-blue-900 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
               <User className="w-12 h-12 text-slate-400" />
               <span className="text-[8px] font-bold">PHOTO</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-center space-y-1">
          <InfoRow icon={User} label="Name" value={data.name} colorClass="text-blue-900" />
          <InfoRow icon={Briefcase} label="Designation" value={data.designation} />
          <InfoRow icon={BookOpen} label="Subject" value={data.subject} />
          <InfoRow icon={School} label="School" value={data.schoolName} />
          <InfoRow icon={IdCard} label="ID No." value={data.id} />
        </div>

        {/* QR & Sign */}
        <div className="w-24 flex flex-col items-center justify-center gap-3">
          <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <QRCodeSVG value={data.id} size={70} level="M" />
          </div>
          <div className="flex flex-col items-center">
             <div className="h-6 flex items-center justify-center">
                <span className="font-serif italic text-slate-400 text-[10px]">Signatory</span>
             </div>
             <div className="w-20 border-t border-slate-300 mt-0.5" />
             <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Authorised Signatory</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="h-10 bg-blue-900 flex items-center justify-center relative mt-auto"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#1e3a8a' } as any}
      >
        <span className="text-white text-[10px] font-medium tracking-[0.2em] uppercase opacity-90">Empowering Every Educator</span>
        <div className="absolute left-0 bottom-0 w-32 h-1 bg-blue-400" />
      </div>
    </div>
  );
};
