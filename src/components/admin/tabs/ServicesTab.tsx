import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { ClinicService } from '../../../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export const ServicesTab: React.FC = () => {
  const { activeClinic, activeClinicId, authFetch, refreshClinicData } = useAdminAuth();
  const [services, setServices] = useState<ClinicService[]>([]);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeClinic?.services) {
      setServices([...activeClinic.services].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    }
  }, [activeClinic]);

  const handleOpenAddModal = () => {
    setEditingService({
      id: '',
      name: '',
      category: 'cosmetic',
      startingPrice: '$350',
      price: '$350',
      priceRange: '$350 – $500',
      duration: '45 – 60 minutes',
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      displayOrder: services.length + 1,
      summary: '',
      keyBenefits: ['Fast results', 'Clinically verified', 'Painless'],
      candidateFor: 'Patients seeking comprehensive smile care',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ClinicService) => {
    setEditingService({ ...service });
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name || !editingService.startingPrice) return;

    setIsSaving(true);
    try {
      const isEdit = !!editingService.id;
      const url = isEdit ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          clinicId: activeClinicId,
          service: editingService
        })
      });

      if (res.ok) {
        setToastMsg({
          type: 'success',
          text: `Service "${editingService.name}" ${isEdit ? 'updated' : 'created'} successfully! AI prompt updated.`
        });
        setIsModalOpen(false);
        setEditingService(null);
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save service' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the clinic catalog?`)) return;

    try {
      const res = await authFetch(`/api/admin/services/${id}?clinicId=${activeClinicId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: `Service "${name}" removed.` });
        await refreshClinicData();
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const handleToggleActive = async (service: ClinicService) => {
    const updated = { ...service, isActive: !service.isActive };
    try {
      await authFetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({ clinicId: activeClinicId, service: updated })
      });
      await refreshClinicData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= services.length) return;

    const newServices = [...services];
    const [moved] = newServices.splice(index, 1);
    newServices.splice(targetIdx, 0, moved);

    const ids = newServices.map(s => s.id);
    setServices(newServices);

    try {
      await authFetch('/api/admin/services/reorder', {
        method: 'POST',
        body: JSON.stringify({ clinicId: activeClinicId, serviceIds: ids })
      });
      await refreshClinicData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Services & Pricing Architecture</h1>
          <p className="text-sm text-slate-400">
            Configure clinical treatments, exact pricing rules, and AI recommendation permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 shadow-md">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-emerald-400">Zero-Hallucination Price Grounding: </span>
          The AI Patient Coordinator quotes exclusively the verified pricing entered here. When "AI Can Mention Price" is turned OFF or a custom disclaimer is applied, the AI automatically explains that exact fees depend on the clinical consultation.
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

      {/* Services Table / Cards */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="divide-y divide-slate-800">
          {services.map((service, index) => (
            <div key={service.id} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-850/50 transition-colors">
              <div className="flex items-start gap-3.5">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1 pt-1 shrink-0">
                  <button
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === services.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">{service.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-800 text-cyan-400 border border-slate-700">
                      {service.category}
                    </span>
                    {!service.isActive && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                        Inactive
                      </span>
                    )}
                    {service.isBookable && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" />
                        <span>Bookable</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-2xl">
                    {service.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{service.startingPrice} {service.priceRange ? `(${service.priceRange})` : ''}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{service.duration}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span>AI Mentions Price: {service.aiCanMentionPrice ? 'YES' : 'CONSULTATION ONLY'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(service)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    service.isActive
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {service.isActive ? 'Active' : 'Disabled'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(service)}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Edit Treatment"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteService(service.id, service.name)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Delete Treatment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-serif">
                {editingService.id ? 'Edit Treatment & Pricing' : 'Add New Clinical Treatment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Treatment Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teeth Whitening"
                    value={editingService.name}
                    onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingService.category}
                    onChange={e => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="cosmetic">Cosmetic Dentistry</option>
                    <option value="orthodontics">Orthodontics / Aligners</option>
                    <option value="restorative">Restorative / Implants</option>
                    <option value="emergency">Emergency Dental Care</option>
                    <option value="preventive">Preventive & Hygiene</option>
                    <option value="general">General Dental Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Starting Price / Fee
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $350"
                    value={editingService.startingPrice}
                    onChange={e => setEditingService({ ...editingService, startingPrice: e.target.value, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Price Range (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $350 – $480"
                    value={editingService.priceRange || ''}
                    onChange={e => setEditingService({ ...editingService, priceRange: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 45 – 60 minutes"
                    value={editingService.duration}
                    onChange={e => setEditingService({ ...editingService, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Ideal Candidate Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adults seeking rapid smile brightener"
                    value={editingService.candidateFor}
                    onChange={e => setEditingService({ ...editingService, candidateFor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Treatment Summary (Used for AI explanations)
                </label>
                <textarea
                  rows={2}
                  value={editingService.summary}
                  onChange={e => setEditingService({ ...editingService, summary: e.target.value })}
                  placeholder="Clinical description of the procedure..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Pricing Notes / Custom Disclaimer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Includes custom desensitizing kit & trays"
                  value={editingService.notes || ''}
                  onChange={e => setEditingService({ ...editingService, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* AI Toggles & Controls */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.aiCanMentionPrice}
                    onChange={e => setEditingService({ ...editingService, aiCanMentionPrice: e.target.checked })}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">AI Can Mention Price</div>
                    <div className="text-[11px] text-slate-400">If OFF, AI states price is consultation-dependent</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.aiCanRecommend}
                    onChange={e => setEditingService({ ...editingService, aiCanRecommend: e.target.checked })}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">AI Can Recommend Treatment</div>
                    <div className="text-[11px] text-slate-400">Allow AI to suggest for candidate symptoms</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.isBookable}
                    onChange={e => setEditingService({ ...editingService, isBookable: e.target.checked })}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Bookable Online</div>
                    <div className="text-[11px] text-slate-400">Triggers consultation scheduler</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.isActive}
                    onChange={e => setEditingService({ ...editingService, isActive: e.target.checked })}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Service Active in Catalog</div>
                    <div className="text-[11px] text-slate-400">Available across website and AI</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
