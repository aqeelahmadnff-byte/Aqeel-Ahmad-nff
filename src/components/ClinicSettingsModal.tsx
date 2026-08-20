import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { ClinicConfig } from '../types';
import { initialClinicConfig } from '../data/defaultClinic';

interface ClinicSettingsModalProps {
  clinicConfig: ClinicConfig;
  onSaveConfig: (updated: ClinicConfig) => void;
}

export const ClinicSettingsModal: React.FC<ClinicSettingsModalProps> = ({
  clinicConfig,
  onSaveConfig
}) => {
  const [config, setConfig] = useState<ClinicConfig>(clinicConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const presets = [
    {
      label: "San Francisco - Aura Dental & Aesthetic Studio",
      data: {
        clinicName: "Aura Dental & Aesthetic Studio",
        address: "450 Sutter St, Suite 1420",
        cityStateZip: "San Francisco, CA 94108",
        phone: "+1 (415) 555-0198",
        emergencyPhone: "+1 (415) 555-9911",
        workingHours: {
          weekdays: "Monday – Friday: 8:00 AM – 6:00 PM",
          saturday: "Saturday: 9:00 AM – 2:00 PM",
          sunday: "Sunday: Closed (24/7 Emergency On-Call)"
        },
        emergencyPolicy: "24/7 Dental Emergency On-Call Triage. Same-day emergency slots prioritized during operating hours for trauma, swelling, and acute toothaches."
      }
    },
    {
      label: "New York - Pearl & Ivy Aesthetic Dentistry",
      data: {
        clinicName: "Pearl & Ivy Aesthetic Dentistry",
        address: "630 5th Ave, Suite 1800",
        cityStateZip: "New York, NY 10111",
        phone: "+1 (212) 555-0422",
        emergencyPhone: "+1 (212) 555-9119",
        workingHours: {
          weekdays: "Monday – Friday: 7:30 AM – 7:00 PM",
          saturday: "Saturday: 8:30 AM – 4:00 PM",
          sunday: "Sunday: 10:00 AM – 2:00 PM (Emergency Only)"
        },
        emergencyPolicy: "Direct 24/7 Manhattan on-call emergency line. Urgent restorative palliative care within 45 minutes of check-in."
      }
    },
    {
      label: "Seattle - Pacific Smile & Implant Center",
      data: {
        clinicName: "Pacific Smile & Implant Center",
        address: "1200 Westlake Ave N, Suite 500",
        cityStateZip: "Seattle, WA 98109",
        phone: "+1 (206) 555-7389",
        emergencyPhone: "+1 (206) 555-8800",
        workingHours: {
          weekdays: "Monday – Friday: 8:00 AM – 5:30 PM",
          saturday: "Saturday: 9:00 AM – 1:00 PM",
          sunday: "Sunday: Closed"
        },
        emergencyPolicy: "Guaranteed same-day pain relief slots. Direct line to Dr. Elena Vance and surgical on-call team."
      }
    }
  ];

  const handleApplyPreset = (presetData: any) => {
    setConfig(prev => ({
      ...prev,
      ...presetData
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    setConfig(initialClinicConfig);
    onSaveConfig(initialClinicConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
            <Building2 className="w-4 h-4" />
            Clinic Customization & System Grounding
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white">
            Clinic Details & Aura Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update clinic name, address, hours, emergency contact, and treatment pricing. Aura immediately grounds to these values.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Saved & Synced with Aura!</span>
          </div>
        )}
      </div>

      {/* Preset Profiles */}
      <div className="bg-[#0f172a] rounded-[24px] p-5 border border-slate-800 shadow-sm space-y-2.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Quick Preset Clinic Locations:
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.data)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-bold tracking-wide transition-all shadow-xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-[#0f172a] rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
        {/* Section 1: Clinic Identity & Location */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Clinic Identity & Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Clinic Name * [INSERT CLINIC NAME]
              </label>
              <input
                type="text"
                required
                value={config.clinicName}
                onChange={(e) => setConfig({ ...config, clinicName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Main Clinic Phone
              </label>
              <input
                type="text"
                required
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Street Address * [INSERT CITY/ADDRESS]
              </label>
              <input
                type="text"
                required
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                City, State, Zip
              </label>
              <input
                type="text"
                required
                value={config.cityStateZip}
                onChange={(e) => setConfig({ ...config, cityStateZip: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Working Hours */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            Working Hours
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Weekday Hours (Mon-Fri)
              </label>
              <input
                type="text"
                value={config.workingHours.weekdays}
                onChange={(e) => setConfig({
                  ...config,
                  workingHours: { ...config.workingHours, weekdays: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Saturday Hours
              </label>
              <input
                type="text"
                value={config.workingHours.saturday}
                onChange={(e) => setConfig({
                  ...config,
                  workingHours: { ...config.workingHours, saturday: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Sunday Hours
              </label>
              <input
                type="text"
                value={config.workingHours.sunday}
                onChange={(e) => setConfig({
                  ...config,
                  workingHours: { ...config.workingHours, sunday: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Policy & Hotline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-red-950/60">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Emergency Policy & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                24/7 Emergency Hotline *
              </label>
              <input
                type="text"
                value={config.emergencyPhone}
                onChange={(e) => setConfig({ ...config, emergencyPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-red-900/60 bg-red-950/20 focus:ring-1 focus:ring-red-500 focus:outline-none text-red-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Emergency Policy & Procedures
              </label>
              <textarea
                rows={2}
                value={config.emergencyPolicy}
                onChange={(e) => setConfig({ ...config, emergencyPolicy: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Treatment Pricing Quick Editor */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Services Offered & Starting Prices
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(config.services || []).slice(0, 4).map((serv, sIdx) => (
              <div key={serv.id} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 space-y-2">
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {serv.name}
                </span>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Starting Price:</label>
                  <input
                    type="text"
                    value={serv.startingPrice}
                    onChange={(e) => {
                      const updatedServices = [...(config.services || [])];
                      if (updatedServices[sIdx]) {
                        updatedServices[sIdx] = { ...updatedServices[sIdx], startingPrice: e.target.value };
                        setConfig({ ...config, services: updatedServices });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-800 font-bold text-emerald-400 bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            id="settings-save-btn"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Save & Sync with Aura</span>
          </button>
        </div>
      </form>
    </div>
  );
};
