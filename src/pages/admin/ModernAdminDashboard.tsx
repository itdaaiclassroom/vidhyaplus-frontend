import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  School, Users, GraduationCap, BarChart3, Activity, 
  MessageSquare, Calendar as CalendarIcon, LogOut, 
  Settings, Search, Eye, Plus, Shield, Clock,
  BookOpen, ClipboardList, Radio, MonitorPlay, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { 
  fetchAdminOverview, 
  fetchAdminAnalytics, 
  createAnnouncement, 
  fetchTeacherLogs,
  getApiBase 
} from "@/api/client";
import { toast } from "sonner";
import MaterialManagement from "./MaterialManagement";

const ModernAdminDashboard = () => {
  const { data, loading, refetch } = useAppData();
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [announcement, setAnnouncement] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);

  // Load Admin specific data
  useEffect(() => {
    fetchAdminOverview().then(setOverview).catch(console.error);
    fetchAdminAnalytics().then(setAnalytics).catch(console.error);
    fetchTeacherLogs().then(setLogs).catch(console.error);
  }, []);

  const { schools, teachers, students, liveSessions } = data;

  const activeSessions = useMemo(() => liveSessions.filter(s => s.status === "active"), [liveSessions]);

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) return;
    try {
      await createAnnouncement({ title: "Admin Announcement", message: announcement });
      toast.success("Announcement sent to all teachers");
      setAnnouncement("");
    } catch (err) {
      toast.error("Failed to send announcement");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "schools", label: "Schools", icon: School },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "materials", label: "Materials", icon: BookOpen },
    { id: "logs", label: "Logs", icon: ClipboardList },
    { id: "profile", label: "Profile", icon: Settings },
    { id: "usermanagement", label: "User Management", icon: Shield },
  ];

  const resolveImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${getApiBase()}/uploads/${path.replace(/^\/+/, "")}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl text-slate-800">Vidhyaplus</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Middle Section */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {userName}</h1>
            <p className="text-slate-500">Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-10 w-64 bg-white border-slate-200" placeholder="Search everything..." />
            </div>
            {activeTab === "schools" && (
              <Button className="rounded-xl px-6">
                <Plus className="w-4 h-4 mr-2" /> Add School
              </Button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Overview Content */}
          <TabsContent value="overview" className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Total Schools" value={overview?.totalSchools || 0} icon={School} color="blue" />
              <SummaryCard title="Total Teachers" value={overview?.totalTeachers || 0} icon={Users} color="purple" />
              <SummaryCard title="Total Students" value={overview?.totalStudents || 0} icon={GraduationCap} color="amber" />
              <SummaryCard 
                title="Session Status" 
                value={`${overview?.sessionsCompleted || 0} / ${overview?.sessionsTotal || 1200}`} 
                icon={Activity} 
                color="green" 
              />
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Student Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.students || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="active" stroke="#1a9988" strokeWidth={3} dot={{r: 4, fill: '#1a9988'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" /> Teacher Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.teachers || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
                <CardHeader className="bg-white border-b border-slate-50">
                  <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" /> Session Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[analytics?.sessions || {completed: 0, remaining: 0}]} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" hide />
                        <Tooltip />
                        <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed Sessions" />
                        <Bar dataKey="remaining" fill="#ef4444" radius={[0, 4, 4, 0]} name="Remaining Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-500">Completed (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-sm text-slate-500">Remaining (Red)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Content */}
          <TabsContent value="students" className="space-y-6">
             <Card className="border-0 shadow-sm rounded-2xl">
               <CardContent className="p-0">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Student ID</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Class</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">School</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {students.slice(0, 10).map(s => (
                       <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4 text-sm font-medium text-primary">#{s.id}</td>
                         <td className="px-6 py-4 text-sm font-medium text-slate-800">{s.name}</td>
                         <td className="px-6 py-4 text-sm text-slate-500">{s.section || '10-A'}</td>
                         <td className="px-6 py-4 text-sm text-slate-500">{schools.find(sc => sc.id === s.schoolId)?.name || 'Main School'}</td>
                         <td className="px-6 py-4 text-right">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="text-primary hover:text-primary hover:bg-primary/5 rounded-lg"
                             onClick={() => setSelectedStudent(s)}
                           >
                             <Eye className="w-4 h-4 mr-2" /> View
                           </Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </CardContent>
             </Card>
          </TabsContent>

          {/* Materials Content */}
          <TabsContent value="materials" className="space-y-6">
            <MaterialManagement />
          </TabsContent>

          {/* User Management Content */}
          <TabsContent value="usermanagement" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Admin User Management</h3>
              <Button onClick={() => toast.info("Add Admin Modal to be implemented")}>
                <Plus className="w-4 h-4 mr-2" /> Add Admin
              </Button>
            </div>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">ID</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.admins?.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-primary">#{admin.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{admin.full_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{admin.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline" className="rounded-full">{admin.role}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Content */}
          <TabsContent value="logs" className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Teacher Activity Logs</h3>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Teacher</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Action</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Details</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{log.teacher_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{log.details || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No activity logs found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Content */}
          <TabsContent value="schools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map(school => (
                <Card key={school.id} className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800">{school.name}</CardTitle>
                    <Badge className={school.activeStatus ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}>
                      {school.activeStatus ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">District:</span>
                      <span className="font-medium text-slate-800">{school.district}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Teachers:</span>
                      <span className="font-medium text-slate-800">{school.teachers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Students:</span>
                      <span className="font-medium text-slate-800">{school.students}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-rose-500 uppercase">Live Session</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary" onClick={() => setShowLiveMonitor(true)}>
                        Monitor <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 3. Right Utility Panel */}
      {activeTab === "overview" && (
        <aside className="w-[340px] bg-white border-l border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Calendar
              </h3>
              <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Announcements
              </h3>
              <div className="space-y-4">
                <textarea 
                  className="w-full h-32 p-4 bg-slate-50 border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Broadcast a message to all teachers..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                />
                <Button className="w-full rounded-xl py-6 font-bold" onClick={handleSendAnnouncement}>
                  Send Message
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Insights</h3>
              <div className="space-y-4">
                 <InsightItem icon={Clock} label="Avg. Session Time" value="42 min" />
                 <InsightItem icon={MonitorPlay} label="Active Classes" value={activeSessions.length} />
              </div>
            </div>
          </section>
        </aside>
      )}

      {/* Live Sessions Monitor Toggle Button (Floating) */}
      <div className={`fixed bottom-8 ${activeTab === 'overview' ? 'right-[360px]' : 'right-8'} z-50 transition-all duration-300`}>
        <Button 
          className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 bg-primary hover:bg-primary-hover"
          onClick={() => setShowLiveMonitor(!showLiveMonitor)}
        >
          <MonitorPlay className="w-6 h-6" />
        </Button>
      </div>

      {/* Live Monitor Panel */}
      {showLiveMonitor && (
        <Card className={`fixed bottom-24 ${activeTab === 'overview' ? 'right-[360px]' : 'right-8'} w-96 z-50 shadow-2xl border-0 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 transition-all duration-300`}>
          <CardHeader className="bg-primary text-white flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" /> Live Sessions ({activeSessions.length})
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowLiveMonitor(false)}>
              Minimize
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {activeSessions.length > 0 ? (
              activeSessions.map(session => (
                <div key={session.id} className="p-4 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{session.topicName}</p>
                    <p className="text-xs text-slate-500">{session.className} • {session.teacherName}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 px-3">
                    Watch
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No ongoing sessions</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Profile Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <div className="relative h-32 bg-primary">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                {selectedStudent?.profile_image_url ? (
                  <img src={selectedStudent.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>
          </div>
          <div className="pt-16 pb-8 px-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent?.name}</h2>
                <p className="text-primary font-medium">#{selectedStudent?.id}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-0 px-4 py-1.5 rounded-full">
                Hosteller: {selectedStudent?.is_hosteller ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-50">
              <DetailItem label="School" value={schools.find(s => s.id === selectedStudent?.schoolId)?.name || 'Main School'} />
              <DetailItem label="Class" value={selectedStudent?.section || '10-A'} />
              <DetailItem label="Phone" value={selectedStudent?.phone_number || 'N/A'} />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <DetailItem label="Village" value={selectedStudent?.village || 'N/A'} />
              <DetailItem label="Mandal" value={selectedStudent?.mandal || 'N/A'} />
              <DetailItem label="District" value={selectedStudent?.district || 'N/A'} />
              <DetailItem label="State" value={selectedStudent?.state || 'Andhra Pradesh'} />
              <DetailItem label="Pincode" value={selectedStudent?.pincode || 'N/A'} />
              <DetailItem label="Address" value={selectedStudent?.address || 'N/A'} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };
  
  return (
    <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} border flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </CardContent>
    </Card>
  );
};

const InsightItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <span className="text-sm text-slate-500 font-medium">{label}</span>
    </div>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

const DetailItem = ({ label, value }: any) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-slate-700 font-medium">{value}</p>
  </div>
);

export default ModernAdminDashboard;
