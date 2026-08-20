import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser, ClinicConfig, StaffPermissions } from '../types';

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeClinicId: string;
  activeClinic: ClinicConfig | null;
  allClinics: { id: string; slug: string; clinicName: string; address: string; phone: string }[];
  hasPermission: (key: keyof StaffPermissions) => boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; email?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<{ success: boolean; error?: string }>;
  logoutAllOtherSessions: () => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetToken?: string; error?: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  switchClinic: (clinicId: string) => void;
  refreshClinicData: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'aura_admin_token';
const CLINIC_STORAGE_KEY = 'aura_active_clinic_id';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [activeClinicId, setActiveClinicId] = useState<string>(() => localStorage.getItem(CLINIC_STORAGE_KEY) || 'clinic-sf');
  const [activeClinic, setActiveClinic] = useState<ClinicConfig | null>(null);
  const [allClinics, setAllClinics] = useState<{ id: string; slug: string; clinicName: string; address: string; phone: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticated fetch wrapper
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  // Load clinic list
  const loadClinicsList = useCallback(async () => {
    try {
      const res = await fetch('/api/clinics');
      if (res.ok) {
        const list = await res.json();
        setAllClinics(list);
      }
    } catch (e) {
      console.warn('Could not load clinics list:', e);
    }
  }, []);

  // Load active clinic configuration
  const refreshClinicData = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinic/config?clinicId=${activeClinicId}`);
      if (res.ok) {
        const config = await res.json();
        setActiveClinic(config);
      }
    } catch (e) {
      console.warn('Could not refresh clinic config:', e);
    }
  }, [activeClinicId]);

  // Refresh user data from backend
  const refreshUserData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.clinicId && data.user.role !== 'super_admin') {
          setActiveClinicId(data.user.clinicId);
          localStorage.setItem(CLINIC_STORAGE_KEY, data.user.clinicId);
        }
      }
    } catch (e) {
      console.warn('Could not refresh user data:', e);
    }
  }, [authFetch, token]);

  // Check existing session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await loadClinicsList();

      if (token) {
        try {
          const res = await fetch('/api/admin/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            if (data.user.clinicId && data.user.role !== 'super_admin') {
              setActiveClinicId(data.user.clinicId);
              localStorage.setItem(CLINIC_STORAGE_KEY, data.user.clinicId);
            }
          } else {
            setToken(null);
            setUser(null);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        } catch (_err) {
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, loadClinicsList]);

  // Load clinic config on active clinic change
  useEffect(() => {
    refreshClinicData();
  }, [activeClinicId, refreshClinicData]);

  // Check RBAC permission for current user
  const hasPermission = useCallback((key: keyof StaffPermissions): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'clinic_admin') return true;
    return !!(user.permissions && user.permissions[key]);
  }, [user]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

        const targetClinic = data.user.clinicId || activeClinicId;
        setActiveClinicId(targetClinic);
        localStorage.setItem(CLINIC_STORAGE_KEY, targetClinic);

        await refreshClinicData();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await authFetch('/api/admin/auth/logout', { method: 'POST' });
      } catch (_e) {}
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const updateProfile = async (updates: { fullName?: string; email?: string; phone?: string }) => {
    try {
      const res = await authFetch('/api/admin/account/update-profile', {
        method: 'POST',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword?: string) => {
    try {
      const res = await authFetch('/api/admin/account/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to change password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const logoutAllOtherSessions = async () => {
    try {
      const res = await authFetch('/api/admin/account/logout-all', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to log out other sessions' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return {
        success: res.ok,
        message: data.message,
        resetToken: data.resetToken,
        error: !res.ok ? data.error : undefined
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const resetPassword = async (tokenStr: string, newPass: string) => {
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to reset password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const switchClinic = (clinicId: string) => {
    if (user?.role !== 'super_admin' && user?.clinicId && user.clinicId !== clinicId) {
      console.warn('Unauthorized clinic switch attempt');
      return;
    }
    setActiveClinicId(clinicId);
    localStorage.setItem(CLINIC_STORAGE_KEY, clinicId);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        activeClinicId,
        activeClinic,
        allClinics,
        hasPermission,
        login,
        logout,
        updateProfile,
        changePassword,
        logoutAllOtherSessions,
        forgotPassword,
        resetPassword,
        switchClinic,
        refreshClinicData,
        refreshUserData,
        authFetch
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
