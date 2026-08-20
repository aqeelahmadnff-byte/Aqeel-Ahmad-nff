import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { NotificationSettings } from '../../../types';
import { Bell, Mail, Plus, Trash2, Save, CheckCircle2, AlertCircle, Volume2, ShieldAlert } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const { activeClinic, activeClinicId, authFetch, refreshClinicData } = useAdminAuth();

  const [settings, setSettings] = useState<NotificationSettings>({
    emailRecipients: ['frontdesk@auradental.com', 'admin@auradental.com'],
    notifyOnNewLead: true,
    notifyOnAppointmentRequest: true,
    notifyOnHandoff: true,
    notifyOnEmergency: true,
    enableSoundAlerts: true
  });

  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeClinic?.notificationSettings) {
      setSettings(activeClinic.notificationSettings);
    }
  }, [activeClinic]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authFetch('/api/admin/clinic/config', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: { notificationSettings: settings }
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Notification routing preferences saved!' });
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save notifications' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    if (settings.emailRecipients.includes(newEmail)) return;
    setSettings({
      ...settings,
      emailRecipients: [...settings.emailRecipients, newEmail]
    });
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setSettings({
      ...settings,
      emailRecipients: settings.emailRecipients.filter(e => e !== emailToRemove)
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Notifications & Staff Alerts</h1>
          <p className="text-sm text-slate-400">
            Configure instant email alerts when patient leads, bookings, handoffs, or emergencies occur.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Notification Settings</span>
            </>
          )}
        </button>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          toastMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-rose-950/80 border border-rose-800 text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Email Recipients */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
          <Mail className="h-5 w-5 text-cyan-400" />
          <span>Staff Email Notification List</span>
        </h2>
        <p className="text-xs text-slate-400">
          These email addresses will receive instant dispatches whenever an inquiry requires front-desk attention.
        </p>

        <div className="flex gap-2 max-w-lg">
          <input
            type="email"
            placeholder="staff.member@clinic.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500"
            onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
          />
          <button
            type="button"
            onClick={handleAddEmail}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            Add Email
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {settings.emailRecipients.map(em => (
            <div key={em} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 max-w-lg">
              <span className="text-xs text-slate-200 font-medium">{em}</span>
              <button
                type="button"
                onClick={() => handleRemoveEmail(em)}
                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Triggers */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
          <Bell className="h-5 w-5 text-emerald-400" />
          <span>Automated Alert Triggers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={settings.notifyOnNewLead}
              onChange={e => setSettings({ ...settings, notifyOnNewLead: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">New Lead Captured</div>
              <div className="text-[11px] text-slate-400">Triggers when patient provides contact info</div>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={settings.notifyOnAppointmentRequest}
              onChange={e => setSettings({ ...settings, notifyOnAppointmentRequest: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Appointment Request Submitted</div>
              <div className="text-[11px] text-slate-400">Triggers on slot reservation requests</div>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={settings.notifyOnHandoff}
              onChange={e => setSettings({ ...settings, notifyOnHandoff: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Human Staff Escalation</div>
              <div className="text-[11px] text-slate-400">When patient asks to speak with a person</div>
            </div>
          </label>

          <label className="flex items-center gap-3.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={settings.notifyOnEmergency}
              onChange={e => setSettings({ ...settings, notifyOnEmergency: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <div>
              <div className="text-xs font-semibold text-rose-300">Urgent Emergency Triggered</div>
              <div className="text-[11px] text-slate-400">Immediate high-priority alert for acute trauma</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
