import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  fetchBroadcastMessages, 
  fetchSchoolAnnouncements, 
  createSchoolAnnouncement, 
  updateSchoolAnnouncement, 
  deleteSchoolAnnouncement,
  SchoolAnnouncement
} from "@/api/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, Calendar, Megaphone, Plus, Pencil, Trash2, Users, User, CheckCircle, MessageSquare, AlertCircle, Building, Globe, Filter } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const Announcements = () => {
  const { role } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // School Specific Announcements State (for Principal CRUD)
  const [schoolAnnouncements, setSchoolAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loadingSchoolAnn, setLoadingSchoolAnn] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formTargetRole, setFormTargetRole] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredMessages = messages.filter((msg) => {
    if (!msg.created_at) return true;
    const msgDate = new Date(msg.created_at);
    msgDate.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (msgDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (msgDate > end) return false;
    }

    return true;
  });

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await fetchBroadcastMessages();
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolAnnouncementsList = async () => {
    if (role !== "principal") return;
    setLoadingSchoolAnn(true);
    try {
      const list = await fetchSchoolAnnouncements();
      setSchoolAnnouncements(list);
    } catch (err) {
      console.error("Failed to fetch school announcements:", err);
    } finally {
      setLoadingSchoolAnn(false);
    }
  };

  useEffect(() => {
    loadMessages();
    if (role === "principal") {
      loadSchoolAnnouncementsList();
    }
  }, [role]);

  // CRUD Handlers
  const handleAddAnnouncement = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }
    setSubmitting(true);
    try {
      await createSchoolAnnouncement({
        title: formTitle.trim(),
        message: formMessage.trim(),
        target_role: formTargetRole
      });
      toast.success("School announcement created and broadcasted successfully!");
      setIsAddModalOpen(false);
      resetForm();
      loadSchoolAnnouncementsList();
      loadMessages(); // Refresh combined feed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement) return;
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }
    setSubmitting(true);
    try {
      await updateSchoolAnnouncement(selectedAnnouncement.id, {
        title: formTitle.trim(),
        message: formMessage.trim(),
        target_role: formTargetRole
      });
      toast.success("Announcement updated successfully!");
      setIsEditModalOpen(false);
      resetForm();
      loadSchoolAnnouncementsList();
      loadMessages(); // Refresh combined feed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;
    setSubmitting(true);
    try {
      await deleteSchoolAnnouncement(selectedAnnouncement.id);
      toast.success("Announcement deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedAnnouncement(null);
      loadSchoolAnnouncementsList();
      loadMessages(); // Refresh combined feed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ann: SchoolAnnouncement) => {
    setSelectedAnnouncement(ann);
    setFormTitle(ann.title);
    setFormMessage(ann.message);
    setFormTargetRole(ann.target_role || "all");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (ann: SchoolAnnouncement) => {
    setSelectedAnnouncement(ann);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormMessage("");
    setFormTargetRole("all");
    setSelectedAnnouncement(null);
  };

  // Stats calculation
  const totalCreated = schoolAnnouncements.length;
  const countTeachers = schoolAnnouncements.filter(a => a.target_role === "teacher").length;
  const countStudents = schoolAnnouncements.filter(a => a.target_role === "student").length;
  const countAll = schoolAnnouncements.filter(a => a.target_role === "all" || !a.target_role).length;

  return (
    <DashboardLayout title="Announcements">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Megaphone className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
              <p className="text-muted-foreground text-sm">Stay updated with the latest school news and notices.</p>
            </div>
          </div>

          {role === "principal" && (
            <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Create Announcement
            </Button>
          )}
        </div>

        {/* Tab System for Principal */}
        {role === "principal" ? (
          <Tabs defaultValue="feed" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-secondary/30 p-1">
              <TabsTrigger value="feed" className="gap-2">
                <Bell className="w-4 h-4" /> Bulletin Board
              </TabsTrigger>
              <TabsTrigger value="manage" className="gap-2">
                <Building className="w-4 h-4" /> School Bulletins (CRUD)
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: COMBINED BULLETIN BOARD */}
            <TabsContent value="feed" className="space-y-6">
              {/* Date Filters Card */}
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" /> Filter Bulletins
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="start-date" className="text-xs text-muted-foreground px-1">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs w-[140px] bg-background"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="end-date" className="text-xs text-muted-foreground px-1">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 text-xs w-[140px] bg-background"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="mt-4 h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground animate-pulse font-medium">Loading announcements...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-border/50 shadow-sm">
                  <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No Announcements Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your date filters or check back later.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMessages.map((msg, idx) => {
                    const isSchoolSpecific = msg.target_audience === 'teacher' || msg.target_audience === 'student' || msg.target_audience === 'all';
                    return (
                      <Card 
                        key={idx} 
                        className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-card to-card/50 relative"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSchoolSpecific ? 'bg-indigo-500' : 'bg-primary'}`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <CardTitle className="text-lg font-semibold text-foreground leading-tight">
                                {msg.title || "Admin Announcement"}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1.5">
                                {isSchoolSpecific ? (
                                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100">
                                    School Announcement
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 text-primary border-primary/10">
                                    Global Broadcast
                                  </Badge>
                                )}
                                {msg.target_audience && (
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5">
                                    To: {msg.target_audience}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                              <Calendar className="w-3.5 h-3.5" />
                              {msg.created_at ? format(new Date(msg.created_at), "MMM d, yyyy") : "Recent"}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                            {msg.message}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: PRINCIPAL CRUD PANEL */}
            <TabsContent value="manage" className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card shadow-sm border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalCreated}</p>
                      <p className="text-xs text-muted-foreground font-medium">Total Sent</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{countAll}</p>
                      <p className="text-xs text-muted-foreground font-medium">To All</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{countTeachers}</p>
                      <p className="text-xs text-muted-foreground font-medium">To Teachers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{countStudents}</p>
                      <p className="text-xs text-muted-foreground font-medium">To Students</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* School Specific list */}
              {loadingSchoolAnn ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground animate-pulse font-medium">Loading school announcements...</p>
                </div>
              ) : schoolAnnouncements.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border/50 shadow-sm">
                  <Building className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">No School Announcements Created</h3>
                  <p className="text-sm text-muted-foreground mt-1">Get started by clicking the "Create Announcement" button at the top.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schoolAnnouncements.map((ann) => {
                    const badgeStyles = 
                      ann.target_role === "teacher" 
                        ? "bg-blue-50 text-blue-700 border-blue-100" 
                        : ann.target_role === "student" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-amber-50 text-amber-700 border-amber-100";

                    return (
                      <Card key={ann.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg text-foreground leading-tight">{ann.title}</h3>
                                <Badge className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${badgeStyles}`}>
                                  Target: {ann.target_role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(ann.created_at), "MMM d, yyyy 'at' hh:mm a")} 
                                {ann.sender_name && ` • Sent by ${ann.sender_name}`}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(ann)} className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteModal(ann)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                            {ann.message}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* STANDARD USER FEED VIEW (Teacher, Student, etc.) */
          <>
            {/* Date Filters Card */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" /> Filter Bulletins
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="start-date" className="text-xs text-muted-foreground px-1">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs w-[140px] bg-background"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="end-date" className="text-xs text-muted-foreground px-1">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs w-[140px] bg-background"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="mt-4 h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse font-medium">Loading announcements...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border/50 shadow-sm">
                <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Announcements Found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your date filters.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMessages.map((msg, idx) => {
                  const isSchoolSpecific = msg.target_audience === 'teacher' || msg.target_audience === 'student' || msg.target_audience === 'all';
                  return (
                    <Card 
                      key={idx} 
                      className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-card to-card/50 relative"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSchoolSpecific ? 'bg-indigo-500' : 'bg-primary'}`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="text-lg font-semibold text-foreground leading-tight">
                              {msg.title || "Admin Announcement"}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                              {isSchoolSpecific ? (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100">
                                  School Announcement
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 text-primary border-primary/10">
                                  Global Broadcast
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                            {msg.created_at ? format(new Date(msg.created_at), "MMM d, yyyy") : "Recent"}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
                          {msg.message}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-md bg-card border-border/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600 animate-pulse" /> Create Announcement
            </DialogTitle>
            <DialogDescription>
              Draft an announcement that will be broadcasted specifically within your school.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title" className="text-xs font-semibold text-foreground">Announcement Title</Label>
              <Input 
                id="ann-title"
                placeholder="e.g. Annual Sports Meet Rescheduled" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={100}
                className="bg-background border-border/80 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="ann-target" className="text-xs font-semibold text-foreground">Target Audience</Label>
              <Select value={formTargetRole} onValueChange={setFormTargetRole}>
                <SelectTrigger id="ann-target" className="bg-background border-border/80 focus-visible:ring-indigo-500">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (All Staff & Students)</SelectItem>
                  <SelectItem value="teacher">Teachers Only</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-message" className="text-xs font-semibold text-foreground">Announcement Message</Label>
              <Textarea 
                id="ann-message"
                placeholder="Type your announcement content here..." 
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={5}
                className="bg-background border-border/80 focus-visible:ring-indigo-500 text-sm whitespace-pre-wrap"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAnnouncement} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {submitting ? "Sending..." : "Publish Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ANNOUNCEMENT DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-md bg-card border-border/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-600" /> Edit Announcement
            </DialogTitle>
            <DialogDescription>
              Modify your existing school-specific announcement bulletin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-title" className="text-xs font-semibold text-foreground">Announcement Title</Label>
              <Input 
                id="ann-edit-title"
                placeholder="e.g. Monthly Meeting Update" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={100}
                className="bg-background border-border/80 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-target" className="text-xs font-semibold text-foreground">Target Audience</Label>
              <Select value={formTargetRole} onValueChange={setFormTargetRole}>
                <SelectTrigger id="ann-edit-target" className="bg-background border-border/80 focus-visible:ring-indigo-500">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (All Staff & Students)</SelectItem>
                  <SelectItem value="teacher">Teachers Only</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-edit-message" className="text-xs font-semibold text-foreground">Announcement Message</Label>
              <Textarea 
                id="ann-edit-message"
                placeholder="Type your announcement content..." 
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={5}
                className="bg-background border-border/80 focus-visible:ring-indigo-500 text-sm whitespace-pre-wrap"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAnnouncement} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ANNOUNCEMENT DIALOG */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm bg-card border-border/80 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" /> Delete Announcement
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete **{selectedAnnouncement?.title}**? This action will recall the bulletin from all audience feeds permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAnnouncement} disabled={submitting}>
              {submitting ? "Recalling..." : "Recall Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Announcements;
