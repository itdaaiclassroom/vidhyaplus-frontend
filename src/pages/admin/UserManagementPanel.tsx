import { useState, useEffect } from "react";
import { 
  Users, Shield, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Lock, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  fetchAdmins, createAdminAccount, updateAdminAccount, deleteAdminAccount, AdminAccount,
  fetchTeams, createTeamAccount, updateTeamAccount, deleteTeamAccount, TeamAccount
} from "@/api/client";

const ITEMS_PER_PAGE = 5;

// ── Team Role Config ─────────────────────────────────────────────────────────
// Must stay in sync with backend ALLOWED_TEAM_ROLES in admin_management.controller.js
const TEAM_ROLES: { value: string; label: string; color: string }[] = [
  { value: "material_management",  label: "Material Management",  color: "bg-indigo-100 text-indigo-700" },
  { value: "school_management",    label: "School Management",    color: "bg-emerald-100 text-emerald-700" },
  { value: "student_management",   label: "Student Management",   color: "bg-amber-100 text-amber-700" },
  { value: "teacher_management",   label: "Teacher Management",   color: "bg-purple-100 text-purple-700" },
];

const getRoleConfig = (role: string) =>
  TEAM_ROLES.find(r => r.value === role) ?? { value: role, label: role, color: "bg-slate-100 text-slate-600" };

