import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminUser, AdminRole, StaffPermissions, defaultStaffPermissions, fullAdminPermissions } from '../../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building, 
  Shield, 
  RefreshCw,
  Edit2
} from 'lucide-react';

export const TeamPermissionsTab: React.FC = () => {
  const { user: currentUser, authFetch, activeClinic, allClinics } = useAdminAuth();
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Add User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('staff');
  const [newClinicId, setNewClinicId] = useState(activeClinic?.id || 'clinic-sf');
  const [newPermissions, setNewPermissions] = useState<StaffPermissions>({ ...defaultStaffPermissions });

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('staff');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<StaffPermissions>({ ...defaultStaffPermissions });

  // Reset Password State
  const [resetNewPass, setResetNewPass] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/team?clinicId=${activeClinic?.id || ''}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load team users');
      }
    } catch (_err) {
      setError('Network error while fetching team list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [activeClinic?.id]);

  const handleOpenAddModal = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setNewRole('staff');
    setNewClinicId(activeClinic?.id || 'clinic-sf');
    setNewPermissions({ ...defaultStaffPermissions });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: AdminUser) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditIsActive(u.isActive);
    setEditPermissions(u.permissions || (u.role === 'staff' ? defaultStaffPermissions : fullAdminPermissions));
    setIsEditModalOpen(true);
  };

  const handleOpenResetPassModal = (u: AdminUser) => {
    setSelectedUser(u);
    setResetNewPass('');
    setIsResetPassModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch('/api/admin/team/create', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          clinicId: newClinicId,
          phone: newPhone,
          permissions: newRole === 'staff' ? newPermissions : fullAdminPermissions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Team member ${newFullName} created successfully.`);
        setIsAddModalOpen(false);
        await fetchTeam();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authFetch(`/api/admin/team/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          isActive: editIsActive,
          permissions: editRole === 'staff' ? editPermissions : fullAdminPermissions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`User ${editFullName} updated successfully.`);
        setIsEditModalOpen(false);
        await fetchTeam();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while updating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(`/api/admin/team/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetNewPass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Password for ${selectedUser.fullName} has been reset.`);
        setIsResetPassModalOpen(false);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently delete user "${u.fullName}" (${u.email})?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/admin/team/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`User ${u.fullName} deleted.`);
        await fetchTeam();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (_e) {
      setError('Error deleting user');
    }
  };

  const permissionLabels: { key: keyof StaffPermissions; label: string; desc: string }[] = [
    { key: 'canViewLeads', label: 'View Leads', desc: 'Read inquiries & captured leads' },
    { key: 'canEditLeads', label: 'Manage Leads', desc: 'Change lead status & assign staff' },
    { key: 'canViewAppointments', label: 'View Appointments', desc: 'Read booked appointments' },
    { key: 'canEditAppointments', label: 'Manage Appointments', desc: 'Confirm, reschedule & cancel slots' },
    { key: 'canTakeoverChat', label: 'Live Chat Takeover', desc: 'Take over conversations in real time' },
    { key: 'canViewAnalytics', label: 'View Analytics', desc: 'Access revenue metrics & traffic' },
    { key: 'canEditServices', label: 'Edit Services & Pricing', desc: 'Modify treatment menu and pricing' },
    { key: 'canEditKnowledgeBase', label: 'Manage Knowledge Base', desc: 'Create and update FAQs and clinic policies' },
    { key: 'canEditClinicSettings', label: 'Clinic Settings & Hours', desc: 'Modify office hours and clinic info' },
    { key: 'canEditAIConfig', label: 'Edit AI Configuration', desc: 'Modify prompts, tone & draft rules' },
    { key: 'canPublishAIConfig', label: 'Publish AI to Live', desc: 'Deploy AI configuration to production' },
    { key: 'canViewAuditLogs', label: 'View Audit Logs', desc: 'Inspect security & activity history' },
    { key: 'canManageTeam', label: 'Manage Team & Roles', desc: 'Invite staff & configure permissions' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            Access Control & RBAC
          </div>
          <h2 className="text-2xl font-bold text-white font-serif tracking-tight">
            Team & Permissions Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage practice staff, assign roles (Super Admin, Clinic Admin, Staff), and enforce granular permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 flex items-center gap-2 self-start cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Add Team Member
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

      {/* Team List Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Active Accounts ({team.length})</h3>
          </div>
          <button
            onClick={fetchTeam}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Clinic Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions Overview</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {team.map((member) => {
                const isSuper = member.role === 'super_admin';
                const isClinicAdmin = member.role === 'clinic_admin';
                const isStaff = member.role === 'staff';

                return (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">{member.fullName}</div>
                      <div className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-500" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          {member.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          isSuper
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : isClinicAdmin
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="text-purple-300 font-medium">All Clinics (Platform-wide)</span>
                      ) : (
                        <span className="text-slate-300">
                          {allClinics.find(c => c.id === member.clinicId)?.clinicName || member.clinicId || 'Assigned Clinic'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSuper || isClinicAdmin ? (
                        <span className="text-slate-400 italic">Full Clinic Management</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Object.entries(member.permissions || {})
                            .filter(([_, val]) => val)
                            .slice(0, 4)
                            .map(([key]) => (
                              <span key={key} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                {key.replace('can', '')}
                              </span>
                            ))}
                          {Object.values(member.permissions || {}).filter(Boolean).length > 4 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400">
                              +{Object.values(member.permissions || {}).filter(Boolean).length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenResetPassModal(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Edit User & Permissions"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {currentUser?.id !== member.id && (
                          <button
                            onClick={() => handleDeleteUser(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <UserPlus className="h-5 w-5" />
                Add New Team Member
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Rachel Adams"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="rachel@auradental.com"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Strong Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars with mixed case & symbols"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (415) 555-0199"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role Assignment <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="staff">Staff / Patient Coordinator</option>
                    <option value="clinic_admin">Clinic Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Clinic Scope
                  </label>
                  <select
                    value={newClinicId}
                    onChange={(e) => setNewClinicId(e.target.value)}
                    disabled={currentUser?.role !== 'super_admin'}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  >
                    {allClinics.map(c => (
                      <option key={c.id} value={c.id}>{c.clinicName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Checklist (Only for Staff role) */}
              {newRole === 'staff' && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-cyan-400 mb-2">Granular Staff Permissions</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {permissionLabels.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950"
                      >
                        <input
                          type="checkbox"
                          checked={newPermissions[perm.key]}
                          onChange={(e) => setNewPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-medium text-slate-200">{perm.label}</div>
                          <div className="text-[10px] text-slate-500">{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Edit2 className="h-5 w-5" />
                Edit User & Permissions ({selectedUser.fullName})
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Permissions Checklist */}
              {selectedUser.role === 'staff' && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-cyan-400 mb-2">Granular Staff Permissions</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {permissionLabels.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950"
                      >
                        <input
                          type="checkbox"
                          checked={editPermissions[perm.key]}
                          onChange={(e) => setEditPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                        />
                        <div>
                          <div className="text-xs font-medium text-slate-200">{perm.label}</div>
                          <div className="text-[10px] text-slate-500">{perm.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Key className="h-5 w-5" />
                Reset User Password
              </div>
              <button
                onClick={() => setIsResetPassModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter a new secure password for <strong className="text-white">{selectedUser.fullName}</strong>.
              This will invalidate all their existing sessions.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Min 8 chars with mixed case & symbols"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resetNewPass}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
