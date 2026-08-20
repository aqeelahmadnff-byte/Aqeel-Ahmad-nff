import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  MessageSquare, 
  AlertCircle,
  AlertTriangle,
  Trash2,
  Download,
  Bell,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { AppointmentBooking, ClinicConfig } from '../types';

interface AppointmentsHubProps {
  appointments: AppointmentBooking[];
  onUpdateStatus: (id: string, status: 'confirmed' | 'pending' | 'rescheduled' | 'cancelled') => void;
  onDeleteBooking: (id: string) => void;
  onOpenNewBooking: () => void;
  clinicConfig: ClinicConfig;
}

// Helper to determine if an appointment is within 24 hours
export function checkIsWithin24Hours(preferredDate: string, preferredTime?: string): {
  isWithin24h: boolean;
  hoursDiff: number | null;
  urgencyLabel: string;
} {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check direct relative strings or date matches
    const lowerDate = preferredDate.toLowerCase().trim();
    if (lowerDate === 'today' || lowerDate.startsWith(todayStr)) {
      return { isWithin24h: true, hoursDiff: 6, urgencyLabel: 'Today (Imminent)' };
    }
    if (lowerDate === 'tomorrow' || lowerDate.startsWith(tomorrowStr)) {
      return { isWithin24h: true, hoursDiff: 18, urgencyLabel: 'Tomorrow (<24h)' };
    }

    // Try parsing date and time
    let datePart = preferredDate;
    let timeHours = 10;
    let timeMinutes = 0;

    if (preferredTime) {
      const match = preferredTime.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3] ? match[3].toUpperCase() : '';
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        timeHours = h;
        timeMinutes = m;
      }
    }

    const aptDate = new Date(datePart);
    if (!isNaN(aptDate.getTime())) {
      aptDate.setHours(timeHours, timeMinutes, 0, 0);
      const diffMs = aptDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Within -2h (just started) to +24h
      if (diffHours >= -2 && diffHours <= 24) {
        const roundedHours = Math.max(1, Math.round(diffHours));
        const label = diffHours < 0 ? 'In Progress' : `In ~${roundedHours}h`;
        return { isWithin24h: true, hoursDiff: roundedHours, urgencyLabel: label };
      }
    }
  } catch {
    // ignore parse error
  }

  return { isWithin24h: false, hoursDiff: null, urgencyLabel: '' };
}

