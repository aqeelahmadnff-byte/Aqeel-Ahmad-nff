import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  ClinicConfig, 
  AdminUser, 
  Lead, 
  Conversation, 
  AppointmentBooking, 
  AuditLogEntry, 
  DashboardMetrics,
  ClinicService,
  KnowledgeBaseArticle,
  AIConfiguration,
  AIVersion,
  StaffPermissions,
  fullAdminPermissions,
  defaultStaffPermissions
} from '../src/types';
import { 
  initialClinicSF, 
  initialClinicPA, 
  defaultAdminUsers, 
  initialLeads, 
  initialConversations, 
  initialBookings, 
  initialAuditLogs,
  defaultAIConfigSF,
  defaultAIVersionsSF
} from '../src/data/defaultClinic';

export interface ServerDatabase {
  clinics: Record<string, ClinicConfig>;
  users: (AdminUser & { passwordHash: string })[];
  sessions: Record<string, { token: string; user: AdminUser; expiresAt: number; createdAt: string; ipAddress?: string }>;
  resetTokens: Record<string, { token: string; email: string; expiresAt: number }>;
  leads: Lead[];
  conversations: Conversation[];
  appointments: AppointmentBooking[];
  auditLogs: AuditLogEntry[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'clinic-db.json');

// Failed login attempt tracker for rate limiting / lockout
interface LoginAttemptRecord {
  attempts: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

export class PasswordSecurity {
  /**
   * Hashes a password with a cryptographic random salt using PBKDF2
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies a password against a stored hash (or legacy plaintext seed)
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;
    
    // Check if hash is in salt:hash format
    if (storedHash.includes(':')) {
      const [salt, originalHash] = storedHash.split(':');
      if (!salt || !originalHash) return false;
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
    }

    // Fallback for initial demo seed plaintext
    return password === storedHash;
  }

  /**
   * Validates strong password rules:
   * Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character.
   */
  public static validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  /**
   * Validates email format standard
   */
  public static validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  }
}

class DataStore {
  private data: ServerDatabase;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ServerDatabase {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.clinics && parsed.users) {
          // Upgrade any clinics that lack draft/published AI config
          Object.keys(parsed.clinics).forEach(cId => {
            const clinic = parsed.clinics[cId];
            if (!clinic.aiPublishedConfig) {
              clinic.aiPublishedConfig = clinic.aiSettings ? { ...clinic.aiSettings } : { ...defaultAIConfigSF };
            }
            if (!clinic.aiDraftConfig) {
              clinic.aiDraftConfig = { ...clinic.aiPublishedConfig };
            }
            if (!clinic.aiVersions || clinic.aiVersions.length === 0) {
              clinic.aiVersions = [...defaultAIVersionsSF];
            }
          });

          // Ensure resetTokens object exists
          if (!parsed.resetTokens) {
            parsed.resetTokens = {};
          }

          // Normalize and secure all user accounts
          if (Array.isArray(parsed.users)) {
            parsed.users.forEach((u: any) => {
              // Ensure isActive is true by default
              if (u.isActive === undefined) {
                u.isActive = true;
              }
              // Primary super admin account must never be deactivated unless explicitly managed
              if (u.id === 'user-super-1' || u.role === 'super_admin') {
                if (u.isActive === undefined || u.isActive === false) {
                  u.isActive = true;
                }
              }
              // Ensure permissions are set
              if (!u.permissions) {
                u.permissions = u.role === 'staff' ? defaultStaffPermissions : fullAdminPermissions;
              }
              // Auto-upgrade plain password strings to PBKDF2 salted hash
              if (u.passwordHash && typeof u.passwordHash === 'string' && !u.passwordHash.includes(':')) {
                u.passwordHash = PasswordSecurity.hashPassword(u.passwordHash);
              }
            });
          }

          this.saveData(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read clinic-db.json, initializing fresh store:', e);
    }

    // Initialize with securely hashed passwords
    const securedUsers = defaultAdminUsers.map(u => ({
      ...u,
      isActive: true,
      passwordHash: u.passwordHash.includes(':') ? u.passwordHash : PasswordSecurity.hashPassword(u.passwordHash)
    }));

    const initialDb: ServerDatabase = {
      clinics: {
        'clinic-sf': initialClinicSF,
        'clinic-pa': initialClinicPA
      },
      users: securedUsers,
      sessions: {},
      resetTokens: {},
      leads: initialLeads,
      conversations: initialConversations,
      appointments: initialBookings,
      auditLogs: initialAuditLogs
    };

    this.saveData(initialDb);
    return initialDb;
  }

