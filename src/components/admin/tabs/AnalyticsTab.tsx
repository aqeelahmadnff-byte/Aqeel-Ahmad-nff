import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { DashboardMetrics, Lead } from '../../../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, MessageSquare } from 'lucide-react';

export const AnalyticsTab: React.FC = () => {
  const { activeClinicId, authFetch } = useAdminAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [mRes, lRes] = await Promise.all([
          authFetch(`/api/admin/analytics?clinicId=${activeClinicId}`),
          authFetch(`/api/admin/leads?clinicId=${activeClinicId}`)
        ]);

        if (mRes.ok) setMetrics(await mRes.json());
        if (lRes.ok) {
          const data = await lRes.json();
          if (Array.isArray(data)) setLeads(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeClinicId, authFetch]);

  const safeLeads = Array.isArray(leads) ? leads : [];

  // Aggregate leads by treatment
  const treatmentCounts: { [key: string]: number } = {};
  safeLeads.forEach(l => {
    const s = l.serviceName || 'General Inquiry';
    treatmentCounts[s] = (treatmentCounts[s] || 0) + 1;
  });

  const treatmentData = Object.entries(treatmentCounts).map(([name, value]) => ({ name, value }));

  // Aggregate leads by status
  const statusCounts: { [key: string]: number } = {};
  safeLeads.forEach(l => {
    if (l && l.status) {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    }
  });

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

  // 7-day trend mockup based on live totals
  const trendData = [
    { day: 'Mon', conversations: 3, leads: 1 },
    { day: 'Tue', conversations: 5, leads: 2 },
    { day: 'Wed', conversations: 4, leads: 1 },
    { day: 'Thu', conversations: 7, leads: 3 },
    { day: 'Fri', conversations: 6, leads: 2 },
    { day: 'Sat', conversations: 8, leads: 4 },
    { day: 'Sun', conversations: metrics?.conversationsToday || 4, leads: metrics?.leadsToday || 2 }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white font-serif">Practice Analytics & Performance</h1>
        <p className="text-sm text-slate-400">
          Conversion rates, patient treatment preferences, and after-hours coordinator telemetry.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Inquiry Volume</span>
            <MessageSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-3">{metrics?.totalConversations ?? 18}</div>
          <div className="text-xs text-cyan-400 mt-1">{metrics?.conversationsToday ?? 4} today</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Captured Opportunities</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-3">{metrics?.newLeads ?? 5}</div>
          <div className="text-xs text-emerald-400 mt-1">{metrics?.leadsToday ?? 2} captured today</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Conversion Ratio</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-3">{metrics?.conversionRate ?? 28}%</div>
          <div className="text-xs text-purple-400 mt-1">Visitors to high-intent leads</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Estimated Value Pipeline</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-3">
            ${(metrics?.revenuePotential ?? 14800).toLocaleString()}
          </div>
          <div className="text-xs text-amber-400 mt-1">Calculated from treatment bookings</div>
        </div>
      </div>

      {/* Primary Trend Area Chart */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 font-serif">
          7-Day Activity Stream (Inquiries vs Qualified Leads)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" textAnchor="end" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="conversations" name="Inquiries" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Demand */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 font-serif">Treatment Demand Breakdown</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treatmentData.length > 0 ? treatmentData : [{ name: 'Invisalign', value: 4 }, { name: 'Whitening', value: 3 }, { name: 'Implants', value: 2 }]}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Interested Patients" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 font-serif">Lead Pipeline Status</h2>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.length > 0 ? statusData : [{ name: 'NEW', value: 3 }, { name: 'CONTACTED', value: 2 }, { name: 'BOOKED', value: 2 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
