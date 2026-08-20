import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AppointmentSettings, AppointmentTypeOption } from '../../../types';
import { CalendarCheck, Plus, Trash2, Edit3, Save, CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';

export const AppointmentSettingsTab: React.FC = () => {
  const { activeClinic, activeClinicId, authFetch, refreshClinicData } = useAdminAuth();

  const [settings, setSettings] = useState<AppointmentSettings>({
    appointmentTypes: [],
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    timeWindows: [
      { start: "08:30", end: "12:30" },
      { start: "14:00", end: "17:30" }
    ],
    minNoticeHours: 2,
    cancellationPolicyText: "We request at least 24 hours advance notice for cancellations.",
    bookingUrl: "https://auradentalstudio.com/book",
    requireDeposit: false
  });

  const [editingType, setEditingType] = useState<AppointmentTypeOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeClinic?.appointmentSettings) {
      setSettings(activeClinic.appointmentSettings);
    }
  }, [activeClinic]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authFetch('/api/admin/clinic/config', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: { appointmentSettings: settings }
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Appointment settings and booking policies saved!' });
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.name) return;

    if (editingType.id) {
      setSettings(prev => ({
        ...prev,
        appointmentTypes: prev.appointmentTypes.map(t => t.id === editingType.id ? editingType : t)
      }));
    } else {
      const newType: AppointmentTypeOption = {
        ...editingType,
        id: `apt-type-${Date.now()}`
      };
      setSettings(prev => ({
        ...prev,
        appointmentTypes: [...prev.appointmentTypes, newType]
      }));
    }
    setEditingType(null);
  };

  const handleDeleteType = (id: string) => {
    setSettings(prev => ({
      ...prev,
      appointmentTypes: prev.appointmentTypes.filter(t => t.id !== id)
    }));
  };

  const daysList = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleDayToggle = (dayKey: string) => {
    const exists = settings.availableDays.includes(dayKey);
    const updated = exists
      ? settings.availableDays.filter(d => d !== dayKey)
      : [...settings.availableDays, dayKey];
    setSettings({ ...settings, availableDays: updated });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Appointment Rules & Booking Hub</h1>
          <p className="text-sm text-slate-400">
            Define appointment categories, notice constraints, and AI consultation routing.
          </p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Appointment Settings</span>
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

      {/* Appointment Types */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
              <CalendarCheck className="h-5 w-5 text-cyan-400" />
              <span>Configured Appointment Types</span>
            </h2>
            <p className="text-xs text-slate-400">Slots recommended by the AI during patient chat sessions</p>
          </div>

          <button
            type="button"
            onClick={() => setEditingType({
              id: '',
              name: '',
              durationMinutes: 45,
              consultationType: 'in_person',
              assignedDoctorIds: [],
              depositRequired: false,
              isActive: true
            })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Appointment Type</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.appointmentTypes?.map(type => (
            <div key={type.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{type.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {type.durationMinutes} mins
                  </span>
                  <span className="capitalize text-cyan-400">
                    {type.consultationType.replace('_', ' ')}
                  </span>
                </div>
                {type.depositRequired && (
                  <div className="text-[11px] text-amber-400 mt-1">
                    Deposit: ${type.depositAmount || 50} required
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingType(type)}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteType(type.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Days & Notice Constraints */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-white font-serif">Booking Windows & Notice Constraints</h2>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
            Available Booking Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {daysList.map(day => {
              const active = settings.availableDays.includes(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleDayToggle(day.key)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    active 
                      ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Minimum Advance Notice (Hours)
            </label>
            <input
              type="number"
              min={1}
              value={settings.minNoticeHours}
              onChange={e => setSettings({ ...settings, minNoticeHours: Number(e.target.value) || 2 })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Prevents last-minute bookings without front desk approval</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              External Booking / Patient Portal URL
            </label>
            <input
              type="text"
              value={settings.bookingUrl || ''}
              onChange={e => setSettings({ ...settings, bookingUrl: e.target.value })}
              placeholder="https://auradentalstudio.com/book"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Cancellation Policy Notice (AI Grounding)
          </label>
          <textarea
            rows={2}
            value={settings.cancellationPolicyText}
            onChange={e => setSettings({ ...settings, cancellationPolicyText: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Edit Type Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">
              {editingType.id ? 'Edit Appointment Type' : 'Add Appointment Type'}
            </h3>

            <form onSubmit={handleSaveType} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Appointment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free 3D Invisalign Scan"
                  value={editingType.name}
                  onChange={e => setEditingType({ ...editingType, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={editingType.durationMinutes}
                    onChange={e => setEditingType({ ...editingType, durationMinutes: Number(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Consultation Mode</label>
                  <select
                    value={editingType.consultationType}
                    onChange={e => setEditingType({ ...editingType, consultationType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="in_person">In-Person</option>
                    <option value="telehealth">Telehealth / Virtual</option>
                    <option value="both">Both Available</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