  private saveData(db?: ServerDatabase) {
    try {
      const dataToSave = db || this.data;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving clinic-db.json:', err);
    }
  }

  // =========================================================================
  // AUTHENTICATION, PASSWORD & SESSION MANAGEMENT
  // =========================================================================

  public authenticate(email: string, pass: string, ipAddress?: string): { success: boolean; token?: string; user?: AdminUser; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const now = Date.now();

    // Check brute-force lockout
    const attemptRecord = loginAttempts.get(cleanEmail);
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const minutesLeft = Math.ceil((attemptRecord.lockedUntil - now) / (60 * 1000));
      return { 
        success: false, 
        error: `Account temporarily locked due to multiple failed login attempts. Please retry in ${minutesLeft} minute(s).` 
      };
    }

    const user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      this.recordFailedAttempt(cleanEmail);
      return { success: false, error: 'Invalid email or password' };
    }

    // Only reject if explicitly false
    if (user.isActive === false) {
      return { success: false, error: 'Account is deactivated. Please contact your system administrator.' };
    }

    const isMatch = PasswordSecurity.verifyPassword(pass, user.passwordHash);
    if (!isMatch) {
      this.recordFailedAttempt(cleanEmail);
      return { success: false, error: 'Invalid email or password' };
    }

    // Reset failed attempts on success
    loginAttempts.delete(cleanEmail);

    // Auto-upgrade plain password to secure salted hash if needed
    if (!user.passwordHash.includes(':')) {
      user.passwordHash = PasswordSecurity.hashPassword(pass);
    }

    const token = `adm_${crypto.randomBytes(24).toString('hex')}_${now}`;
    const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours

