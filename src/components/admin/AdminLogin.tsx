import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface AdminLoginProps {
  onBackToPatientSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToPatientSite }) => {
  const { login, forgotPassword, resetPassword } = useAdminAuth();
  const [mode, setMode] = useState<'login' | 'forgot_password' | 'reset_password'>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password / Reset State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your work email and password');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setError('Please provide your account email address.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const res = await forgotPassword(recoveryEmail);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess('Reset token generated. You may now input the token and set your new password.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setMode('reset_password');
    } else {
      setError(res.error || 'Failed to request reset token');
    }
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Reset token and new password are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const res = await resetPassword(resetToken, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess('Password updated successfully! Please log in with your new password.');
      setPassword(newPassword);
      setEmail(recoveryEmail || email);
      setMode('login');
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(res.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="h-7 w-7 text-cyan-400" />
            </div>
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white font-serif">
          Aura Clinical Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Admin Settings, Role-Based Access & AI Configuration Suite
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {error && (
            <div className="mb-6 bg-rose-950/50 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3 text-rose-200 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Security Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-950/50 border border-emerald-800/80 rounded-xl p-4 flex items-start gap-3 text-emerald-200 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">Success</p>
                <p>{success}</p>
              </div>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form className="space-y-5" onSubmit={handleSubmitLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@auradental.com"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setError(null);
                      setMode('forgot_password');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 shadow-lg shadow-cyan-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Admin Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD MODE */}
          {mode === 'forgot_password' && (
            <form className="space-y-4" onSubmit={handleRequestResetToken}>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-2">
                <KeyRound className="h-4 w-4" />
                Password Recovery
              </div>
              <p className="text-xs text-slate-400">
                Enter your account email to dispatch a secure one-time password reset token.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="admin@auradental.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !recoveryEmail}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                  Request Reset Token
                </button>
              </div>
            </form>
          )}

          {/* 3. RESET PASSWORD TOKEN ENTRY */}
          {mode === 'reset_password' && (
            <form className="space-y-4" onSubmit={handleExecutePasswordReset}>
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
                <Lock className="h-4 w-4" />
                Set New Password
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  One-Time Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Strong Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, mixed case, numbers & symbols"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resetToken || !newPassword}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Update Password & Sign In
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-slate-800/80">
            <button
              onClick={onBackToPatientSite}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Patient Facing Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
