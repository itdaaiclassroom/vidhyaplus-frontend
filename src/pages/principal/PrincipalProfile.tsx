import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Settings, Shield } from 'lucide-react';
import { fetchPrincipalProfile, updatePrincipalProfile } from '@/api/client';
import toast from 'react-hot-toast';

export default function PrincipalProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    designation: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchPrincipalProfile();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        designation: data.designation || '',
        password: ''
      });
    } catch (err) {
      toast.error('Failed to load principal profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updatePrincipalProfile(form);
      toast.success('Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm rounded-2xl max-w-4xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-500" />
            Principal Information
          </CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Settings className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                <div className="space-y-1.5"><Label>Phone Number</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="space-y-1.5"><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Headmaster" /></div>
              </div>
              <div className="space-y-1.5 mt-2 pt-4 border-t border-slate-100">
                <Label>New Password (optional)</Label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="max-w-md" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <p className="text-lg font-medium text-slate-800">{profile?.full_name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                </Label>
                <p className="text-lg font-medium text-slate-800">{profile?.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </Label>
                <p className="text-lg font-medium text-slate-800">{profile?.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Designation
                </Label>
                <p className="text-lg font-medium text-slate-800">{profile?.designation || 'Principal'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" /> School
                </Label>
                <p className="text-lg font-medium text-slate-800">{profile?.school_name || '-'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
