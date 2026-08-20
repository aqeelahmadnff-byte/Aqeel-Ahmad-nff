import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { BusinessHoursConfig, BusinessDayHours, HolidayClosure, TemporaryClosure } from '../../../types';
import { isClinicOpenNow } from '../../../utils/coordinatorEngine';
import { 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Coffee, 
  CalendarOff, 
  MoonStar, 
  Radio
} from 'lucide-react';

export const BusinessHoursTab: React.FC = () => {
  const { activeClinic, activeClinicId, authFetch, refreshClinicData } = useAdminAuth();

  const [hoursConfig, setHoursConfig] = useState<BusinessHoursConfig>({
    schedule: [
      { day: 'monday', dayLabel: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', dayLabel: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', dayLabel: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'thursday', dayLabel: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', dayLabel: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', dayLabel: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00', hasBreak: false },
      { day: 'sunday', dayLabel: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '13:00', hasBreak: false }
    ],
    holidayClosures: [],
    temporaryClosures: [],
    afterHoursMessage: "Our front desk is currently closed. However, our AI Coordinator is active 24/7 to record consultation bookings and triage emergencies."
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Holiday modal state
  const [newHoliday, setNewHoliday] = useState<{ name: string; startDate: string; endDate: string; note: string }>({
    name: '',
    startDate: '',
    endDate: '',
    note: ''
  });
  const [showAddHoliday, setShowAddHoliday] = useState(false);

  useEffect(() => {
    if (activeClinic?.businessHours) {
      setHoursConfig(activeClinic.businessHours);
    }
  }, [activeClinic]);

  const handleDayChange = (index: number, field: keyof BusinessDayHours, value: any) => {
    const updated = [...hoursConfig.schedule];
    updated[index] = { ...updated[index], [field]: value };
    setHoursConfig({ ...hoursConfig, schedule: updated });
  };

  const handleSaveHours = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authFetch('/api/admin/clinic/config', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: {
            businessHours: hoursConfig,
            workingHours: {
              weekdays: `Monday – Friday: ${hoursConfig.schedule[0]?.openTime || '8:00 AM'} – ${hoursConfig.schedule[0]?.closeTime || '6:00 PM'}`,
              saturday: hoursConfig.schedule[5]?.isOpen ? `Saturday: ${hoursConfig.schedule[5]?.openTime} – ${hoursConfig.schedule[5]?.closeTime}` : 'Saturday: Closed',
              sunday: hoursConfig.schedule[6]?.isOpen ? `Sunday: ${hoursConfig.schedule[6]?.openTime} – ${hoursConfig.schedule[6]?.closeTime}` : 'Sunday: Closed (24/7 On-Call Emergency Triage)'
            }
          }
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Operating hours and after-hours rules saved successfully!' });
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save hours' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.startDate) return;
    const hol: HolidayClosure = {
      id: `hol-${Date.now()}`,
      name: newHoliday.name,
      startDate: newHoliday.startDate,
      endDate: newHoliday.endDate || newHoliday.startDate,
      note: newHoliday.note
    };
    setHoursConfig(prev => ({
      ...prev,
      holidayClosures: [...prev.holidayClosures, hol]
    }));
    setNewHoliday({ name: '', startDate: '', endDate: '', note: '' });
    setShowAddHoliday(false);
  };

  const handleDeleteHoliday = (id: string) => {
    setHoursConfig(prev => ({
      ...prev,
      holidayClosures: prev.holidayClosures.filter(h => h.id !== id)
    }));
  };

  // Real-time live status evaluation test
  const liveStatus = activeClinic ? isClinicOpenNow(activeClinic) : { isOpen: true, reason: 'Open' };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Operating Hours & Schedule</h1>
          <p className="text-sm text-slate-400">
            Set weekly schedule, lunch break periods, holiday closures, and after-hours AI behaviors.
          </p>
        </div>

        <button
          onClick={() => handleSaveHours()}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Live AI Status Pill */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className={`h-3.5 w-3.5 rounded-full ${liveStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live AI Operating Status</div>
            <div className="text-sm font-bold text-white">
              {liveStatus.isOpen ? '🟢 Currently Evaluated as OPEN' : '🔴 Currently Evaluated as CLOSED / AFTER-HOURS'}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400 max-w-xs text-right hidden sm:block">
          Reason: {liveStatus.reason}
        </div>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          toastMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-rose-950/80 border border-rose-800 text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Monday - Sunday Schedule */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
          <Clock className="h-5 w-5 text-cyan-400" />
          <span>Weekly Clinic Hours</span>
        </h2>

        <div className="divide-y divide-slate-800">
          {hoursConfig.schedule.map((item, idx) => (
            <div key={item.day} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-36">
                <input
                  type="checkbox"
                  checked={item.isOpen}
                  onChange={e => handleDayChange(idx, 'isOpen', e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${item.isOpen ? 'text-white' : 'text-slate-500'}`}>
                  {item.dayLabel}
                </span>
              </div>

              {item.isOpen ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Open:</span>
                    <input
                      type="time"
                      value={item.openTime}
                      onChange={e => handleDayChange(idx, 'openTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Close:</span>
                    <input
                      type="time"
                      value={item.closeTime}
                      onChange={e => handleDayChange(idx, 'closeTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Lunch break */}
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                    <Coffee className="h-3.5 w-3.5 text-amber-400" />
                    <label className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.hasBreak}
                        onChange={e => handleDayChange(idx, 'hasBreak', e.target.checked)}
                        className="h-3.5 w-3.5 rounded bg-slate-950 border-slate-700 text-cyan-600"
                      />
                      <span>Lunch Break</span>
                    </label>

                    {item.hasBreak && (
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={item.breakStart || '13:00'}
                          onChange={e => handleDayChange(idx, 'breakStart', e.target.value)}
                          className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
                        />
                        <span className="text-slate-500 text-xs">–</span>
                        <input
                          type="time"
                          value={item.breakEnd || '14:00'}
                          onChange={e => handleDayChange(idx, 'breakEnd', e.target.value)}
                          className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Closed all day (Emergency On-Call Triage Active)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* After-Hours AI Coordinator Message */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
          <MoonStar className="h-5 w-5 text-indigo-400" />
          <span>After-Hours AI Behavior & Prompt Notice</span>
        </h2>
        <p className="text-xs text-slate-400">
          When visitors chat outside operating hours, the AI informs them the physical front desk is closed while still booking consultation slots.
        </p>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Custom After-Hours Message
          </label>
          <textarea
            rows={3}
            value={hoursConfig.afterHoursMessage}
            onChange={e => setHoursConfig({ ...hoursConfig, afterHoursMessage: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Holiday Closures */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
            <CalendarOff className="h-5 w-5 text-rose-400" />
            <span>Holiday & Special Closures</span>
          </h2>

          <button
            type="button"
            onClick={() => setShowAddHoliday(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Closure</span>
          </button>
        </div>

        {showAddHoliday && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-300">New Scheduled Closure</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Holiday / Reason Name</label>
                <input
                  type="text"
                  placeholder="e.g. Labor Day"
                  value={newHoliday.name}
                  onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newHoliday.startDate}
                  onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={newHoliday.endDate}
                  onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddHoliday(false)}
                className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddHoliday}
                className="px-3 py-1 bg-cyan-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add Closure
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-800">
          {hoursConfig.holidayClosures.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              No holiday closures scheduled.
            </div>
          ) : (
            hoursConfig.holidayClosures.map(hol => (
              <div key={hol.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{hol.name}</div>
                  <div className="text-xs text-slate-400">
                    {hol.startDate} {hol.endDate && hol.endDate !== hol.startDate ? `to ${hol.endDate}` : ''}
                    {hol.note ? ` • ${hol.note}` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteHoliday(hol.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
