import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AIVersionHistory } from '../../../types';
import { 
  History, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  X, 
  RefreshCw,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const AIVersionHistoryTab: React.FC = () => {
  const { activeClinic, authFetch, refreshClinicData, hasPermission } = useAdminAuth();
  const [versions, setVersions] = useState<AIVersionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<AIVersionHistory | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<AIVersionHistory | null>(null);
  const [restoreMode, setRestoreMode] = useState<'into_draft' | 'publish_now'>('into_draft');
  const [isRestoring, setIsRestoring] = useState(false);

  const canEditAI = hasPermission('canEditAIConfig');

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/ai/versions?clinicId=${activeClinic?.id || 'clinic-sf'}`);
      if (res.ok) {
        const list = await res.json();
        setVersions(list || []);
      } else {
        setError('Failed to load version history');
      }
    } catch (_err) {
      setError('Network error fetching versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [activeClinic?.id]);

  const handleOpenRestoreModal = (v: AIVersionHistory) => {
    setVersionToRestore(v);
    setRestoreMode('into_draft');
    setRestoreModalOpen(true);
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionToRestore) return;
    setIsRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/admin/ai/versions/${versionToRestore.id}/restore`, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinic?.id || 'clinic-sf',
          mode: restoreMode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(
          restoreMode === 'into_draft'
            ? `Version ${versionToRestore.versionNumber} successfully restored into your active Draft.`
            : `Version ${versionToRestore.versionNumber} published directly as live active configuration!`
        );
        setRestoreModalOpen(false);
        await fetchVersions();
        await refreshClinicData();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to restore version');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing rollback');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <History className="h-4 w-4" />
            Audit Trail & Rollbacks
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            AI Configuration Version History
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Every published AI configuration snapshot is logged with publisher attribution, changelog summaries, and one-click rollback capabilities.
          </p>
        </div>

        <button
          onClick={fetchVersions}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors self-start"
          title="Refresh versions"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Version Timeline Cards */}
      <div className="space-y-4">
        {versions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No published versions found. Publish your first draft from the AI Studio tab to create a version record.
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isLatest = idx === 0;

            return (
              <div
                key={ver.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLatest
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        Version {ver.versionNumber}
                      </span>

                      {isLatest ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          CURRENTLY LIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                          Archived
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 font-medium">
                      "{ver.summary || 'Standard configuration update'}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        Published by <strong className="text-slate-400">{ver.publishedByName || 'Admin'}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(ver.publishedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => setSelectedVersion(ver)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect Config
                    </button>

                    {!isLatest && canEditAI && (
                      <button
                        onClick={() => handleOpenRestoreModal(ver)}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Rollback / Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INSPECT MODAL */}
      {selectedVersion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Eye className="h-5 w-5" />
                Snapshot: Version {selectedVersion.versionNumber} Details
              </div>
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Assistant Name</div>
                  <div className="text-white font-semibold">{selectedVersion.config.assistantName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tone</div>
                  <div className="text-white font-semibold">{selectedVersion.config.tone}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Language</div>
                  <div className="text-white font-semibold">{selectedVersion.config.language}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Prices Discussed</div>
                  <div className="text-white font-semibold">{selectedVersion.config.canDiscussPrices ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-300 mb-1">Greeting Message</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  {selectedVersion.config.greetingMessage}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-300 mb-1">Emergency Protocols</div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  {selectedVersion.config.emergencyInstructions || 'Standard emergency referral'}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-300 mb-1">Allowed Topics</div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedVersion.config.allowedTopics || []).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-300 mb-1">Restricted Topics</div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedVersion.config.restrictedTopics || []).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVersion(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {restoreModalOpen && versionToRestore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm border-b border-slate-800 pb-3">
              <RotateCcw className="h-5 w-5" />
              Restore Version {versionToRestore.versionNumber}
            </div>

            <p className="text-xs text-slate-300">
              Select how you would like to restore the configuration from <strong className="text-white">Version {versionToRestore.versionNumber}</strong>:
            </p>

            <form onSubmit={handleExecuteRestore} className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                <input
                  type="radio"
                  name="restoreMode"
                  value="into_draft"
                  checked={restoreMode === 'into_draft'}
                  onChange={() => setRestoreMode('into_draft')}
                  className="mt-1 text-cyan-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-white">Restore into Draft (Recommended)</div>
                  <div className="text-[11px] text-slate-400">
                    Loads the configuration into your draft studio for review and testing before going live.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40">
                <input
                  type="radio"
                  name="restoreMode"
                  value="publish_now"
                  checked={restoreMode === 'publish_now'}
                  onChange={() => setRestoreMode('publish_now')}
                  className="mt-1 text-cyan-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-white">Publish Live Immediately</div>
                  <div className="text-[11px] text-slate-400">
                    Immediately deploys this past version as the active configuration for all patients.
                  </div>
                </div>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestoring}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isRestoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Confirm Rollback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
