import React from "react";
import { QRCodeSVG } from "qrcode.react";
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
      <span className="font-display font-black text-[18px] text-teal-600">VidhyaPlus</span>
      <span className="font-display font-bold text-[18px] text-teal-400">+</span>
    </div>
    <span className="text-[7px] font-medium text-slate-500 tracking-tighter uppercase">Smart Student Learning Portal</span>
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
  validUpto: string;
  photoUrl?: string | null;
};

export type TeacherData = {
  id: string;
  name: string;
  designation: string;
  subject: string;
  schoolName: string;
  validUpto: string;
  photoUrl?: string | null;
};

// 1. Student Main Card (Horizontal)
export const StudentMainCard = ({ data }: { data: StudentData }) => {
  return (
    <div className="w-[450px] h-[280px] bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border border-slate-200 relative group transition-all duration-300 hover:shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-teal-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-start relative z-10">
        <ItdaLogo />
        <div className="flex flex-col items-end gap-2">
          <VidhyaPlusLogo />
          <div className="bg-teal-600 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
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
          <InfoRow icon={Layers} label="Class" value={`${data.grade}th ${data.section ? ` - ${data.section}` : ""}`} />
          <InfoRow icon={IdCard} label="ID No." value={data.rollNo} />
          <InfoRow icon={Calendar} label="Valid Upto" value={data.validUpto} />
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
      <div className="h-10 bg-teal-600 flex items-center justify-center relative mt-auto">
        <span className="text-white text-[10px] font-medium tracking-[0.2em] uppercase opacity-90">Empowering Every Student with AI</span>
        <div className="absolute left-0 bottom-0 w-32 h-1 bg-teal-400" />
      </div>
    </div>
  );
};

// 2. Student Option Card (Vertical)
export type OptionLetter = "A" | "B" | "C" | "D";

export const StudentOptionCard = ({ data, option }: { data: StudentData, option: OptionLetter }) => {
  const configs = {
    A: { color: "teal", theme: "bg-teal-600", text: "text-teal-600", light: "bg-teal-50", border: "border-teal-200" },
    B: { color: "green", theme: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-200" },
    C: { color: "blue", theme: "bg-blue-700", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200" },
    D: { color: "purple", theme: "bg-purple-700", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200" },
  };

  const config = configs[option];
  const qrValue = `stu${data.rollNo}_${option}`;

  return (
    <div className="w-[280px] h-[450px] bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col border border-slate-100 relative group transition-all duration-300 hover:shadow-2xl">
      {/* Background decoration */}
      <div className={cn("absolute top-24 right-[-40px] w-32 h-32 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700", config.light)} />
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-start relative z-10">
        <ItdaLogo />
        <VidhyaPlusLogo />
      </div>

      {/* Option Badge */}
      <div className="flex flex-col items-center py-2 relative z-10">
         <span className={cn("text-[9px] font-black tracking-[0.3em] uppercase opacity-60 mb-1", config.text)}>Option</span>
         <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg ring-4 ring-offset-2 ring-transparent transition-all group-hover:ring-slate-100", config.theme)}>
           {option}
         </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center py-4 relative z-10">
        <div className={cn("p-3 bg-white border rounded-[28px] shadow-inner transition-transform group-hover:scale-105", config.border)}>
          <QRCodeSVG value={qrValue} size={110} level="H" />
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-2 space-y-0.5 relative z-10">
        <InfoRow icon={User} label="Name" value={data.name} colorClass={config.text} />
        <InfoRow icon={School} label="School" value={data.schoolName} />
        <InfoRow icon={Layers} label="Class" value={`${data.grade}th ${data.section ? ` - ${data.section}` : ""}`} />
        <InfoRow icon={IdCard} label="ID No." value={`${data.rollNo}-${option}`} />
      </div>

      {/* Footer */}
      <div className={cn("h-12 flex items-center justify-center gap-2 mt-auto", config.theme)}>
        <Scan className="w-4 h-4 text-white opacity-80" />
        <span className="text-white text-[9px] font-bold tracking-widest uppercase opacity-90">Scan to Select Option {option}</span>
      </div>
    </div>
  );
};

// 3. Teacher Main Card (Horizontal)
export const TeacherMainCard = ({ data }: { data: TeacherData }) => {
  return (
    <div className="w-[450px] h-[280px] bg-white rounded-[20px] shadow-xl overflow-hidden flex flex-col border border-slate-200 relative group transition-all duration-300 hover:shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-start relative z-10">
        <ItdaLogo />
        <div className="flex flex-col items-end gap-2">
          <VidhyaPlusLogo />
          <div className="bg-blue-900 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
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
          <InfoRow icon={Calendar} label="Valid Upto" value={data.validUpto} />
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
      <div className="h-10 bg-blue-900 flex items-center justify-center relative mt-auto">
        <span className="text-white text-[10px] font-medium tracking-[0.2em] uppercase opacity-90">Empowering Every Educator</span>
        <div className="absolute left-0 bottom-0 w-32 h-1 bg-blue-400" />
      </div>
    </div>
  );
};
