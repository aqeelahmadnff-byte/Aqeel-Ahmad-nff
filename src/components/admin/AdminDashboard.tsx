import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Stethoscope, 
  Clock, 
  CalendarCheck, 
  Bot, 
  BookOpen, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  TrendingUp, 
  Bell, 
  FileText, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  Sparkles, 
  ExternalLink,
  Shield,
  Radio,
  UserCog,
  KeyRound,
  Users2,
  History
} from 'lucide-react';

import { DashboardHomeTab } from './tabs/DashboardHomeTab';
import { ClinicProfileTab } from './tabs/ClinicProfileTab';
import { ServicesTab } from './tabs/ServicesTab';
import { BusinessHoursTab } from './tabs/BusinessHoursTab';
import { AppointmentSettingsTab } from './tabs/AppointmentSettingsTab';
import { AISettingsTab } from './tabs/AISettingsTab';
import { AIVersionHistoryTab } from './tabs/AIVersionHistoryTab';
import { KnowledgeBaseTab } from './tabs/KnowledgeBaseTab';
import { LeadsTab } from './tabs/LeadsTab';
import { ConversationInboxTab } from './tabs/ConversationInboxTab';
import { AISafetyTab } from './tabs/AISafetyTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { AuditLogTab } from './tabs/AuditLogTab';
import { ClinicsManagerTab } from './tabs/ClinicsManagerTab';
import { AdminAccountTab } from './tabs/AdminAccountTab';
import { SecurityTab } from './tabs/SecurityTab';
import { TeamPermissionsTab } from './tabs/TeamPermissionsTab';

