import React from 'react';
import { 
  AlertCircle, 
  Phone, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  MessageSquare,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ClinicConfig } from '../types';
import { emergencyGuides } from '../data/defaultClinic';

interface EmergencyTriageProps {
  clinicConfig: ClinicConfig;
  onBookEmergencySlot: () => void;
  onAskAuraEmergency: (symptom: string) => void;
}

export const EmergencyTriage: React.FC<EmergencyTriageProps> = ({
  clinicConfig,
  onBookEmergencySlot,
  onAskAuraEmergency
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Critical Emergency Hotline Hero */}
      <div className="bg-[#0f172a] text-white rounded-[32px] p-6 sm:p-8 border border-red-900/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-red-950/60 text-red-300 border border-red-900/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            </span>
            24/7 Priority Emergency Triage Protocol
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif italic tracking-wide text-white">
            Dental Emergency? We Are Here For You Right Now.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Severe toothache, knocked-out teeth, uncontrolled bleeding, or acute trauma? Call our on-call coordinator directly or book an immediate guaranteed same-day slot.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              id="emergency-call-btn"
              href={`tel:${clinicConfig.emergencyPhone}`}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 transition-all group active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Call 24/7 Hotline: {clinicConfig.emergencyPhone}</span>
            </a>

            <button
              id="emergency-book-slot-btn"
              onClick={onBookEmergencySlot}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-900/60 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4 text-red-400" />
              <span>Reserve Same-Day Emergency Slot</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Emergency Policy & Guarantee Notice */}
      <div className="bg-[#0f172a] rounded-[28px] p-6 border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-red-900/50 text-red-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-white text-base">
            Official Emergency Policy & Operating Hours
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {clinicConfig.emergencyPolicy}
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              Emergency Operating Hours: {clinicConfig.workingHours.weekdays}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              Weekends: {clinicConfig.workingHours.saturday}
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Triage First-Aid Guides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif italic text-white">Immediate First-Aid Guides</h2>
            <p className="text-xs text-slate-400">What to do in the critical first 30 minutes while getting to our clinic</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {emergencyGuides.map(guide => (
            <div
              key={guide.id}
              className="bg-[#0f172a] rounded-[28px] border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:border-slate-700 transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">
                    {guide.title}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      guide.urgency === 'critical'
                        ? 'bg-red-950/60 text-red-300 border border-red-900/60'
                        : guide.urgency === 'urgent'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                    }`}
                  >
                    {guide.urgency}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Immediate Steps:
                  </h4>
                  <ul className="space-y-1.5">
                    {guide.firstAid.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {guide.warningNote && (
                  <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-900/40 text-xs text-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{guide.warningNote}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => onAskAuraEmergency(`I have a ${guide.title}. What should I do right now?`)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-800 hover:border-emerald-500/30 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ask Aura</span>
                </button>

                <button
                  onClick={onBookEmergencySlot}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Urgent Slot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
