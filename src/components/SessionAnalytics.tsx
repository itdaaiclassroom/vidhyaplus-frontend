import { useState, useMemo } from "react";
import { useAppData } from "@/contexts/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity, Target, ChevronDown, CheckCircle2, Clock, BookOpen
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SessionAnalyticsProps {
  schoolId: string;
}

export default function SessionAnalytics({ schoolId }: SessionAnalyticsProps) {
  const { data } = useAppData();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<any>(null);

  // Classes belonging to this school
  const schoolClasses = useMemo(
    () => data.classes.filter(c => c.schoolId === schoolId),
    [data.classes, schoolId]
  );

  // Unique grades for this school
  const schoolGrades = useMemo(
    () => Array.from(new Set(schoolClasses.map(c => c.grade))).sort((a, b) => a - b),
    [schoolClasses]
  );

  // Subjects available for selected grade
  const availableSubjects = useMemo(() => {
    if (selectedClass === "all") return data.subjects;
    const grade = Number(selectedClass);
    return data.subjects.filter(s => s.grades?.includes(grade));
  }, [data.subjects, selectedClass]);

  // Chapters for the selected subject + grade
  const filteredChapters = useMemo(() => {
    let chaps = data.chapters;
    if (selectedSubject !== "all") chaps = chaps.filter(ch => ch.subjectId === selectedSubject);
    if (selectedClass !== "all") chaps = chaps.filter(ch => ch.grade === Number(selectedClass));
    return chaps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data.chapters, selectedSubject, selectedClass]);
  
  const filteredChapterIds = useMemo(() => new Set(filteredChapters.map(c => c.id)), [filteredChapters]);

  // Topics for the filtered chapters
  const filteredTopics = useMemo(
    () => data.topics.filter(t => filteredChapterIds.has(t.chapterId)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [data.topics, filteredChapterIds]
  );

  const getChapterProgress = (chapterId: string) => {
    const chTopics = filteredTopics.filter((t) => t.chapterId === chapterId);
    if (chTopics.length === 0) return 0;
    const completed = chTopics.filter((t) => t.status === "completed" || t.status === "done").length;
    return Math.round((completed / chTopics.length) * 100);
  };

  const getChapterStatus = (chapterId: string) => {
    const progress = getChapterProgress(chapterId);
    if (progress === 100) return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed", color: "#10b981" };
    if (progress > 0) return { bg: "bg-amber-100", text: "text-amber-700", label: "In Progress", color: "#f59e0b" };
    return { bg: "bg-slate-100", text: "text-slate-500", label: "Not Started", color: "#94a3b8" };
  };

  // Syllabus Completion for the selected filters
  const syllabusData = useMemo(() => {
    const totalTopics = filteredTopics.length;
    const completedTopics = filteredTopics.filter(t => t.status === "completed" || t.status === "done").length;
    const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalTopics, completedTopics, completionRate };
  }, [filteredTopics]);

  const getTopicQuizResults = () => {
    if (!activeTopic) return [];
    
    let validStudents = data.students.filter(s => s.schoolId === schoolId);
    if (selectedClass !== "all") {
       const grade = Number(selectedClass);
       const classIds = schoolClasses.filter(c => c.grade === grade).map(c => c.id);
       validStudents = validStudents.filter(s => classIds.includes(s.classId));
    }

    const results = validStudents.map(student => {
      const result = data.studentQuizResults.find(r => r.studentId === student.id && r.chapterId === activeTopic.chapterId);
      return {
         student,
         score: result ? result.score : 0,
         total: result ? result.total : 0,
         date: result ? result.date : "-",
         hasAttempted: !!result
      };
    });

    return results.sort((a, b) => {
       if (a.hasAttempted === b.hasAttempted) return b.score - a.score;
       return a.hasAttempted ? -1 : 1;
    });
  };

  const hasNoData = schoolClasses.length === 0;

  return (
    <div className="space-y-6">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 w-44">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class</Label>
          <select
            className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setSelectedSubject("all"); }}
          >
            <option value="all">All Classes</option>
            {schoolGrades.map(g => (
              <option key={g} value={String(g)}>Class {g}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 w-48">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</Label>
          <select
            className="w-full h-10 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {hasNoData ? (
        <div className="text-center py-16 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No classes found for this school</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Syllabus Completion Summary Widget */}
          <Card className="shadow-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-slate-50 to-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-800">Overall Syllabus Progress</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Based on {syllabusData.totalTopics} total topics across selected chapters</p>
                  </div>
                </div>
                <div className="w-full md:w-64 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{syllabusData.completedTopics} Completed</span>
                    <span className="text-primary">{syllabusData.completionRate}%</span>
                  </div>
                  <Progress value={syllabusData.completionRate} className="h-2 bg-slate-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapters and Topics Accordion */}
          <div className="space-y-3">
            {filteredChapters.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border rounded-xl border-dashed">
                <p className="text-sm">No chapters found for the selected filters.</p>
              </div>
            ) : (
              filteredChapters.map((ch) => {
                const chTopics = filteredTopics.filter(t => t.chapterId === ch.id);
                const progress = getChapterProgress(ch.id);
                const sc = getChapterStatus(ch.id);
                const isExpanded = selectedChapter === ch.id;

                return (
                  <Card key={ch.id} className="shadow-card border-border overflow-hidden transition-all duration-200">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setSelectedChapter(isExpanded ? null : ch.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-10 rounded-full" style={{ backgroundColor: sc.color }} />
                        <div>
                          <h4 className="font-display font-semibold text-foreground text-sm">{ch.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={`${sc.bg} ${sc.text} text-xs border-none hover:opacity-80`}>{sc.label}</Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {chTopics.length} {chTopics.length === 1 ? "topic" : "topics"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                        </div>
                        <div className={`flex items-center justify-center transition-all ${isExpanded ? "text-slate-700" : "text-muted-foreground"}`}>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border bg-secondary/30 p-4 space-y-2">
                        {chTopics.length > 0 ? chTopics.map((topic) => {
                          const isCompleted = topic.status === "completed" || topic.status === "done";
                          const isInProgress = topic.status === "in_progress" || topic.status === "active";
                          
                          return (
                            <div key={topic.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                ) : isInProgress ? (
                                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium text-slate-700">{topic.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 text-xs gap-1.5 font-medium shadow-sm transition-transform hover:-translate-y-[1px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTopic(topic);
                                    setQuizModalOpen(true);
                                  }}
                                >
                                  <Target className="w-3.5 h-3.5" />
                                  Quiz Results
                                </Button>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="text-center py-4 text-slate-400 text-xs">
                            No topics available for this chapter.
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quiz Results Dialog */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Quiz Results — {activeTopic?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 font-semibold text-slate-600 rounded-tl-lg">Student Name</th>
                  <th className="p-3 font-semibold text-slate-600">Roll No</th>
                  <th className="p-3 font-semibold text-slate-600">Score</th>
                  <th className="p-3 font-semibold text-slate-600 rounded-tr-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getTopicQuizResults().map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-slate-800 font-medium">{row.student.name}</td>
                    <td className="p-3 text-slate-500">{row.student.rollNo}</td>
                    <td className="p-3">
                      {row.hasAttempted ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{row.score} / {row.total}</span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not Attempted</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{row.date}</td>
                  </tr>
                ))}
                {getTopicQuizResults().length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 bg-slate-50/30">
                      No students found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
