import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Specialist } from '../../../types';
import { Building2, Phone, Mail, MapPin, Globe, Shield, UserPlus, Trash2, Edit3, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const ClinicProfileTab: React.FC = () => {
  const { activeClinic, activeClinicId, authFetch, refreshClinicData } = useAdminAuth();

  const [formData, setFormData] = useState({
    clinicName: '',
    tagline: '',
    logo: '',
    address: '',
    cityStateZip: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    website: '',
    googleMapsUrl: '',
    about: '',
    emergencyPolicy: ''
  });

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeClinic) {
      setFormData({
        clinicName: activeClinic.clinicName || '',
        tagline: activeClinic.tagline || '',
        logo: activeClinic.logo || '',
        address: activeClinic.address || '',
        cityStateZip: activeClinic.cityStateZip || '',
        phone: activeClinic.phone || '',
        emergencyPhone: activeClinic.emergencyPhone || '',
        email: activeClinic.email || '',
        website: activeClinic.website || '',
        googleMapsUrl: activeClinic.googleMapsUrl || '',
        about: activeClinic.about || '',
        emergencyPolicy: activeClinic.emergencyPolicy || ''
      });
      setSpecialists(activeClinic.specialists || []);
    }
  }, [activeClinic]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMsg(null);

    try {
      const res = await authFetch('/api/admin/clinic/config', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: {
            ...formData,
            specialists
          }
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Clinic profile & doctor roster saved successfully! Changes are active in AI prompt.' });
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save clinic profile' });
      }
    } catch (e: any) {
      setToastMsg({ type: 'error', text: e.message || 'Network error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleAddOrUpdateSpecialist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialist || !editingSpecialist.name) return;

    if (editingSpecialist.id) {
      setSpecialists(prev => prev.map(s => s.id === editingSpecialist.id ? editingSpecialist : s));
    } else {
      const newDoc: Specialist = {
        ...editingSpecialist,
        id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isActive: true
      };
      setSpecialists(prev => [...prev, newDoc]);
    }
    setEditingSpecialist(null);
  };

  const handleDeleteSpecialist = (id: string) => {
    setSpecialists(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Clinic Profile & Doctor Directory</h1>
          <p className="text-sm text-slate-400">
            Control clinic identity, locations, emergency policies, and provider credentials grounded in the AI Coordinator.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          toastMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-rose-950/80 border border-rose-800 text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
            <Building2 className="h-5 w-5 text-cyan-400" />
            <span>Practice Identity & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Clinic Name
              </label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tagline / Specialty Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                City, State & ZIP
              </label>
              <input
                type="text"
                required
                value={formData.cityStateZip}
                onChange={e => setFormData({ ...formData, cityStateZip: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Main Front Desk Phone
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-rose-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span>24/7 Urgent Emergency Line</span>
              </label>
              <input
                type="text"
                required
                value={formData.emergencyPhone}
                onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-rose-800/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Public Inquiry Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Google Maps Link
            </label>
            <input
              type="text"
              value={formData.googleMapsUrl}
              onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              About Clinic (AI Coordinator Narrative Grounding)
            </label>
            <textarea
              rows={3}
              value={formData.about}
              onChange={e => setFormData({ ...formData, about: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Emergency & Trauma Triage Policy
            </label>
            <textarea
              rows={2}
              value={formData.emergencyPolicy}
              onChange={e => setFormData({ ...formData, emergencyPolicy: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </form>

      {/* Doctors & Specialists Management */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Doctors & Clinical Providers</h2>
            <p className="text-xs text-slate-400">Manage provider credentials, specialties, and bio details known to the AI.</p>
          </div>

          <button
            type="button"
            onClick={() => setEditingSpecialist({
              id: '',
              name: '',
              title: 'Associate Dentist',
              specialty: 'Cosmetic & Restorative Dentistry',
              experience: '5+ Years Clinical Experience',
              bio: '',
              isActive: true
            })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Provider</span>
          </button>
        </div>

        {/* Doctor List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialists.map(doctor => (
            <div key={doctor.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {doctor.image ? (
                  <img src={doctor.image} alt={doctor.name} className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                    {doctor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">{doctor.name}</h3>
                  <div className="text-xs text-cyan-400">{doctor.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{doctor.specialty}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{doctor.experience}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSpecialist(doctor)}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Doctor"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSpecialist(doctor.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Delete Doctor"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Edit Modal */}
      {editingSpecialist && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">
              {editingSpecialist.id ? 'Edit Provider Profile' : 'Add New Clinical Provider'}
            </h3>

            <form onSubmit={handleAddOrUpdateSpecialist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Full Name & Degrees</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Vance, DDS"
                  value={editingSpecialist.name}
                  onChange={e => setEditingSpecialist({ ...editingSpecialist, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Title / Practice Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Aesthetic Dentist"
                  value={editingSpecialist.title}
                  onChange={e => setEditingSpecialist({ ...editingSpecialist, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Clinical Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cosmetic Dentistry & Implantology"
                  value={editingSpecialist.specialty}
                  onChange={e => setEditingSpecialist({ ...editingSpecialist, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Experience & Alma Mater</label>
                <input
                  type="text"
                  placeholder="e.g. 14+ Years Clinical Experience (UCSF)"
                  value={editingSpecialist.experience}
                  onChange={e => setEditingSpecialist({ ...editingSpecialist, experience: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Photo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingSpecialist.image || ''}
                  onChange={e => setEditingSpecialist({ ...editingSpecialist, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSpecialist(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
