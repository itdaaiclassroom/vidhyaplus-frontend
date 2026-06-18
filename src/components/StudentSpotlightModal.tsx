import React from 'react';
import { X, Calendar, Award } from 'lucide-react';

interface StudentSpotlightModalProps {
  spotlightStudent: any;
  setSpotlightStudent: (student: any) => void;
  safeRawAttendance: any[];
  safeQuizzes: any[];
}

export const StudentSpotlightModal: React.FC<StudentSpotlightModalProps> = ({
  spotlightStudent,
  setSpotlightStudent,
  safeRawAttendance,
  safeQuizzes,
}) => {
  if (!spotlightStudent) return null;

  // Fetch recent student attendance logs
  const studentAttendanceLogs = safeRawAttendance
    .filter(a => String(a.studentId) === String(spotlightStudent.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Fetch student quiz scores
  const studentQuizzes = safeQuizzes
    .filter(q => String(q.studentId) === String(spotlightStudent.id) && q.total > 0)
    .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
    .slice(0, 10);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
              Student Spotlight
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-2">{spotlightStudent.name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Grade: <strong className="text-slate-700">{spotlightStudent.grade}</strong> | School: <strong className="text-slate-700">{spotlightStudent.schoolName}</strong>
            </p>
          </div>
          <button 
            onClick={() => setSpotlightStudent(null)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Attendance</span>
              <span className="text-xl font-black text-emerald-600 block mt-1">{spotlightStudent.attPct}%</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Quiz Performance</span>
              <span className="text-xl font-black text-indigo-650 block mt-1">{spotlightStudent.quizPct}%</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Quizzes</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1">{studentQuizzes.length} Attempts</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/40 bg-indigo-50/30">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Rank Status</span>
              <span className="text-xl font-black text-indigo-600 block mt-1">
                {spotlightStudent.quizPct >= 90 ? "Excellent" : spotlightStudent.quizPct >= 75 ? "Good" : spotlightStudent.quizPct >= 50 ? "Average" : "Needs Improvement"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Attendance Log History */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Recent Attendance Logs
              </h4>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[260px] overflow-y-auto space-y-2.5">
                {studentAttendanceLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-150/40">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {log.date ? new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">Daily Attendance log</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      log.status === "present"
                        ? "bg-emerald-50 text-emerald-650 border border-emerald-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
                {studentAttendanceLogs.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-12">No raw attendance logs found for this student.</p>
                )}
              </div>
            </div>

            {/* Quiz Results Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Quiz Results Breakdown
              </h4>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[260px] overflow-y-auto space-y-2.5">
                {studentQuizzes.map((quiz, index) => {
                  const percent = quiz.total > 0 ? Math.round((quiz.score / quiz.total) * 100) : 0;
                  return (
                    <div key={index} className="bg-white p-3 rounded-xl border border-slate-150/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{quiz.subjectName || "Quiz Attempt"}</span>
                        <span className="text-xs font-extrabold text-indigo-600">{percent}% ({quiz.score}/{quiz.total})</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {studentQuizzes.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-12">No quiz results logged for this student.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={() => setSpotlightStudent(null)}
            className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
export default StudentSpotlightModal;