const UserManagementPanel = () => {
  const [activeTab, setActiveTab] = useState("admins");
  
  // Data
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  
  // Pagination
  const [adminPage, setAdminPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);

  // Loading
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamAccount | null>(null);

  // Forms
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [teamForm, setTeamForm] = useState({ team_name: "", email: "", password: "", role: "", district: "", is_active: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showTeamPassword, setShowTeamPassword] = useState(false);

  // Data fetching
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await fetchAdmins();
      setAdmins(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await fetchTeams();
      setTeams(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admins") loadAdmins();
    else if (activeTab === "teams") loadTeams();
  }, [activeTab]);

  // Admin Handlers
  const openAdminDialog = (admin: AdminAccount | null = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({ name: admin.name, email: admin.email, password: "", role: admin.role });
    } else {
      setEditingAdmin(null);
      setAdminForm({ name: "", email: "", password: "", role: "admin" });
    }
    setShowAdminPassword(false);
    setAdminDialogOpen(true);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email) {
      toast.error("Name and email are required");
      return;
    }
    if (!editingAdmin && adminForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (editingAdmin && adminForm.password && adminForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAdmin) {
        await updateAdminAccount(editingAdmin.id, {
          name: adminForm.name,
          email: adminForm.email,
          ...(adminForm.password ? { password: adminForm.password } : {}),
          role: adminForm.role
        });
        toast.success("Admin updated successfully");
      } else {
        await createAdminAccount({
          name: adminForm.name,
          email: adminForm.email,
          password: adminForm.password,
          role: adminForm.role
        });
        toast.success("Admin created successfully");
      }
      setAdminDialogOpen(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to save admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await deleteAdminAccount(id);
      toast.success("Admin deleted successfully");
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete admin");
    }
  };

  // Team Handlers
  const openTeamDialog = (team: TeamAccount | null = null) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({ 
        team_name: team.team_name, 
        email: team.email, 
        password: "", 
        role: team.role,
        district: team.district || "",
        is_active: team.is_active
      });
    } else {
      setEditingTeam(null);
      setTeamForm({ team_name: "", email: "", password: "", role: "", district: "", is_active: 1 });
    }
    setShowTeamPassword(false);
    setTeamDialogOpen(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.team_name || !teamForm.email || !teamForm.role) {
      toast.error("Team name, email, and role are required");
      return;
    }
    if (!editingTeam && teamForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (editingTeam && teamForm.password && teamForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTeam) {
        await updateTeamAccount(editingTeam.id, {
          team_name: teamForm.team_name,
          email: teamForm.email,
          ...(teamForm.password ? { password: teamForm.password } : {}),
          role: teamForm.role,
          district: teamForm.district,
          is_active: teamForm.is_active
        });
        toast.success("Team updated successfully");
      } else {
        await createTeamAccount({
          team_name: teamForm.team_name,
          email: teamForm.email,
          password: teamForm.password,
          role: teamForm.role,
          district: teamForm.district
        });
        toast.success("Team created successfully");
      }
      setTeamDialogOpen(false);
      loadTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to save team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeamAccount(id);
      toast.success("Team deleted successfully");
      loadTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
    }
  };

  const toggleTeamActive = async (team: TeamAccount) => {
    try {
      await updateTeamAccount(team.id, { is_active: team.is_active ? 0 : 1 });
      toast.success(`Team ${team.is_active ? 'deactivated' : 'activated'} successfully`);
      loadTeams();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle team status");
    }
  };

  // Pagination Logic
  const paginatedAdmins = admins.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE);
  const totalAdminPages = Math.ceil(admins.length / ITEMS_PER_PAGE);

  const paginatedTeams = teams.slice((teamPage - 1) * ITEMS_PER_PAGE, teamPage * ITEMS_PER_PAGE);
  const totalTeamPages = Math.ceil(teams.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">User Management</h3>
          <p className="text-sm text-slate-500">Manage administrators and department teams</p>
        </div>
        <Button onClick={() => activeTab === "admins" ? openAdminDialog() : openTeamDialog()}>
          <Plus className="w-4 h-4 mr-2" /> 
          {activeTab === "admins" ? "Add Admin" : "Add Team"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
          <TabsTrigger value="admins" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Shield className="w-4 h-4 mr-2" /> Admins
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" /> Admin Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">ID</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Created</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                    ) : paginatedAdmins.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No admins found</td></tr>
                    ) : paginatedAdmins.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-primary">#{admin.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{admin.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{admin.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="outline" className="rounded-full bg-slate-50">{admin.role}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Button variant="ghost" size="sm" onClick={() => openAdminDialog(admin)}>
                            <Edit className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalAdminPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Showing {(adminPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(adminPage * ITEMS_PER_PAGE, admins.length)} of {admins.length} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAdminPage(p => Math.max(1, p - 1))} disabled={adminPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">Page {adminPage} of {totalAdminPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setAdminPage(p => Math.min(totalAdminPages, p + 1))} disabled={adminPage === totalAdminPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">ID</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Team Name</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">District</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                    ) : paginatedTeams.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No teams found</td></tr>
                    ) : paginatedTeams.map(team => (
                      <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-primary">#{team.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{team.team_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{team.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className={`rounded-full border-0 text-xs font-semibold ${getRoleConfig(team.role).color}`}>
                            {getRoleConfig(team.role).label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{team.district || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge 
                            className={`cursor-pointer ${team.is_active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} border-0`}
                            onClick={() => toggleTeamActive(team)}
                          >
                            {team.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Button variant="ghost" size="sm" onClick={() => openTeamDialog(team)}>
                            <Edit className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalTeamPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Showing {(teamPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(teamPage * ITEMS_PER_PAGE, teams.length)} of {teams.length} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTeamPage(p => Math.max(1, p - 1))} disabled={teamPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">Page {teamPage} of {totalTeamPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setTeamPage(p => Math.min(totalTeamPages, p + 1))} disabled={teamPage === totalTeamPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? "Edit Admin" : "Add New Admin"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} placeholder="admin@vidhyaplus.com" required />
            </div>
            <div className="space-y-2">
              <Label>Password {editingAdmin ? "(Leave blank to keep current)" : <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Input type={showAdminPassword ? "text" : "password"} value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="••••••••" required={!editingAdmin} minLength={8} className="pr-10" />
                <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimum 8 characters required</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})} disabled placeholder="admin" />
              <p className="text-xs text-slate-500">Admins always have the 'admin' role.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : (editingAdmin ? "Update Admin" : "Create Admin")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTeamSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Team Name <span className="text-destructive">*</span></Label>
              <Input value={teamForm.team_name} onChange={e => setTeamForm({...teamForm, team_name: e.target.value})} placeholder="Krishna Materials Team" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={teamForm.email} onChange={e => setTeamForm({...teamForm, email: e.target.value})} placeholder="materials.krishna@vidhyaplus.com" required />
            </div>
            <div className="space-y-2">
              <Label>Password {editingTeam ? "(Leave blank to keep current)" : <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Input type={showTeamPassword ? "text" : "password"} value={teamForm.password} onChange={e => setTeamForm({...teamForm, password: e.target.value})} placeholder="••••••••" required={!editingTeam} minLength={8} className="pr-10" />
                <button type="button" onClick={() => setShowTeamPassword(!showTeamPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showTeamPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimum 8 characters required</p>
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <select
                value={teamForm.role}
                onChange={e => setTeamForm({...teamForm, role: e.target.value})}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>Select a role</option>
                {TEAM_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {teamForm.role && (
                <p className="text-xs text-slate-400">
                  {teamForm.role === "material_management" && "Can upload/manage textbooks, PPTs, and question banks."}
                  {teamForm.role === "school_management" && "Can create, update, and delete school records."}
                  {teamForm.role === "student_management" && "Can register students, manage bulk uploads, and update attendance."}
                  {teamForm.role === "teacher_management" && "Can register teachers, manage bulk uploads, and track attendance."}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={teamForm.district} onChange={e => setTeamForm({...teamForm, district: e.target.value})} placeholder="e.g. Krishna" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : (editingTeam ? "Update Team" : "Create Team")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel;
