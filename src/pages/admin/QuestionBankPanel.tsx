import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, X, ChevronLeft, ChevronRight, Trash2, Upload, AlertCircle, CheckCircle, Loader, List, Download } from 'lucide-react';
import * as XLSX from "xlsx";
import { 
  fetchQuestionBank, createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions, fetchSubjectTopics,
  QuestionBankEntry, QuestionBankResponse, BulkUploadQuestionsResponse, CreateQuestionBody 
} from '@/api/client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';

interface QuestionBankPanelProps {
  subjects: any[];
}

export default function QuestionBankPanel({ subjects }: QuestionBankPanelProps) {
  // Filters State
  const [qbSubjectId, setQbSubjectId] = useState<number | "">("");
  const [qbGrade, setQbGrade] = useState<string>("");
  const [qbChapter, setQbChapter] = useState<string>("");
  
  const [qbPendingSubject, setQbPendingSubject] = useState<number | "">("");
  const [qbPendingGrade, setQbPendingGrade] = useState<string>("");
  const [qbPendingChapter, setQbPendingChapter] = useState<string>("");
  
  // Data State
  const [qbPage, setQbPage] = useState(1);
  const [qbTotal, setQbTotal] = useState(0);
  const [qbTotalPages, setQbTotalPages] = useState(1);
  const [questions, setQuestions] = useState<QuestionBankEntry[]>([]);
  const [qbLoading, setQbLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Modal State
  const [qbModalOpen, setQbModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankEntry | null>(null);
  const [qbSaving, setQbSaving] = useState(false);
  
  const initialFormState: CreateQuestionBody = {
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "",
    correct_option: "A", explanation: "", chapter: "", grade: undefined, assigned_for: "both"
  };
  const [qbForm, setQbForm] = useState<CreateQuestionBody>(initialFormState);
  const [modalSubjectId, setModalSubjectId] = useState<number | "">("");
  const [modalTopicId, setModalTopicId] = useState<number | "">("");
  const [modalTopics, setModalTopics] = useState<any[]>([]);
  const [loadingModalTopics, setLoadingModalTopics] = useState(false);

  // Bulk Upload State
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSubjectId, setBulkSubjectId] = useState<number | "">("");
  const [bulkGrade, setBulkGrade] = useState<string>("");
  const [bulkTopicId, setBulkTopicId] = useState<number | "">("");
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadQuestionsResponse | null>(null);

  const downloadSampleTemplate = () => {
    const data = [
      ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation", "Chapter", "Grade", "Assigned For"],
      ["What is the powerhouse of the cell?", "Nucleus", "Mitochondria", "Ribosome", "Golgi Body", "B", "Mitochondria generates ATP.", "Introduction to Cells", "9", "both"],
      ["Which planet is known as the Red Planet?", "Earth", "Mars", "Jupiter", "Venus", "B", "Mars has iron oxide on its surface.", "Solar System", "8", "student"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuestionsTemplate");
    XLSX.writeFile(wb, "quiz_questions_template.xlsx");
  };


  useEffect(() => {
    if (bulkSubjectId && bulkOpen) {
      setLoadingTopics(true);
      fetchSubjectTopics(Number(bulkSubjectId), bulkGrade ? Number(bulkGrade) : undefined)
        .then(setTopics)
        .catch(() => setTopics([]))
        .finally(() => setLoadingTopics(false));
    } else {
      setTopics([]);
    }
  }, [bulkSubjectId, bulkGrade, bulkOpen]);

  useEffect(() => {
    if (modalSubjectId && qbModalOpen) {
      setLoadingModalTopics(true);
      fetchSubjectTopics(Number(modalSubjectId), qbForm.grade)
        .then(setModalTopics)
        .catch(() => setModalTopics([]))
        .finally(() => setLoadingModalTopics(false));
    } else {
      setModalTopics([]);
    }
  }, [modalSubjectId, qbForm.grade, qbModalOpen]);

  const loadQuestions = async () => {
    setQbLoading(true);
    try {
      const res = await fetchQuestionBank({
        subject_id: qbSubjectId !== "" ? Number(qbSubjectId) : undefined,
        grade: qbGrade !== "" ? Number(qbGrade) : undefined,
        chapter: qbChapter !== "" ? qbChapter : undefined,
        page: qbPage,
        limit: 20
      });
      setQuestions(res.data || []);
      setQbTotal(res.total || 0);
      setQbTotalPages(res.total_pages || 1);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load questions");
    } finally {
      setQbLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [qbSubjectId, qbGrade, qbChapter, qbPage]);

  const applyFilters = () => {
    setQbSubjectId(qbPendingSubject);
    setQbGrade(qbPendingGrade);
    setQbChapter(qbPendingChapter);
    setQbPage(1);
  };

  const clearFilters = () => {
    setQbPendingSubject("");
    setQbPendingGrade("");
    setQbPendingChapter("");
    setQbSubjectId("");
    setQbGrade("");
    setQbChapter("");
    setQbPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQbForm(initialFormState);
    setModalSubjectId(qbSubjectId || "");
    setModalTopicId("");
    setQbModalOpen(true);
  };

  const handleOpenEditModal = (q: QuestionBankEntry) => {
    setEditingQuestion(q);
    setModalSubjectId(q.subject_id);
    setModalTopicId(""); // We don't have topic_id in subject_quiz_bank yet
    setQbForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation || "",
      chapter: q.chapter || "",
      grade: q.grade || undefined,
      assigned_for: q.assigned_for || "both"
    });
    setQbModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    setQbSaving(true);
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, qbForm);
        toast.success("Question updated!");
      } else {
        await createQuestion(Number(modalSubjectId), { ...qbForm, topic_id: modalTopicId !== "" ? Number(modalTopicId) : undefined } as any);
        toast.success("Question created!");
      }
      setQbModalOpen(false);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.message || "Failed to save question");
    } finally {
      setQbSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(id);
      toast.success("Question deleted!");
      loadQuestions();
    } catch (err: any) {
      toast.error("Failed to delete question");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkSubjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (!bulkFile) {
      toast.error("Please select a file");
      return;
    }
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const res = await bulkUploadQuestions(Number(bulkSubjectId), bulkFile, bulkTopicId !== "" ? Number(bulkTopicId) : undefined);
      setBulkResult(res);
      toast.success("Bulk upload processed!");
      if (res.uploaded > 0) {
        loadQuestions();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  const OptionBadge = ({ option, text, isCorrect }: { option: string, text: string, isCorrect: boolean }) => (
    <div className={`p-2 rounded-lg border flex gap-2 text-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
      <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-slate-500'}`}>{option})</span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Question Bank</h2>
            <p className="text-sm text-slate-500">Manage MCQ questions for all subjects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={downloadSampleTemplate}>
            <Download className="w-4 h-4 mr-2" /> Download Template
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => { setBulkFile(null); setBulkResult(null); setBulkSubjectId(qbSubjectId); setBulkOpen(true); }}>
            <Upload className="w-4 h-4 mr-2" /> Upload Excel
          </Button>
          <Button className="rounded-xl" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm rounded-2xl bg-slate-50 mb-6">
        <CardContent className="p-5 flex flex-wrap gap-3 items-end">
          <div className="space-y-1 w-48">
            <Label className="text-xs font-bold text-slate-500 uppercase">Subject</Label>
            <select className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" value={qbPendingSubject} onChange={e => setQbPendingSubject(e.target.value ? Number(e.target.value) : "")}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-32">
            <Label className="text-xs font-bold text-slate-500 uppercase">Grade</Label>
            <select className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm" value={qbPendingGrade} onChange={e => setQbPendingGrade(e.target.value)}>
              <option value="">All</option>
              {[6,7,8,9,10].map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-48">
            <Label className="text-xs font-bold text-slate-500 uppercase">Chapter</Label>
            <Input className="h-10 bg-white" placeholder="Search chapter..." value={qbPendingChapter} onChange={e => setQbPendingChapter(e.target.value)} />
          </div>
          <Button className="rounded-xl h-10 px-6" onClick={applyFilters}>Apply</Button>
          <Button variant="outline" className="rounded-xl h-10" onClick={clearFilters}>Clear</Button>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center">
        <Badge variant="outline" className="text-slate-500">
          <List className="w-3 h-3 mr-1 inline" /> {qbTotal} questions · Page {qbPage} of {qbTotalPages}
        </Badge>
      </div>

      {/* Table */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase w-12">#</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase w-1/3">Question</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase">Chapter</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase">Grade</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase text-center">Correct</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase text-center">Assigned For</th>
                <th className="px-5 py-4 font-semibold text-slate-500 text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qbLoading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No questions found</td></tr>
              ) : (
                questions.map(q => {
                  const isExp = expandedRow === q.id;
                  return (
                    <React.Fragment key={q.id}>
                      <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExp ? 'bg-slate-50' : ''}`} onClick={() => setExpandedRow(isExp ? null : q.id)}>
                        <td className="px-5 py-3 text-sm text-slate-400">{q.id}</td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-800 line-clamp-2">{q.question_text}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{q.chapter || '-'}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{q.grade || '-'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 text-center ${
                            q.correct_option === 'A' ? 'bg-emerald-100 text-emerald-700' :
                            q.correct_option === 'B' ? 'bg-blue-100 text-blue-700' :
                            q.correct_option === 'C' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{q.correct_option}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant="outline" className={
                            q.assigned_for === 'student' ? 'text-blue-600 bg-blue-50' : 
                            q.assigned_for === 'teacher' ? 'text-purple-600 bg-purple-50' : 'text-slate-600 bg-slate-50'
                          }>
                            {q.assigned_for === 'student' ? 'Students' : q.assigned_for === 'teacher' ? 'Teachers' : 'Both'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(q); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-10 py-4">
                            <div className="grid grid-cols-2 gap-4 max-w-3xl">
                              <OptionBadge option="A" text={q.option_a} isCorrect={q.correct_option === 'A'} />
                              <OptionBadge option="B" text={q.option_b} isCorrect={q.correct_option === 'B'} />
                              <OptionBadge option="C" text={q.option_c} isCorrect={q.correct_option === 'C'} />
                              <OptionBadge option="D" text={q.option_d} isCorrect={q.correct_option === 'D'} />
                            </div>
                            {q.explanation && (
                              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 max-w-3xl">
                                <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {qbTotalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-4">
            <Button variant="outline" size="sm" disabled={qbPage <= 1} onClick={() => setQbPage(p => p - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
            <Button variant="outline" size="sm" disabled={qbPage >= qbTotalPages} onClick={() => setQbPage(p => p + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={qbModalOpen} onOpenChange={setQbModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveQuestion} className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Subject <span className="text-red-500">*</span></Label>
                <select className="w-full h-10 px-3 border rounded-xl" value={modalSubjectId} onChange={e => setModalSubjectId(e.target.value ? Number(e.target.value) : "")} required disabled={!!editingQuestion}>
                  <option value="">Select...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Grade</Label>
                <select className="w-full h-10 px-3 border rounded-xl" value={qbForm.grade || ""} onChange={e => setQbForm(f => ({ ...f, grade: e.target.value ? Number(e.target.value) : undefined }))}>
                  <option value="">None</option>
                  {[6,7,8,9,10].map(g => <option key={g} value={g}>Class {g}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Chapter</Label>
                <Input value={qbForm.chapter} onChange={e => setQbForm(f => ({ ...f, chapter: e.target.value }))} placeholder="e.g. Optics" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Assign to Topic <span className="text-slate-400 text-[10px] font-normal">(Required for Teacher Assessments)</span></Label>
              <select 
                className="w-full h-10 px-3 border rounded-xl" 
                value={modalTopicId} 
                onChange={e => setModalTopicId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingModalTopics || !modalSubjectId || !!editingQuestion}
              >
                <option value="">Select Topic (Optional)...</option>
                {modalTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.chapter_name}] {t.name}
                  </option>
                ))}
              </select>
              {loadingModalTopics && <p className="text-[10px] text-blue-500 animate-pulse">Loading topics...</p>}
              {editingQuestion && <p className="text-[10px] text-amber-500 italic">Topic assignment is only available during creation.</p>}
            </div>
            
            <div className="space-y-1">
              <Label>Question Text <span className="text-red-500">*</span></Label>
              <textarea className="w-full p-3 border rounded-xl" rows={3} value={qbForm.question_text} onChange={e => setQbForm(f => ({ ...f, question_text: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Option A *</Label><Input required value={qbForm.option_a} onChange={e => setQbForm(f => ({ ...f, option_a: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Option B *</Label><Input required value={qbForm.option_b} onChange={e => setQbForm(f => ({ ...f, option_b: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Option C *</Label><Input required value={qbForm.option_c} onChange={e => setQbForm(f => ({ ...f, option_c: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Option D *</Label><Input required value={qbForm.option_d} onChange={e => setQbForm(f => ({ ...f, option_d: e.target.value }))} /></div>
            </div>

            <div className="space-y-2">
              <Label>Correct Option <span className="text-red-500">*</span></Label>
              <div className="flex gap-4">
                {(['A','B','C','D'] as const).map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-slate-50 pr-4">
                    <input type="radio" name="correct_option" checked={qbForm.correct_option === opt} onChange={() => setQbForm(f => ({ ...f, correct_option: opt }))} />
                    <span className="font-bold">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Assigned For</Label>
              <select className="w-full h-10 px-3 border rounded-xl" value={qbForm.assigned_for || "both"} onChange={e => setQbForm(f => ({ ...f, assigned_for: e.target.value as "student" | "teacher" | "both" }))}>
                <option value="both">Both</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Explanation (optional)</Label>
              <textarea className="w-full p-3 border rounded-xl" rows={2} value={qbForm.explanation} onChange={e => setQbForm(f => ({ ...f, explanation: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setQbModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={qbSaving}>{qbSaving ? "Saving..." : "Save Question"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              Bulk Upload Questions
              <Button variant="ghost" size="sm" onClick={downloadSampleTemplate} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-2">
                <Download className="w-4 h-4" /> Download Template
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Subject <span className="text-red-500">*</span></Label>
                <select className="w-full h-10 px-3 border rounded-xl" value={bulkSubjectId} onChange={e => { setBulkSubjectId(e.target.value ? Number(e.target.value) : ""); setBulkTopicId(""); }}>
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Grade (Optional filter)</Label>
                <select className="w-full h-10 px-3 border rounded-xl" value={bulkGrade} onChange={e => { setBulkGrade(e.target.value); setBulkTopicId(""); }}>
                  <option value="">All Grades</option>
                  {[6,7,8,9,10].map(g => <option key={g} value={g}>Class {g}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Assign to Topic <span className="text-slate-400 text-[10px] font-normal">(Required for Teacher Assessments)</span></Label>
              <select 
                className="w-full h-10 px-3 border rounded-xl" 
                value={bulkTopicId} 
                onChange={e => setBulkTopicId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingTopics || !bulkSubjectId}
              >
                <option value="">Select Topic (Optional)...</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.chapter_name}] {t.name}
                  </option>
                ))}
              </select>
              {loadingTopics && <p className="text-[10px] text-blue-500 animate-pulse">Loading topics...</p>}
            </div>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors text-center cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              {bulkFile ? (
                <p className="font-medium text-indigo-600">{bulkFile.name}</p>
              ) : (
                <>
                  <p className="font-medium text-slate-700">Drop your .xlsx or .csv file here</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[80%] mx-auto">
                    Columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation (opt), Chapter (opt), Grade (opt), Assigned For (opt)
                  </p>
                  <p className="text-[10px] text-indigo-500 mt-2 font-semibold">
                    Note: If you don't select a Topic above, questions will only be saved in the general subject bank.
                  </p>
                </>
              )}
            </div>

            {bulkResult && (
              <div className={`p-4 rounded-xl border ${bulkResult.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {bulkResult.failed > 0 ? <AlertCircle className="w-5 h-5 text-amber-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
                  <span>{bulkResult.uploaded} Uploaded Successfully</span>
                </div>
                {bulkResult.failed > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="text-amber-800 font-semibold mb-1">❌ {bulkResult.failed} Rows Failed:</p>
                    <ul className="list-disc pl-5 space-y-1 text-amber-700 max-h-32 overflow-y-auto">
                      {bulkResult.errors.map((err, i) => <li key={i}>Row {err.row}: {err.reason}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Close</Button>
              <Button onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile || !bulkSubjectId}>
                {bulkUploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
