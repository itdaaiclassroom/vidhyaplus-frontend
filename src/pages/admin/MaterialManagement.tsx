import React, { useState, useEffect, useRef } from 'react';
import { Upload, Book, FileText, CheckCircle, AlertCircle, Loader, Layers, List, Sparkles, Trash2, Settings2, ShieldCheck, BookOpen, Save, Table2, ChevronDown, ChevronRight, ChevronLeft, Search, ExternalLink, X, Download, GraduationCap } from 'lucide-react';
import { fetchAll, uploadSubjectMaterial, fetchSubjectMaterials, uploadTopicPpt, deleteSubjectMaterial, deleteTopicPpt, updateTopicPdf, deleteTopicPdf, updateTopicYoutube, deleteTopicYoutube, updateTopicActivity, deleteTopicActivity, fetchGatingConfig, updateGatingConfig, fetchChapterAssessmentConfig, upsertChapterAssessmentConfig, getPresignedUploadUrl, uploadToR2Direct, extractTextbookCurriculum, getApiBase, bulkUploadCurriculum, fetchCurriculumStructure, deleteCurriculumEntry, toggleTopicMaterialMandatory, fetchTopicMaterials, type ChapterAssessmentConfigItem, type CurriculumChapter } from '@/api/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from "@/contexts/AuthContext";
import { CurriculumBuilderModal } from './CurriculumBuilderModal';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export type PendingMaterial = 
  | { id: string; type: 'file'; file: File; materialType: 'pdf' | 'ppt' | 'textbook'; title: string; isMandatory: boolean }
  | { id: string; type: 'youtube'; url: string; title: string; isMandatory: boolean }
  | { id: string; type: 'activity'; description?: string; title: string; file?: File | null; isMandatory: boolean };

