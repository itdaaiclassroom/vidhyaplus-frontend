import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, FileText, Image, PlayCircle, Presentation, ChevronRight, ArrowLeft
} from "lucide-react";
import { useAppData } from "@/contexts/DataContext";
import { getApiBase } from "@/api/client";

const typeIcons: Record<string, typeof FileText> = {
  ppt: Presentation,
  pdf: FileText,
  video: PlayCircle,
  image: Image,
};

const typeColors: Record<string, string> = {
  ppt: "bg-amber-light text-amber",
  pdf: "bg-destructive/10 text-destructive",
  video: "bg-info-light text-info",
  image: "bg-success-light text-success",
};

const StudentSubjects = () => {
  const { studentId } = useAuth();
  const { data } = useAppData();
  const { subjects, chapters, topics, studyMaterials, students, classes } = data;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? students[0], [students, studentId]);
  const studentClass = useMemo(() => (student ? classes.find((c) => c.id === student.classId) : undefined), [classes, student]);
  const grade = studentClass?.grade ?? 8;

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const gradeSubjects = useMemo(() => subjects.filter((s) => s.grades.includes(grade)), [subjects, grade]);

  const subjectChapters = useMemo(
    () => (selectedSubject ? chapters.filter((ch) => ch.subjectId === selectedSubject && ch.grade === grade) : []),
    [chapters, selectedSubject, grade]
  );

  const chapterMaterials = useMemo(
    () => (selectedChapter ? studyMaterials.filter((m) => m.chapterId === selectedChapter) : []),
    [studyMaterials, selectedChapter]
  );

  const currentSubject = subjects.find((s) => s.id === selectedSubject);
  const currentChapter = chapters.find((c) => c.id === selectedChapter);
  const chapterTopics = useMemo(
    () => (selectedChapter ? topics.filter((t) => t.chapterId === selectedChapter).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []),
    [topics, selectedChapter]
  );

  return (
    <DashboardLayout title="Study Materials">
      {!selectedSubject ? (
        <>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">📚 Select a Subject</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {gradeSubjects.map(sub => (
              <Card
                key={sub.id}
                className="shadow-card border-border card-hover cursor-pointer min-w-[220px] flex-shrink-0"
                onClick={() => setSelectedSubject(sub.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{sub.icon}</div>
                  <h3 className="font-display font-semibold text-foreground">{sub.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === grade).length} chapters
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : !selectedChapter ? (
        <>
          <Button variant="ghost" onClick={() => setSelectedSubject(null)} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Subjects
          </Button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">
            {currentSubject?.icon} {currentSubject?.name} — Chapters
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[...subjectChapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((ch) => (
              <Card
                key={ch.id}
                className="shadow-card border-border card-hover cursor-pointer"
                onClick={() => setSelectedChapter(ch.id)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm">{ch.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        {studyMaterials.filter((m) => m.chapterId === ch.id).length} materials
                        {(ch as { textbookChunkPdfPath?: string | null }).textbookChunkPdfPath && (
                          <Badge variant="secondary" className="text-[10px]">Textbook PDF</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" onClick={() => setSelectedChapter(null)} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Chapters
          </Button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">
            📖 {currentChapter?.name}
          </h2>

          {(currentChapter as { textbookChunkPdfPath?: string | null })?.textbookChunkPdfPath && (
            <Card className="shadow-card border-border mb-4">
              <CardContent className="p-4">
                <a
                  href={`${getApiBase()}/uploads/${(currentChapter as { textbookChunkPdfPath: string }).textbookChunkPdfPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Textbook chapter (PDF)
                </a>
              </CardContent>
            </Card>
          )}

          {chapterTopics.some((t) => (t as { topicPptPath?: string | null }).topicPptPath) && (
            <Card className="shadow-card border-border mb-4">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-2">Topic presentations</p>
                <ul className="space-y-1.5">
                  {chapterTopics.filter((t) => (t as { topicPptPath?: string | null }).topicPptPath).map((t) => (
                    <li key={t.id}>
                      <a
                        href={`${getApiBase()}/uploads/${(t as { topicPptPath: string }).topicPptPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Presentation className="w-3.5 h-3.5" />
                        {t.name} (PPT)
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {chapterMaterials.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapterMaterials.map(mat => {
                const Icon = typeIcons[mat.type] || FileText;
                const colorClass = typeColors[mat.type] || "bg-secondary text-foreground";
                return (
                  <Card key={mat.id} className="shadow-card border-border card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-sm">{mat.title}</h3>
                          <Badge variant="outline" className="mt-1 text-xs uppercase">{mat.type}</Badge>
                        </div>
                      </div>
                      {mat.type === "video" ? (
                        <div className="mt-4 rounded-xl overflow-hidden aspect-video bg-secondary">
                          <iframe
                            src={mat.url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={mat.title}
                          />
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="mt-3 w-full gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Open
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No study materials uploaded for this chapter yet.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentSubjects;
