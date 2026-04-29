import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { fetchAll, uploadSubjectMaterial, fetchSubjectMaterials } from '@/api/client';

export default function MaterialManagement() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await fetchAll();
        setSubjects(data.subjects || []);
        if (data.subjects && data.subjects.length > 0) {
          setSelectedSubject(data.subjects[0].id);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    loadMaterials(selectedSubject);
  }, [selectedSubject]);

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
    if (!selectedSubject || !file || !title) {
      setErrorMsg("Please provide a title and select a file.");
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        try {
          await uploadSubjectMaterial(selectedSubject, {
            title,
            file: base64String,
            contentType: file.type || 'application/pdf'
          });
          setSuccessMsg("Material uploaded successfully and assigned to all teachers!");
          setFile(null);
          setTitle('');
          loadMaterials(selectedSubject);
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to upload material.");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read the file.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Book className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Subject Materials</h2>
          <p className="text-sm text-slate-500">Upload generic syllabus materials (PDFs) that will be automatically visible to all teachers teaching the subject.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div>
          <form onSubmit={handleUpload} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Material Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Biology Syllabus PDF"
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF/PPT)</label>
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
                <><Upload className="w-5 h-5" /> Upload to Cloudflare R2</>
              )}
            </button>
          </form>
        </div>

        {/* Existing Materials */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Uploaded Materials</h3>
          {loading ? (
            <div className="flex justify-center p-8"><Loader className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : materials.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No materials uploaded yet</p>
              <p className="text-sm text-slate-400 mt-1">Upload a material to see it here.</p>
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
                  <a
                    href={m.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
