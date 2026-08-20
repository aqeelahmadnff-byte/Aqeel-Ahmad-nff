import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { KnowledgeBaseArticle, KBCategory } from '../../../types';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const KnowledgeBaseTab: React.FC = () => {
  const { activeClinic, authFetch, refreshClinicData, hasPermission } = useAdminAuth();
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEdit = hasPermission('canEditKnowledgeBase');

  useEffect(() => {
    if (activeClinic?.kbArticles) {
      setArticles(activeClinic.kbArticles);
    }
  }, [activeClinic]);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Knowledge' },
    { key: 'faqs', label: 'General FAQs' },
    { key: 'treatment_info', label: 'Treatment Specifics' },
    { key: 'preparation_instructions', label: 'Preparation & Aftercare' },
    { key: 'payment_insurance', label: 'Insurance & Financing' },
    { key: 'cancellation_rescheduling', label: 'Policies & Cancellations' },
    { key: 'clinic_policies', label: 'Office Guidelines' },
    { key: 'parking_location', label: 'Parking & Directions' },
    { key: 'doctor_credentials', label: 'Doctor Credentials' },
    { key: 'custom', label: 'Custom Articles' }
  ];

  const handleOpenAdd = () => {
    setEditingArticle({
      id: '',
      clinicId: activeClinic?.id || 'clinic-sf',
      category: 'faqs',
      title: '',
      content: '',
      tags: ['faq', 'policy'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title || !editingArticle.content) return;

    setIsSaving(true);
    try {
      const isEdit = !!editingArticle.id;
      const url = isEdit ? `/api/admin/kb/${editingArticle.id}` : '/api/admin/kb';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          ...editingArticle
        })
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: `Article "${editingArticle.title}" saved! Grounded in AI knowledge base.` });
        setEditingArticle(null);
        await refreshClinicData();
      } else {
        const err = await res.json();
        setToastMsg({ type: 'error', text: err.error || 'Failed to save article' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Delete article "${title}" from the knowledge base?`)) return;

    try {
      const res = await authFetch(`/api/admin/kb/${id}?clinicId=${activeClinic?.id || 'clinic-sf'}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setToastMsg({ type: 'success', text: 'Article deleted.' });
        await refreshClinicData();
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Error' });
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            Clinical Knowledge & FAQ Repository
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            Knowledge Base Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            All active knowledge articles, FAQs, insurance details, and clinic policies dynamically ground the AI Patient Coordinator.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/20 flex items-center gap-2 self-start cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Knowledge Article
          </button>
        )}
      </div>

      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs ${
          toastMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search FAQs, insurance rules, parking, policies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-xl">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No knowledge articles found matching your criteria.
          </div>
        ) : (
          filteredArticles.map(art => (
            <div
              key={art.id}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {art.category.replace('_', ' ')}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${art.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                </div>

                <h3 className="text-sm font-bold text-white font-serif">{art.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {art.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {art.tags?.map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingArticle(art)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Article"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(art.id, art.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT / ADD MODAL */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <BookOpen className="h-5 w-5" />
                {editingArticle.id ? 'Edit Knowledge Article' : 'Create Knowledge Article'}
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Article Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingArticle.title}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    placeholder="e.g. Do veneers ruin your natural teeth?"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as KBCategory })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.filter(c => c.key !== 'all').map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Authoritative Content / FAQ Response <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  placeholder="Provide precise clinic instructions, answers, recovery timelines, or insurance rules..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingArticle.isActive}
                    onChange={(e) => setEditingArticle({ ...editingArticle, isActive: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  Active (Included in AI prompt context)
                </label>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingArticle(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Article
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
