import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AuditLog } from '../../../types';
import { ShieldCheck, Search, Filter, Clock, User, FileText } from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const { activeClinicId, authFetch } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`/api/admin/audit-logs?clinicId=${activeClinicId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setLogs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [activeClinicId, authFetch]);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter(l => {
    return !searchQuery ||
      (l.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(l.details || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white font-serif">Security & Configuration Audit Trail</h1>
        <p className="text-sm text-slate-400">
          Cryptographically recorded log of all administrative modifications, pricing changes, and AI prompt updates.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter audit logs by staff email, action, or payload..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Changes & Payload</th>
                <th className="py-3.5 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No audit records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{log.userEmail}</div>
                      <div className="text-[10px] text-cyan-400 font-normal uppercase">{log.userRole}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-950 text-emerald-400 border border-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
