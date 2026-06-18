import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, LogOut, User as UserIcon, Shield, Mail, Phone, MapPin, Globe, CalendarCheck } from 'lucide-react';
import { fetchAdminProfile, updateAdminProfile } from '@/api/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const { userName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    mandal: '',
    district: '',
    language: '',
    password: ''
  });

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await fetchAdminProfile();
      setAdminProfile(data);
      setProfileForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        mandal: data.mandal || '',
        district: data.district || '',
        language: data.language || '',
        password: ''
      });
    } catch (err) {
      toast.error('Failed to load admin profile');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      await updateAdminProfile(profileForm);
      toast.success('Profile updated successfully');
      setEditProfileModalOpen(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="relative group">
        {/* Cover Gradient - Soft Theme */}
        <div className="h-48 w-full bg-slate-100/80 rounded-3xl overflow-hidden border border-slate-200 transition-all duration-700 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-100 opacity-50"></div>
        </div>
        
        {/* Profile Header */}
        <div className="px-10 -mt-20 relative flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-slate-100">
          <div className="p-2 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-32 h-32 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl font-bold text-slate-700 border-2 border-white overflow-hidden shadow-inner uppercase">
              {(adminProfile?.full_name || userName)?.charAt(0) || "A"}
            </div>
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-bold text-slate-800">{adminProfile?.full_name || userName || "Administrator"}</h2>
              <Badge className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 text-xs font-semibold rounded-md uppercase tracking-wider">
                {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : role}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium text-lg">{adminProfile?.designation || "System Management & Administration"}</p>
          </div>
          <div className="flex gap-4 pb-3">
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-all" onClick={() => setEditProfileModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Details
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium transition-all" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="mt-8 px-2">
          {/* Account Information */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white transition-all duration-300">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-8">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-slate-400" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {profileLoading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" /> Full Name
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.full_name || userName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> Account ID
                    </Label>
                    <p className="text-lg font-medium text-slate-800 font-mono bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-200">{String(adminProfile?.sequence_no || adminProfile?.id || localStorage.getItem("auth.teamId") || 1)}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" /> Designation
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.designation || "-"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.email || "Not Set"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.phone || "Not Set"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Assigned Location
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.location || "Not Set"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Mandal
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.mandal || "Not Set"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> District
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.district || "Not Set"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Languages
                    </Label>
                    <p className="text-lg font-medium text-slate-800">{adminProfile?.language || "English (Primary), Telugu"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CalendarCheck className="w-3.5 h-3.5" /> Member Since
                    </Label>
                    <p className="text-lg font-medium text-slate-800">
                      {adminProfile?.created_at 
                        ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(adminProfile.created_at))
                        : "May 12, 2024"
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-0 shadow-xl rounded-3xl">
          <DialogTitle className="sr-only">Edit Profile</DialogTitle>
          <div className="bg-slate-50 border-b border-slate-100 p-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
            <p className="text-slate-500 text-sm mt-1">Update your account information</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input required value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" required value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="+91..." />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="e.g. Headquarters" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mandal</Label>
                <Input value={profileForm.mandal} onChange={e => setProfileForm({ ...profileForm, mandal: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="e.g. Mandal" />
              </div>
              <div className="space-y-1.5">
                <Label>District</Label>
                <Input value={profileForm.district} onChange={e => setProfileForm({ ...profileForm, district: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="e.g. District" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Languages</Label>
              <Input value={profileForm.language} onChange={e => setProfileForm({ ...profileForm, language: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="e.g. English, Telugu" />
            </div>
            
            <div className="pt-2 border-t border-slate-100 mt-2">
              <div className="space-y-1.5">
                <Label className="text-slate-500">Change Password (optional)</Label>
                <Input type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} className="rounded-xl border-slate-200 bg-slate-50/50" placeholder="Leave blank to keep current" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl border-slate-200 text-slate-600" onClick={() => setEditProfileModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={profileSubmitting} className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm">
                {profileSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