export const AppointmentsHub: React.FC<AppointmentsHubProps> = ({
  appointments = [],
  onUpdateStatus,
  onDeleteBooking,
  onOpenNewBooking,
  clinicConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'within24h' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [remindedApts, setRemindedApts] = useState<Record<string, boolean>>({});

  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  // Compute 24h appointments
  const within24hList = safeAppointments.filter(apt => {
    if (apt.status === 'cancelled') return false;
    const { isWithin24h } = checkIsWithin24Hours(apt.preferredDate, apt.preferredTime);
    return isWithin24h;
  });

  const filteredAppointments = safeAppointments.filter(apt => {
    const matchesSearch = 
      (apt.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.treatment || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'within24h') {
      const { isWithin24h } = checkIsWithin24Hours(apt.preferredDate, apt.preferredTime);
      return isWithin24h && apt.status !== 'cancelled';
    }

    if (statusFilter !== 'all') {
      return apt.status === statusFilter;
    }

    return true;
  });

  const handleSendReminder = (id: string, name: string) => {
    setRemindedApts(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      // transient state feedback
    }, 3000);
  };

  const exportCSV = () => {
    const headers = "ID,Full Name,Contact,Treatment,Preferred Date,Preferred Time,Status,Source,Within24Hours,Notes\n";
    const rows = safeAppointments.map(a => {
      const { isWithin24h } = checkIsWithin24Hours(a.preferredDate, a.preferredTime);
      return `"${a.id}","${a.fullName}","${a.contact}","${a.treatment}","${a.preferredDate}","${a.preferredTime}","${a.status}","${a.source}","${isWithin24h ? 'YES' : 'NO'}","${(a.notes || '').replace(/"/g, '""')}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
            <Calendar className="w-4 h-4" />
            Patient Lead & Schedule Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white">
            Consultations & Bookings Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time consultation requests collected by Aura, triage dispatch & online bookings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Staff Alert Banner for Imminent Appointments (<24 Hours) */}
      {within24hList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 rounded-[28px] p-5 border border-amber-500/50 shadow-[0_10px_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Clinic Staff Alert • 24-Hour Notice
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {within24hList.length} Upcoming
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {within24hList.length === 1
                  ? "1 patient has an appointment scheduled within the next 24 hours. Pre-op prep, room sterilization, and patient confirmation queued."
                  : `${within24hList.length} patients have appointments scheduled within the next 24 hours. Pre-op triage & operatory readiness recommended.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'within24h' ? 'all' : 'within24h')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'within24h'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 border border-amber-500/50 text-amber-300 hover:bg-amber-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{statusFilter === 'within24h' ? 'Show All Bookings' : 'Filter 24h List'}</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] p-4 rounded-[24px] border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search patient name, phone, email, or treatment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-900 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All
          </button>

          {/* 24h Filter Pill */}
          <button
            onClick={() => setStatusFilter('within24h')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'within24h'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 text-amber-400/90 hover:text-amber-300 border border-amber-500/30'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            Within 24h ({within24hList.length})
          </button>

          {(['confirmed', 'pending', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-[#0f172a] rounded-[32px] p-12 text-center border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Consultations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? "No bookings match your current search or filter criteria." : "No bookings found for the selected view. Visitors chatting with Aura will appear here in real-time."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map(apt => {
            const { isWithin24h, urgencyLabel } = checkIsWithin24Hours(apt.preferredDate, apt.preferredTime);
            const isImminent = isWithin24h && apt.status !== 'cancelled';
            const hasReminded = remindedApts[apt.id];

            return (
              <div
                key={apt.id}
                className={`rounded-[28px] p-5 border transition-all space-y-4 flex flex-col justify-between relative overflow-hidden ${
                  isImminent
                    ? 'bg-gradient-to-b from-slate-900 via-[#0f172a] to-amber-950/20 border-amber-500/50 shadow-[0_10px_35px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/30'
                    : 'bg-[#0f172a] border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:border-slate-700'
                }`}
              >
                {/* 24-Hour Urgent Alert Header Pill for Clinic Staff */}
                {isImminent && (
                  <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                      </span>
                      <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Within 24 Hours • Priority Prep
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 text-amber-200">
                      {urgencyLabel}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Status & Source Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                            : apt.status === 'pending'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                            : 'bg-red-950/60 text-red-300 border border-red-900/60'
                        }`}
                      >
                        {apt.status}
                      </span>

                      <span className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                        via {apt.source}
                      </span>
                    </div>

                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      {apt.id}
                    </span>
                  </div>

                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {apt.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{apt.contact}</span>
                    </div>
                  </div>

                  {/* Treatment & Time */}
                  <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${
                    isImminent ? 'bg-slate-950/90 border-amber-500/30' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Treatment:</span>
                      <span className="font-bold text-slate-200">{apt.treatment}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Preferred Slot:</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        isImminent ? 'text-amber-300 font-bold' : 'text-emerald-400'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {apt.preferredDate} at {apt.preferredTime}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {apt.notes && (
                    <p className="text-xs text-amber-300/90 italic bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/40">
                      "{apt.notes}"
                    </p>
                  )}
                </div>

                {/* Status Actions & Staff Tools */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {apt.status !== 'confirmed' && (
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirm</span>
                      </button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {/* Quick Staff Action: Send 24h SMS/WhatsApp reminder */}
                    {isImminent && (
                      <button
                        onClick={() => handleSendReminder(apt.id, apt.fullName)}
                        title="Send Instant 24h SMS/Email reminder to patient"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          hasReminded
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-500/40'
                        }`}
                      >
                        {hasReminded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Reminder Sent</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-amber-400" />
                            <span>Send 24h Reminder</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteBooking(apt.id)}
                    title="Remove record"
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
