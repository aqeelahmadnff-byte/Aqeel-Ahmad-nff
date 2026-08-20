import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { 
  ShieldCheck, 
  KeyRound, 
  Laptop, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  RefreshCw, 
  Lock, 
  Server, 
  Fingerprint,
  FileCheck
} from 'lucide-react';

interface SessionItem {
  token: string;
  userId: string;
  clinicId?: string;
  createdAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  userAgent?: string;
  isCurrent?: boolean;
}

export const SecurityTab: React.FC = () => {
  const { user, authFetch, logoutAllOtherSessions } = useAdminAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);

  // Forgot password generator tester
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [generatedResetToken, setGeneratedResetToken] = useState<string | null>(null);
  const [isGeneratingReset, setIsGeneratingReset] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/account/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (_e) {
      console.warn('Could not fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminateOtherSessions = async () => {
    setIsTerminating(true);
    setError(null);
    setSuccess(null);
    const result = await logoutAllOtherSessions();
    setIsTerminating(false);

    if (result.success) {
      setSuccess(result.message || 'All other active sessions have been signed out.');
      await fetchSessions();
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(result.error || 'Failed to terminate other sessions.');
    }
  };

  const handleTestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReset(true);
    setGeneratedResetToken(null);
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      if (data.resetToken) {
        setGeneratedResetToken(data.resetToken);
      }
      setSuccess('Reset token generated. In a live deployment, this is emailed securely to the account.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (_e) {
      setError('Failed to generate reset link');
    } finally {
      setIsGeneratingReset(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="h-4 w-4" />
            Security Posture & Sessions
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            Security & Session Controls
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Inspect active session tokens, configure password policies, and monitor lockout defenses.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors self-start"
          title="Refresh active sessions"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Sessions Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif">Active Authorization Sessions</h3>
                  <p className="text-[11px] text-slate-400">Devices and tokens currently authorized to access this account</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                  <span>Current Browser Session (Active)</span>
                  <span className="text-emerald-400 font-semibold">Online</span>
                </div>
              ) : (
                sessions.map((sess, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>Web Client • Token {sess.token.substring(0, 8)}...</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Started: {new Date(sess.createdAt).toLocaleDateString()} {new Date(sess.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleTerminateOtherSessions}
              disabled={isTerminating}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-amber-400" />
              {isTerminating ? 'Terminating sessions...' : 'Invalidate All Other Active Sessions'}
            </button>
          </div>

          {/* Password Recovery Tester */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-serif">Forgot Password / Recovery Verification</h3>
                <p className="text-[11px] text-slate-400">Test secure one-time password reset token dispatch</p>
              </div>
            </div>

            <form onSubmit={handleTestPasswordReset} className="flex gap-2">
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter admin email address"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isGeneratingReset || !testEmail}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingReset ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                Generate Token
              </button>
            </form>

            {generatedResetToken && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1">
                <div className="text-[11px] font-semibold text-purple-300">Generated One-Time Reset Token (Valid for 1 hour):</div>
                <code className="text-xs font-mono text-emerald-400 break-all select-all">{generatedResetToken}</code>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security Architecture Standards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Practice Security Guardrails
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  PBKDF2 Cryptographic Salting
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Passphrases are computed with 10,000 iterations of SHA-512 with per-user unique 16-byte cryptographic salts.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                  Brute Force Lockout Protection
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accounts are temporarily locked after 5 consecutive failed login attempts to prevent automated credential stuffing.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-purple-400" />
                  Multi-Clinic Data Isolation
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  All queries enforce tenant boundaries so clinic staff cannot view or modify data belonging to other practices in the network.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                  Audit Log Trail
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every administrative action, AI configuration publish, and team permission modification is permanently audited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
