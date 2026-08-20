import React, { useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Building2, Plus, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, Globe, ArrowRight } from 'lucide-react';

export const ClinicsManagerTab: React.FC = () => {
  const { clinics, activeClinicId, setActiveClinicId, isSuperAdmin, authFetch, refreshClinicData } = useAdminAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClinic, setNewClinic] = useState({
    clinicName: '',
    tagline: '',
    address: '',
    cityStateZip: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    website: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinic.clinicName) return;

    setIsCreating(true);
    try {
      const res = await authFetch('/api/admin/clinics', {
        method: 'POST',
        body: JSON.stringify({
          clinic: newClinic
        })
      });

      if (res.ok) {
        const created = await res.json();
        setToastMsg(`Clinic "${newClinic.clinicName}" created successfully!`);
        setShowAddModal(false);
        setNewClinic({
          clinicName: '',
          tagline: '',
          address: '',
          cityStateZip: '',
          phone: '',
          emergencyPhone: '',
          email: '',
          website: ''
        });
        await refreshClinicData();
        setActiveClinicId(created.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Multi-Clinic Practice Network</h1>
          <p className="text-sm text-slate-400">
            Enterprise clinic multi-tenancy. Manage multiple practice locations with completely isolated AI grounding, services, and leads.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Practice Location</span>
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(clinics || []).map(clinic => {
          const isActive = clinic.id === activeClinicId;
          return (
            <div
              key={clinic.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500/80 shadow-2xl shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">{clinic.clinicName}</h3>
                      <p className="text-xs text-cyan-400 font-medium">{clinic.tagline || 'Dental Studio & Surgery'}</p>
                    </div>
                  </div>

                  {isActive && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Active Scope</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{clinic.address}, {clinic.cityStateZip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Front Desk: {clinic.phone} • Emergency: {clinic.emergencyPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{clinic.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800 text-center">
                  <div className="bg-slate-950 p-2 rounded-xl">
                    <div className="text-xs text-slate-400">Services</div>
                    <div className="text-sm font-bold text-white mt-0.5">{clinic.services?.length || 0}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl">
                    <div className="text-xs text-slate-400">Providers</div>
                    <div className="text-sm font-bold text-white mt-0.5">{clinic.specialists?.length || 0}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl">
                    <div className="text-xs text-slate-400">KB Articles</div>
                    <div className="text-sm font-bold text-white mt-0.5">{clinic.kbArticles?.length || 0}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                {!isActive ? (
                  <button
                    onClick={() => setActiveClinicId(clinic.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Switch to this Clinic</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Currently Controlling this Practice</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Add New Practice Location</h3>
            <form onSubmit={handleCreateClinic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aura Dental Studio (Palo Alto)"
                  value={newClinic.clinicName}
                  onChange={e => setNewClinic({ ...newClinic, clinicName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Silicon Valley Aesthetic & Laser Center"
                  value={newClinic.tagline}
                  onChange={e => setNewClinic({ ...newClinic, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 525 University Ave"
                    value={newClinic.address}
                    onChange={e => setNewClinic({ ...newClinic, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">City, ST ZIP</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Palo Alto, CA 94301"
                    value={newClinic.cityStateZip}
                    onChange={e => setNewClinic({ ...newClinic, cityStateZip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Front Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. (650) 555-0188"
                    value={newClinic.phone}
                    onChange={e => setNewClinic({ ...newClinic, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. (650) 555-0911"
                    value={newClinic.emergencyPhone}
                    onChange={e => setNewClinic({ ...newClinic, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {isCreating ? 'Provisioning...' : 'Provision Clinic Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
