import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ClinicConfig, AppointmentBooking } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicConfig: ClinicConfig;
  onSubmitBooking: (booking: Partial<AppointmentBooking>) => void;
  presetTreatment?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  clinicConfig,
  onSubmitBooking,
  presetTreatment = 'Teeth Whitening'
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferredTime: '10:30 AM',
    treatment: presetTreatment || 'Teeth Whitening',
    notes: '',
    urgency: 'standard'
  });

  const [submittedBooking, setSubmittedBooking] = useState<AppointmentBooking | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.contact.trim()) return;

    const newBooking: Partial<AppointmentBooking> = {
      fullName: formData.fullName.trim(),
      contact: formData.contact.trim(),
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      treatment: formData.treatment,
      notes: formData.notes.trim() ? `${formData.urgency === 'urgent' ? '[URGENT SAME-DAY REQUEST] ' : ''}${formData.notes}` : (formData.urgency === 'urgent' ? '[URGENT SAME-DAY REQUEST]' : ''),
      source: formData.urgency === 'urgent' ? 'emergency_triage' : 'booking_form'
    };

    onSubmitBooking(newBooking);

    setSubmittedBooking({
      id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: formData.fullName,
      contact: formData.contact,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      treatment: formData.treatment,
      notes: formData.notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      source: 'booking_form'
    });
  };

  const resetAndClose = () => {
    setSubmittedBooking(null);
    setFormData({
      fullName: '',
      contact: '',
      preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      preferredTime: '10:30 AM',
      treatment: 'Teeth Whitening',
      notes: '',
      urgency: 'standard'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-[32px] max-w-xl w-full shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-slate-950/90 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-serif italic">
                {submittedBooking ? "Consultation Reserved" : "Schedule Your Consultation"}
              </h3>
              <p className="text-xs text-slate-400">
                {clinicConfig.clinicName} • Concierge Coordinator
              </p>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedBooking ? (
          /* Confirmation Receipt View */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-serif italic font-bold text-white">
                You're Scheduled, {submittedBooking.fullName}!
              </h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Aura has confirmed your consultation request. A confirmation and reminder have been prepared for your contact: <strong className="text-white">{submittedBooking.contact}</strong>.
              </p>
            </div>

            {/* Appointment Ticket Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Confirmation Code
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {submittedBooking.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Treatment:</span>
                  <span className="font-bold text-slate-200">{submittedBooking.treatment}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Date & Time:</span>
                  <span className="font-bold text-slate-200">{submittedBooking.preferredDate} at {submittedBooking.preferredTime}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Clinic Address:</span>
                  <span className="font-medium text-slate-300">{clinicConfig.address}, {clinicConfig.cityStateZip}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={resetAndClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form View */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone Number or Email *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="(415) 555-0199 or email"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Desired Treatment *
                </label>
                <select
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 font-medium"
                >
                  {(clinicConfig?.services || []).map(s => (
                    <option key={s.id} value={s.name} className="bg-slate-900 text-slate-100">
                      {s.name} (from {s.startingPrice})
                    </option>
                  ))}
                  <option value="General Consultation & Exam" className="bg-slate-900 text-slate-100">General Consultation & Exam</option>
                  <option value="Second Opinion / Cosmetic Assessment" className="bg-slate-900 text-slate-100">Second Opinion / Cosmetic Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Preferred Time Slot *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  '08:30 AM',
                  '10:00 AM',
                  '11:30 AM',
                  '02:00 PM',
                  '04:30 PM'
                ].map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferredTime: time })}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      formData.preferredTime === time
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Notes or Symptoms (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Mention any dental sensitivities, insurance details, or specific cosmetic goals..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 text-xs uppercase font-bold tracking-wider text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Confirm Consultation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
