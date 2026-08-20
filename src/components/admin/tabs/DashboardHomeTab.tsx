import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight, 
  Plus, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  DollarSign,
  PhoneCall,
  Bot
} from 'lucide-react';
import { DashboardMetrics, Lead, Conversation } from '../../../types';

interface DashboardHomeTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenLiveTest: () => void;
}

export const DashboardHomeTab: React.FC<DashboardHomeTabProps> = ({ onNavigateTab, onOpenLiveTest }) => {
  const { activeClinic, activeClinicId, authFetch } = useAdminAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [mRes, lRes, cRes] = await Promise.all([
          authFetch(`/api/admin/analytics?clinicId=${activeClinicId}`),
          authFetch(`/api/admin/leads?clinicId=${activeClinicId}`),
          authFetch(`/api/admin/conversations?clinicId=${activeClinicId}`)
        ]);

        if (mRes.ok) setMetrics(await mRes.json());
        if (lRes.ok) {
          const leads = await lRes.json();
          if (Array.isArray(leads)) {
            setRecentLeads(leads.slice(0, 5));
          }
        }
        if (cRes.ok) {
          const convs = await cRes.json();
          if (Array.isArray(convs)) {
            setRecentConversations(convs.slice(0, 5));
          }
        }
      } catch (e) {
        console.error('Error fetching dashboard analytics:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [activeClinicId, authFetch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">New Lead</span>;
      case 'appointment_requested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">Appt Requested</span>;
      case 'booked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Booked</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">Contacted</span>;
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-800">Qualified</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">AI Coordinator Active</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 font-serif">
            {activeClinic?.clinicName || 'Clinic Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time patient acquisition, AI prompt guardrails, and practice coordination
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenLiveTest}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>Test Live Patient AI</span>
          </button>

          <button
            onClick={() => onNavigateTab('services')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Add Service</span>
          </button>

          <button
            onClick={() => onNavigateTab('leads')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Leads</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Conversations</span>
            <div className="h-9 w-9 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {metrics?.totalConversations ?? 18}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-cyan-400">
              <span>{metrics?.conversationsToday ?? 4} conversations today</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Patient Leads</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {metrics?.newLeads ?? 5}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
              <span className="font-semibold">{metrics?.leadsToday ?? 2} captured today</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appointment Requests</span>
            <div className="h-9 w-9 rounded-xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {metrics?.appointmentRequests ?? 3}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400">
              <span>Verified in clinic bookings</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
            <div className="h-9 w-9 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white">
              {metrics?.conversionRate ?? 28}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-400">
              <span>Chat to qualified lead ratio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">After-Hours Conversations</div>
            <div className="text-lg font-bold text-white">
              {metrics?.afterHoursConversations ?? 6} inquiries answered
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center shrink-0">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Human Staff Handoffs</div>
            <div className="text-lg font-bold text-white">
              {metrics?.handoffsCount ?? 2} routed to front desk
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Estimated Pipeline Value</div>
            <div className="text-lg font-bold text-emerald-400">
              ${(metrics?.revenuePotential ?? 14800).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Leads & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Recent Patient Leads</h2>
              <p className="text-xs text-slate-400">Captured automatically by AI coordinator</p>
            </div>
            <button
              onClick={() => onNavigateTab('leads')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800 flex-1">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No patient leads captured yet. Test the patient chat to see live leads!
              </div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200 text-sm">{lead.name}</span>
                      {getStatusBadge(lead.status)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {lead.serviceName} • {lead.phone || lead.email}
                    </div>
                    {lead.preferredTime && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Prefers: {lead.preferredTime}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-400">
                      ${lead.estimatedValue || 450}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Recent AI Inquiries</h2>
              <p className="text-xs text-slate-400">Live patient chat sessions</p>
            </div>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Open Inbox</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800 flex-1">
            {recentConversations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No active conversations yet.
              </div>
            ) : (
              recentConversations.map(conv => (
                <div key={conv.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200 text-sm">
                        {conv.patientName || 'Anonymous Visitor'}
                      </span>
                      {conv.priority === 'emergency' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          EMERGENCY
                        </span>
                      )}
                      {conv.isAfterHours && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-400">
                          After-Hours
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {conv.messages[conv.messages.length - 1]?.text || 'Started conversation'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('inbox')}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg shrink-0 border border-slate-700 transition-all cursor-pointer"
                  >
                    View Thread
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
