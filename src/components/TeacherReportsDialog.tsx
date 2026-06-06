import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Circle, ArrowLeft, BarChart3, User, BookOpen, Presentation, CalendarCheck } from "lucide-react";
import { useAppData } from "@/contexts/DataContext";

interface TeacherReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
}

export default function TeacherReportsDialog({ open, onOpenChange, teacherId }: TeacherReportsDialogProps) {
  const { data } = useAppData();
  const [step, setStep] = useState<number>(1);
  const [reportType, setReportType] = useState<"individual" | "overall" | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const teacher = useMemo(() => data.teachers.find(t => t.id === teacherId), [data.teachers, teacherId]);
  const school = useMemo(() => data.schools.find(s => s.id === teacher?.schoolId), [data.schools, teacher]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setReportType(null);
      setSelectedGrade(null);
      setSelectedSubjectId(null);
    }
  }, [open, teacherId]);

  const teacherGrades = useMemo(() => {
    if (!teacher) return [];
    const grades = new Set<number>();
    
    // 1. Try explicit assigned classIds
    teacher.classIds?.forEach(cid => {
      const cls = data.classes.find(c => c.id === cid);
      if (cls && cls.grade) grades.add(cls.grade);
    });

    // 2. If explicit assignment is empty, infer dynamically from live sessions
    if (grades.size === 0) {
      data.liveSessions?.forEach(ls => {
        if (ls.teacherId === teacher.id) {
          const cls = data.classes.find(c => c.id === ls.classId);
          if (cls && cls.grade) grades.add(cls.grade);
        }
      });
    }

    return Array.from(grades).sort((a, b) => a - b);
  }, [teacher, data.classes, data.liveSessions]);

  const teacherSubjects = useMemo(() => {
    if (!teacher) return [];
    
    // 1. Try explicit teacher.subjects mapping
    let subjects = data.subjects.filter(s => teacher.subjects?.includes(s.name));
    
    // 2. If not found, dynamically infer from liveSessions
    if (subjects.length === 0) {
      const teacherSessionSubjects = new Set(
        data.liveSessions?.filter(ls => ls.teacherId === teacher.id).map(ls => ls.subjectId) || []
      );
      subjects = data.subjects.filter(s => teacherSessionSubjects.has(s.id));
    }

    // Filter down to the selected grade if applicable
    if (selectedGrade) {
      subjects = subjects.filter(s => !s.grades || s.grades.includes(selectedGrade));
    }
    
    return subjects;
  }, [teacher, selectedGrade, data.subjects, data.liveSessions]);

  const reportData = useMemo(() => {
    if (!teacher) return null;
    let targetSubjects = teacherSubjects;
    if (reportType === "individual" && selectedSubjectId) {
      targetSubjects = teacherSubjects.filter(s => s.id === selectedSubjectId);
    }

    let targetGrades = teacherGrades;
    if (reportType === "individual" && selectedGrade) {
      targetGrades = [selectedGrade];
    }

    const relevantChapters = data.chapters.filter(ch => 
      targetSubjects.some(s => s.id === ch.subjectId) &&
      targetGrades.includes(ch.grade)
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const relevantChapterIds = new Set(relevantChapters.map(c => c.id));
    const relevantTopics = data.topics.filter(t => relevantChapterIds.has(t.chapterId)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const topicStatusMap = new Map<string, string>();
    const teacherLiveSessions = data.liveSessions?.filter(ls => {
      if (ls.teacherId !== teacher.id) return false;
      if (reportType === "individual" && selectedGrade) {
        const cls = data.classes.find(c => c.id === ls.classId);
        if (cls?.grade !== selectedGrade) return false;
      }
      return true;
    }) || [];

    teacherLiveSessions.forEach(ls => {
      const existing = topicStatusMap.get(ls.topicId);
      if (existing === 'completed' || existing === 'done') return;
      const st = ls.status?.toLowerCase();
      if (st === 'completed' || st === 'done' || st === 'ended') {
        topicStatusMap.set(ls.topicId, 'completed');
      } else {
        topicStatusMap.set(ls.topicId, 'in_progress');
      }
    });

    const dynamicTopics = relevantTopics.map(t => {
      const dynamicStatus = topicStatusMap.get(t.id);
      return { ...t, status: dynamicStatus || "not_started" };
    });

    const totalTopics = dynamicTopics.length;
    const completedTopics = dynamicTopics.filter(t => t.status === "completed" || t.status === "done").length;
    let completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Dynamically retrieve attendance percentage from classStatus logs or teacherEffectiveness
    let attendancePct = 0;
    const teacherClassStatus = data.classStatus?.filter(s => s.teacherId === teacher.id) || [];
    
    if (teacherClassStatus.length > 0) {
      const conducted = teacherClassStatus.filter(s => s.status === 'conducted').length;
      attendancePct = Math.round((conducted / teacherClassStatus.length) * 100);
    } else {
      const te = data.teacherEffectiveness?.find((x: any) => x.teacherId === teacher.id) as any;
      if (te && te.totalScheduled > 0) {
        attendancePct = Math.round((te.classesCompleted / te.totalScheduled) * 100);
      }
    }

    // Dynamic completion rate fallback if topics aren't fully configured
    if (totalTopics === 0) {
      const te = data.teacherEffectiveness?.find((x: any) => x.teacherId === teacher.id) as any;
      if (te && te.lessonCompletionRate) {
        completionRate = te.lessonCompletionRate;
      }
    }

    return {
      chapters: relevantChapters,
      topics: dynamicTopics,
      attendancePct,
      completionRate
    };

  }, [teacher, reportType, selectedGrade, selectedSubjectId, data.chapters, data.topics, data.classStatus, data.teacherEffectiveness, teacherSubjects, teacherGrades, data.liveSessions, data.classes]);

  const handleSelectType = (type: "individual" | "overall") => {
    setReportType(type);
    if (type === "overall") {
      setStep(4); // Jump to report
    } else {
      setStep(2); // Go to class selection
    }
  };

  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
    setStep(3); // Go to subject selection
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setStep(4); // Go to report view
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-slate-50 max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Reports for {teacher.name}</DialogTitle>

        {/* Modal Header */}
        <div className="bg-primary border-b border-primary/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20 hover:text-white" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Teacher Reports</h2>
              <p className="text-sm text-white/80 font-medium">{teacher.name}</p>
            </div>
          </div>
          {step === 4 && (
             <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 px-3 py-1 text-sm font-medium">
               {reportType === "overall" ? "Overall Report" : "Class Report"}
             </Badge>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          
          {/* STEP 1: Select Report Type */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Report Type</h3>
                <p className="text-slate-500">Choose the type of report you want to view for {teacher.name}.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all group overflow-hidden" 
                  onClick={() => handleSelectType("individual")}
                >
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">Individual Class Report</h4>
                      <p className="text-sm text-slate-500 mt-1">View detailed performance and syllabus completion for a specific class.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all group overflow-hidden"
                  onClick={() => handleSelectType("overall")}
                >
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">Overall Class Report</h4>
                      <p className="text-sm text-slate-500 mt-1">View aggregated performance across all classes taught by this teacher.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* STEP 2: Select Class */}
          {step === 2 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Class</h3>
                <p className="text-slate-500">Choose a class to view the individual report.</p>
              </div>
              {teacherGrades.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No classes assigned to this teacher.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {teacherGrades.map(grade => (
                    <Button 
                      key={grade} 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all text-lg font-bold"
                      onClick={() => handleSelectGrade(grade)}
                    >
                      Class {grade}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Select Subject */}
          {step === 3 && (
             <div className="max-w-3xl mx-auto space-y-6">
               <div className="text-center mb-8">
                 <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Subject</h3>
                 <p className="text-slate-500">Choose a subject taught in Class {selectedGrade}.</p>
               </div>
               {teacherSubjects.length === 0 ? (
                 <div className="text-center text-slate-500 py-12">No subjects assigned for this class.</div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {teacherSubjects.map(subject => (
                     <Card 
                        key={subject.id} 
                        className="cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                        onClick={() => handleSelectSubject(subject.id)}
                      >
                       <CardContent className="p-6 flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-shrink-0 items-center justify-center text-2xl">
                           {subject.icon || '📚'}
                         </div>
                         <div>
                           <h4 className="font-bold text-slate-800">{subject.name}</h4>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               )}
             </div>
          )}

          {/* STEP 4: Report View */}
          {step === 4 && reportData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Report Header */}
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{school?.name || "School Name"}</h2>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class</span>
                    <span className="text-lg font-bold text-primary">{reportType === "overall" ? "Overall" : `Class ${selectedGrade}`}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</span>
                    <span className="text-lg font-bold text-primary">
                      {reportType === "overall" 
                        ? teacherSubjects.map(s => s.name).join(", ") || "All Subjects" 
                        : data.subjects.find(s => s.id === selectedSubjectId)?.name || "N/A"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CalendarCheck className="w-32 h-32 text-blue-600" />
                  </div>
                  <CardContent className="p-8 flex items-center justify-between relative z-10">
                    <div className="space-y-2">
                      <h3 className="text-slate-500 font-semibold tracking-wide">Teacher Attendance</h3>
                      <div className="text-4xl font-black text-slate-800">{reportData.attendancePct}%</div>
                    </div>
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-slate-200" strokeWidth="8" fill="transparent" />
                        <circle cx="48" cy="48" r="40" className="stroke-blue-600 transition-all duration-1000 ease-out" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={(2 * Math.PI * 40) - (reportData.attendancePct / 100) * (2 * Math.PI * 40)} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{reportData.attendancePct}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Syllabus Completion Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Presentation className="w-32 h-32 text-emerald-600" />
                  </div>
                  <CardContent className="p-8 flex items-center justify-between relative z-10">
                    <div className="space-y-2">
                      <h3 className="text-slate-500 font-semibold tracking-wide">Syllabus Completion</h3>
                      <div className="text-4xl font-black text-slate-800">{reportData.completionRate}%</div>
                    </div>
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-slate-200" strokeWidth="8" fill="transparent" />
                        <circle cx="48" cy="48" r="40" className="stroke-emerald-500 transition-all duration-1000 ease-out" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={(2 * Math.PI * 40) - (reportData.completionRate / 100) * (2 * Math.PI * 40)} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600">{reportData.completionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chapters and Topics Details Section */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-slate-800">Chapters & Topics Breakdown</h3>
                </div>

                <div className="space-y-6">
                  {reportData.chapters.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                      No chapters assigned for the current selection.
                    </div>
                  ) : (
                    reportData.chapters.map(chapter => {
                      const chapterTopics = reportData.topics.filter(t => t.chapterId === chapter.id);
                      
                      return (
                        <div key={chapter.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                          <div className="p-2 -mx-2 mb-4 rounded-lg hover:bg-primary transition-colors group/chapter">
                            <h4 className="text-lg font-bold text-slate-800 group-hover/chapter:text-white">{chapter.name}</h4>
                          </div>
                          {chapterTopics.length === 0 ? (
                             <p className="text-sm text-slate-400 italic">No topics found for this chapter.</p>
                          ) : (
                            <div className="space-y-1 pl-4">
                              {chapterTopics.map(topic => {
                                const isCompleted = topic.status === "completed" || topic.status === "done";
                                const isInProgress = topic.status === "in_progress" || topic.status === "active";
                                
                                return (
                                  <div key={topic.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary transition-colors group/topic cursor-default">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 group-hover/topic:text-white" />
                                    ) : isInProgress ? (
                                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 group-hover/topic:text-white" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover/topic:text-white" />
                                    )}
                                    <span className={`text-base font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-600'} group-hover/topic:text-white`}>
                                      {topic.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
