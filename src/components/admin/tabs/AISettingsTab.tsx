import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AIConfiguration, defaultAIConfiguration } from '../../../types';
import { 
  Bot, 
  Sparkles, 
  Save, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sliders, 
  RotateCcw, 
  Send, 
  Code, 
  Eye, 
  ListPlus, 
  Trash2, 
  Plus, 
  Radio, 
  Lock, 
  AlertTriangle,
  Play,
  FileCode2,
  RefreshCw,
  Clock
} from 'lucide-react';

export const AISettingsTab: React.FC = () => {
  const { activeClinic, authFetch, refreshClinicData, hasPermission } = useAdminAuth();

  const [draftConfig, setDraftConfig] = useState<AIConfiguration>({ ...defaultAIConfiguration });
  const [publishedConfig, setPublishedConfig] = useState<AIConfiguration>({ ...defaultAIConfiguration });
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'sandbox' | 'prompt_preview'>('editor');

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishSummary, setPublishSummary] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tag Inputs
  const [newAllowedTopic, setNewAllowedTopic] = useState('');
  const [newRestrictedTopic, setNewRestrictedTopic] = useState('');
  const [newLeadQuestion, setNewLeadQuestion] = useState('');

  // Sandbox State
  const [sandboxHistory, setSandboxHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [generatedPromptPreview, setGeneratedPromptPreview] = useState<string>('');

  const canEditAI = hasPermission('canEditAIConfig');
  const canPublishAI = hasPermission('canPublishAIConfig');

  // Load configs
  const loadConfigs = async () => {
    try {
      const res = await authFetch(`/api/admin/ai/config?clinicId=${activeClinic?.id || 'clinic-sf'}`);
      if (res.ok) {
        const data = await res.json();
        if (data.draft) setDraftConfig(data.draft);
        if (data.published) setPublishedConfig(data.published);
      }
    } catch (e) {
      console.warn('Could not load AI configs:', e);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [activeClinic?.id]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const res = await authFetch('/api/admin/ai/draft', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          draftConfig
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: 'success', text: 'AI configuration draft saved successfully.' });
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to save draft.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setIsSavingDraft(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      // First save draft
      await authFetch('/api/admin/ai/draft', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          draftConfig
        })
      });

      // Then publish
      const res = await authFetch('/api/admin/ai/publish', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          summary: publishSummary || 'Published updated AI settings and clinical instructions'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishedConfig(data.published);
        setPublishModalOpen(false);
        setPublishSummary('');
        setToast({ type: 'success', text: 'Configuration published to live AI Patient Coordinator!' });
        await refreshClinicData();
      } else {
        setToast({ type: 'error', text: data.error || 'Failed to publish configuration.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setToast(null), 4500);
    }
  };

  const handleResetDraftToPublished = () => {
    if (confirm('Discard all un-published draft changes and revert to current live published configuration?')) {
      setDraftConfig({ ...publishedConfig });
      setToast({ type: 'success', text: 'Draft reverted to published configuration.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Tag modifiers
  const addAllowedTopic = () => {
    if (!newAllowedTopic.trim()) return;
    setDraftConfig(prev => ({
      ...prev,
      allowedTopics: [...(prev.allowedTopics || []), newAllowedTopic.trim()]
    }));
    setNewAllowedTopic('');
  };

  const removeAllowedTopic = (idx: number) => {
    setDraftConfig(prev => ({
      ...prev,
      allowedTopics: (prev.allowedTopics || []).filter((_, i) => i !== idx)
    }));
  };

  const addRestrictedTopic = () => {
    if (!newRestrictedTopic.trim()) return;
    setDraftConfig(prev => ({
      ...prev,
      restrictedTopics: [...(prev.restrictedTopics || []), newRestrictedTopic.trim()]
    }));
    setNewRestrictedTopic('');
  };

  const removeRestrictedTopic = (idx: number) => {
    setDraftConfig(prev => ({
      ...prev,
      restrictedTopics: (prev.restrictedTopics || []).filter((_, i) => i !== idx)
    }));
  };

  const addLeadQuestion = () => {
    if (!newLeadQuestion.trim()) return;
    setDraftConfig(prev => ({
      ...prev,
      leadQualificationQuestions: [...(prev.leadQualificationQuestions || []), newLeadQuestion.trim()]
    }));
    setNewLeadQuestion('');
  };

  const removeLeadQuestion = (idx: number) => {
    setDraftConfig(prev => ({
      ...prev,
      leadQualificationQuestions: (prev.leadQualificationQuestions || []).filter((_, i) => i !== idx)
    }));
  };

  // Sandbox simulation runner
  const handleSendSandboxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxInput.trim() || isSimulating) return;

    const userMsg = sandboxInput.trim();
    setSandboxInput('');
    const newHistory = [...sandboxHistory, { role: 'user' as const, text: userMsg }];
    setSandboxHistory(newHistory);
    setIsSimulating(true);

    try {
      const res = await authFetch('/api/admin/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          message: userMsg,
          customAIConfig: draftConfig,
          history: sandboxHistory
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSandboxHistory([...newHistory, { role: 'assistant', text: data.text }]);
        if (data.systemPromptPreview) {
          setGeneratedPromptPreview(data.systemPromptPreview);
        }
      } else {
        setSandboxHistory([...newHistory, { role: 'assistant', text: 'Error simulating response: ' + (data.error || 'Server error') }]);
      }
    } catch (_err) {
      setSandboxHistory([...newHistory, { role: 'assistant', text: 'Network error communicating with AI engine.' }]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Dual-State Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            AI Prompt Studio & Guardrails
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            AI Patient Coordinator Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure prompt personality, clinical rules, and emergency boundaries with a zero-risk draft & publish workflow.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDraftToPublished}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Revert draft changes to live version"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard Draft
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || !canEditAI}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSavingDraft ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            disabled={isPublishing || !canPublishAI}
            className="py-2 px-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            Publish to Live Assistant
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs ${
          toast.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('editor')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'editor'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Configuration Editor
        </button>

        <button
          onClick={() => setActiveSubTab('sandbox')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'sandbox'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="h-4 w-4" />
          Draft Sandbox Simulation
        </button>

        <button
          onClick={() => setActiveSubTab('prompt_preview')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'prompt_preview'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          System Prompt Inspector
        </button>
      </div>

      {/* 1. CONFIGURATION EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="space-y-6">
          {/* Section A: Persona & Identity */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Assistant Identity & Tone</h3>
                <p className="text-[11px] text-slate-400">Define the coordinator's persona, greeting, and voice</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={draftConfig.assistantName}
                  onChange={(e) => setDraftConfig({ ...draftConfig, assistantName: e.target.value })}
                  placeholder="e.g. Aura"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tone Style
                </label>
                <select
                  value={draftConfig.tone}
                  onChange={(e) => setDraftConfig({ ...draftConfig, tone: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="professional_warm">Professional & Warm (Recommended)</option>
                  <option value="luxury_concierge">Luxury Concierge & High-Touch</option>
                  <option value="direct_efficient">Direct & Efficient</option>
                  <option value="empathetic_clinical">Empathetic Clinical & Gentle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Language Model Mode
                </label>
                <select
                  value={draftConfig.language}
                  onChange={(e) => setDraftConfig({ ...draftConfig, language: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="bilingual">Bilingual (English + Spanish Auto-Detect)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Greeting Message (Shown to Patient on Opening Chat)
              </label>
              <textarea
                rows={2}
                value={draftConfig.greetingMessage}
                onChange={(e) => setDraftConfig({ ...draftConfig, greetingMessage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Clinic Overview & Mission Introduction
              </label>
              <textarea
                rows={2}
                value={draftConfig.clinicIntroduction}
                onChange={(e) => setDraftConfig({ ...draftConfig, clinicIntroduction: e.target.value })}
                placeholder="Brief intro for the AI to summarize when patients ask 'Tell me about the practice'..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section B: Topic Boundaries (Allowed & Restricted) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Topic Boundaries & Permissions</h3>
                <p className="text-[11px] text-slate-400">Explicitly whitelist or blacklist topics the AI is allowed to discuss</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allowed Topics */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-emerald-400">
                  Allowed Topics (Whitelisted)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllowedTopic}
                    onChange={(e) => setNewAllowedTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllowedTopic())}
                    placeholder="e.g. Porcelain Veneers duration"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addAllowedTopic}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {(draftConfig.allowedTopics || []).map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                      {t}
                      <button onClick={() => removeAllowedTopic(idx)} className="hover:text-rose-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Restricted Topics */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-rose-400">
                  Restricted Topics (Forbidden & Blocked)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRestrictedTopic}
                    onChange={(e) => setNewRestrictedTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRestrictedTopic())}
                    placeholder="e.g. Prescribing narcotics"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={addRestrictedTopic}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {(draftConfig.restrictedTopics || []).map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      {t}
                      <button onClick={() => removeRestrictedTopic(idx)} className="hover:text-white">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Protocols (Emergency, Booking, Lead Qualification, After Hours) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Clinical Protocols & Action Flows</h3>
                <p className="text-[11px] text-slate-400">Emergency rules, lead qualification prompts, and booking procedures</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Emergency Triage Instructions
                </label>
                <textarea
                  rows={3}
                  value={draftConfig.emergencyInstructions}
                  onChange={(e) => setDraftConfig({ ...draftConfig, emergencyInstructions: e.target.value })}
                  placeholder="Instructions for acute trauma, bleeding, severe pain..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Booking & Appointment Instructions
                </label>
                <textarea
                  rows={3}
                  value={draftConfig.bookingInstructions}
                  onChange={(e) => setDraftConfig({ ...draftConfig, bookingInstructions: e.target.value })}
                  placeholder="Instructions for collecting patient contact info, preferred slots..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Lead Qualification Questions */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-cyan-400">
                Lead Qualification Questions (Asked during consultation triage)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLeadQuestion}
                  onChange={(e) => setNewLeadQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLeadQuestion())}
                  placeholder="e.g. Have you had dental cleanings in the past 6 months?"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={addLeadQuestion}
                  className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Question
                </button>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {(draftConfig.leadQualificationQuestions || []).map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200">
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {q}
                    </span>
                    <button onClick={() => removeLeadQuestion(idx)} className="text-slate-400 hover:text-rose-400 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Human Handoff & Escalation Rules
                </label>
                <textarea
                  rows={2}
                  value={draftConfig.humanHandoffRules}
                  onChange={(e) => setDraftConfig({ ...draftConfig, humanHandoffRules: e.target.value })}
                  placeholder="When to escalate to staff coordinator..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Clinical Instructions
                </label>
                <textarea
                  rows={2}
                  value={draftConfig.systemInstructions}
                  onChange={(e) => setDraftConfig({ ...draftConfig, systemInstructions: e.target.value })}
                  placeholder="Additional behavioral rules specific to this clinic..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section D: Strict Guardrails & Feature Flags */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Medical Safety Guardrails & Capabilities</h3>
                <p className="text-[11px] text-slate-400">Toggle hard safety filters and assistant interaction capabilities</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Never Provide Medical Diagnosis</span>
                <input
                  type="checkbox"
                  checked={draftConfig.neverDiagnose}
                  onChange={(e) => setDraftConfig({ ...draftConfig, neverDiagnose: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Never Invent / Discount Prices</span>
                <input
                  type="checkbox"
                  checked={draftConfig.neverInventPrices}
                  onChange={(e) => setDraftConfig({ ...draftConfig, neverInventPrices: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Never Guarantee Medical Results</span>
                <input
                  type="checkbox"
                  checked={draftConfig.neverGuaranteeMedicalResults}
                  onChange={(e) => setDraftConfig({ ...draftConfig, neverGuaranteeMedicalResults: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Disclose AI Identity to Patients</span>
                <input
                  type="checkbox"
                  checked={draftConfig.identifyAsAI}
                  onChange={(e) => setDraftConfig({ ...draftConfig, identifyAsAI: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Can Discuss Verified Pricing</span>
                <input
                  type="checkbox"
                  checked={draftConfig.canDiscussPrices}
                  onChange={(e) => setDraftConfig({ ...draftConfig, canDiscussPrices: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-medium text-slate-200">Can Capture Patient Leads</span>
                <input
                  type="checkbox"
                  checked={draftConfig.canCaptureLeads}
                  onChange={(e) => setDraftConfig({ ...draftConfig, canCaptureLeads: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-0 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. DRAFT SANDBOX SIMULATION */}
      {activeSubTab === 'sandbox' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-400" />
                Live Draft Sandbox Simulation
              </h3>
              <p className="text-[11px] text-slate-400">
                Safely test your current draft configuration against test patient queries before publishing to live patients.
              </p>
            </div>
            <button
              onClick={() => setSandboxHistory([])}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
            >
              Clear Chat History
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 text-xs">
            {sandboxHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Bot className="h-8 w-8 text-slate-600" />
                <p>Send a message to simulate a conversation with your draft AI coordinator.</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
                  {[
                    "How much does teeth whitening cost?",
                    "Do you take Delta Dental?",
                    "My tooth broke in half and is bleeding!",
                    "Can you prescribe antibiotics for my gum pain?"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSandboxInput(preset);
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              sandboxHistory.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-xl leading-relaxed ${
                    m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {m.role === 'user' ? 'Test Patient' : `${draftConfig.assistantName} (Draft Engine)`}
                    </div>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {isSimulating && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-400 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  Generating response via sandbox...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendSandboxMessage} className="flex gap-2">
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="Ask a question as a patient..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isSimulating || !sandboxInput.trim()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              Send Test
            </button>
          </form>
        </div>
      )}

      {/* 3. PROMPT INSPECTOR */}
      {activeSubTab === 'prompt_preview' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Code className="h-4 w-4 text-cyan-400" />
                Dynamic System Instruction Assembly
              </h3>
              <p className="text-[11px] text-slate-400">
                Inspect the dynamically compiled system prompt injected into Gemini for this clinic.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap">
            {generatedPromptPreview || "Click 'Send Test' in the Sandbox tab or save your draft to inspect the compiled dynamic system prompt."}
          </div>
        </div>
      )}

      {/* PUBLISH CONFIRMATION MODAL */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-cyan-400 border-b border-slate-800 pb-3">
              <UploadCloud className="h-6 w-6" />
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Publish AI Configuration</h3>
                <p className="text-[11px] text-slate-400">Deploy draft changes to live Patient Coordinator</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will create a new immutable version in the version history and immediately update the AI assistant's system instructions for <strong className="text-white">{activeClinic?.clinicName}</strong>.
            </p>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Changelog / Version Summary <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  placeholder="e.g. Added emergency dental triage & updated whitening promo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || !publishSummary.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  {isPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                  Confirm & Publish Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