interface AdminDashboardProps {
  onBackToPatientSite: () => void;
  onOpenLiveChatModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToPatientSite, onOpenLiveChatModal }) => {
  const { 
    user, 
    logout, 
    activeClinic, 
    activeClinicId, 
    allClinics, 
    switchClinic, 
    hasPermission 
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClinicDropdownOpen, setIsClinicDropdownOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isClinicAdmin = user?.role === 'clinic_admin';

  // Navigation Items organized cleanly with permission gates
  const navigationSections = [
    {
      title: 'Practice Overview',
      items: [
        { id: 'home', label: 'Dashboard Overview', icon: LayoutDashboard, show: true },
        { id: 'inbox', label: 'Live AI Inbox', icon: MessageSquare, show: hasPermission('canTakeoverChat') || isClinicAdmin || isSuperAdmin },
        { id: 'leads', label: 'Patient Leads', icon: Users, show: hasPermission('canViewLeads') || isClinicAdmin || isSuperAdmin },
        { id: 'appointments', label: 'Appointments Hub', icon: CalendarCheck, show: hasPermission('canViewAppointments') || isClinicAdmin || isSuperAdmin },
        { id: 'analytics', label: 'Practice Analytics', icon: TrendingUp, show: hasPermission('canViewAnalytics') || isClinicAdmin || isSuperAdmin }
      ]
    },
    {
      title: 'AI & Clinical Intelligence',
      items: [
        { id: 'ai-settings', label: 'AI Prompt & Drafts', icon: Bot, show: hasPermission('canEditAIConfig') || isClinicAdmin || isSuperAdmin },
        { id: 'ai-versions', label: 'AI Version History', icon: History, show: hasPermission('canEditAIConfig') || isClinicAdmin || isSuperAdmin },
        { id: 'knowledge-base', label: 'Knowledge & FAQs', icon: BookOpen, show: hasPermission('canEditKnowledgeBase') || isClinicAdmin || isSuperAdmin },
        { id: 'services', label: 'Services & Pricing', icon: Stethoscope, show: hasPermission('canEditServices') || isClinicAdmin || isSuperAdmin },
        { id: 'safety', label: 'Safety & Guardrails', icon: ShieldCheck, show: true }
      ]
    },
    {
      title: 'Clinic Administration',
      items: [
        { id: 'profile', label: 'Clinic Profile', icon: Building2, show: hasPermission('canEditClinicSettings') || isClinicAdmin || isSuperAdmin },
        { id: 'hours', label: 'Hours & Break Times', icon: Clock, show: hasPermission('canEditClinicSettings') || isClinicAdmin || isSuperAdmin },
        { id: 'team', label: 'Team & Permissions', icon: Users2, show: hasPermission('canManageTeam') || isClinicAdmin || isSuperAdmin },
        { id: 'account', label: 'My Admin Account', icon: UserCog, show: true },
        { id: 'security', label: 'Security & Sessions', icon: KeyRound, show: true },
        { id: 'audit-logs', label: 'Security Audit Trail', icon: FileText, show: hasPermission('canViewAuditLogs') || isClinicAdmin || isSuperAdmin },
        { id: 'clinics', label: 'Multi-Clinic Network', icon: Shield, show: isSuperAdmin }
      ]
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHomeTab onNavigateTab={(tab) => setActiveTab(tab)} onOpenLiveTest={onOpenLiveChatModal} />;
      case 'account':
        return <AdminAccountTab />;
      case 'security':
        return <SecurityTab />;
      case 'team':
        return <TeamPermissionsTab />;
      case 'ai-settings':
        return <AISettingsTab />;
      case 'ai-versions':
        return <AIVersionHistoryTab />;
      case 'profile':
        return <ClinicProfileTab />;
      case 'services':
        return <ServicesTab />;
      case 'hours':
        return <BusinessHoursTab />;
      case 'appointments':
        return <AppointmentSettingsTab />;
      case 'knowledge-base':
        return <KnowledgeBaseTab />;
      case 'leads':
        return <LeadsTab />;
      case 'inbox':
        return <ConversationInboxTab />;
      case 'safety':
        return <AISafetyTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'audit-logs':
        return <AuditLogTab />;
      case 'clinics':
        return <ClinicsManagerTab />;
      default:
        return <DashboardHomeTab onNavigateTab={(tab) => setActiveTab(tab)} onOpenLiveTest={onOpenLiveChatModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div>
            <div className="text-sm font-bold text-white font-serif">{activeClinic?.clinicName || 'Aura Clinical'}</div>
            <div className="text-[10px] text-cyan-400">Admin Console</div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Clinic Brand & Switcher */}
          <div className="p-4 border-b border-slate-800 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20 shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight truncate font-serif">
                  Aura Practice Suite
                </h1>
                <p className="text-[10px] text-slate-400">Clinical AI & Admin Hub</p>
              </div>
            </div>

            {/* Clinic Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => isSuperAdmin && setIsClinicDropdownOpen(!isClinicDropdownOpen)}
                disabled={!isSuperAdmin}
                className="w-full p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer disabled:cursor-default"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isSuperAdmin ? 'Active Scope (Super Admin)' : 'Assigned Clinic'}
                  </div>
                  <div className="text-xs font-bold text-cyan-300 truncate">
                    {activeClinic?.clinicName || 'Select Clinic'}
                  </div>
                </div>
                {isSuperAdmin && <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {isSuperAdmin && isClinicDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50">
                  <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Switch Clinic Scope
                  </div>
                  {allClinics.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        switchClinic(c.id);
                        setIsClinicDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeClinicId === c.id
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{c.clinicName}</span>
                      {activeClinicId === c.id && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {navigationSections.map((sec, secIdx) => {
              const visibleItems = sec.items.filter(i => i.show);
              if (visibleItems.length === 0) return null;

              return (
                <div key={secIdx} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {sec.title}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-600/20 to-emerald-600/10 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* User Profile & Actions Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Admin User'}</div>
                <div className="text-[10px] text-cyan-400 truncate capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => setActiveTab('account')}
                className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Account Settings"
              >
                <UserCog className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onBackToPatientSite}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Patient Site</span>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-[11px] font-medium text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderActiveTab()}
      </main>
    </div>
  );
};
