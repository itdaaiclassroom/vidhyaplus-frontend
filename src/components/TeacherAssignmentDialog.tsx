import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPrincipalGrades, fetchPrincipalSections, PrincipalGrade, PrincipalSection } from "@/api/client";
import { assignTeacherSubjectsAndClasses, fetchTeacherAssignments } from "@/api/client";
import { toast } from "sonner";
import { X } from "lucide-react";

export function TeacherAssignmentDialog({
  teacher,
  schoolId,
  open,
  onOpenChange,
  subjects,
  onSaved
}: {
  teacher: any;
  schoolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: any[];
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for selections
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<number[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<number[]>([]);
  const [assignedSectionIds, setAssignedSectionIds] = useState<number[]>([]);

  // Reference data
  const [grades, setGrades] = useState<PrincipalGrade[]>([]);
  const [allSections, setAllSections] = useState<PrincipalSection[]>([]);
  
  // Input state
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  useEffect(() => {
    if (open && teacher) {
      setLoading(true);
      Promise.all([
        fetchPrincipalGrades(),
        fetchPrincipalSections(), // Fetch ALL sections for name resolution
        fetchTeacherAssignments(String(teacher.id)).catch(() => ({ assigned_subject_ids: [], assigned_class_ids: [], assigned_section_ids: [] }))
      ]).then(([gradesData, sectionsData, assignments]) => {
        setGrades(gradesData.grades || []);
        setAllSections(sectionsData.sections || []);
        setAssignedSubjectIds(assignments.assigned_subject_ids || []);
        setAssignedClassIds(assignments.assigned_class_ids || []);
        setAssignedSectionIds(assignments.assigned_section_ids || []);
      }).catch(err => {
        console.error(err);
        toast.error("Failed to load assignments");
      }).finally(() => setLoading(false));
    }
  }, [open, teacher]);

  const filteredSections = selectedGrade 
    ? allSections.filter(s => String(s.grade_id) === String(selectedGrade))
    : [];

  const handleAddSubject = () => {
    if (selectedSubject && !assignedSubjectIds.includes(Number(selectedSubject))) {
      setAssignedSubjectIds([...assignedSubjectIds, Number(selectedSubject)]);
      setSelectedSubject("");
    }
  };

  const handleAddSection = () => {
    if (selectedGrade && selectedSection && !assignedSectionIds.includes(Number(selectedSection))) {
      setAssignedSectionIds([...assignedSectionIds, Number(selectedSection)]);
      if (!assignedClassIds.includes(Number(selectedGrade))) {
        setAssignedClassIds([...assignedClassIds, Number(selectedGrade)]);
      }
      setSelectedSection("");
    }
  };

  const handleRemoveSubject = (id: number) => {
    setAssignedSubjectIds(assignedSubjectIds.filter(x => x !== id));
  };

  const handleRemoveSection = (id: number) => {
    setAssignedSectionIds(assignedSectionIds.filter(x => x !== id));
    // Optionally remove classId if no sections left, but simple array is fine for now
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await assignTeacherSubjectsAndClasses(String(teacher.id), {
        assigned_subject_ids: assignedSubjectIds,
        assigned_class_ids: assignedClassIds,
        assigned_section_ids: assignedSectionIds
      });
      toast.success("Assignments updated successfully");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update assignments");
    } finally {
      setSaving(false);
    }
  };

  const getSubjectName = (id: string | number) => 
    subjects.find(s => String(s.id) === String(id))?.subject_name || `Subject ${id}`;
  
  const getSectionName = (id: string | number) => {
    const sec = allSections.find(s => String(s.id) === String(id));
    if (sec) return `Grade ${sec.grade_id}-${sec.section_code}`;
    return `Section ID: ${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Subjects & Classes to {teacher?.full_name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-8 py-4">
            
            {/* Subjects Section */}
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Subjects</h4>
              
              <div className="flex gap-2">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddSubject} disabled={!selectedSubject}>Add Subject</Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {assignedSubjectIds.map(id => (
                  <Badge key={id} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                    {getSubjectName(id)}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveSubject(id)} />
                  </Badge>
                ))}
                {assignedSubjectIds.length === 0 && <span className="text-sm text-muted-foreground">No subjects assigned</span>}
              </div>
            </div>

            {/* Classes/Sections Section */}
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Classes & Sections</h4>
              
              <div className="flex gap-2">
                <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setSelectedSection(""); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.grade_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedGrade}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.section_code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddSection} disabled={!selectedSection}>Add Section</Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {assignedSectionIds.map(id => (
                  <Badge key={id} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                    {getSectionName(id)}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveSection(id)} />
                  </Badge>
                ))}
                {assignedSectionIds.length === 0 && <span className="text-sm text-muted-foreground">No sections assigned</span>}
              </div>
            </div>

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
