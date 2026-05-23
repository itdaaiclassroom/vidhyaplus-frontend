import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, CheckCircle, AlertCircle, Loader, Layers, List, Sparkles, Trash2, Settings2, ShieldCheck, BookOpen, Save } from 'lucide-react';
import { fetchAll, uploadSubjectMaterial, fetchSubjectMaterials, uploadTopicPpt, deleteSubjectMaterial, deleteTopicPpt, fetchGatingConfig, updateGatingConfig, fetchChapterAssessmentConfig, upsertChapterAssessmentConfig, getPresignedUploadUrl, uploadToR2Direct, extractTextbookCurriculum, getApiBase, type ChapterAssessmentConfigItem } from '@/api/client';
import { toast } from 'sonner';
import QuestionBankPanel from './QuestionBankPanel';

export default function MaterialManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [uploadScope, setUploadScope] = useState<'subject' | 'topic'>('subject');

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // AI Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ chapters: number; topics: number; bookTitle: string } | null>(null);

  // Assessment Config State
  const [assessConfig, setAssessConfig] = useState<Record<string, string>>({});
  const [assessConfigLoading, setAssessConfigLoading] = useState(true);
  const [assessConfigSaving, setAssessConfigSaving] = useState(false);

  // Per-chapter assessment config
  const [chapterConfigGrade, setChapterConfigGrade] = useState('10');
  const [chapterConfigSubject, setChapterConfigSubject] = useState('');
  const [chapterConfigs, setChapterConfigs] = useState<ChapterAssessmentConfigItem[]>([]);
  const [chapterConfigEdits, setChapterConfigEdits] = useState<Record<number, { questionCount: number; totalMarks: number; passingMarks: number }>>({});
  const [chapterConfigLoading, setChapterConfigLoading] = useState(false);
  const [chapterConfigGlobalDefaults, setChapterConfigGlobalDefaults] = useState<{ questionCount: number; totalMarks: number; passingMarks: number }>({ questionCount: 10, totalMarks: 100, passingMarks: 70 });
  const [savingChapterId, setSavingChapterId] = useState<number | null>(null);

  const loadAssessConfig = async () => {
    setAssessConfigLoading(true);
    try {
      const data = await fetchGatingConfig();
      setAssessConfig(data.config || {});
    } catch (err) {
      console.error("Failed to load assessment config:", err);
    } finally {
      setAssessConfigLoading(false);
    }
  };

  const handleUpdateAssessConfig = async (key: string, value: string) => {
    setAssessConfigSaving(true);
    try {
      await updateGatingConfig({ [key]: value });
      setAssessConfig(prev => ({ ...prev, [key]: value }));
      toast.success("Assessment setting updated");
    } catch (err) {
      toast.error("Failed to update setting");
    } finally {
      setAssessConfigSaving(false);
    }
  };

  const loadChapterConfigs = async (subjectId: string) => {
    if (!subjectId) return;
    setChapterConfigLoading(true);
    try {
      const data = await fetchChapterAssessmentConfig(subjectId);
      setChapterConfigs(data.chapters || []);
      setChapterConfigGlobalDefaults(data.globalDefaults);
      // Initialize edits with current values
      const edits: Record<number, { questionCount: number; totalMarks: number; passingMarks: number }> = {};
      for (const ch of data.chapters) {
        edits[ch.chapterId] = { questionCount: ch.questionCount, totalMarks: ch.totalMarks, passingMarks: ch.passingMarks };
      }
      setChapterConfigEdits(edits);
    } catch (err) {
      console.error("Failed to load chapter configs:", err);
      toast.error("Failed to load chapter assessment configs");
    } finally {
      setChapterConfigLoading(false);
    }
  };

  const handleSaveChapterConfig = async (chapterId: number) => {
    const edit = chapterConfigEdits[chapterId];
    if (!edit) return;
    setSavingChapterId(chapterId);
    try {
      await upsertChapterAssessmentConfig(String(chapterId), edit);
      toast.success("Chapter assessment config saved");
      // Mark as custom in local state
      setChapterConfigs(prev => prev.map(c => c.chapterId === chapterId ? { ...c, ...edit, isCustom: true } : c));
    } catch (err) {
      toast.error("Failed to save chapter config");
    } finally {
      setSavingChapterId(null);
    }
  };

  const loadData = async () => {
      try {
        const data = await fetchAll();
        setSubjects(data.subjects || []);
        setChapters(data.chapters || []);
        setTopics(data.topics || []);
        
        // Find first subject for Grade 10 by default
        const grade10Subs = (data.subjects || []).filter((s: any) => (s.grades || []).includes(10));
        if (grade10Subs.length > 0 && !selectedSubject) {
          setSelectedGrade('10');
          setSelectedSubject(grade10Subs[0].id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

  useEffect(() => {
    loadData();
    loadAssessConfig();
  }, []);

  // When grade changes, update available subjects
  useEffect(() => {
    const gradeSubs = subjects.filter(s => (s.grades || []).includes(parseInt(selectedGrade)));
    if (gradeSubs.length > 0) {
      if (!gradeSubs.find(s => String(s.id) === String(selectedSubject))) {
        setSelectedSubject(gradeSubs[0].id);
      }
    } else {
      setSelectedSubject('');
    }
  }, [selectedGrade, subjects]);

  useEffect(() => {
    if (!selectedSubject) return;
    loadMaterials(selectedSubject, selectedGrade);
    
    // Filter chapters for this subject AND grade
    const subChapters = chapters.filter(c => 
      String(c.subjectId) === String(selectedSubject) && 
      String(c.grade) === String(selectedGrade)
    );
    if (subChapters.length > 0) {
      setSelectedChapter(subChapters[0].id);
    } else {
      setSelectedChapter('');
    }
  }, [selectedSubject, selectedGrade, chapters]);

  useEffect(() => {
    if (!selectedChapter) {
       setSelectedTopic('');
       return;
    }
    // Filter topics for this chapter
    const chapTopics = topics.filter(t => String(t.chapterId) === String(selectedChapter));
    if (chapTopics.length > 0) {
      setSelectedTopic(chapTopics[0].id);
    } else {
      setSelectedTopic('');
    }
  }, [selectedChapter, topics]);

  const loadMaterials = async (subId: string, grade: string) => {
    setLoading(true);
    try {
      const data = await fetchSubjectMaterials(subId, grade);
      setMaterials(data || []);
    } catch (err) {
      console.error("Error loading materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setErrorMsg("Please provide a title and select a file.");
      return;
    }
    if (uploadScope === 'subject' && !selectedSubject) {
      setErrorMsg("Please select a subject.");
      return;
    }
    if (uploadScope === 'topic' && !selectedTopic) {
      setErrorMsg("Please select a topic.");
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64String = btoa(binary);
      const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64String}`;

      if (uploadScope === 'subject') {
        await uploadSubjectMaterial(selectedSubject, {
          title,
          file: dataUrl,
          contentType: file.type || 'application/pdf',
          grade_id: selectedGrade
        } as any);
        setSuccessMsg("Reference file uploaded successfully! (Use \"Upload & AI Extract\" to auto-generate chapters & topics.)");
      } else {
        await uploadTopicPpt(selectedTopic, {
          title,
          file: base64String,
          filename: file.name
        });
        setSuccessMsg("Topic presentation uploaded successfully!");
        loadData();
      }

      toast.success("Upload successful!");
      setFile(null);
      setTitle('');
      if (uploadScope === 'subject') loadMaterials(selectedSubject, selectedGrade);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Failed to upload.");
      toast.error(err.message || "Failed to upload.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * AI Extraction handler — uploads the PDF to R2 (or server fallback),
   * then triggers the Express AI pipeline to auto-generate chapters & topics.
   */
  const handleAiExtract = async () => {
    if (!file) {
      setErrorMsg("Please select a PDF file first.");
      return;
    }
    if (!selectedSubject) {
      setErrorMsg("Please select a subject.");
      return;
    }
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg("AI extraction requires a PDF file.");
      return;
    }

    setIsExtracting(true);
    setExtractResult(null);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let publicUrl: string;

      // Step 1: Try presigned R2 upload (fastest, no base64)
      const safeFilename = file.name.replace(/[^a-z0-9._-]/gi, '_');
      const r2Key = `textbook/${selectedSubject}_grade${selectedGrade}_${Date.now()}_${safeFilename}`;

      try {
        const presignResult = await getPresignedUploadUrl(r2Key, file.type || 'application/pdf');
        await uploadToR2Direct(presignResult.uploadUrl, file);
        publicUrl = presignResult.publicUrl;
        console.log('[AI Extract] Uploaded to R2:', publicUrl);
      } catch (r2Err: any) {
        // Step 2: Fallback — server-side upload (R2 not configured)
        console.warn('[AI Extract] R2 upload failed, falling back to server upload:', r2Err.message);
        const buffer = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64File = btoa(binary);
        const apiBase = getApiBase();
        const uploadRes = await fetch(`${apiBase}/api/storage/upload-server`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: r2Key, file: base64File, contentType: file.type || 'application/pdf' }),
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.text().catch(() => uploadRes.statusText);
          throw new Error(`Server upload also failed: ${uploadErr}`);
        }
        const uploadData = await uploadRes.json();
        publicUrl = uploadData.publicUrl;
        console.log('[AI Extract] Uploaded via server fallback:', publicUrl);
      }

      // Step 3: Trigger AI extraction via Express → Python FastAPI
      const result = await extractTextbookCurriculum(selectedSubject, selectedGrade, { pdf_url: publicUrl });

      setExtractResult({
        chapters: result.chapters_loaded,
        topics: result.topics_loaded,
        bookTitle: result.book_title || title || file.name,
      });

      toast.success(`✨ AI extracted ${result.chapters_loaded} chapters & ${result.topics_loaded} topics!`);

      // Step 4: Refresh global data — Teacher Dashboard will instantly update
      await loadData();
      loadMaterials(selectedSubject, selectedGrade);
      setFile(null);
      setTitle('');
    } catch (err: any) {
      console.error('[AI Extract] Error:', err);
      setErrorMsg(err.message || 'AI extraction failed. Please try again.');
      toast.error(err.message || 'AI extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteSubjectMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteSubjectMaterial(id);
      toast.success("Material deleted successfully");
      loadMaterials(selectedSubject, selectedGrade);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleDeleteTopicPpt = async (topicId: string) => {
    if (!window.confirm("Are you sure you want to delete this topic presentation?")) return;
    try {
      await deleteTopicPpt(topicId);
      toast.success("Presentation deleted successfully");
      loadData(); // Refresh to see changes
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const filteredChapters = chapters.filter(c => 
    String(c.subjectId) === String(selectedSubject) && 
    String(c.grade) === String(selectedGrade)
  );
  const filteredTopics = topics.filter(t => String(t.chapterId) === String(selectedChapter));
  const activeTopic = topics.find(t => String(t.id) === String(selectedTopic));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

      {/* ── AI Extraction Glassmorphic Loading Overlay ─────────────────────── */}
      {isExtracting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white/10 border border-white/20 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center backdrop-blur-xl">
            {/* Animated gradient ring */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">VidhyaPlus AI</h3>
            <p className="text-white/80 font-medium mb-1">Reading your textbook...</p>
            <p className="text-white/50 text-sm leading-relaxed">
              Detecting chapters, extracting topics &amp; building your curriculum. This takes 20–40 seconds.
            </p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400"
                  style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
            <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scaleY(0.5); opacity:0.4; } 40% { transform: scaleY(1.2); opacity:1; } }`}</style>
          </div>
        </div>
      )}

      {/* ── AI Extraction Success Banner ────────────────────────────────────── */}
      {extractResult && !isExtracting && (
        <div className="mb-6 p-5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-violet-900 text-lg">Curriculum Extracted Successfully!</h4>
            <p className="text-violet-700 text-sm mt-0.5">
              <span className="font-semibold">{extractResult.bookTitle}</span> — AI detected{' '}
              <span className="font-bold text-indigo-700">{extractResult.chapters} chapters</span> and{' '}
              <span className="font-bold text-violet-700">{extractResult.topics} topics</span> and saved them to the database.
            </p>
            <p className="text-violet-500 text-xs mt-1">The Teacher Dashboard has been automatically updated with the new curriculum structure.</p>
          </div>
          <button onClick={() => setExtractResult(null)} className="text-violet-400 hover:text-violet-600 p-1">
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Book className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Materials Management</h2>
          <p className="text-sm text-slate-500">Upload textbooks for entire subjects or presentations for specific topics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div>
          <form onSubmit={handleUpload} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex gap-2 p-1 bg-slate-200 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setUploadScope('subject')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${uploadScope === 'subject' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <Layers className="w-4 h-4" /> Textbook-wise
              </button>
              <button
                type="button"
                onClick={() => setUploadScope('topic')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${uploadScope === 'topic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <List className="w-4 h-4" /> Topic PPT-wise
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                  <option key={g} value={g}>Class {g}</option>
                ))}
              </select>

              <label className="block text-sm font-medium text-slate-700 mb-1">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              >
                {subjects.filter(s => (s.grades || []).includes(parseInt(selectedGrade))).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {uploadScope === 'topic' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Chapter</label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  >
                    <option value="">-- Choose Chapter --</option>
                    {filteredChapters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  >
                    <option value="">-- Choose Topic --</option>
                    {filteredTopics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {uploadScope === 'subject' ? 'Textbook / Syllabus Title' : 'Topic Presentation Title'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={uploadScope === 'subject' ? "e.g. Biology Standard Textbook" : "e.g. Introduction to Cells PPT"}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {uploadScope === 'subject' ? 'Upload PDF (Textbook)' : 'Upload PPT/PDF (Topic Presentation)'}
              </label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-100 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                ) : (
                  <p className="text-sm text-slate-500">Drag & drop or click to upload</p>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={uploading || isExtracting}
                className="w-full bg-slate-600 text-white rounded-xl py-3 font-medium hover:bg-slate-700 transition-colors flex justify-center items-center gap-2"
                title={uploadScope === 'subject' ? 'Save as a reference file only (no AI extraction)' : 'Upload PPT/PDF for this topic'}
              >
                {uploading ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-5 h-5" /> {uploadScope === 'subject' ? 'Upload Reference Only' : 'Upload'}</>
                )}
              </button>

              {uploadScope === 'subject' && (
                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={uploading || isExtracting || !file}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl py-3 font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Upload PDF to R2 and auto-extract all chapters & topics using AI"
                >
                  <Sparkles className="w-5 h-5" />
                  Upload & AI Extract Curriculum
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Materials */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            {uploadScope === 'subject' ? "Uploaded Subject Materials" : "Topic Material Status"}
          </h3>
          
          {uploadScope === 'subject' ? (
            loading ? (
              <div className="flex justify-center p-8"><Loader className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : materials.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No subject materials uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{m.title}</p>
                        <p className="text-xs text-slate-500">Uploaded {new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={m.file_path || m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteSubjectMaterial(m.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete material"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
               {activeTopic && activeTopic.topicPptPath ? (
                 <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                             <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="font-bold text-green-900">Presentation Active</h4>
                             <p className="text-xs text-green-700">File: {activeTopic.topicPptPath.split('/').pop()}</p>
                          </div>
                       </div>
                       <button
                         onClick={() => handleDeleteTopicPpt(activeTopic.id)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                       >
                          <Trash2 className="w-4 h-4" /> Delete PPT
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 text-slate-500">
                       <AlertCircle className="w-5 h-5" />
                       <p className="text-sm">No presentation uploaded for the selected topic yet.</p>
                    </div>
                 </div>
               )}

              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 mb-1">Smart Topic PPTs</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Topic-specific presentations are automatically linked to the teacher's lesson screen. 
                      When a teacher starts a session for the selected topic, your uploaded PPT will be the primary presentation shown.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Quiz Questions Upload */}
      <QuestionBankPanel subjects={subjects} />

      {/* Per-Chapter Assessment Settings */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Chapter Assessment Settings</h2>
              <p className="text-sm text-slate-500">Set number of questions, total marks, and passing marks per chapter.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] text-blue-700 font-medium">Admin Only</span>
          </div>
        </div>

        {/* Global Defaults Row */}
        {!assessConfigLoading && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Global Defaults (applied when no chapter-specific config is set)</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Default Questions (Max 30)</label>
                <input type="number" value={assessConfig.student_quiz_question_count || "10"}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (val > 30) val = 30;
                    setAssessConfig(prev => ({ ...prev, student_quiz_question_count: String(val) }));
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-center text-purple-600 focus:ring-2 focus:ring-purple-500 outline-none" min={1} max={30} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Default Total Marks</label>
                <input type="number" value={assessConfig.student_quiz_total_marks || "100"}
                  onChange={(e) => setAssessConfig(prev => ({ ...prev, student_quiz_total_marks: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-center text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none" min={1} max={1000} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold">Default Passing Marks</label>
                <input type="number" value={assessConfig.student_quiz_passing_marks || "70"}
                  onChange={(e) => setAssessConfig(prev => ({ ...prev, student_quiz_passing_marks: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-center text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none" min={1} max={1000} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={async () => {
                  let qCount = parseInt(assessConfig.student_quiz_question_count || "10", 10);
                  if (isNaN(qCount) || qCount < 1) qCount = 10;
                  if (qCount > 30) qCount = 30;
                  await Promise.all([
                    handleUpdateAssessConfig("student_quiz_question_count", String(qCount)),
                    handleUpdateAssessConfig("student_quiz_total_marks", assessConfig.student_quiz_total_marks || "100"),
                    handleUpdateAssessConfig("student_quiz_passing_marks", assessConfig.student_quiz_passing_marks || "70")
                  ]);
                  // Refresh the table to show the new global defaults
                  if (chapterConfigSubject) {
                    loadChapterConfigs(chapterConfigSubject);
                  }
                }}
                disabled={assessConfigSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {assessConfigSaving ? "Saving..." : "Save Global Defaults"}
              </button>
            </div>
          </div>
        )}

        {/* Class and Subject Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Class</label>
            <select
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              value={chapterConfigGrade}
              onChange={(e) => {
                setChapterConfigGrade(e.target.value);
                setChapterConfigSubject('');
                setChapterConfigs([]);
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                <option key={g} value={g}>Class {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Subject</label>
            <select
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              value={chapterConfigSubject}
              onChange={(e) => {
                setChapterConfigSubject(e.target.value);
                loadChapterConfigs(e.target.value);
              }}
              disabled={!chapterConfigGrade}
            >
              <option value="">Choose a subject...</option>
              {subjects
                .filter(s => (s.grades || []).includes(parseInt(chapterConfigGrade)))
                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Chapter List */}
        {chapterConfigSubject && (() => {
          const filteredChapters = chapterConfigs.filter(ch => String(ch.gradeId) === String(chapterConfigGrade));
          
          if (chapterConfigLoading) {
            return <div className="flex justify-center p-8"><Loader className="w-8 h-8 text-purple-500 animate-spin" /></div>;
          }
          if (filteredChapters.length === 0) {
            return <div className="text-center text-slate-400 py-8">No chapters found for this subject and class.</div>;
          }
          return (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Chapter</div>
                <div className="col-span-2 text-center">Questions</div>
                <div className="col-span-2 text-center">Total Marks</div>
                <div className="col-span-2 text-center">Passing Marks</div>
                <div className="col-span-1"></div>
              </div>
              {filteredChapters.map((ch, idx) => {
                const edit = chapterConfigEdits[ch.chapterId] || { questionCount: ch.questionCount, totalMarks: ch.totalMarks, passingMarks: ch.passingMarks };
                const hasChanges = edit.questionCount !== ch.questionCount || edit.totalMarks !== ch.totalMarks || edit.passingMarks !== ch.passingMarks;
                return (
                  <div key={ch.chapterId} className={`grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl border transition-all ${
                    ch.isCustom ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}>
                    <div className="col-span-1 text-sm font-bold text-slate-400">{idx + 1}</div>
                    <div className="col-span-4">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ch.chapterName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400">Grade {ch.gradeId}</span>
                        {ch.isCustom && <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-bold">Custom</span>}
                        {!ch.isCustom && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">Default</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={edit.questionCount}
                        onChange={(e) => setChapterConfigEdits(prev => ({ ...prev, [ch.chapterId]: { ...edit, questionCount: parseInt(e.target.value) || 1 } }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold text-center text-purple-600 focus:ring-2 focus:ring-purple-400 outline-none"
                        min={1} max={50} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={edit.totalMarks}
                        onChange={(e) => setChapterConfigEdits(prev => ({ ...prev, [ch.chapterId]: { ...edit, totalMarks: parseInt(e.target.value) || 1 } }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold text-center text-indigo-600 focus:ring-2 focus:ring-indigo-400 outline-none"
                        min={1} max={1000} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={edit.passingMarks}
                        onChange={(e) => setChapterConfigEdits(prev => ({ ...prev, [ch.chapterId]: { ...edit, passingMarks: parseInt(e.target.value) || 1 } }))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold text-center text-emerald-600 focus:ring-2 focus:ring-emerald-400 outline-none"
                        min={1} max={1000} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleSaveChapterConfig(ch.chapterId)}
                        disabled={savingChapterId === ch.chapterId || (!hasChanges && ch.isCustom)}
                        className={`p-2 rounded-lg transition-all ${
                          hasChanges ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' : 'bg-slate-100 text-slate-400'
                        }`}
                        title="Save chapter config"
                      >
                        {savingChapterId === ch.chapterId ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      
    </div>
  );
}