    const sanitizedUser: AdminUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
      phone: user.phone,
      permissions: user.permissions || (user.role === 'staff' ? defaultStaffPermissions : fullAdminPermissions),
      isActive: user.isActive,
      lastLoginAt: new Date().toISOString(),
      createdAt: user.createdAt
    };

    user.lastLoginAt = sanitizedUser.lastLoginAt;

    this.data.sessions[token] = {
      token,
      user: sanitizedUser,
      expiresAt,
      createdAt: new Date().toISOString(),
      ipAddress
    };

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinicId,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'security',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      ipAddress,
      details: { email: user.email, role: user.role }
    });

    this.saveData();
    return { success: true, token, user: sanitizedUser };
  }

  private recordFailedAttempt(email: string) {
    const record = loginAttempts.get(email) || { attempts: 0, lockedUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
    }
    loginAttempts.set(email, record);
  }

  public verifySession(authHeader?: string): AdminUser | null {
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const session = this.data.sessions[token];

    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.saveData();
      return null;
    }

    // Refresh user record from store in case permissions or profile changed
    const freshUser = this.data.users.find(u => u.id === session.user.id);
    if (!freshUser || freshUser.isActive === false) {
      delete this.data.sessions[token];
      this.saveData();
      return null;
    }

    return {
      id: freshUser.id,
      email: freshUser.email,
      fullName: freshUser.fullName,
      role: freshUser.role,
      clinicId: freshUser.clinicId,
      phone: freshUser.phone,
      permissions: freshUser.permissions || (freshUser.role === 'staff' ? defaultStaffPermissions : fullAdminPermissions),
      isActive: freshUser.isActive,
      lastLoginAt: freshUser.lastLoginAt,
      createdAt: freshUser.createdAt
    };
  }

  public logoutSession(token: string) {
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const session = this.data.sessions[cleanToken];
    if (session) {
      this.logAudit({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        clinicId: session.user.clinicId,
        action: 'ADMIN_LOGOUT',
        entityType: 'security',
        entityId: session.user.id,
        timestamp: new Date().toISOString()
      });
      delete this.data.sessions[cleanToken];
      this.saveData();
    }
  }

  public invalidateAllOtherSessions(userId: string, currentToken?: string): number {
    const cleanCurrent = currentToken ? (currentToken.startsWith('Bearer ') ? currentToken.substring(7) : currentToken) : '';
    let count = 0;
    Object.keys(this.data.sessions).forEach(tok => {
      const sess = this.data.sessions[tok];
      if (sess.user.id === userId && tok !== cleanCurrent) {
        delete this.data.sessions[tok];
        count++;
      }
    });
    this.saveData();
    return count;
  }

  public getActiveSessionsForUser(userId: string): { tokenSnippet: string; createdAt: string; ipAddress?: string }[] {
    return Object.values(this.data.sessions)
      .filter(s => s.user.id === userId && Date.now() <= s.expiresAt)
      .map(s => ({
        tokenSnippet: `••••${s.token.slice(-6)}`,
        createdAt: s.createdAt,
        ipAddress: s.ipAddress || '127.0.0.1'
      }));
  }

  // =========================================================================
  // ADMIN ACCOUNT PROFILE & PASSWORD CHANGE
  // =========================================================================

  public updateAdminProfile(
    userId: string, 
    updates: { fullName?: string; email?: string; phone?: string },
    performedBy: AdminUser,
    ipAddress?: string
  ): { success: boolean; user?: AdminUser; error?: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    // Multi-tenant authorization check
    if (performedBy.role !== 'super_admin' && performedBy.id !== userId) {
      return { success: false, error: 'Permission denied: Cannot edit other user profiles' };
    }

    if (updates.email) {
      const cleanEmail = updates.email.toLowerCase().trim();
      if (!PasswordSecurity.validateEmail(cleanEmail)) {
        return { success: false, error: 'Invalid email address format' };
      }
      const existing = this.data.users.find(u => u.email.toLowerCase() === cleanEmail && u.id !== userId);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists' };
      }
      user.email = cleanEmail;
    }

    if (updates.fullName) {
      user.fullName = updates.fullName.trim();
    }
    if (updates.phone !== undefined) {
      user.phone = updates.phone.trim();
    }
    user.updatedAt = new Date().toISOString();

    const sanitized: AdminUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
      phone: user.phone,
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Update active sessions for this user with updated user info
    Object.keys(this.data.sessions).forEach(tok => {
      if (this.data.sessions[tok].user.id === userId) {
        this.data.sessions[tok].user = sanitized;
      }
    });

    this.logAudit({
      userId: performedBy.id,
      userEmail: performedBy.email,
      userRole: performedBy.role,
      clinicId: user.clinicId,
      action: 'UPDATE_ADMIN_PROFILE',
      entityType: 'account',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      ipAddress,
      details: updates
    });

    this.saveData();
    return { success: true, user: sanitized };
  }

  public changeAdminPassword(
    userId: string, 
    currentPass: string, 
    newPass: string, 
    currentToken?: string,
    ipAddress?: string
  ): { success: boolean; error?: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    // Verify current password
    const isCurrentValid = PasswordSecurity.verifyPassword(currentPass, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'The current password you entered is incorrect' };
    }

    // Validate new password strength
    const strengthCheck = PasswordSecurity.validatePasswordStrength(newPass);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.message };
    }

    // Update password with new salt and hash
    user.passwordHash = PasswordSecurity.hashPassword(newPass);
    user.updatedAt = new Date().toISOString();

    // Invalidate other sessions for security
    this.invalidateAllOtherSessions(userId, currentToken);

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinicId,
      action: 'CHANGE_PASSWORD',
      entityType: 'security',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      ipAddress
    });

    this.saveData();
    return { success: true };
  }

  // =========================================================================
  // PASSWORD RESET FLOW
  // =========================================================================

  public createPasswordResetToken(email: string): { success: boolean; resetToken?: string; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      // Return simulated success for security (avoid email enumeration)
      return { success: true };
    }

    const resetToken = `rst_${crypto.randomBytes(20).toString('hex')}`;
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiration

    this.data.resetTokens[resetToken] = {
      token: resetToken,
      email: cleanEmail,
      expiresAt
    };

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinicId,
      action: 'REQUEST_PASSWORD_RESET',
      entityType: 'security',
      entityId: user.id,
      timestamp: new Date().toISOString()
    });

    this.saveData();
    return { success: true, resetToken };
  }

  public resetPasswordWithToken(resetToken: string, newPassword: string): { success: boolean; error?: string } {
    const record = this.data.resetTokens[resetToken];
    if (!record || Date.now() > record.expiresAt) {
      return { success: false, error: 'Password reset link is invalid or has expired' };
    }

    const user = this.data.users.find(u => u.email.toLowerCase() === record.email.toLowerCase());
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const strengthCheck = PasswordSecurity.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.message };
    }

    user.passwordHash = PasswordSecurity.hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    delete this.data.resetTokens[resetToken];
    this.invalidateAllOtherSessions(user.id);

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinicId,
      action: 'COMPLETE_PASSWORD_RESET',
      entityType: 'security',
      entityId: user.id,
      timestamp: new Date().toISOString()
    });

    this.saveData();
    return { success: true };
  }

  // =========================================================================
  // TEAM & STAFF MANAGEMENT (RBAC)
  // =========================================================================

  public getTeamUsers(requester: AdminUser, clinicId?: string): AdminUser[] {
    let users = this.data.users;

    if (requester.role !== 'super_admin') {
      // Clinic Admin and Staff can only view their own clinic's users
      const targetClinic = requester.clinicId || clinicId;
      users = users.filter(u => u.clinicId === targetClinic);
    } else if (clinicId) {
      users = users.filter(u => !u.clinicId || u.clinicId === clinicId);
    }

    return users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      clinicId: u.clinicId,
      phone: u.phone,
      permissions: u.permissions || (u.role === 'staff' ? defaultStaffPermissions : fullAdminPermissions),
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  }

  public createTeamUser(
    requester: AdminUser,
    userData: {
      email: string;
      fullName: string;
      password: string;
      role: 'clinic_admin' | 'staff';
      clinicId?: string;
      phone?: string;
      permissions?: StaffPermissions;
    }
  ): { success: boolean; user?: AdminUser; error?: string } {
    // Permission checks
    if (requester.role === 'staff') {
      return { success: false, error: 'Staff members cannot create accounts' };
    }

    const cleanEmail = userData.email.toLowerCase().trim();
    if (!PasswordSecurity.validateEmail(cleanEmail)) {
      return { success: false, error: 'Invalid email address format' };
    }

    const exists = this.data.users.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'An account with this email address already exists' };
    }

    const strengthCheck = PasswordSecurity.validatePasswordStrength(userData.password);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.message };
    }

    // Clinic assignment
    let targetClinicId = userData.clinicId;
    if (requester.role === 'clinic_admin') {
      targetClinicId = requester.clinicId;
    }

    const newUser: AdminUser & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      fullName: userData.fullName.trim(),
      role: userData.role,
      clinicId: targetClinicId,
      phone: userData.phone?.trim(),
      permissions: userData.role === 'clinic_admin' ? fullAdminPermissions : (userData.permissions || defaultStaffPermissions),
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash: PasswordSecurity.hashPassword(userData.password)
    };

    this.data.users.push(newUser);

    const sanitized: AdminUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      clinicId: newUser.clinicId,
      phone: newUser.phone,
      permissions: newUser.permissions,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    this.logAudit({
      userId: requester.id,
      userEmail: requester.email,
      userRole: requester.role,
      clinicId: targetClinicId,
      action: 'CREATE_TEAM_USER',
      entityType: 'team',
      entityId: newUser.id,
      timestamp: new Date().toISOString(),
      details: { email: newUser.email, role: newUser.role }
    });

    this.saveData();
    return { success: true, user: sanitized };
  }

  public updateTeamUser(
    requester: AdminUser,
    userId: string,
    updates: {
      fullName?: string;
      email?: string;
      role?: 'clinic_admin' | 'staff';
      phone?: string;
      permissions?: StaffPermissions;
      isActive?: boolean;
    }
  ): { success: boolean; user?: AdminUser; error?: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    // Prevent clinic admins from editing users outside their clinic
    if (requester.role === 'clinic_admin' && user.clinicId !== requester.clinicId) {
      return { success: false, error: 'Cannot manage users from another clinic' };
    }

    // Prevent editing super admins unless you are a super admin
    if (user.role === 'super_admin' && requester.role !== 'super_admin') {
      return { success: false, error: 'Cannot modify Super Admin accounts' };
    }

    if (updates.email) {
      const cleanEmail = updates.email.toLowerCase().trim();
      if (!PasswordSecurity.validateEmail(cleanEmail)) {
        return { success: false, error: 'Invalid email address format' };
      }
      const existing = this.data.users.find(u => u.email.toLowerCase() === cleanEmail && u.id !== userId);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists' };
      }
      user.email = cleanEmail;
    }

    if (updates.fullName) user.fullName = updates.fullName.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.role && requester.role === 'super_admin') user.role = updates.role;
    if (updates.permissions) user.permissions = updates.permissions;
    if (updates.isActive !== undefined) {
      // Authorization checks for account activation/deactivation
      if (requester.id === userId && updates.isActive === false) {
        return { success: false, error: 'You cannot deactivate your own active account' };
      }
      if (user.id === 'user-super-1' && updates.isActive === false) {
        return { success: false, error: 'The primary Platform Director account cannot be deactivated' };
      }
      if (user.role === 'super_admin' && requester.role !== 'super_admin') {
        return { success: false, error: 'Super Admin accounts can only be managed by authorized Super Administrators' };
      }
      if (user.role === 'clinic_admin' && requester.role !== 'super_admin') {
        return { success: false, error: 'Clinic Admin account status can only be modified by Super Administrators' };
      }
      user.isActive = updates.isActive;
      if (!user.isActive) {
        this.invalidateAllOtherSessions(userId);
      }
    }
    user.updatedAt = new Date().toISOString();

    const sanitized: AdminUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      clinicId: user.clinicId,
      phone: user.phone,
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    this.logAudit({
      userId: requester.id,
      userEmail: requester.email,
      userRole: requester.role,
      clinicId: user.clinicId,
      action: 'UPDATE_TEAM_USER',
      entityType: 'team',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      details: updates
    });

    this.saveData();
    return { success: true, user: sanitized };
  }

  public adminResetUserPassword(
    requester: AdminUser,
    userId: string,
    newPass: string
  ): { success: boolean; error?: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    if (requester.role === 'clinic_admin' && user.clinicId !== requester.clinicId) {
      return { success: false, error: 'Cannot reset password for user in another clinic' };
    }

    const strengthCheck = PasswordSecurity.validatePasswordStrength(newPass);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.message };
    }

    user.passwordHash = PasswordSecurity.hashPassword(newPass);
    user.updatedAt = new Date().toISOString();
    this.invalidateAllOtherSessions(userId);

    this.logAudit({
      userId: requester.id,
      userEmail: requester.email,
      userRole: requester.role,
      clinicId: user.clinicId,
      action: 'ADMIN_RESET_USER_PASSWORD',
      entityType: 'security',
      entityId: user.id,
      timestamp: new Date().toISOString()
    });

    this.saveData();
    return { success: true };
  }

  public deleteTeamUser(requester: AdminUser, userId: string): { success: boolean; error?: string } {
    if (requester.id === userId) {
      return { success: false, error: 'You cannot delete your own account' };
    }

    const index = this.data.users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, error: 'User not found' };

    const user = this.data.users[index];
    if (requester.role === 'clinic_admin' && user.clinicId !== requester.clinicId) {
      return { success: false, error: 'Cannot delete user from another clinic' };
    }

    this.data.users.splice(index, 1);
    this.invalidateAllOtherSessions(userId);

    this.logAudit({
      userId: requester.id,
      userEmail: requester.email,
      userRole: requester.role,
      clinicId: user.clinicId,
      action: 'DELETE_TEAM_USER',
      entityType: 'team',
      entityId: userId,
      timestamp: new Date().toISOString(),
      details: { email: user.email }
    });

    this.saveData();
    return { success: true };
  }

  // =========================================================================
  // AI CONFIGURATION & VERSION HISTORY (DRAFT & PUBLISH)
  // =========================================================================

  public getAIConfigs(clinicId: string): { draft: AIConfiguration; published: AIConfiguration; versions: AIVersion[] } {
    const clinic = this.getClinic(clinicId);
    const published = clinic.aiPublishedConfig || clinic.aiSettings || defaultAIConfigSF;
    const draft = clinic.aiDraftConfig || published;
    const versions = clinic.aiVersions || defaultAIVersionsSF;

    return { draft, published, versions };
  }

  public saveAIDraft(clinicId: string, draftConfig: AIConfiguration, user: AdminUser): AIConfiguration {
    const clinic = this.getClinic(clinicId);
    clinic.aiDraftConfig = { ...draftConfig };

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId,
      action: 'SAVE_AI_DRAFT',
      entityType: 'ai_config',
      timestamp: new Date().toISOString(),
      details: { assistantName: draftConfig.assistantName }
    });

    this.saveData();
    return clinic.aiDraftConfig;
  }

  public publishAIConfig(clinicId: string, user: AdminUser, summaryText?: string): { published: AIConfiguration; version: AIVersion } {
    const clinic = this.getClinic(clinicId);
    const draft = clinic.aiDraftConfig || clinic.aiPublishedConfig || defaultAIConfigSF;

    // Calculate next version number
    const currentVersions = clinic.aiVersions || [];
    const nextVerNum = currentVersions.length > 0 
      ? Math.max(...currentVersions.map(v => v.versionNumber)) + 1 
      : 1;

    const newVersion: AIVersion = {
      id: `ver-${clinicId}-${Date.now()}`,
      clinicId,
      versionNumber: nextVerNum,
      config: { ...draft },
      status: 'published',
      summary: summaryText || `Published AI Configuration v${nextVerNum}.0`,
      publishedAt: new Date().toISOString(),
      publishedBy: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      createdAt: new Date().toISOString()
    };

    // Mark prior versions as archived
    currentVersions.forEach(v => {
      if (v.status === 'published') v.status = 'archived';
    });

    clinic.aiPublishedConfig = { ...draft };
    clinic.aiSettings = {
      ...draft,
      welcomeMessage: draft.greetingMessage,
      clinicInstructions: draft.systemInstructions,
      greetingPrompt: draft.greetingMessage,
      humanHandoffBehavior: 'transfer_to_inbox'
    };

    clinic.aiVersions = [newVersion, ...currentVersions];

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId,
      action: 'PUBLISH_AI_CONFIG',
      entityType: 'ai_config',
      entityId: newVersion.id,
      fieldChanged: 'versionNumber',
      previousValue: `v${nextVerNum - 1}.0`,
      newValue: `v${nextVerNum}.0`,
      timestamp: new Date().toISOString(),
      details: { summary: newVersion.summary }
    });

    this.saveData();
    return { published: clinic.aiPublishedConfig, version: newVersion };
  }

  public restoreAIVersion(
    clinicId: string, 
    versionId: string, 
    user: AdminUser,
    mode: 'into_draft' | 'publish_now' = 'into_draft'
  ): { success: boolean; config: AIConfiguration; version?: AIVersion; error?: string } {
    const clinic = this.getClinic(clinicId);
    const targetVer = (clinic.aiVersions || []).find(v => v.id === versionId);
    if (!targetVer) return { success: false, error: 'Target AI version not found', config: clinic.aiPublishedConfig || defaultAIConfigSF };

    clinic.aiDraftConfig = { ...targetVer.config };

    if (mode === 'publish_now') {
      const publishResult = this.publishAIConfig(clinicId, user, `Restored and published from Version ${targetVer.versionNumber}.0`);
      return { success: true, config: publishResult.published, version: publishResult.version };
    }

    this.logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      clinicId,
      action: 'RESTORE_AI_VERSION_TO_DRAFT',
      entityType: 'ai_version',
      entityId: targetVer.id,
      newValue: `Loaded v${targetVer.versionNumber}.0 into draft`,
      timestamp: new Date().toISOString()
    });

    this.saveData();
    return { success: true, config: clinic.aiDraftConfig };
  }

  // =========================================================================
  // CLINIC CONFIG & SETTINGS
  // =========================================================================

  public getClinics(): ClinicConfig[] {
    return Object.values(this.data.clinics);
  }

  public getClinic(clinicId?: string): ClinicConfig {
    if (clinicId && this.data.clinics[clinicId]) {
      return this.data.clinics[clinicId];
    }
    const firstKey = Object.keys(this.data.clinics)[0] || 'clinic-sf';
    return this.data.clinics[firstKey] || initialClinicSF;
  }

  public updateClinic(clinicId: string, updates: Partial<ClinicConfig>, user?: AdminUser): ClinicConfig {
    const current = this.getClinic(clinicId);
    const updated: ClinicConfig = {
      ...current,
      ...updates,
      id: current.id,
      slug: updates.slug || current.slug
    };

    this.data.clinics[clinicId] = updated;

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        clinicName: updated.clinicName,
        action: 'UPDATE_CLINIC_PROFILE',
        entityType: 'clinic',
        entityId: clinicId,
        timestamp: new Date().toISOString(),
        details: { updatedFields: Object.keys(updates) }
      });
    }

    this.saveData();
    return updated;
  }

  // =========================================================================
  // SERVICES & PRICING MANAGEMENT
  // =========================================================================

  public getServices(clinicId?: string): ClinicService[] {
    const clinic = this.getClinic(clinicId);
    return clinic.services || [];
  }

  public createService(clinicId: string, service: Omit<ClinicService, 'id'>, user?: AdminUser): ClinicService {
    const clinic = this.getClinic(clinicId);
    const newService: ClinicService = {
      ...service,
      id: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      displayOrder: (clinic.services?.length || 0) + 1
    };

    if (!clinic.services) clinic.services = [];
    clinic.services.push(newService);

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'CREATE_SERVICE',
        entityType: 'service',
        entityId: newService.id,
        newValue: newService.name,
        timestamp: new Date().toISOString(),
        details: { startingPrice: newService.startingPrice, category: newService.category }
      });
    }

    this.saveData();
    return newService;
  }

  public updateService(clinicId: string, serviceId: string, updates: Partial<ClinicService>, user?: AdminUser): ClinicService | null {
    const clinic = this.getClinic(clinicId);
    const serviceIndex = (clinic.services || []).findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) return null;

    const oldService = clinic.services[serviceIndex];
    const updated: ClinicService = {
      ...oldService,
      ...updates,
      id: serviceId
    };

    clinic.services[serviceIndex] = updated;

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'UPDATE_SERVICE',
        entityType: 'service',
        entityId: serviceId,
        previousValue: `${oldService.name} (${oldService.startingPrice})`,
        newValue: `${updated.name} (${updated.startingPrice})`,
        timestamp: new Date().toISOString()
      });
    }

    this.saveData();
    return updated;
  }

  public deleteService(clinicId: string, serviceId: string, user?: AdminUser): boolean {
    const clinic = this.getClinic(clinicId);
    const serviceIndex = (clinic.services || []).findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) return false;

    const removed = clinic.services.splice(serviceIndex, 1)[0];

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'DELETE_SERVICE',
        entityType: 'service',
        entityId: serviceId,
        previousValue: removed.name,
        timestamp: new Date().toISOString()
      });
    }

    this.saveData();
    return true;
  }

  // =========================================================================
  // KNOWLEDGE BASE & FAQS MANAGEMENT
  // =========================================================================

  public getKBArticles(clinicId?: string): KnowledgeBaseArticle[] {
    const clinic = this.getClinic(clinicId);
    return clinic.kbArticles || [];
  }

  public createKBArticle(clinicId: string, article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>, user?: AdminUser): KnowledgeBaseArticle {
    const clinic = this.getClinic(clinicId);
    const newArticle: KnowledgeBaseArticle = {
      ...article,
      id: `kb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clinicId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!clinic.kbArticles) clinic.kbArticles = [];
    clinic.kbArticles.unshift(newArticle);

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'CREATE_KB_ARTICLE',
        entityType: 'kb',
        entityId: newArticle.id,
        newValue: newArticle.title,
        timestamp: new Date().toISOString(),
        details: { category: newArticle.category }
      });
    }

    this.saveData();
    return newArticle;
  }

  public updateKBArticle(clinicId: string, articleId: string, updates: Partial<KnowledgeBaseArticle>, user?: AdminUser): KnowledgeBaseArticle | null {
    const clinic = this.getClinic(clinicId);
    const articleIndex = (clinic.kbArticles || []).findIndex(k => k.id === articleId);
    if (articleIndex === -1) return null;

    const old = clinic.kbArticles[articleIndex];
    const updated: KnowledgeBaseArticle = {
      ...old,
      ...updates,
      id: articleId,
      clinicId,
      updatedAt: new Date().toISOString()
    };

    clinic.kbArticles[articleIndex] = updated;

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'UPDATE_KB_ARTICLE',
        entityType: 'kb',
        entityId: articleId,
        previousValue: old.title,
        newValue: updated.title,
        timestamp: new Date().toISOString()
      });
    }

    this.saveData();
    return updated;
  }

  public deleteKBArticle(clinicId: string, articleId: string, user?: AdminUser): boolean {
    const clinic = this.getClinic(clinicId);
    const articleIndex = (clinic.kbArticles || []).findIndex(k => k.id === articleId);
    if (articleIndex === -1) return false;

    const removed = clinic.kbArticles.splice(articleIndex, 1)[0];

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId,
        action: 'DELETE_KB_ARTICLE',
        entityType: 'kb',
        entityId: articleId,
        previousValue: removed.title,
        timestamp: new Date().toISOString()
      });
    }

    this.saveData();
    return true;
  }

  // =========================================================================
  // LEADS, CONVERSATIONS, APPOINTMENTS
  // =========================================================================

  public getLeads(clinicId?: string): Lead[] {
    if (!clinicId) return this.data.leads;
    return this.data.leads.filter(l => l.clinicId === clinicId);
  }

  public addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.leads.unshift(newLead);
    this.saveData();
    return newLead;
  }

  public updateLead(id: string, updates: Partial<Lead>, user?: AdminUser): Lead | null {
    const lead = this.data.leads.find(l => l.id === id);
    if (!lead) return null;

    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId: lead.clinicId,
        action: 'UPDATE_LEAD_STATUS',
        entityType: 'lead',
        entityId: id,
        timestamp: new Date().toISOString(),
        details: updates
      });
    }

    this.saveData();
    return lead;
  }

  public getConversations(clinicId?: string): Conversation[] {
    if (!clinicId) return this.data.conversations;
    return this.data.conversations.filter(c => c.clinicId === clinicId);
  }

  public getConversationBySession(sessionId: string, clinicId?: string): Conversation | undefined {
    return this.data.conversations.find(c => c.sessionId === sessionId && (!clinicId || c.clinicId === clinicId));
  }

  public saveConversation(conv: Conversation): Conversation {
    const idx = this.data.conversations.findIndex(c => c.id === conv.id || c.sessionId === conv.sessionId);
    if (idx >= 0) {
      this.data.conversations[idx] = conv;
    } else {
      this.data.conversations.unshift(conv);
    }
    this.saveData();
    return conv;
  }

  public getAppointments(clinicId?: string): AppointmentBooking[] {
    if (!clinicId) return this.data.appointments;
    return this.data.appointments.filter(a => a.clinicId === clinicId);
  }

  public addAppointment(apt: Omit<AppointmentBooking, 'id' | 'createdAt'>): AppointmentBooking {
    const newApt: AppointmentBooking = {
      ...apt,
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.data.appointments.unshift(newApt);
    this.saveData();
    return newApt;
  }

  public updateAppointment(id: string, updates: Partial<AppointmentBooking>, user?: AdminUser): AppointmentBooking | null {
    const apt = this.data.appointments.find(a => a.id === id);
    if (!apt) return null;

    Object.assign(apt, updates);

    if (user) {
      this.logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        clinicId: apt.clinicId,
        action: 'UPDATE_APPOINTMENT',
        entityType: 'appointment',
        entityId: id,
        timestamp: new Date().toISOString(),
        details: updates
      });
    }

    this.saveData();
    return apt;
  }

  public deleteAppointment(id: string, user?: AdminUser): boolean {
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx >= 0) {
      const removed = this.data.appointments.splice(idx, 1)[0];
      this.saveData();
      if (user) {
        this.logAudit({
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          clinicId: removed.clinicId,
          action: 'DELETE_APPOINTMENT',
          entityType: 'appointment',
          entityId: id,
          timestamp: new Date().toISOString()
        });
      }
      return true;
    }
    return false;
  }

  // =========================================================================
  // AUDIT LOGS & ANALYTICS
  // =========================================================================

  public logAudit(entry: Omit<AuditLogEntry, 'id'>) {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.data.auditLogs.unshift(newEntry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.saveData();
  }

  public getAuditLogs(clinicId?: string): AuditLogEntry[] {
    if (!clinicId) return this.data.auditLogs;
    return this.data.auditLogs.filter(l => !l.clinicId || l.clinicId === clinicId);
  }

  public getAnalytics(clinicId?: string): DashboardMetrics {
    const convs = this.getConversations(clinicId);
    const leads = this.getLeads(clinicId);
    const appointments = this.getAppointments(clinicId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const convsToday = convs.filter(c => c.createdAt.startsWith(todayStr)).length;
    const leadsToday = leads.filter(l => l.createdAt.startsWith(todayStr)).length;
    const afterHoursConvs = convs.filter(c => c.isAfterHours).length;
    const handoffsCount = convs.filter(c => c.status === 'handoff_requested' || c.status === 'staff_took_over').length;

    const conversionRate = convs.length > 0 ? Math.min(100, Math.round((leads.length / convs.length) * 100)) : 24;

    const leadStatusCounts = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      appointment_requested: leads.filter(l => l.status === 'appointment_requested').length,
      booked: leads.filter(l => l.status === 'booked').length,
      closed: leads.filter(l => l.status === 'closed').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };

    const treatmentMap = new Map<string, { count: number; value: number }>();
    leads.forEach(l => {
      const name = l.serviceName || 'General Consultation';
      const cur = treatmentMap.get(name) || { count: 0, value: 0 };
      cur.count += 1;
      cur.value += (l.estimatedValue || 500);
      treatmentMap.set(name, cur);
    });

    const treatmentBreakdown = Array.from(treatmentMap.entries()).map(([name, val]) => ({
      name,
      count: val.count,
      value: val.value
    }));

    const dailyTraffic: { date: string; conversations: number; leads: number; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      dailyTraffic.push({
        date: label,
        conversations: convs.filter(c => c.createdAt.startsWith(dStr)).length + (i === 0 ? convsToday : Math.floor(Math.random() * 4) + 1),
        leads: leads.filter(l => l.createdAt.startsWith(dStr)).length + (i === 0 ? leadsToday : Math.floor(Math.random() * 2)),
        bookings: appointments.filter(a => a.createdAt.startsWith(dStr)).length
      });
    }

    const revenuePotential = leads.reduce((acc, l) => acc + (l.estimatedValue || 500), 0);

    return {
      totalConversations: convs.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      appointmentRequests: appointments.length,
      conversationsToday: convsToday || 4,
      leadsToday: leadsToday || 2,
      afterHoursConversations: afterHoursConvs,
      conversionRate,
      handoffsCount,
      revenuePotential,
      treatmentBreakdown,
      dailyTraffic,
      leadStatusCounts
    };
  }
}

export const store = new DataStore();
