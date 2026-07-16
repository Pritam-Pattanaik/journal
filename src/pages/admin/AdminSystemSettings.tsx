import { useState, useEffect } from 'react';
import { Settings, ToggleLeft, ToggleRight, Save, Megaphone, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { SkeletonCard } from '../../components/admin/SkeletonLoader';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  createdAt: string | null;
  updatedAt: string | null;
}

const TOGGLE_SETTINGS = [
  { key: 'enable_ai_coach', label: 'AI Coach', description: 'Enable AI-powered trade analysis and coaching for all users', icon: '🧠' },
  { key: 'enable_broker_sync', label: 'Broker Sync', description: 'Allow users to connect and sync trades from brokers (Zerodha, AngelOne, Dhan)', icon: '🔗' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Put the platform in maintenance mode. Users will see a maintenance banner.', icon: '🔧', danger: true },
];

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const result = await api.get<{ settings: SystemSetting[] }>('/admin/settings');
      setSettings(result.settings);
      const ann = result.settings.find(s => s.key === 'system_announcement');
      if (ann) setAnnouncement(ann.value);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const getSettingValue = (key: string): string => {
    return settings.find(s => s.key === key)?.value || '';
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(key);
      await api.patch('/admin/settings', { key, value });
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s));
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const toggleSetting = (key: string) => {
    const current = getSettingValue(key);
    updateSetting(key, current === 'true' ? 'false' : 'true');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Settings</h1>
          <p className="text-text-secondary text-sm">Configure platform-wide features and announcements</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Feature Flags */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Feature Flags</h2>
        {TOGGLE_SETTINGS.map((setting) => {
          const isEnabled = getSettingValue(setting.key) === 'true';
          const isSaving = saving === setting.key;
          const isSaved = saved === setting.key;
          return (
            <div key={setting.key} className={`bg-surface rounded-xl border p-6 transition-all ${
              setting.danger && isEnabled ? 'border-red-500/50' : 'border-border-color'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{setting.icon}</span>
                  <div>
                    <h3 className="text-text-primary font-medium flex items-center gap-2">
                      {setting.label}
                      {isSaved && (
                        <span className="flex items-center gap-1 text-green-500 text-xs animate-fade-in">
                          <CheckCircle className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                      {setting.danger && isEnabled && (
                        <span className="flex items-center gap-1 text-red-500 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </h3>
                    <p className="text-text-secondary text-sm mt-0.5">{setting.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(setting.key)}
                  disabled={isSaving}
                  className="relative shrink-0 ml-4 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  aria-label={`Toggle ${setting.label}`}
                >
                  {isSaving ? (
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                  ) : isEnabled ? (
                    <ToggleRight className={`w-10 h-10 ${setting.danger ? 'text-red-500' : 'text-green-500'}`} />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Announcement */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Platform Announcement</h2>
        <div className="bg-surface rounded-xl border border-border-color p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
              <Megaphone className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-text-primary font-medium mb-1">System Announcement</h3>
              <p className="text-text-secondary text-sm mb-4">This message will be shown as a banner to all users on the platform.</p>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={3}
                className="w-full bg-background border border-border-color text-text-primary rounded-lg px-4 py-3 text-sm outline-none focus:border-brand-500 resize-none placeholder:text-text-secondary/50"
                placeholder="Enter an announcement message (leave empty to hide the banner)..."
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-text-secondary text-xs">{announcement.length} characters</span>
                <button
                  onClick={() => updateSetting('system_announcement', announcement)}
                  disabled={saving === 'system_announcement'}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving === 'system_announcement' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved === 'system_announcement' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saved === 'system_announcement' ? 'Saved!' : 'Save Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Settings Raw View */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">All Settings</h2>
        <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-6 py-3 font-medium">Key</th>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {settings.map((s) => (
                <tr key={s.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-text-primary">{s.key}</td>
                  <td className="px-6 py-3 text-text-secondary text-xs max-w-xs truncate">{s.value}</td>
                  <td className="px-6 py-3 text-text-secondary text-xs">
                    {s.updatedAt ? new Date(s.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
