import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, FileText, PlayCircle, Presentation, ChevronRight, ArrowLeft,
  Sparkles, ExternalLink, Download, Clock, Calendar, CheckCircle, HelpCircle, Layers,
  PenTool, Type, Calculator, Atom, Leaf, Globe, Languages
} from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { getApiBase } from "@/api/client";

interface SubjectTheme {
  gradient: string;
  glow: string;
  border: string;
  iconBg: string;
  textColor: string;
  accent: string;
  accentHover: string;
  pillColor: string;
}

const SUBJECT_ICONS: Record<string, any> = {
  "Telugu": PenTool,
  "Hindi": BookOpen,
  "English": Type,
  "Mathematics": Calculator,
  "Physics": Atom,
  "Biology": Leaf,
  "Social Studies": Globe,
  "Marathi": Languages,
};

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  "Telugu": {
    gradient: "from-rose-500/10 to-orange-500/10 hover:from-rose-500/15 hover:to-orange-500/15",
    glow: "shadow-rose-500/5 hover:shadow-rose-500/10",
    border: "border-rose-100 hover:border-rose-300 dark:border-rose-950/40",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    textColor: "text-rose-800 dark:text-rose-300",
    accent: "bg-rose-600 text-white hover:bg-rose-700",
    accentHover: "hover:bg-rose-50/50 hover:text-rose-700 dark:hover:bg-rose-950/30",
    pillColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  "Hindi": {
    gradient: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15",
    glow: "shadow-amber-500/5 hover:shadow-amber-500/10",
    border: "border-amber-100 hover:border-amber-300 dark:border-amber-950/40",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    textColor: "text-amber-800 dark:text-amber-300",
    accent: "bg-amber-600 text-white hover:bg-amber-700",
    accentHover: "hover:bg-amber-50/50 hover:text-amber-700 dark:hover:bg-amber-950/30",
    pillColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  "English": {
    gradient: "from-sky-500/10 to-indigo-500/10 hover:from-sky-500/15 hover:to-indigo-500/15",
    glow: "shadow-sky-500/5 hover:shadow-sky-500/10",
    border: "border-sky-100 hover:border-sky-300 dark:border-sky-950/40",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    textColor: "text-sky-800 dark:text-sky-300",
    accent: "bg-sky-600 text-white hover:bg-sky-700",
    accentHover: "hover:bg-sky-50/50 hover:text-sky-700 dark:hover:bg-sky-950/30",
    pillColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  "Mathematics": {
    gradient: "from-violet-500/10 to-fuchsia-500/10 hover:from-violet-500/15 hover:to-fuchsia-500/15",
    glow: "shadow-violet-500/5 hover:shadow-violet-500/10",
    border: "border-violet-100 hover:border-violet-300 dark:border-violet-950/40",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    textColor: "text-violet-800 dark:text-violet-300",
    accent: "bg-violet-600 text-white hover:bg-violet-700",
    accentHover: "hover:bg-violet-50/50 hover:text-violet-700 dark:hover:bg-violet-950/30",
    pillColor: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  "Physics": {
    gradient: "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/15 hover:to-cyan-500/15",
    glow: "shadow-blue-500/5 hover:shadow-blue-500/10",
    border: "border-blue-100 hover:border-blue-300 dark:border-blue-950/40",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    textColor: "text-blue-800 dark:text-blue-300",
    accent: "bg-blue-600 text-white hover:bg-blue-700",
    accentHover: "hover:bg-blue-50/50 hover:text-blue-700 dark:hover:bg-blue-950/30",
    pillColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  "Biology": {
    gradient: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15",
    glow: "shadow-emerald-500/5 hover:shadow-emerald-500/10",
    border: "border-emerald-100 hover:border-emerald-300 dark:border-emerald-950/40",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    textColor: "text-emerald-800 dark:text-emerald-300",
    accent: "bg-emerald-600 text-white hover:bg-emerald-700",
    accentHover: "hover:bg-accent hover:text-accent-foreground",
    pillColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  "Social Studies": {
    gradient: "from-stone-500/10 to-amber-700/10 hover:from-stone-500/15 hover:to-amber-700/15",
    glow: "shadow-stone-500/5 hover:shadow-stone-500/10",
    border: "border-stone-100 hover:border-stone-300 dark:border-stone-950/40",
    iconBg: "bg-stone-500/10 text-stone-600 dark:text-stone-400",
    textColor: "text-stone-800 dark:text-stone-300",
    accent: "bg-stone-600 text-white hover:bg-stone-700",
    accentHover: "hover:bg-stone-50/50 hover:text-stone-700 dark:hover:bg-stone-950/30",
    pillColor: "bg-stone-100 text-stone-800 dark:bg-stone-950 dark:text-stone-300",
  },
  "Marathi": {
    gradient: "from-orange-500/10 to-amber-500/10 hover:from-orange-500/15 hover:to-amber-500/15",
    glow: "shadow-orange-500/5 hover:shadow-orange-500/10",
    border: "border-orange-100 hover:border-orange-300 dark:border-orange-950/40",
    iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    textColor: "text-orange-800 dark:text-orange-300",
    accent: "bg-orange-600 text-white hover:bg-orange-700",
    accentHover: "hover:bg-orange-50/50 hover:text-orange-700 dark:hover:bg-orange-950/30",
    pillColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
};

const DEFAULT_THEME: SubjectTheme = {
  gradient: "from-teal-500/10 to-primary/10 hover:from-teal-500/15 hover:to-primary/15",
  glow: "shadow-primary/5 hover:shadow-primary/10",
  border: "border-border hover:border-primary/30",
  iconBg: "bg-primary/10 text-primary",
  textColor: "text-foreground",
  accent: "bg-primary text-primary-foreground hover:bg-primary/95",
  accentHover: "hover:bg-accent hover:text-accent-foreground",
  pillColor: "bg-secondary text-secondary-foreground",
};

const resolveMaterialUrl = (url: string) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${getApiBase()}/uploads/${url}`;
};

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const StudentSubjects = () => {
  const { studentId } = useAuth();
  const { data } = useAppData();
  const { subjects, chapters, topics, students, classes, subjectMaterials } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;
  const studentName = student ? (student.name || [student.first_name, student.last_name].filter(Boolean).join(" ")) : "Student";

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"chapters" | "materials">("chapters");

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);

  const subjectChapters = useMemo(
    () => (selectedSubject ? chapters.filter((ch) => ch.subjectId === selectedSubject && ch.grade === grade) : []),
    [chapters, selectedSubject, grade]
  );

  const generalMaterials = useMemo(
    () => (selectedSubject ? (subjectMaterials || []).filter((m) => String(m.subject_id) === String(selectedSubject) && Number(m.grade_id) === grade) : []),
    [subjectMaterials, selectedSubject, grade]
  );

  const currentSubjectObj = useMemo(() => subjects.find((s) => s.id === selectedSubject), [subjects, selectedSubject]);
  const currentChapterObj = useMemo(() => chapters.find((c) => c.id === selectedChapter), [chapters, selectedChapter]);

  const chapterTopicsList = useMemo(
    () => (selectedChapter ? topics.filter((t) => t.chapterId === selectedChapter).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []),
    [topics, selectedChapter]
  );

  const activeTheme = useMemo(() => {
    if (!currentSubjectObj) return DEFAULT_THEME;
    return SUBJECT_THEMES[currentSubjectObj.name] || DEFAULT_THEME;
  }, [currentSubjectObj]);

  return (
    <DashboardLayout title="Study Hub">
      {!selectedSubject ? (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-teal-600 via-primary to-teal-500 text-white p-6 md:p-8 shadow-lg">
            <div className="relative z-10 max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Learning Hub
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
                Hey {studentName}!
              </h1>
              <p className="text-sm md:text-base text-teal-50 leading-relaxed font-medium">
                Choose a subject to explore textbook chapters, slides, worksheets, and videos prepared for your curriculum.
              </p>
            </div>
            {/* Visual background element */}
            <div className="absolute right-0 bottom-0 top-0 opacity-15 hidden md:block select-none pointer-events-none p-6 translate-x-10 scale-125">
              <Layers className="w-72 h-72" />
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span>📚</span> Your Subjects
            </h2>
            
            {/* Subjects Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {gradeSubjects.map((sub) => {
                const subChapters = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade);
                const subRefMaterials = (subjectMaterials || []).filter((m) => String(m.subject_id) === String(sub.id) && Number(m.grade_id) === grade);
                const theme = SUBJECT_THEMES[sub.name] || DEFAULT_THEME;
                const SubjectIcon = SUBJECT_ICONS[sub.name] || BookOpen;

                return (
                  <Card
                    key={sub.id}
                    className={`group relative overflow-hidden border bg-card shadow-sm cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-lg ${theme.border} ${theme.glow}`}
                    onClick={() => setSelectedSubject(sub.id)}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient.replace("hover:", "")}`} />
                    <CardContent className="p-5 flex flex-col items-center text-center space-y-3 pt-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${theme.iconBg}`}>
                        <SubjectIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-foreground text-sm tracking-tight">
                          {sub.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 items-center justify-center mt-2">
                          <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                            {subChapters.length} Chapters
                          </Badge>
                          {subRefMaterials.length > 0 && (
                            <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-primary/20 bg-primary/5 text-primary">
                              {subRefMaterials.length} Reference{subRefMaterials.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : !selectedChapter ? (
        <div className="space-y-6">
          {/* Back and Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => { setSelectedSubject(null); setCurrentTab("chapters"); }}
              className={`gap-1.5 rounded-xl self-start ${activeTheme.accentHover}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Subjects
            </Button>
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-inner ${activeTheme.iconBg}`}>
                {currentSubjectObj?.icon}
              </span>
              <h2 className="font-display text-xl font-black text-foreground">
                {currentSubjectObj?.name} Curriculum
              </h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setCurrentTab("chapters")}
              className={`py-3 px-5 font-display font-bold text-sm border-b-2 transition-all relative ${
                currentTab === "chapters"
                  ? "text-primary border-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Modules & Chapters ({subjectChapters.length})
            </button>
            <button
              onClick={() => setCurrentTab("materials")}
              className={`py-3 px-5 font-display font-bold text-sm border-b-2 transition-all relative ${
                currentTab === "materials"
                  ? "text-primary border-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              General Reference Docs ({generalMaterials.length})
            </button>
          </div>

          {currentTab === "chapters" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...subjectChapters]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((ch, idx) => {
                  const chTopics = topics.filter((t) => t.chapterId === ch.id);
                  const isCompleted = chTopics.length > 0 && chTopics.every(t => t.status === 'completed');
                  const inProgress = chTopics.some(t => t.status === 'in_progress');

                  return (
                    <Card
                      key={ch.id}
                      className={`overflow-hidden border bg-card hover:shadow-md transition-all duration-300 ${
                        isCompleted ? "border-success/20 bg-success/5" : "border-border"
                      }`}
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? "bg-success/15 text-success" : activeTheme.iconBg
                            }`}>
                              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-muted-foreground tracking-tight uppercase">
                                  Chapter {ch.chapterNo || idx + 1}
                                </span>
                                {ch.monthLabel && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 bg-secondary/50">
                                    📅 {ch.monthLabel}
                                  </Badge>
                                )}
                                {ch.periods && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 bg-secondary/50">
                                    ⏱️ {ch.periods} Periods
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-display font-bold text-foreground text-sm tracking-tight leading-snug">
                                {ch.name}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {ch.teachingPlanSummary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-border pl-2">
                            {ch.teachingPlanSummary}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 flex-wrap gap-2 text-xs text-muted-foreground">
                          <div>
                            <strong>{chTopics.length}</strong> Topics • <strong>{chTopics.filter(t => t.status === 'completed').length}</strong> Done
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {ch.textbookChunkPdfPath && (
                              <a
                                href={resolveMaterialUrl(ch.textbookChunkPdfPath)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                  <FileText className="w-3.5 h-3.5" /> Textbook
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => setSelectedChapter(ch.id)}
                              className={`h-8 text-xs gap-1.5 rounded-lg ${activeTheme.accent}`}
                            >
                              Explore Journey <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            generalMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generalMaterials.map((mat) => (
                  <Card key={mat.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px] space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
                            {mat.title}
                          </h4>
                          <span className="inline-flex text-[9px] font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                            Subject PDF
                          </span>
                        </div>
                      </div>
                      <a href={resolveMaterialUrl(mat.url)} className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-lg border-border hover:bg-secondary">
                          <Download className="w-3.5 h-3.5" /> Download / View
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border bg-card">
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                  <Layers className="w-12 h-12 opacity-30" />
                  <p className="text-sm">No general reference materials have been uploaded for this subject yet.</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Details view header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => { setSelectedChapter(null); }}
              className={`gap-1.5 rounded-xl self-start ${activeTheme.accentHover}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Chapters
            </Button>
            <div className="space-y-0.5 text-right sm:text-left">
              <span className="text-xs font-bold text-muted-foreground tracking-tight uppercase">
                {currentSubjectObj?.name} • Chapter {currentChapterObj?.chapterNo}
              </span>
              <h2 className="font-display text-lg font-extrabold text-foreground leading-snug">
                {currentChapterObj?.name}
              </h2>
            </div>
          </div>

          {/* Chapter-Level materials */}
          {currentChapterObj?.textbookChunkPdfPath && (
            <Card className="border-l-4 border-l-rose-500 border border-border bg-card shadow-sm">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-semibold text-foreground">Official Chapter Textbook (PDF)</span>
                </div>
                <a
                  href={resolveMaterialUrl(currentChapterObj.textbookChunkPdfPath)}
                >
                  <Button size="sm" variant="outline" className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                    <Download className="w-3.5 h-3.5" /> Download Chapter Textbook
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Timeline of Topics */}
          <div>
            <h3 className="font-display text-sm font-bold text-muted-foreground tracking-wide uppercase mb-4">
              🗺️ Learning Timeline & Topic Materials
            </h3>

            {chapterTopicsList.length === 0 ? (
              <Card className="border border-border bg-card p-8 text-center text-muted-foreground">
                <p className="text-sm">No topics found for this chapter.</p>
              </Card>
            ) : (
              <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                {chapterTopicsList.map((topic, index) => {
                  const statusColors = {
                    completed: "bg-success text-white border-success/30",
                    in_progress: "bg-info text-white border-info/30",
                    not_started: "bg-secondary text-muted-foreground border-transparent",
                  };

                  const statusLabels = {
                    completed: "Completed",
                    in_progress: "In Progress",
                    not_started: "Not Started",
                  };

                  const hasMaterials = topic.materials && topic.materials.length > 0;
                  const hasMicroLessons = topic.microLessons && topic.microLessons.length > 0;

                  return (
                    <div key={topic.id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-9 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                        statusColors[topic.status as keyof typeof statusColors] || statusColors.not_started
                      }`}>
                        {topic.status === "completed" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : topic.status === "in_progress" ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                              Topic {index + 1}
                            </span>
                            <CardTitle className="font-display text-sm font-extrabold text-foreground leading-snug">
                              {topic.name}
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className={`text-[10px] py-0.5 px-2 capitalize ${
                            topic.status === "completed" ? "bg-success/10 text-success border-success/20" :
                            topic.status === "in_progress" ? "bg-info/10 text-info border-info/20 animate-pulse" :
                            "bg-secondary/40 text-muted-foreground"
                          }`}>
                            {statusLabels[topic.status as keyof typeof statusLabels] || "Not Started"}
                          </Badge>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2 space-y-4">
                          {/* Micro Lessons List */}
                          {hasMicroLessons && (
                            <div className="bg-secondary/30 rounded-xl p-3 border border-border/40 space-y-2">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Topic Outline & Plan
                              </h5>
                              <div className="divide-y divide-border/40">
                                {topic.microLessons.map((ml: any) => (
                                  <div key={ml.id} className="py-2 first:pt-0 last:pb-0 text-xs">
                                    <div className="flex items-start gap-1.5">
                                      <Badge variant="outline" className="text-[9px] font-semibold py-0 px-1.5 bg-background">
                                        Period {ml.periodNo}
                                      </Badge>
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">{ml.conceptText}</p>
                                        {ml.planText && <p className="text-muted-foreground text-[11px] leading-normal">{ml.planText}</p>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Topic Materials Uploaded */}
                          {hasMaterials ? (
                            <div className="space-y-2.5">
                              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                📎 Uploaded Resources ({topic.materials.length})
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {topic.materials.map((mat: any) => {
                                  const isYoutube = mat.type === "youtube" || mat.type === "video";
                                  const embedUrl = isYoutube ? getYoutubeEmbedUrl(mat.url) : null;

                                  let typeLabel = "Document";
                                  let typeColor = "bg-secondary/50 text-muted-foreground border-transparent";
                                  let Icon = FileText;

                                  if (mat.type === "ppt") {
                                    typeLabel = "Slideshow";
                                    typeColor = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-500/10";
                                    Icon = Presentation;
                                  } else if (mat.type === "pdf") {
                                    typeLabel = "Notes PDF";
                                    typeColor = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-500/10";
                                    Icon = FileText;
                                  } else if (isYoutube) {
                                    typeLabel = embedUrl ? "Embedded Video" : "External Video";
                                    typeColor = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-500/10";
                                    Icon = PlayCircle;
                                  } else if (mat.type === "activity") {
                                    typeLabel = "Activity";
                                    typeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/10";
                                    Icon = Sparkles;
                                  }

                                  return (
                                    <div key={mat.id} className="border border-border/80 bg-background/50 rounded-xl p-3 flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2.5">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                                            <Icon className="w-4 h-4" />
                                          </div>
                                          <div className="space-y-0.5">
                                            <p className="font-semibold text-foreground text-xs leading-snug line-clamp-2">
                                              {mat.title}
                                            </p>
                                            <span className={`inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${typeColor}`}>
                                              {typeLabel}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Inline YouTube player */}
                                        {embedUrl && (
                                          <div className="rounded-lg overflow-hidden aspect-video border border-border mt-2 shadow-sm bg-black">
                                            <iframe
                                              src={embedUrl}
                                              className="w-full h-full"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowFullScreen
                                              title={mat.title}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                                        <a
                                          href={resolveMaterialUrl(mat.url)}
                                          className="w-full sm:w-auto"
                                        >
                                          <Button size="xs" variant="outline" className="w-full gap-1 rounded-md text-xs py-1 h-7 border-border hover:bg-secondary">
                                            <span>Open Resource</span> <ExternalLink className="w-3 h-3" />
                                          </Button>
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic bg-secondary/10 px-3 py-2 rounded-lg border border-border/40">
                              ℹ️ Standard curriculum topic. No additional learning media has been uploaded for this specific topic yet.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentSubjects;


