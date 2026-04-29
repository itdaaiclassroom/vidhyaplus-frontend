import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, CheckCircle, AlertCircle, Loader, Layers, List, Sparkles, Trash2 } from 'lucide-react';
import { fetchAll, uploadSubjectMaterial, fetchSubjectMaterials, uploadTopicPpt, deleteSubjectMaterial, deleteTopicPpt } from '@/api/client';
import { toast } from 'sonner';

export default function MaterialManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  
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

  const loadData = async () => {
      try {
        const data = await fetchAll();
        setSubjects(data.subjects || []);
        setChapters(data.chapters || []);
        setTopics(data.topics || []);
        
        if (data.subjects && data.subjects.length > 0 && !selectedSubject) {
          setSelectedSubject(data.subjects[0].id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    loadMaterials(selectedSubject);
    
    // Filter chapters for this subject
    const subChapters = chapters.filter(c => String(c.subjectId) === String(selectedSubject));
    if (subChapters.length > 0) {
      setSelectedChapter(subChapters[0].id);
    } else {
      setSelectedChapter('');
    }
  }, [selectedSubject, chapters]);

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

  const loadMaterials = async (subId: string) => {
    setLoading(true);
    try {
      const data = await fetchSubjectMaterials(subId);
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
          contentType: file.type || 'application/pdf'
        });
        setSuccessMsg("Subject material uploaded successfully!");
      } else {
        await uploadTopicPpt(selectedTopic, {
          title,
          file: base64String,
          filename: file.name
        });
        setSuccessMsg("Topic presentation uploaded successfully!");
        loadData(); // Refresh to get the new pptPath
      }

      toast.success("Upload successful!");
      setFile(null);
      setTitle('');
      if (uploadScope === 'subject') loadMaterials(selectedSubject);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Failed to upload.");
      toast.error(err.message || "Failed to upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSubjectMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteSubjectMaterial(id);
      toast.success("Material deleted successfully");
      loadMaterials(selectedSubject);
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

  const filteredChapters = chapters.filter(c => String(c.subjectId) === String(selectedSubject));
  const filteredTopics = topics.filter(t => String(t.chapterId) === String(selectedChapter));
  const activeTopic = topics.find(t => String(t.id) === String(selectedTopic));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              >
                {subjects.map(s => (
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

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
            >
              {uploading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-5 h-5" /> Upload</>
              )}
            </button>
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
    </div>
  );
}
