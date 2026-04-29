import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createPrincipalSection, updatePrincipalSection, deletePrincipalSection, PrincipalGrade, PrincipalSection } from "@/api/client";
import { usePrincipal } from "@/contexts/PrincipalContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LayoutGrid, Users } from "lucide-react";

interface SectionManagementProps {
  onViewStudents?: (gradeId: number, sectionId: number) => void;
}

const SectionManagement: React.FC<SectionManagementProps> = ({ onViewStudents }) => {
  const { grades, sections, loading, refetchSections } = usePrincipal();
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [newSectionCode, setNewSectionCode] = useState("");
  const [editingSection, setEditingSection] = useState<PrincipalSection | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddSection = async () => {
    if (!selectedGrade || !newSectionCode.trim()) {
      toast.error("Please select a grade and enter a section code");
      return;
    }
    setSubmitting(true);
    try {
      await createPrincipalSection({
        grade_id: Number(selectedGrade),
        section_code: newSectionCode.trim().toUpperCase()
      });
      toast.success("Section created successfully");
      setIsAddModalOpen(false);
      setSelectedGrade("");
      setNewSectionCode("");
      refetchSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create section");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !newSectionCode.trim()) return;
    setSubmitting(true);
    try {
      await updatePrincipalSection(editingSection.id, {
        section_code: newSectionCode.trim().toUpperCase()
      });
      toast.success("Section updated successfully");
      setIsEditModalOpen(false);
      setEditingSection(null);
      setNewSectionCode("");
      refetchSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update section");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!editingSection) return;
    setSubmitting(true);
    try {
      await deletePrincipalSection(editingSection.id);
      toast.success("Section deleted successfully");
      setIsDeleteModalOpen(false);
      setEditingSection(null);
      refetchSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete section");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (section: PrincipalSection) => {
    setEditingSection(section);
    setNewSectionCode(section.section_code);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (section: PrincipalSection) => {
    setEditingSection(section);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Loading sections...</p>
      </div>
    );
  }

  // Group sections by grade
  const groupedSections = grades.reduce((acc, grade) => {
    acc[grade.id] = {
      label: grade.grade_label,
      sections: sections.filter(s => s.grade_id === grade.id)
    };
    return acc;
  }, {} as Record<number, { label: string; sections: PrincipalSection[] }>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" /> Section Management
          </h3>
          <p className="text-sm text-muted-foreground">Manage classes and sections for your school</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(groupedSections).map(([gradeId, group]) => (
          <Card key={gradeId} className="overflow-hidden border-secondary/50">
            <CardHeader className="bg-secondary/20 py-3 px-6">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                {group.label}
                <Badge variant="outline" className="bg-white">{group.sections.length} Sections</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-secondary/30">
                {group.sections.length > 0 ? (
                  group.sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between py-4 px-6 hover:bg-secondary/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {section.section_code}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{section.display_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {section.student_count} Students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {onViewStudents && (
                          <Button variant="outline" size="sm" onClick={() => onViewStudents(section.grade_id, section.id)}>
                            View Students
                          </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(section)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteModal(section)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm italic">
                    No sections created for this grade yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Section Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>Create a new class section in your school.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Grade</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.grade_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Code</label>
              <Input 
                placeholder="e.g. A, B, C, Rose, Lotus" 
                value={newSectionCode} 
                onChange={(e) => setNewSectionCode(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={submitting}>
              {submitting ? "Creating..." : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Section</DialogTitle>
            <DialogDescription>Update the section code for {editingSection?.display_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Section Code</label>
              <Input 
                placeholder="e.g. B" 
                value={newSectionCode} 
                onChange={(e) => setNewSectionCode(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSection} disabled={submitting}>
              {submitting ? "Updating..." : "Update Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete **{editingSection?.display_name}**? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingSection && editingSection.student_count > 0 && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 font-medium">
              Warning: This section has {editingSection.student_count} students enrolled. 
              The server will block deletion until they are reassigned.
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSection} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionManagement;
