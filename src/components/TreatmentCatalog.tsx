import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MessageSquare,
  ShieldCheck,
  Zap,
  DollarSign
} from 'lucide-react';
import { ClinicConfig, ClinicService } from '../types';

interface TreatmentCatalogProps {
  clinicConfig: ClinicConfig;
  onSelectTreatmentForChat: (treatmentName: string) => void;
  onSelectTreatmentForBooking: (treatmentName: string) => void;
}

export const TreatmentCatalog: React.FC<TreatmentCatalogProps> = ({
  clinicConfig,
  onSelectTreatmentForChat,
  onSelectTreatmentForBooking
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Treatments' },
    { id: 'cosmetic', label: 'Cosmetic (Whitening)' },
    { id: 'orthodontics', label: 'Orthodontics (Invisalign®)' },
    { id: 'restorative', label: 'Restorative (Implants)' },
    { id: 'emergency', label: 'Emergency Care' }
  ];

  const servicesList = clinicConfig?.services || [];
  const filteredServices = selectedCategory === 'all'
    ? servicesList
    : servicesList.filter(s => s.category === selectedCategory);

  const toggleFaq = (key: string) => {
    setExpandedFaq(prev => (prev === key ? null : key));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-slate-900 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            Official Clinical Catalog & Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif italic tracking-wide text-white">
            World-Class Care Tailored to Your Smile
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Transparent pricing, advanced technology, and personalized treatments at {clinicConfig?.clinicName || 'our clinic'}. Have questions? Aura is always ready to guide you.
          </p>
        </div>

        {/* Decorative subtle background glow */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className="bg-[#0f172a] rounded-[28px] border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Service Header */}
            <div className="p-6 border-b border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-emerald-400 border border-emerald-500/30 mb-2">
                    {service.category}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {service.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-medium">Starting from</div>
                  <div className="text-2xl font-serif italic font-bold text-emerald-400 tracking-tight">
                    {service.startingPrice}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                {service.summary}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {service.duration}
                </span>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="p-6 space-y-4 bg-[#020617]/50 flex-1">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                  Clinical Highlights & Inclusions
                </h4>
                <ul className="space-y-2">
                  {(service.keyBenefits || []).map((benefit, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Candidate profile */}
              {service.candidateFor && (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-white">Ideal For: </span>
                  {service.candidateFor}
                </div>
              )}

              {/* Expandable FAQs */}
              {service.faqs && service.faqs.length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Frequently Asked Questions
                  </div>
                  <div className="space-y-2">
                    {service.faqs.map((faq, fIdx) => {
                      const faqKey = `${service.id}-${fIdx}`;
                      const isExpanded = expandedFaq === faqKey;
                      return (
                        <div
                          key={fIdx}
                          className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80 text-xs"
                        >
                          <button
                            onClick={() => toggleFaq(faqKey)}
                            className="w-full px-4 py-3 text-left font-semibold text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors"
                          >
                            <span>{faq.q}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-3 text-slate-400 leading-relaxed border-t border-slate-800 bg-slate-950/60 pt-2.5">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Card Action Footers */}
            <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectTreatmentForChat(service.name)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ask Aura</span>
              </button>

              <button
                onClick={() => onSelectTreatmentForBooking(service.name)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-950" />
                <span>Book Slot</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Insurance & Financing Section */}
      <div className="bg-[#0f172a] rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">In-Network Insurance & Flexible Payment Options</h3>
            <p className="text-xs text-slate-400">We maximize your insurance benefits and offer 0% APR monthly installments</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {(clinicConfig?.insuranceAccepted || ['Delta Dental Premier', 'Cigna Total DPPO', 'MetLife Preferred', 'Guardian DentalGuard']).map((ins, idx) => (
            <div
              key={idx}
              className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="line-clamp-1">{ins}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
