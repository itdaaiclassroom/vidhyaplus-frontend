import React, { useState, useEffect } from "react";
import { usePrincipal } from "@/contexts/PrincipalContext";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import { Button } from "@/components/ui/button";
import { fetchPrincipalSubjects } from "@/api/client";
import { Users, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const AdminManageTeachers: React.FC = () => {
  const { teachers, refetch, schoolId } = usePrincipal();
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

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
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" /> Teacher Assignments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-800 text-lg">{t.full_name}</p>
                <p className="text-sm text-slate-500">{t.email}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 w-full flex items-center gap-2"
                onClick={() => setSelectedTeacher(t)}
              >
                <BookOpen className="w-4 h-4" /> Assign Subjects & Classes
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
