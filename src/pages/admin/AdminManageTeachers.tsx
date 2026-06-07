import React, { useState, useEffect } from "react";
import { usePrincipal } from "@/contexts/PrincipalContext";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import { Button } from "@/components/ui/button";
import { fetchPrincipalSubjects } from "@/api/client";
import { Users, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const AdminManageTeachers: React.FC = () => {
  const { teachers, refetch, schoolId } = usePrincipal();
  const { role, permissions } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const isReadOnly = role === "admin" && permissions?.teachers === "read";

  useEffect(() => {
    if (schoolId) {
      fetchPrincipalSubjects().then(res => {
        if (res && res.data) setSubjectsList(res.data);
        else if (Array.isArray(res)) setSubjectsList(res);
      }).catch(console.error);
    }
  }, [schoolId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Teacher Assignments
          </h3>
          {isReadOnly && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Read-only access
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{t.full_name}</p>
                    <p className="text-sm text-slate-500">{t.email}</p>
                  </div>
                  <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {t.role || 'Teacher'}
                  </div>
                </div>
                
                <div className="space-y-3 mt-4 mb-5">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Subjects
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.subjects && t.subjects.length > 0 ? (
                        t.subjects.map((sub: string, idx: number) => (
                          <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md text-xs font-medium">
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Classes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.class_names && t.class_names.length > 0 ? (
                        t.class_names.map((cls: string, idx: number) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-xs font-medium">
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No classes assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-2 w-full flex items-center gap-2 hover:bg-slate-50"
                onClick={() => setSelectedTeacher(t)}
                disabled={isReadOnly}
                title={isReadOnly ? "You have read-only access" : ""}
              >
                <BookOpen className="w-4 h-4" /> Manage Assignments
              </Button>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              No teachers found in this school.
            </div>
          )}
        </div>
      </div>

      {selectedTeacher && schoolId && (
        <TeacherAssignmentDialog
          teacher={selectedTeacher}
          schoolId={String(schoolId)}
          open={!!selectedTeacher}
          onOpenChange={(open) => { if (!open) setSelectedTeacher(null); }}
          subjects={subjectsList}
          onSaved={refetch}
        />
      )}
    </div>
  );
};
