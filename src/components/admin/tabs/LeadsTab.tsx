import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Lead, LeadStatus } from '../../../types';
import { 
  Users, 
  Search, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const LeadsTab: React.FC = () => {
  const { activeClinicId, authFetch } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/admin/leads?clinicId=${activeClinicId}`);
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeClinicId, authFetch]);

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await authFetch(`/api/admin/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: { status: newStatus }
        })
      });

      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        setToastMsg({ type: 'success', text: `Lead status updated to ${newStatus.replace('_', ' ')}` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editingLead.name) return;

    try {
      const isEdit = !!editingLead.id;
      const url = isEdit ? `/api/admin/leads/${editingLead.id}` : '/api/admin/leads';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: editingLead,
          lead: editingLead
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Lead saved successfully!' });
        setEditingLead(null);
        setIsAddOpen(false);
        await fetchLeads();
      }
    } catch (e: any) {
      setToastMsg({ type: 'error', text: e.message || 'Error occurred' });
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Delete lead "${name}"?`)) return;

    try {
      const res = await authFetch(`/api/admin/leads/${id}?clinicId=${activeClinicId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        setToastMsg({ type: 'success', text: 'Lead deleted.' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Service', 'Status', 'Estimated Value', 'Preferred Time', 'Notes', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.serviceName || ''}"`,
      l.status,
      l.estimatedValue || 0,
      `"${l.preferredTime || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_clinic_${activeClinicId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSearch = !searchQuery ||
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'new': return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      case 'appointment_requested': return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'booked': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'contacted': return 'bg-indigo-950 text-indigo-400 border-indigo-800';
      case 'qualified': return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'closed': return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'lost': return 'bg-rose-950 text-rose-400 border-rose-800';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Patient Opportunity & Leads Hub</h1>
          <p className="text-sm text-slate-400">
            Patients qualified and captured automatically by the AI Patient Coordinator.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingLead({
                id: '',
                clinicId: activeClinicId,
                name: '',
                phone: '',
                email: '',
                serviceName: 'Cosmetic Consultation',
                status: 'new',
                estimatedValue: 500,
                preferredTime: 'Next available morning',
                notes: 'Manual lead entry from front desk',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Patient Lead</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          toastMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-rose-950/80 border border-rose-800 text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient name, phone, email, or procedure..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Statuses ({leads.length})</option>
            <option value="new">New</option>
            <option value="appointment_requested">Appointment Requested</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Service of Interest</th>
                <th className="py-3.5 px-4">Est. Value</th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4">Captured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{lead.name}</div>
                      {lead.preferredTime && (
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          Time: {lead.preferredTime}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="h-3 w-3 text-cyan-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-300">{lead.serviceName}</span>
                      {lead.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                          {lead.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      ${lead.estimatedValue || 450}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={e => handleUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer focus:outline-none ${getStatusColor(lead.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="appointment_requested">Appt Requested</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="booked">Booked</option>
                        <option value="closed">Closed</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingLead({ ...lead });
                            setIsAddOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lead Modal */}
      {isAddOpen && editingLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif">
                {editingLead.id ? 'Edit Lead Record' : 'Add New Patient Lead'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Smith"
                  value={editingLead.name}
                  onChange={e => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. (415) 555-0199"
                    value={editingLead.phone || ''}
                    onChange={e => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. patient@example.com"
                    value={editingLead.email || ''}
                    onChange={e => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Service of Interest</label>
                  <input
                    type="text"
                    placeholder="e.g. Invisalign Clear Aligners"
                    value={editingLead.serviceName}
                    onChange={e => setEditingLead({ ...editingLead, serviceName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={editingLead.estimatedValue || 0}
                    onChange={e => setEditingLead({ ...editingLead, estimatedValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Preferred Time / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Patient notes or scheduling preferences..."
                  value={editingLead.notes || ''}
                  onChange={e => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
