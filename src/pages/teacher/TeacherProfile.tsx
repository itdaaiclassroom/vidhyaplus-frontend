import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, BookOpen, Layers, Star, Award, Settings, CheckCircle } from 'lucide-react';
import { fetchTeacherProfile, updateTeacherProfile } from '@/api/client';
import { toast } from 'sonner';

export default function TeacherProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    designation: '',
    skills: '',
    experience: '',
    highest_qualification: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchTeacherProfile();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        designation: data.designation || '',
        skills: data.skills ? (typeof data.skills === 'string' ? data.skills : JSON.stringify(data.skills)) : '',
        experience: data.experience || '',
        highest_qualification: data.highest_qualification || '',
        password: ''
      });
    } catch (err) {
      toast.error('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()) : []
      };
      await updateTeacherProfile(payload);
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

  const p = profile?.performance || {};

  return (
    <div className="space-y-6">
      {/* Top Section: Profile Info & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Teacher Information */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              Teacher Information
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                  <div className="space-y-1.5"><Label>Phone Number</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div className="space-y-1.5"><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} /></div>
                  <div className="space-y-1.5"><Label>Experience</Label><Input value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="e.g. 5 Years" /></div>
                  <div className="space-y-1.5"><Label>Highest Qualification</Label><Input value={form.highest_qualification} onChange={e => setForm({...form, highest_qualification: e.target.value})} placeholder="e.g. M.Sc. Mathematics" /></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Skills / Expertise (comma separated)</Label>
                  <Input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="e.g. Classroom Management, STEM" />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password (optional)</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Name</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.full_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Email</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Phone</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Designation</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.designation || 'Teacher'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">School</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.school_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Experience</Label>
                  <p className="text-base font-medium text-slate-800">{profile?.experience || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">Skills / Expertise</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {(() => {
                      let skills = [];
                      try { skills = typeof profile?.skills === 'string' ? JSON.parse(profile.skills) : profile?.skills; } catch(e){}
                      if (!Array.isArray(skills) || skills.length === 0) return <p className="text-sm text-slate-500">-</p>;
                      return skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">{s}</span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Ranking System */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white text-center flex-1 flex flex-col justify-center items-center">
            <Award className="w-16 h-16 mb-4 opacity-90" />
            <h3 className="text-xl font-bold mb-1">Teacher Ranking Score</h3>
            <p className="text-indigo-100 text-sm mb-6">Based on comprehensive performance metrics</p>
            
            <div className="text-6xl font-black tracking-tight drop-shadow-md">
              {p.rankingScore || 0}<span className="text-2xl text-indigo-200 font-medium ml-1">/100</span>
            </div>
            
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-4 w-full text-left space-y-2 border border-white/20">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-50">Student Performance</span>
                <span className="font-semibold text-white">30% Weight</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-50">Syllabus Completion</span>
                <span className="font-semibold text-white">30% Weight</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-50">Unit Progress</span>
                <span className="font-semibold text-white">20% Weight</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-50">Student Participation</span>
                <span className="font-semibold text-white">20% Weight</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Performance Metrics */}
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-700">
            <Star className="w-5 h-5 text-amber-500" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{p.sessionsConducted || 0}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Sessions Conducted</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{p.syllabusCompletion || 0}%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Syllabus Completion</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{p.unitProgress || 0}%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Unit-wise Progress</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-3">
                <User className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{p.studentParticipation || 0}%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Student Participation</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{p.quizPerformance || 0}%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Quiz Performance</p>
            </div>

          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
