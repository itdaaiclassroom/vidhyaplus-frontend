import { useState, useEffect } from "react";
import { 
  Users, Shield, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff, Key, Phone, MapPin, Mail, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  fetchAdmins, createAdminAccount, updateAdminAccount, deleteAdminAccount, AdminAccount
} from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 5;

const FEATURES = [
  { key: "overview", label: "Overview" },
  { key: "schools", label: "Schools Management" },
  { key: "students", label: "Students Management" },
  { key: "teachers", label: "Teachers Management" },
  { key: "materials", label: "Materials Management" },
  { key: "reports", label: "Reports" },
  { key: "question_bank", label: "Question Bank" },
];

const PERMISSION_LEVELS = [
  { value: "none", label: "None" },
  { value: "read", label: "Read-only" },
  { value: "write", label: "Read & Write" },
];

const UserManagementPanel = () => {
  const { role: currentUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState("superadmins");
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminPage, setAdminPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);

  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    location: "",
    mandal: "",
    district: "",
    password: "", 
    role: "admin", 
    designation: "",
    permissions: {} as Record<string, 'none' | 'read' | 'write'>
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setAdminPage(1);
  }, [activeTab, searchTerm]);

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

  useEffect(() => {
    loadAdmins();
  }, []);

  const openDialog = (admin: AdminAccount | null = null, mode: 'view' | 'edit' | 'create' = 'create') => {
    if (admin) {
      setEditingAdmin(admin);
      setForm({ 
        name: admin.name, 
        email: admin.email, 
        phone: admin.phone || "",
        location: admin.location || "",
        mandal: admin.mandal || "",
        district: admin.district || "",
        password: "", 
        role: admin.role,
        designation: admin.designation || "",
        permissions: admin.permissions || {}
      });
      setIsEditingMode(mode === 'edit');
    } else {
      setEditingAdmin(null);
      setIsEditingMode(true);
      let newRole = "admin";
      if (activeTab === "superadmins") newRole = "superadmin";
      
      setForm({ 
        name: "", 
        email: "", 
        phone: "",
        location: "",
        mandal: "",
        district: "",
        password: "", 
        role: newRole,
        designation: "",
        permissions: FEATURES.reduce((acc, feat) => ({ ...acc, [feat.key]: 'none' }), {})
      });
    }
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handlePermissionChange = (featureKey: string, level: 'none' | 'read' | 'write') => {
    if (!isEditingMode) return;
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [featureKey]: level
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingMode) return;
    
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    if (!editingAdmin && form.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (editingAdmin && form.password && form.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAdmin) {
        await updateAdminAccount(editingAdmin.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          mandal: form.mandal,
          district: form.district,
          ...(form.password ? { password: form.password } : {}),
          role: form.role,
          designation: form.designation,
          permissions: form.role === 'admin' ? form.permissions : {}
        });
        toast.success("Admin updated successfully");
      } else {
        await createAdminAccount({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          mandal: form.mandal,
          district: form.district,
          password: form.password,
          role: form.role,
          designation: form.designation,
          permissions: form.role === 'admin' ? form.permissions : {}
        });
        toast.success("Admin created successfully");
        let nextTab = "admins";
        if (form.role === "superadmin") nextTab = "superadmins";
        setActiveTab(nextTab);
      }
      setDialogOpen(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to save admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this admin account? This action cannot be undone.")) return;
    try {
      await deleteAdminAccount(id);
      toast.success("Admin deleted successfully");
      setDialogOpen(false);
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete admin");
    }
  };

  const formatId = (id: number, role: string) => {
    if (role === 'superadmin') return `SA${String(id).padStart(4, '0')}`;
    if (role === 'question_bank_admin') return `QB${String(id).padStart(4, '0')}`;
    return `A${String(id).padStart(4, '0')}`;
  };

  const superadmins = admins.filter(a => a.role === 'superadmin');
  const regularAdmins = admins.filter(a => a.role === 'admin');
  
  let currentAdmins = regularAdmins;
  if (activeTab === "superadmins") currentAdmins = superadmins;

  const filteredAdmins = currentAdmins.filter(admin => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const idString = formatId(admin.id, admin.role).toLowerCase();
    return idString.includes(term) || admin.name.toLowerCase().includes(term) || admin.email.toLowerCase().includes(term);
  });

  const paginatedAdmins = filteredAdmins.slice((adminPage - 1) * ITEMS_PER_PAGE, adminPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);

  const getRoleBadge = (role: string) => {
    if (role === 'superadmin') {
      return <Badge className="bg-purple-100 text-purple-700 border-0 rounded-full px-3 py-1 font-semibold flex items-center gap-1 w-fit"><Shield className="w-3 h-3" /> Superadmin</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-full px-3 py-1 font-semibold flex items-center gap-1 w-fit"><Users className="w-3 h-3" /> Admin</Badge>;
  };

  const renderTable = () => (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-0">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-end rounded-t-2xl">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search by ID, Name or Email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Acc ID</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Designation</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Created</th>
                {currentUserRole === 'superadmin' && (
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={currentUserRole === 'superadmin' ? 7 : 6} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : paginatedAdmins.length === 0 ? (
                <tr><td colSpan={currentUserRole === 'superadmin' ? 7 : 6} className="px-6 py-8 text-center text-slate-400">No admins found</td></tr>
              ) : paginatedAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 font-mono">{formatId(admin.id, admin.role)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{admin.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{admin.designation || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{admin.email}</td>
                  <td className="px-6 py-4 text-sm">
                    {getRoleBadge(admin.role)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                  {currentUserRole === 'superadmin' && (
                    <td className="px-6 py-4 text-sm text-right">
                      <Button variant="outline" size="sm" onClick={() => openDialog(admin, 'view')} className="rounded-xl flex items-center gap-1.5 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 font-semibold px-3 transition-colors">
                        <Eye className="w-4 h-4" />
                        View Profile
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Showing {(adminPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(adminPage * ITEMS_PER_PAGE, filteredAdmins.length)} of {filteredAdmins.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAdminPage(p => Math.max(1, p - 1))} disabled={adminPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">Page {adminPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setAdminPage(p => Math.min(totalPages, p + 1))} disabled={adminPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">User Management</h3>
          <p className="text-sm text-slate-500">Manage superadmins and administrators</p>
        </div>
        {currentUserRole === 'superadmin' && (
          <Button onClick={() => openDialog(null, 'create')} className="rounded-xl shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> 
            Add Administrator
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-slate-100 p-1 w-full max-w-sm grid grid-cols-2 h-12 rounded-xl">
          <TabsTrigger value="superadmins" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg h-full transition-all">
            Superadmins
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg h-full transition-all">
            Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="superadmins">
          {renderTable()}
        </TabsContent>
        <TabsContent value="admins">
          {renderTable()}
        </TabsContent>
      </Tabs>

      {/* Unified View/Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl bg-white">
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {editingAdmin 
                ? (isEditingMode ? `Edit Profile` : `Admin Profile`)
                : `Add New Administrator`
              }
            </DialogTitle>
            {editingAdmin && (
              <div className="flex items-center gap-2">
                {!isEditingMode && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingMode(true)} className="rounded-lg h-9">
                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(editingAdmin.id)} className="rounded-lg h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {!isEditingMode && editingAdmin && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border border-primary/20 uppercase">
                    {editingAdmin.name.charAt(0)}
                 </div>
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <h2 className="text-2xl font-bold text-slate-800">{editingAdmin.name}</h2>
                     {getRoleBadge(editingAdmin.role)}
                   </div>
                   <p className="text-slate-500 font-medium font-mono">{formatId(editingAdmin.id, editingAdmin.role)} • <span className="font-sans">{editingAdmin.designation || 'No Designation'}</span></p>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Full Name {isEditingMode && <span className="text-rose-500">*</span>}</Label>
                {isEditingMode ? (
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" required />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.name || '-'}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Email Address {isEditingMode && <span className="text-rose-500">*</span>}</Label>
                {isEditingMode ? (
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. admin@vidhyaplus.com" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" required autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.email || '-'}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Designation</Label>
                {isEditingMode ? (
                  <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Principal, IT Manager" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.designation || '-'}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Phone Number</Label>
                {isEditingMode ? (
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. +91..." className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.phone || '-'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Location</Label>
                {isEditingMode ? (
                  <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Headquarters" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.location || '-'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Mandal</Label>
                {isEditingMode ? (
                  <Input value={form.mandal} onChange={e => setForm({...form, mandal: e.target.value})} placeholder="e.g. Mandal" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.mandal || '-'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">District</Label>
                {isEditingMode ? (
                  <Input value={form.district} onChange={e => setForm({...form, district: e.target.value})} placeholder="e.g. District" className="h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="off" />
                ) : (
                  <p className="text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-transparent">{form.district || '-'}</p>
                )}
              </div>

              {isEditingMode && (
                <div className="space-y-1.5 md:col-span-2 mt-2 pt-4 border-t border-slate-100">
                  <Label className="text-slate-700 font-semibold text-sm">Password {editingAdmin ? <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span> : <span className="text-rose-500">*</span>}</Label>
                  <div className="relative max-w-sm">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required={!editingAdmin} minLength={8} className="h-10 pr-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {form.role === 'admin' && (
              <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-500" />
                  <h4 className="font-semibold text-slate-800 text-sm">Feature Access Permissions</h4>
                </div>
                <div className="p-4 space-y-3">
                  {FEATURES.map(feat => (
                    <div key={feat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1">
                      <Label className="text-sm font-medium text-slate-600">{feat.label}</Label>
                      <div className={`flex items-center gap-1 ${isEditingMode ? 'bg-slate-50 p-1 rounded-lg border border-slate-200' : ''}`}>
                        {isEditingMode ? (
                          PERMISSION_LEVELS.map(level => {
                            const isActive = (form.permissions[feat.key] || 'none') === level.value;
                            return (
                              <button
                                key={level.value}
                                type="button"
                                onClick={() => handlePermissionChange(feat.key, level.value as any)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex-1 sm:flex-none ${
                                  isActive 
                                    ? 'bg-white shadow-sm text-primary border border-slate-200' 
                                    : 'text-slate-500 hover:bg-slate-200/50'
                                }`}
                              >
                                {level.label}
                              </button>
                            );
                          })
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 capitalize">
                            {PERMISSION_LEVELS.find(l => l.value === (form.permissions[feat.key] || 'none'))?.label || 'None'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-8">
              {!isEditingMode ? (
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl px-6 font-medium">Close</Button>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={() => editingAdmin ? setIsEditingMode(false) : setDialogOpen(false)} className="rounded-xl px-6 font-medium">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="rounded-xl px-8 shadow-sm">
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel;
