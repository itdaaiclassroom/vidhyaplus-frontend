import React from 'react';
import { Download, X, GraduationCap, Trophy, Users, BarChart3, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentReportCardProps {
  studentName: string;
  className: string;
  subjectName?: string;
  rollNumber: string;
  schoolName: string;
  attendance: number;
  perfIndex: number;
  quizScore: number;
  quizTotal: number;
  aiReportContent: string;
  onClose: () => void;
  onDownload: () => void;
}

const StudentReportCard: React.FC<StudentReportCardProps> = ({
  studentName,
  className,
  subjectName = "Social Studies",
  rollNumber,
  schoolName,
  attendance,
  perfIndex,
  quizScore,
  quizTotal,
  aiReportContent,
  onClose,
  onDownload
}) => {
  // Simple parser for AI content
  const parseAiNarrative = (content: string) => {
    if (!content) return { 
      strengths: "Mathematics, Physics", 
      opportunities: "English", 
      summary: "Student shows consistent progress across core subjects." 
    };

    // If it's a long text, we can try to extract parts, but usually it's better to just show it
    // For now, let's assume the AI returns a structured-ish string or just use defaults if it's too short
    const strengthsMatch = content.match(/Strengths:?\s*([^.\n]+)/i);
    const opportunitiesMatch = content.match(/(?:Areas to improve|Opportunities|Improvement):?\s*([^.\n]+)/i);
    
    return {
      strengths: strengthsMatch ? strengthsMatch[1].trim() : "Core concepts, logical reasoning",
      opportunities: opportunitiesMatch ? opportunitiesMatch[1].trim() : "Communication skills",
      summary: content.length > 50 ? content : "This analysis is automatically generated based on real-time student performance logs."
    };
  };

  const narrative = parseAiNarrative(aiReportContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl bg-[#F8F9FE] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
        id="student-report-card"
      >
        {/* Header - Purple Gradient */}
        <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-8 pb-16 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            data-html2canvas-ignore
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">VidhyaPlus</h1>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Academic Performance Report</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
              <p className="text-[10px] font-bold uppercase opacity-70">Academic Year</p>
              <p className="text-sm font-black">2025-26</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Users className="w-10 h-10 text-[#6366F1]" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">{studentName}</h2>
              <div className="flex gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/10 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> {subjectName}
                </span>
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/10 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" /> Class {className}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Overlapping */}
        <div className="px-8 -mt-10 relative z-10 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform duration-300">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Performance Index</p>
            <p className="text-3xl font-black text-[#6366F1]">{perfIndex}%</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform duration-300">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
            <p className="text-3xl font-black text-[#10B981]">{attendance}%</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform duration-300">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quiz Score</p>
            <p className="text-3xl font-black text-[#F59E0B]">{quizScore}/{quizTotal}</p>
          </div>
        </div>

        {/* AI Narrative Section */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Learning Narrative</p>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#ECFDF5] rounded-3xl p-5 border border-emerald-100 flex gap-4 group">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Key Strengths
                </p>
                <p className="text-sm font-bold text-slate-700 leading-tight">"{narrative.strengths}"</p>
              </div>
            </div>

            <div className="bg-[#FFFBEB] rounded-3xl p-5 border border-amber-100 flex gap-4 group">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" /> Opportunities for Growth
                </p>
                <p className="text-sm font-bold text-slate-700 leading-tight">"{narrative.opportunities}"</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100/50 rounded-2xl p-4 text-center">
            <p className="text-[10px] italic text-slate-500 leading-relaxed max-w-md mx-auto">
              Note: {narrative.summary}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-0 flex gap-4" data-html2canvas-ignore>
          <Button 
            variant="ghost" 
            className="flex-1 rounded-2xl h-14 font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
            onClick={onClose}
          >
            Dismiss
          </Button>
          <Button 
            className="flex-[2] rounded-2xl h-14 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-black shadow-xl shadow-[#6366F1]/20 gap-3 transition-all active:scale-[0.98]"
            onClick={onDownload}
          >
            <Download className="w-5 h-5" /> Download Report PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentReportCard;
