import React, { useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  LogOut, 
  Laptop, 
  RefreshCw, 
  History,
  ShieldAlert
} from 'lucide-react';

export const AdminAccountTab: React.FC = () => {
  const { user, updateProfile, changePassword, logoutAllOtherSessions, activeClinic } = useAdminAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Sessions State
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    const result = await updateProfile({ fullName, email, phone });
    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccess('Account profile updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      setProfileError(result.error || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!isStrong) {
      setPassError('Please ensure your new password satisfies all strong password requirements.');
      return;
    }

    if (!passwordsMatch) {
      setPassError('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPass(true);
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setIsChangingPass(false);

    if (result.success) {
      setPassSuccess('Password changed securely. All other active sessions have been signed out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 5000);
    } else {
      setPassError(result.error || 'Failed to change password.');
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    setSessionError(null);
    setSessionSuccess(null);
    setIsLoggingOutOthers(true);

    const result = await logoutAllOtherSessions();
    setIsLoggingOutOthers(false);

    if (result.success) {
      setSessionSuccess(result.message || 'All other active sessions have been terminated.');
      setTimeout(() => setSessionSuccess(null), 4000);
    } else {
      setSessionError(result.error || 'Failed to invalidate other sessions.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            Security & Credentials
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            Admin Account Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your administrator credentials, email, password security, and active authentication sessions.
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 bg-slate-900 border-slate-700 text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Role: <span className="text-cyan-400 capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
          {user?.clinicId && (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 hidden sm:block">
              {activeClinic?.clinicName || 'Assigned Clinic'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Account Information */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">Profile Information</h3>
                <p className="text-xs text-slate-400">Update your administrator name and primary contact details</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Sterling"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@auradental.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for administrative login, password recovery, and emergency alerts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Direct Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (415) 555-0198"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating Account...
                    </>
                  ) : (
                    'Save Account Details'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions & Security Guard Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">Session Security</h3>
                <p className="text-xs text-slate-400">Manage active login tokens across devices</p>
              </div>
            </div>

            {sessionSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{sessionSuccess}</span>
              </div>
            )}

            {sessionError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{sessionError}</span>
              </div>
            )}

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Current Active Session</div>
                    <div className="text-[11px] text-slate-400">Web Browser • Authenticated via Salted Token</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Session Expiry: 24 Hours</span>
                <span>Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogoutAllOtherSessions}
              disabled={isLoggingOutOthers}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-amber-400" />
              {isLoggingOutOthers ? 'Signing Out Other Devices...' : 'Log Out All Other Active Sessions'}
            </button>
          </div>
        </div>

        {/* Right Column: Change Password & Security Policy */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">Change Password</h3>
                <p className="text-xs text-slate-400">Verify current password and set a new strong salted password</p>
              </div>
            </div>

            {passSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set new secure password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none transition-colors ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-rose-500/50 focus:border-rose-500'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Password Strength Checklist */}
              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Strong Password Requirements
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                    Min 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasUpper ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                    One uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasLower ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                    One lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                    One numerical digit (0-9)
                  </div>
                  <div className={`flex items-center gap-2 col-span-full ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                    One special symbol (!@#$%^&*)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPass || !isStrong || !passwordsMatch || !currentPassword}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isChangingPass ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Hashing & Updating Password...
                  </>
                ) : (
                  'Update Password & Sign Out Others'
                )}
              </button>
            </form>
          </div>

          {/* Security Protocols Info Box */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              Cryptographic Security Standard
            </div>
            <p>
              Admin passwords are cryptographically salted and hashed using high-iteration PBKDF2. Passwords are never logged, stored in plaintext, or transmitted to client browser payloads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
