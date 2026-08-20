import React from 'react';
import { Sparkles, Phone, AlertCircle, Clock, Calendar, MessageSquare, ShieldCheck, Settings, Shield } from 'lucide-react';
import { ClinicConfig } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'treatments' | 'emergency' | 'book' | 'appointments' | 'settings';
  setActiveTab: (tab: 'chat' | 'treatments' | 'emergency' | 'book' | 'appointments' | 'settings') => void;
  clinicConfig: ClinicConfig;
  unreadBookingsCount: number;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clinicConfig,
  unreadBookingsCount,
  onOpenAdmin
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
      {/* Emergency & Status Top Bar */}
      <div className="bg-[#020617] text-slate-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px] text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            Aura AI Coordinator Active
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {clinicConfig.workingHours?.weekdays || 'Mon – Fri: 8:00 AM – 6:00 PM'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {onOpenAdmin && (
            <button
              id="top-admin-portal-link"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}
          <a
            href={`tel:${clinicConfig.emergencyPhone}`}
            className="flex items-center gap-1.5 font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>24/7 Hotline: {clinicConfig.emergencyPhone}</span>
          </a>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Clinic Brand & Identity */}
          <div 
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-xl text-white tracking-wide leading-tight group-hover:text-emerald-300 transition-colors">
                  {clinicConfig.clinicName}
                </span>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900 border border-emerald-500/30 text-emerald-400">
                  Concierge: {clinicConfig.aiAssistantName || 'Aura'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {clinicConfig.address}, {clinicConfig.cityStateZip}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Chat with {clinicConfig.aiAssistantName || 'Aura'}</span>
            </button>

            <button
              id="nav-tab-treatments"
              onClick={() => setActiveTab('treatments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'treatments'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Treatments & FAQs</span>
            </button>

            <button
              id="nav-tab-emergency"
              onClick={() => setActiveTab('emergency')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'emergency'
                  ? 'bg-red-950/40 text-red-300 border border-red-900/50 shadow-md'
                  : 'text-red-400/80 hover:text-red-300 hover:bg-red-950/30'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Emergency Triage</span>
            </button>

            <button
              id="nav-tab-appointments"
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Bookings Hub</span>
              {unreadBookingsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                  {unreadBookingsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              id="header-btn-book"
              onClick={() => setActiveTab('book')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Book Consultation</span>
              <span className="sm:hidden">Book</span>
            </button>

            {onOpenAdmin && (
              <button
                id="header-btn-admin-portal"
                onClick={onOpenAdmin}
                title="Open Practice Admin Dashboard"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Scroll Navigation */}
      <div className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 border-t border-slate-800 overflow-x-auto scrollbar-none bg-[#020617]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold cursor-pointer ${
            activeTab === 'chat' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Aura Chat
        </button>

        <button
          onClick={() => setActiveTab('treatments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold cursor-pointer ${
            activeTab === 'treatments' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Treatments & FAQs
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold cursor-pointer ${
            activeTab === 'emergency' ? 'bg-red-950/60 text-red-300 border border-red-900/60' : 'bg-slate-900 text-red-400/80 border border-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Emergency
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold cursor-pointer ${
            activeTab === 'appointments' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Bookings ({unreadBookingsCount})
        </button>

        {onOpenAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold bg-cyan-950 border border-cyan-800 text-cyan-400 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Portal
          </button>
        )}
      </div>
    </header>
  );
};