export default function MaterialManagement() {
  const { role, permissions } = useAuth();
  const isReadOnly = role === "admin" && permissions?.materials === "read";

  const getAdminMaterialUrl = (url: string | null): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const base = getApiBase();
    const cleanPath = url
      .replace(/\\/g, "/")
      .replace(/^\//, "")
      .replace(/^uploads\//i, "");
    return `${base}/uploads/${cleanPath}`;
  };

  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  const gradesList = grades.length > 0 ? grades : [
    { id: 1, grade_label: 'Class 1' },
    { id: 2, grade_label: 'Class 2' },
    { id: 3, grade_label: 'Class 3' },
    { id: 4, grade_label: 'Class 4' },
    { id: 5, grade_label: 'Class 5' },
    { id: 6, grade_label: 'Class 6' },
    { id: 7, grade_label: 'Class 7' },
    { id: 8, grade_label: 'Class 8' },
    { id: 9, grade_label: 'Class 9' },
    { id: 10, grade_label: 'Class 10' }
  ];

  const [selectedGrade, setSelectedGrade] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activityFile, setActivityFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Ref to prevent cascading useEffects from overwriting user selections on data reload
  const isInitialLoad = useRef(true);
  const currentUploadScope = selectedTopic ? 'topic' : 'subject';

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [title, setTitle] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // AI Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ chapters: number; topics: number; bookTitle: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  // Curriculum Structure state
  const [curriculumTab, setCurriculumTab] = useState<'materials' | 'curriculum'>('materials');
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const [curriculumUploading, setCurriculumUploading] = useState(false);
  const [curriculumResult, setCurriculumResult] = useState<{ uploaded: number; skipped: number; failed: number; errors: any[] } | null>(null);
  const [curriculumData, setCurriculumData] = useState<CurriculumChapter[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [curriculumFilterGrade, setCurriculumFilterGrade] = useState('');
  const [curriculumFilterSubject, setCurriculumFilterSubject] = useState('');
  const [curriculumFilterChapter, setCurriculumFilterChapter] = useState('');
  const [curriculumSearchText, setCurriculumSearchText] = useState('');
  const [curriculumPage, setCurriculumPage] = useState(1);
  const [isCurriculumUploadOpen, setIsCurriculumUploadOpen] = useState(false);

  // Curriculum Builder Modal state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<'grade' | 'subject' | 'chapter' | 'topic'>('grade');

  // PDF Viewer state
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState<string>('');

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

  // ── Curriculum Structure helpers ─────────────────────────────────────────
  const loadCurriculumData = async (subjectId?: string, grade?: string) => {
    setCurriculumLoading(true);
    try {
      const params: any = {};
      if (subjectId) params.subject_id = Number(subjectId);
      if (grade) params.grade = Number(grade);
      const data = await fetchCurriculumStructure(params);
      setCurriculumData(data.chapters || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load curriculum');
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleCurriculumUpload = async () => {
    if (!curriculumFile) { toast.error('Please select an Excel file'); return; }
    setCurriculumUploading(true);
    setCurriculumResult(null);
    try {
      const result = await bulkUploadCurriculum(curriculumFile);
      setCurriculumResult(result);
      if (result.uploaded > 0) {
        toast.success(`✅ ${result.uploaded} topics uploaded successfully!`);
        await loadCurriculumData(curriculumFilterSubject, curriculumFilterGrade);
        await loadData();
      } else {
        toast.info(`No new topics uploaded. ${result.skipped} skipped, ${result.failed} failed.`);
      }
      setCurriculumFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setCurriculumUploading(false);
    }
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const downloadTemplate = () => {
    const header = 'subject,grade,chapter,topic,subtopics,learning_intent\n';
    const rows = [
      'Physics,10,Light,Reflection of Light,Mirror formula; Image formation,Understand optical principles',
      'Physics,10,Light,Refraction of Light,Snell\'s law; Lenses,',
      'Biology,9,Cell,Cell Structure,Nucleus; Cytoplasm; Cell membrane,',
    ].join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'curriculum_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const loadData = async () => {
    try {
      const data = await fetchAll();
      setSubjects(data.subjects || []);
      setChapters(data.chapters || []);
      setTopics(data.topics || []);
      setGrades(data.grades || []);
      // No auto-selection — let user pick subject manually
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadAssessConfig();
  }, []);

  useEffect(() => {
    if (curriculumTab === 'curriculum') {
      loadCurriculumData(curriculumFilterSubject, curriculumFilterGrade);
    }
  }, [curriculumTab, curriculumFilterSubject, curriculumFilterGrade]);

  useEffect(() => {
    setCurriculumPage(1);
    // Reset chapter filter whenever grade or subject changes
    setCurriculumFilterChapter('');
  }, [curriculumFilterSubject, curriculumFilterGrade, curriculumSearchText]);

  // When grade changes, clear subject only if current selection is no longer valid
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const gradeSubs = subjects.filter(s => (s.grades || []).includes(parseInt(selectedGrade)));
    if (selectedSubject && gradeSubs.find(s => String(s.id) === String(selectedSubject))) {
      // Current selection is still valid for this grade — keep it
      return;
    }
    // Current selection is invalid — clear it (don't auto-pick)
    setSelectedSubject('');
  }, [selectedGrade, subjects]);

  useEffect(() => {
    if (!selectedSubject) return;
    loadMaterials(selectedSubject, selectedGrade);

    // Only auto-pick chapter if user hasn't already selected one that's valid
    const subChapters = chapters.filter(c =>
      String(c.subjectId) === String(selectedSubject) &&
      String(c.grade) === String(selectedGrade)
    );
    if (selectedChapter && subChapters.find(c => String(c.id) === String(selectedChapter))) {
      return; // current chapter selection is still valid
    }
    setSelectedChapter('');
  }, [selectedSubject, selectedGrade, chapters]);

  useEffect(() => {
    if (!selectedChapter) {
      setSelectedTopic('');
      return;
    }
    // Only clear topic if current selection is no longer valid
    const chapTopics = topics.filter(t => String(t.chapterId) === String(selectedChapter));
    if (selectedTopic && chapTopics.find(t => String(t.id) === String(selectedTopic))) {
      return; // current topic selection is still valid
    }
    setSelectedTopic('');
  }, [selectedChapter, topics]);

  useEffect(() => {
    if (selectedTopic) {
      refreshTopicMaterials(selectedTopic);
    }
  }, [selectedTopic]);

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

  const refreshTopicMaterials = async (topicId: string) => {
    try {
      const topicMats = await fetchTopicMaterials(topicId);
      setTopics(prev => prev.map(t => String(t.id) === String(topicId) ? { ...t, materials: topicMats } : t));
    } catch (err) {
      console.error("Error refreshing topic materials:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      const rejected = allFiles.filter(f => f.size > MAX_FILE_SIZE);
      const accepted = allFiles.filter(f => f.size <= MAX_FILE_SIZE);

      if (rejected.length > 0) {
        const names = rejected.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
        toast.error(`File(s) exceed 1 MB limit and were not added: ${names}`);
      }

      if (accepted.length > 0) {
        const newFiles = accepted.map(f => {
          const isPpt = f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx');
          return {
            id: Math.random().toString(36).substring(7),
            type: 'file' as const,
            file: f,
            materialType: (isPpt ? 'ppt' : 'pdf') as 'ppt' | 'pdf',
            title: f.name.split('.')[0],
            isMandatory: false
          };
        });
        setPendingMaterials(prev => [...prev, ...newFiles]);
      }
    }
  };

  const handleTextbookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      const rejected = allFiles.filter(f => f.size > MAX_FILE_SIZE);
      const accepted = allFiles.filter(f => f.size <= MAX_FILE_SIZE);

      if (rejected.length > 0) {
        const names = rejected.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(', ');
        toast.error(`File(s) exceed 1 MB limit and were not added: ${names}`);
      }

      if (accepted.length > 0) {
        const newFiles = accepted.map(f => {
          return {
            id: Math.random().toString(36).substring(7),
            type: 'file' as const,
            file: f,
            materialType: 'textbook' as const,
            title: f.name.split('.')[0],
            isMandatory: false
          };
        });
        setPendingMaterials(prev => [...prev, ...newFiles]);
      }
    }
  };

  const addYoutubeLink = () => {
    if (!youtubeUrl) return;
    setPendingMaterials(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(7), type: 'youtube', url: youtubeUrl, title: title || 'YouTube Video', isMandatory: false }
    ]);
    setYoutubeUrl('');
    setTitle('');
  };

  const addActivity = () => {
    if (!activityFile) return;
    setPendingMaterials(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(7), type: 'activity', title: activityFile.name.split('.')[0] || 'Class Activity', file: activityFile, isMandatory: false }
    ]);
    setActivityFile(null);
  };

  const updatePendingTitle = (id: string, newTitle: string) => {
    setPendingMaterials(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };

  const removePendingMaterial = (id: string) => {
    setPendingMaterials(prev => prev.filter(item => item.id !== id));
  };

  const togglePendingMaterialMandatory = (id: string) => {
    setPendingMaterials(prev => prev.map(item => item.id === id ? { ...item, isMandatory: !item.isMandatory } : item));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isTopicUpload = !!selectedTopic;

    if (!isTopicUpload) {
      if (!selectedSubject) { setErrorMsg("Please select a subject."); return; }
      if (pendingMaterials.length === 0) { setErrorMsg("Please select at least one file."); return; }
    } else {
      if (!selectedTopic) { setErrorMsg("Please select a topic."); return; }
      if (pendingMaterials.length === 0) {
        setErrorMsg("Please add at least one material to the pending queue.");
        return;
      }
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!isTopicUpload) {
        for (const item of pendingMaterials) {
          if (item.type !== 'file') continue;
          const { file, title } = item;
          const buffer = await file.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
          const base64String = btoa(binary);
          const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64String}`;

          await uploadSubjectMaterial(selectedSubject, {
            title: title || file.name,
            file: dataUrl,
            contentType: file.type || 'application/pdf',
            grade_id: selectedGrade
          } as any);
        }
        setSuccessMsg("Textbook(s) uploaded successfully!");
      } else {
        // Topic materials
        for (const item of pendingMaterials) {
          if (item.type === 'file') {
            const { file, isMandatory, materialType, title } = item;
            if (materialType === 'textbook') {
              const buffer = await file.arrayBuffer();
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
              const base64String = btoa(binary);
              const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64String}`;

              await uploadSubjectMaterial(selectedSubject, {
                title: title || file.name,
                file: dataUrl,
                contentType: file.type || 'application/pdf',
                grade_id: selectedGrade
              } as any);
              continue;
            }
            let publicUrl = '';
            const safeFilename = file.name.replace(/[^a-z0-9._-]/gi, '_');
            const r2Key = materialType === 'ppt' 
              ? `ppt/${selectedTopic}_${Date.now()}_${safeFilename}`
              : `materials/${selectedTopic}_${Date.now()}_${safeFilename}`;
            
            try {
              const presignResult = await getPresignedUploadUrl(r2Key, file.type || 'application/octet-stream');
              await uploadToR2Direct(presignResult.uploadUrl, file);
              publicUrl = presignResult.publicUrl;
            } catch (r2Err) {
              console.warn('R2 upload failed, falling back to Base64:', r2Err);
              const buffer = await file.arrayBuffer();
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
              const base64String = btoa(binary);
              
              if (materialType === 'ppt') {
                await uploadTopicPpt(selectedTopic, { title: title || file.name, file: base64String, filename: file.name, is_mandatory: isMandatory });
              } else {
                await updateTopicPdf(selectedTopic, { title: title || file.name, file: base64String, filename: file.name, is_mandatory: isMandatory });
              }
              continue; // proceed to next file
            }

            if (materialType === 'ppt') {
              await uploadTopicPpt(selectedTopic, { title: title || file.name, path: publicUrl, is_mandatory: isMandatory });
            } else {
              await updateTopicPdf(selectedTopic, { title: title || file.name, path: publicUrl, is_mandatory: isMandatory });
            }
          } else if (item.type === 'youtube') {
            await updateTopicYoutube(selectedTopic, { title: item.title, url: item.url, is_mandatory: item.isMandatory });
          } else if (item.type === 'activity') {
            // Activity upload logic
            const payload: any = { title: item.title, description: item.description, is_mandatory: item.isMandatory };
            
            if (item.file) {
              let publicUrl = '';
              const safeFilename = item.file.name.replace(/[^a-z0-9._-]/gi, '_');
              const r2Key = `materials/activity_${selectedTopic}_${Date.now()}_${safeFilename}`;
              
              try {
                const presignResult = await getPresignedUploadUrl(r2Key, item.file.type || 'application/octet-stream');
                await uploadToR2Direct(presignResult.uploadUrl, item.file);
                publicUrl = presignResult.publicUrl;
                payload.path = publicUrl;
              } catch (r2Err) {
                console.warn('Activity R2 upload failed, falling back to Base64:', r2Err);
                const buffer = await item.file.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
                payload.file = btoa(binary);
                payload.filename = item.file.name;
              }
            }
            
            await updateTopicActivity(selectedTopic, payload);
          }
        }

        setSuccessMsg(`Topic material(s) uploaded successfully!`);
      }

      toast.success("Upload successful!");
      setPendingMaterials([]);
      setTitle('');
      setYoutubeUrl('');
      // Reload both subject textbooks and topic materials to ensure right-hand panel is fully in sync
      if (selectedSubject) {
        await loadMaterials(selectedSubject, selectedGrade);
      }
      if (selectedTopic) {
        await refreshTopicMaterials(selectedTopic);
      }
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
    if (!files || files.length === 0) {
      setErrorMsg("Please select a PDF file first.");
      return;
    }
    const file = files[0];
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
      setFiles([]);
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

  const handleDeleteTopicMaterial = async (topicId: string, type: string, materialId?: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} material?`)) return;
    try {
      if (materialId) {
        const { deleteTopicMaterial } = await import('@/api/client');
        await deleteTopicMaterial(topicId, type, materialId);
      } else {
        // Fallback for old bulk delete functions
        if (type === 'ppt') await deleteTopicPpt(topicId);
        else if (type === 'pdf') await deleteTopicPdf(topicId);
        else if (type === 'youtube') await deleteTopicYoutube(topicId);
        else if (type === 'activity') await deleteTopicActivity(topicId);
      }
      
      toast.success("Material deleted successfully");
      await refreshTopicMaterials(topicId);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete material");
    }
  };

  const handleToggleMandatory = async (topicId: string, type: string, materialId: string, currentStatus: boolean) => {
    if (isReadOnly) return;
    try {
      await toggleTopicMaterialMandatory(topicId, type, materialId, !currentStatus);
      toast.success("Mandatory status updated");
      await refreshTopicMaterials(topicId);
    } catch (err: any) {
      toast.error(err.message || "Failed to update mandatory status");
    }
  };

  const filteredChapters = chapters.filter(c =>
    String(c.subjectId) === String(selectedSubject) &&
    String(c.grade) === String(selectedGrade)
  );
  const filteredTopics = topics.filter(t => String(t.chapterId) === String(selectedChapter));
  const activeTopic = topics.find(t => String(t.id) === String(selectedTopic));

  const showTextbookUpload = !!selectedSubject && materials.length === 0 && (
    !!selectedTopic || 
    filteredChapters.length === 0 || 
    (!!selectedChapter && filteredTopics.length === 0)
  );

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
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Materials Management</h2>
          <p className="text-sm text-slate-500">Upload textbooks for entire subjects or presentations for specific topics.</p>
        </div>
        {isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 h-fit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Read-only access
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-slate-200 rounded-lg mb-6 max-w-sm">
        <button
          type="button"
          onClick={() => setCurriculumTab('materials')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${curriculumTab === 'materials' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <Layers className="w-4 h-4" /> Upload Materials
        </button>
        <button
          type="button"
          onClick={() => setCurriculumTab('curriculum')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${curriculumTab === 'curriculum' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <GraduationCap className="w-4 h-4" /> Curriculum
        </button>
      </div>

      {curriculumTab !== 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div>
            <form onSubmit={handleUpload} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Select Class</label>
                  {!isReadOnly && (
                    <button type="button" onClick={() => { setBuilderType('grade'); setBuilderOpen(true); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Manage Classes</button>
                  )}
                </div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {gradesList.map(g => (
                    <option key={g.id} value={g.id}>{g.grade_label || `Class ${g.id}`}</option>
                  ))}
                </select>

                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Select Subject</label>
                  {!isReadOnly && selectedGrade && (
                    <button type="button" onClick={() => { setBuilderType('subject'); setBuilderOpen(true); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Manage Subjects</button>
                  )}
                </div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.filter(s => (s.grades || []).includes(parseInt(selectedGrade))).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Select Chapter <span className="text-xs text-slate-500 font-normal">(Optional for Textbook)</span></label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  disabled={!selectedSubject}
                >
                  <option value="">-- Select Chapter --</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Select Topic <span className="text-xs text-slate-500 font-normal">(Optional for Textbook)</span></label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  disabled={!selectedChapter}
                >
                  <option value="">-- Select Topic --</option>
                  {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {!!selectedTopic && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800">Unified Upload Queue</h4>
                    <span className="text-xs text-slate-500">Drop files or use quick-add below</span>
                  </div>
                  
                  {/* Universal Drag & Drop Zone */}
                  <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/10 rounded-2xl p-8 hover:bg-indigo-50/30 hover:border-indigo-500 transition-all text-center cursor-pointer mb-4 shadow-sm hover:shadow group">
                    <input
                      type="file"
                      multiple={true}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".pdf,.ppt,.pptx"
                    />
                    <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-sm font-semibold text-slate-800">Drag & drop PDFs and PPTs here</p>
                    <p className="text-xs text-slate-500 mt-1">Files are automatically categorized</p>
                  </div>

                  {/* Quick-Add Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* YouTube Quick Add */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
                      <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Add YouTube Link
                      </label>
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full text-sm border border-slate-300 rounded p-2 mb-2 focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                      <button type="button" onClick={addYoutubeLink} disabled={!youtubeUrl} className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors">
                        Add to Queue
                      </button>
                    </div>

                    {/* Activity Quick Add */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
                      <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                        <List className="w-3.5 h-3.5 text-emerald-500" /> Add Class Activity
                      </label>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <input 
                          type="file" 
                          id="activity-doc" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const f = e.target.files[0];
                              if (f.size > MAX_FILE_SIZE) {
                                toast.error(`${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB) exceeds the 1 MB limit.`);
                                return;
                              }
                              setActivityFile(f);
                            }
                          }} 
                        />
                        <label htmlFor="activity-doc" className="text-xs px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded cursor-pointer truncate flex-1 text-center font-medium transition-colors">
                          {activityFile ? activityFile.name : "📎 Choose Activity Document"}
                        </label>
                        {activityFile && (
                          <button type="button" onClick={() => setActivityFile(null)} className="text-slate-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2">Max 1 MB per file</p>
                      <button type="button" onClick={addActivity} disabled={!activityFile} className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors">
                        Add to Queue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Textbook Fallback Upload UI */}
              {showTextbookUpload && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Subject Textbook (PDF)</label>
                  <div className="relative border-2 border-dashed border-slate-300 bg-white rounded-xl p-8 hover:bg-slate-50 hover:border-indigo-400 transition-colors text-center cursor-pointer mb-4">
                    <input
                      type="file"
                      multiple={true}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleTextbookFileChange}
                      accept=".pdf"
                    />
                    <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Drag & drop Textbook PDF</p>
                  </div>
                </div>
              )}

              {/* Pending Queue List */}
              {pendingMaterials.length > 0 && (
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Items to Upload ({pendingMaterials.length})</label>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingMaterials.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-150 transition-all group">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden pr-4">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            item.type === 'file' && item.materialType === 'ppt' ? 'bg-indigo-100 text-indigo-600' :
                            item.type === 'file' && item.materialType === 'pdf' ? 'bg-red-100 text-red-600' :
                            item.type === 'file' && item.materialType === 'textbook' ? 'bg-violet-100 text-violet-600' :
                            item.type === 'youtube' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {item.type === 'file' && item.materialType === 'ppt' && <Layers className="w-4 h-4" />}
                            {item.type === 'file' && item.materialType === 'pdf' && <FileText className="w-4 h-4" />}
                            {item.type === 'file' && item.materialType === 'textbook' && <Book className="w-4 h-4" />}
                            {item.type === 'youtube' && <Sparkles className="w-4 h-4" />}
                            {item.type === 'activity' && <List className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updatePendingTitle(item.id, e.target.value)}
                              placeholder="Material Title..."
                              className="w-full text-sm font-semibold text-slate-800 border-none bg-transparent focus:ring-0 p-0 mb-0.5 placeholder:text-slate-400 outline-none"
                            />
                            <div className="text-[10px] text-slate-500 truncate flex gap-2">
                              <span className="uppercase font-bold tracking-wider">{item.type === 'file' ? item.materialType : item.type}</span>
                              {item.type === 'file' && <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>}
                              {item.type === 'youtube' && <span className="truncate">{item.url}</span>}
                              {item.type === 'activity' && <span className="truncate">{item.description || "No description"} {item.file && `(Attached: ${item.file.name})`}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {!!selectedTopic && !(item.type === 'file' && item.materialType === 'textbook') && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Gating:</span>
                              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                                <button
                                  type="button"
                                  onClick={() => { if (!item.isMandatory) togglePendingMaterialMandatory(item.id); }}
                                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                    item.isMandatory 
                                      ? 'bg-amber-500 text-white shadow-sm' 
                                      : 'text-slate-500 hover:text-slate-700 bg-transparent'
                                  }`}
                                >
                                  Mandatory
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { if (item.isMandatory) togglePendingMaterialMandatory(item.id); }}
                                  className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                    !item.isMandatory 
                                      ? 'bg-white text-slate-700 shadow-sm border border-slate-200/30' 
                                      : 'text-slate-400 hover:text-slate-600 bg-transparent'
                                  }`}
                                >
                                  Optional
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removePendingMaterial(item.id)}
                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  disabled={uploading || isExtracting || isReadOnly}
                  className="w-full bg-slate-600 text-white rounded-xl py-3 font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                  title={isReadOnly ? "Read-only access" : (currentUploadScope === 'subject' ? 'Upload textbook file' : 'Upload material for this topic')}
                >
                  {uploading ? (
                    <><Loader className="w-5 h-5 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-5 h-5" /> Upload</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Materials */}
          <div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                {!!selectedTopic ? <List className="w-32 h-32" /> : <Book className="w-32 h-32" />}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">
                {!!selectedTopic ? 'Topic & Subject Materials' : 'Subject Textbook'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {!!selectedTopic 
                  ? 'View uploaded textbooks for the subject or topic-specific resources.' 
                  : 'Upload the comprehensive textbook PDF for this entire subject.'}
              </p>
              
              {!selectedSubject ? (
                <div className="text-sm text-slate-400 italic">Select a subject to view uploaded materials.</div>
              ) : (
                <div className="space-y-6">
                  {/* Subject Textbooks List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <Book className="w-4 h-4 text-indigo-500" /> Subject Textbooks
                    </h4>
                    {loading ? (
                      <div className="flex justify-center p-4"><Loader className="w-6 h-6 text-indigo-500 animate-spin" /></div>
                    ) : materials.length > 0 ? (
                      <div className="space-y-2">
                        {materials.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <FileText className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                                <p className="text-[10px] text-slate-500">Uploaded {new Date(m.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setPdfViewerUrl(getAdminMaterialUrl(m.file_path || m.url)); setPdfViewerTitle(m.title); }}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> View
                              </button>
                              <a
                                href={getAdminMaterialUrl(m.file_path || m.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg transition-colors"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleDeleteSubjectMaterial(m.id)}
                                disabled={isReadOnly}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title={isReadOnly ? "Read-only access" : "Delete material"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-200 rounded-lg">
                        No textbooks uploaded yet.
                      </div>
                    )}
                  </div>

                  {/* Topic Materials List */}
                  {selectedTopic && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                        <List className="w-4 h-4 text-emerald-500" /> Topic Materials
                      </h4>
                      {activeTopic && activeTopic.materials && activeTopic.materials.length > 0 ? (
                        <div className="space-y-2">
                          {activeTopic.materials.map((m: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow transition-shadow flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${m.type === 'ppt' ? 'bg-indigo-100 text-indigo-600' : m.type === 'pdf' ? 'bg-red-100 text-red-600' : m.type === 'youtube' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {m.type === 'youtube' ? <ExternalLink className="w-4 h-4" /> : m.type === 'activity' ? <List className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="text-sm font-semibold text-slate-800">
                                      {m.title || m.type.toUpperCase()}
                                    </h4>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 w-max shrink-0">
                                      <button
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => { if (!m.is_mandatory) handleToggleMandatory(activeTopic.id, m.type, m.id, false); }}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                          m.is_mandatory 
                                            ? 'bg-amber-500 text-white shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700 bg-transparent disabled:opacity-50'
                                        }`}
                                      >
                                        Mandatory
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => { if (m.is_mandatory) handleToggleMandatory(activeTopic.id, m.type, m.id, true); }}
                                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                          !m.is_mandatory 
                                            ? 'bg-white text-slate-700 shadow-sm border border-slate-200/30' 
                                            : 'text-slate-400 hover:text-slate-600 bg-transparent disabled:opacity-50'
                                        }`}
                                      >
                                        Optional
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 capitalize">{m.type} Material</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {(m.type === 'ppt' || m.type === 'pdf' || m.type === 'youtube') && (
                                  <a
                                    href={m.type === 'youtube' ? m.url : getAdminMaterialUrl(m.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteTopicMaterial(activeTopic.id, m.type, m.id)}
                                  disabled={isReadOnly}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title={isReadOnly ? "Read-only access" : "Delete material"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-200 rounded-lg">
                          No materials uploaded for this topic yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PDF Viewer Modal ─────────────────────────────────────────────── */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg"><FileText className="w-4 h-4 text-white" /></div>
              <span className="text-white font-semibold text-sm truncate max-w-xs">{pdfViewerTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={pdfViewerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open in Tab
              </a>
              <button onClick={() => setPdfViewerUrl(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
          <iframe
            src={`${pdfViewerUrl}#toolbar=1&view=FitH`}
            className="flex-1 w-full bg-white"
            title={pdfViewerTitle}
          />
        </div>
      )}

      {/* ── Curriculum Structure Section ─────────────────────────────────── */}
      {curriculumTab === 'curriculum' && (
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Curriculum Registry</h2>
                <p className="text-sm text-slate-500">View and manage chapters, topics, and teaching intentions.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" /> Template
              </button>
              <button 
                onClick={() => { setCurriculumFile(null); setCurriculumResult(null); setIsCurriculumUploadOpen(true); }}
                disabled={isReadOnly}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 hover:shadow-none transition-all disabled:opacity-50"
                title={isReadOnly ? "Read-only access" : ""}
              >
                <Upload className="w-4 h-4" /> Import Excel
              </button>
            </div>
          </div>

          {/* Unified Filter & Search Bar */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 w-44">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</label>
              <select 
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                value={curriculumFilterGrade}
                onChange={e => { setCurriculumFilterGrade(e.target.value); setCurriculumFilterChapter(''); loadCurriculumData(curriculumFilterSubject, e.target.value); }}
              >
                <option value="">All Grades</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => <option key={g} value={String(g)}>Class {g}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5 w-56">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
              <select 
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                value={curriculumFilterSubject}
                onChange={e => { setCurriculumFilterSubject(e.target.value); setCurriculumFilterChapter(''); loadCurriculumData(e.target.value, curriculumFilterGrade); }}
              >
                <option value="">All Subjects</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Chapter filter — derived from curriculumData based on current grade+subject */}
            <div className="space-y-1.5 w-56">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chapter</label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                value={curriculumFilterChapter}
                onChange={e => { setCurriculumFilterChapter(e.target.value); setCurriculumPage(1); }}
                disabled={curriculumData.length === 0}
              >
                <option value="">All Chapters</option>
                {Array.from(
                  new Set(
                    curriculumData
                      .filter(ch =>
                        (!curriculumFilterGrade || String(ch.grade) === String(curriculumFilterGrade)) &&
                        (!curriculumFilterSubject || String(ch.subject_id) === String(curriculumFilterSubject))
                      )
                      .map(ch => ch.chapter_name)
                  )
                ).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search chapter, topic, learning intent..."
                  value={curriculumSearchText}
                  onChange={e => setCurriculumSearchText(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {curriculumSearchText && (
                  <button 
                    onClick={() => setCurriculumSearchText('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={() => loadCurriculumData(curriculumFilterSubject, curriculumFilterGrade)}
              className="h-10 px-4 border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shrink-0"
            >
              {curriculumLoading ? <Loader className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Refresh
            </button>
          </div>

          {/* Curriculum Registry Table */}
          {(() => {
            const flatTopics: Array<{
              id: number;
              chapterName: string;
              subjectName: string;
              subjectId: number;
              grade: number;
              source: string;
              learningIntent: string;
              topicName: string;
              subtopics: string[];
            }> = [];

            curriculumData.forEach(ch => {
              const topicsList = ch.topics || [];
              topicsList.forEach(t => {
                flatTopics.push({
                  id: t.id,
                  chapterName: ch.chapter_name,
                  subjectName: ch.subject_name,
                  subjectId: ch.subject_id,
                  grade: ch.grade,
                  source: ch.source || 'excel',
                  learningIntent: ch.learning_intent || '',
                  topicName: t.topic_name,
                  subtopics: t.subtopics || [],
                });
              });
            });

            // Perform client-side filter and search
            const filteredFlatTopics = flatTopics.filter(t => {
              if (curriculumFilterGrade && String(t.grade) !== String(curriculumFilterGrade)) return false;
              if (curriculumFilterSubject && String(t.subjectId) !== String(curriculumFilterSubject)) return false;
              if (curriculumFilterChapter && t.chapterName !== curriculumFilterChapter) return false;
              
              const matchesSearch = !curriculumSearchText ? true : (
                t.topicName.toLowerCase().includes(curriculumSearchText.toLowerCase()) ||
                t.chapterName.toLowerCase().includes(curriculumSearchText.toLowerCase()) ||
                t.subjectName.toLowerCase().includes(curriculumSearchText.toLowerCase()) ||
                t.learningIntent.toLowerCase().includes(curriculumSearchText.toLowerCase())
              );
              return matchesSearch;
            });

            if (curriculumLoading && flatTopics.length === 0) {
              return (
                <div className="flex justify-center py-16">
                  <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              );
            }

            if (filteredFlatTopics.length === 0) {
              return (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-base">No topics or chapters matches your filter</p>
                  <p className="text-slate-400 text-sm mt-1">Try expanding your search query or select another grade / subject.</p>
                </div>
              );
            }

            const itemsPerPage = 5;
            const totalItems = filteredFlatTopics.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const activePage = Math.min(Math.max(1, curriculumPage), totalPages || 1);
            
            const paginatedTopics = filteredFlatTopics.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

            return (
              <div className="space-y-4">
                <div className="border border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/75 border-b border-slate-100">
                        <tr>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">#</th>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Class &amp; Subject</th>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Chapter Name</th>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Topic Name</th>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-56">Subtopics</th>
                          <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTopics.map((t, idx) => {
                          const globalIdx = (activePage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-4 px-4 text-sm font-semibold text-slate-400 text-center">{globalIdx}</td>
                              <td className="py-4 px-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-slate-800">{t.subjectName}</span>
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-max">Grade {t.grade}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-0.5 max-w-xs">
                                  <p className="text-sm font-bold text-slate-800 truncate" title={t.chapterName}>{t.chapterName}</p>
                                  {t.learningIntent && (
                                    <p className="text-xs text-slate-400 italic truncate" title={t.learningIntent}>
                                      🎯 {t.learningIntent}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-medium text-slate-700">{t.topicName}</span>
                              </td>
                              <td className="py-4 px-4">
                                {t.subtopics.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {t.subtopics.map((sub, sIdx) => (
                                      <span key={sIdx} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[90px]" title={sub}>
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">None</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`Delete topic "${t.topicName}"?`)) return;
                                    try {
                                      await deleteCurriculumEntry(t.id);
                                      toast.success('Topic deleted');
                                      loadCurriculumData(curriculumFilterSubject, curriculumFilterGrade);
                                    } catch (e: any) { toast.error(e.message); }
                                  }}
                                  disabled={isReadOnly}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                                  title={isReadOnly ? "Read-only access" : "Delete topic"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-700">{Math.min((activePage - 1) * itemsPerPage + 1, totalItems)}</strong> to{' '}
                    <strong className="text-slate-700">{Math.min(activePage * itemsPerPage, totalItems)}</strong> of{' '}
                    <strong className="text-slate-700">{totalItems}</strong> entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurriculumPage(prev => Math.max(1, prev - 1))}
                      disabled={activePage === 1}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - activePage) <= 1)
                      .map((p, idx, arr) => {
                        const showDots = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showDots && <span className="text-slate-400 px-1">...</span>}
                            <button
                              onClick={() => setCurriculumPage(p)}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all ${
                                activePage === p
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setCurriculumPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={activePage === totalPages}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Excel Upload Modal Dialog */}
          <Dialog open={isCurriculumUploadOpen} onOpenChange={setIsCurriculumUploadOpen}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-emerald-600" />
                  Import Curriculum Excel
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-3">
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 leading-relaxed">
                  Format Requirement: Columns must include <strong>subject</strong>, <strong>grade</strong>, <strong>chapter</strong>, and <strong>topic</strong>. Optional columns: <em>subtopics</em> (semicolon separated) and <em>learning_intent</em>.
                </p>
                
                <div
                  className="relative border-2 border-dashed border-emerald-200 rounded-2xl p-8 hover:bg-emerald-50/50 text-center cursor-pointer transition-all"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setCurriculumFile(f); }}
                >
                  <input type="file" accept=".xlsx,.xls,.csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => { if (e.target.files?.[0]) setCurriculumFile(e.target.files[0]); }} />
                  <Table2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  {curriculumFile ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 truncate max-w-[280px] mx-auto">{curriculumFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(curriculumFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Drag &amp; drop or click to choose file</p>
                      <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, and .csv formats</p>
                    </div>
                  )}
                </div>

                {/* Upload status feedback */}
                {curriculumResult && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${curriculumResult.uploaded > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span className="text-green-700">Uploaded: {curriculumResult.uploaded}</span>
                      <span className="text-amber-600">Skipped: {curriculumResult.skipped}</span>
                      <span className="text-red-600">Failed: {curriculumResult.failed}</span>
                    </div>
                    {curriculumResult.errors.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto text-[10px] text-red-600 space-y-0.5 border-t border-red-100 pt-2">
                        {curriculumResult.errors.slice(0, 10).map((e, i) => (
                          <div key={i}>Row {e.row}: {e.reason}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => { setIsCurriculumUploadOpen(false); setCurriculumFile(null); setCurriculumResult(null); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleCurriculumUpload}
                    disabled={curriculumUploading || !curriculumFile || isReadOnly}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-100 disabled:shadow-none"
                    title={isReadOnly ? "Read-only access" : ""}
                  >
                    {curriculumUploading ? (
                      <span className="flex items-center gap-1"><Loader className="w-3.5 h-3.5 animate-spin" /> Uploading...</span>
                    ) : (
                      'Start Upload'
                    )}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
                  <div key={ch.chapterId} className={`grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl border transition-all ${ch.isCustom ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-slate-100 hover:border-slate-200'
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
                        className={`p-2 rounded-lg transition-all ${hasChanges ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' : 'bg-slate-100 text-slate-400'
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

      {/* Curriculum Builder Modal */}
      <CurriculumBuilderModal 
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        entityType={builderType}
        parentData={{ gradeId: selectedGrade, subjectId: selectedSubject, chapterId: selectedChapter }}
        existingList={
          builderType === 'grade' ? gradesList :
          builderType === 'subject' ? (selectedGrade ? subjects.filter(s => (s.grades || []).includes(parseInt(selectedGrade))) : subjects) :
          builderType === 'chapter' ? filteredChapters :
          builderType === 'topic' ? filteredTopics : []
        }
        onRefresh={() => {
          // Trigger a re-fetch of the main data
          fetchAll().then(data => {
            setSubjects(data.subjects || []);
            setChapters(data.chapters || []);
            setTopics(data.topics || []);
            setGrades(data.grades || []);
          });
        }}
      />
    </div>
  );
}
