import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Settings2, 
  History, 
  Unlock, 
  Lock, 
  Search, 
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { 
  fetchGatingConfig, 
  updateGatingConfig, 
  fetchChapterOverrides, 
  createChapterOverride,
  fetchPrincipalSubjects 
} from "@/api/client";
import { toast } from "sonner";
import { useAppData } from "@/contexts/DataContext";

export default function GatingAdminPanel() {
  const { data } = useAppData();
  const { teachers, schools, classes, chapters } = data;

  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Overrides state
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  
  // New override form
  const [targetTeacherId, setTargetTeacherId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [targetChapterId, setTargetChapterId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [creatingOverride, setCreatingOverride] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, overridesData] = await Promise.all([
        fetchGatingConfig(),
        fetchChapterOverrides()
      ]);
      setConfig(configData.config);
      setOverrides(overridesData.overrides);
    } catch (err) {
      toast.error("Failed to load gating data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateConfig = async (key: string, value: string) => {
    setSaving(true);
    try {
      await updateGatingConfig({ [key]: value });
      setConfig(prev => ({ ...prev, [key]: value }));
      toast.success("Configuration updated");
    } catch (err) {
      toast.error("Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOverride = async () => {
    if (!targetTeacherId || !targetChapterId || !targetClassId) {
      toast.error("Please select teacher, class, and chapter");
      return;
    }
    setCreatingOverride(true);
    try {
      await createChapterOverride({
        teacherId: targetTeacherId,
        chapterId: targetChapterId,
        classId: targetClassId,
        overrideType: "unlock",
        reason: overrideReason
      });
      toast.success("Manual override created successfully");
      setOverrideReason("");
      // Reload overrides
      const data = await fetchChapterOverrides();
      setOverrides(data.overrides);
    } catch (err) {
      toast.error("Failed to create override");
    } finally {
      setCreatingOverride(false);
    }
  };

  const filteredChapters = chapters.filter(ch => {
    const teacher = teachers.find(t => String(t.id) === String(targetTeacherId));
    if (!teacher) return false;
    // Basic filtering logic - in a real app you'd filter by teacher's subject/grade
    return true; 
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-500">Loading gating controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Global Settings */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden lg:col-span-1">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> Global Settings
            </CardTitle>
            <CardDescription>Configure progression rules for all teachers.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Enable Gating System</Label>
                <p className="text-xs text-slate-500">Enable or disable strict progression across the app.</p>
              </div>
              <Switch 
                checked={config.gating_enabled === "true"}
                onCheckedChange={(checked) => handleUpdateConfig("gating_enabled", checked ? "true" : "false")}
                disabled={saving}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Teacher Pass Threshold (%)</Label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  value={config.teacher_pass_percentage || "70"}
                  onChange={(e) => setConfig(prev => ({ ...prev, teacher_pass_percentage: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig("teacher_pass_percentage", e.target.value)}
                  className="bg-slate-50 border-slate-200 rounded-xl"
                  min="0"
                  max="100"
                />
                <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200">Required</Badge>
              </div>
              <p className="text-[10px] text-slate-400 italic">Score needed by teachers on competency assessments.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Student Threshold (%)</Label>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  value={config.student_threshold_percentage || "60"}
                  onChange={(e) => setConfig(prev => ({ ...prev, student_threshold_percentage: e.target.value }))}
                  onBlur={(e) => handleUpdateConfig("student_threshold_percentage", e.target.value)}
                  className="bg-slate-50 border-slate-200 rounded-xl"
                  min="0"
                  max="100"
                />
                <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200">Required</Badge>
              </div>
              <p className="text-[10px] text-slate-400 italic">Class average needed to unlock next chapter assessment.</p>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-tight">
                  Changes apply immediately to all active sessions and dashboards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Override Form */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden lg:col-span-2">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-500" /> Manual Chapter Override
            </CardTitle>
            <CardDescription>Grant temporary access or bypass gating for specific chapters.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Teacher</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={targetTeacherId}
                    onChange={(e) => setTargetTeacherId(e.target.value)}
                  >
                    <option value="">Choose Teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({schools.find(s => s.id === t.schoolId)?.name || 'Unknown School'})</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Class</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                  >
                    <option value="">Choose Class...</option>
                    {classes
                      .filter(c => teachers.find(t => t.id === targetTeacherId)?.classId === c.id || true) // Simplified
                      .map(c => <option key={c.id} value={c.id}>{c.name} ({schools.find(s => s.id === c.schoolId)?.name})</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Chapter</Label>
                  <select 
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={targetChapterId}
                    onChange={(e) => setTargetChapterId(e.target.value)}
                  >
                    <option value="">Choose Chapter...</option>
                    {chapters.sort((a,b) => (a.order || 0) - (b.order || 0)).map(ch => <option key={ch.id} value={ch.id}>{ch.name} (G{ch.grade})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Override</Label>
                  <textarea 
                    className="w-full h-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="e.g., Technical issue during assessment, transfer teacher, etc."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full rounded-xl py-6 font-bold gap-2" 
                  onClick={handleCreateOverride}
                  disabled={creatingOverride || !targetTeacherId || !targetChapterId}
                >
                  {creatingOverride ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Authorize Manual Unlock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Override History */}
      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" /> Override Audit Trail
            </CardTitle>
            <CardDescription>Full history of manual unlocks and gating modifications.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Teacher</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Chapter</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Action</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Reason</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Admin</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overrides.length > 0 ? overrides.map((ov, i) => (
                  <tr key={ov.id || i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{ov.teacher_name}</p>
                      <p className="text-[10px] text-slate-400">{ov.class_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{ov.chapter_name}</td>
                    <td className="px-6 py-4">
                      <Badge className={ov.override_type === 'unlock' ? "bg-emerald-100 text-emerald-600 border-0" : "bg-rose-100 text-rose-600 border-0"}>
                        {ov.override_type === 'unlock' ? 'Manual Unlock' : 'Manual Lock'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">{ov.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{ov.admin_name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 text-right">
                      {new Date(ov.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No override records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
