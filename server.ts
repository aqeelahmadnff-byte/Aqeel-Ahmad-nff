import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { store, PasswordSecurity } from "./server/store";
import { 
  ClinicConfig, 
  AdminUser, 
  ChatMessage, 
  Conversation, 
  Lead, 
  AppointmentBooking, 
  StaffPermissions,
  AIConfiguration
} from "./src/types";
import { isClinicOpenNow, generateLocalCoordinatorResponse } from "./src/utils/coordinatorEngine";

interface AuthenticatedRequest extends Request {
  user?: AdminUser;
  token?: string;
}

// Lazy Gemini AI Client initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Failed to initialize Gemini SDK:", e);
    }
  }
  return aiClient;
}

// Authentication Middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const user = store.verifySession(authHeader);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
  }

  req.user = user;
  req.token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  next();
}

// Multi-tenant Data Isolation Middleware
function requireClinicAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const requestedClinicId = (req.query.clinicId as string) || (req.body?.clinicId as string) || (req.params?.clinicId as string);

  // Super admins have global cross-clinic access
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Clinic admins & staff must match their clinicId
  if (requestedClinicId && req.user.clinicId && req.user.clinicId !== requestedClinicId) {
    return res.status(403).json({ error: "Forbidden: You do not have permission to access another clinic's data" });
  }

  next();
}

// Permission checking middleware for staff
function requirePermission(permissionKey: keyof StaffPermissions) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === 'super_admin' || req.user.role === 'clinic_admin') {
      return next();
    }
    const permissions = req.user.permissions;
    if (permissions && permissions[permissionKey]) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: Missing required permission (${String(permissionKey)})` });
  };
}

function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'clinic_admin')) {
    return res.status(403).json({ error: "Forbidden: Administrator privileges required" });
  }
  next();
}

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: "Forbidden: Super Admin privileges required" });
  }
  next();
}

// Builds dynamic system instruction strictly grounded in the clinic's real published database configuration
export function buildDynamicSystemPrompt(config: ClinicConfig, customAIConfig?: AIConfiguration): string {
  const openStatus = isClinicOpenNow(config);
  const ai = customAIConfig || config.aiPublishedConfig || config.aiSettings;

  const servicesList = (config.services || [])
    .filter(s => s.isActive !== false)
    .map(s => {
      let priceText = '';
      if (!ai.canDiscussPrices || !s.aiCanMentionPrice) {
        priceText = 'Price: Requires personalized clinical examination (DO NOT invent or state fixed numerical prices)';
      } else if (s.promotionalPrice) {
        priceText = `Price: Starting at ${s.startingPrice} (Special Promo: ${s.promotionalPrice}) | Range: ${s.priceRange || s.startingPrice}`;
      } else if (s.priceRange) {
        priceText = `Price: Starting at ${s.startingPrice} (${s.priceRange})`;
      } else {
        priceText = `Price: Starting at ${s.startingPrice}`;
      }
      const doc = s.assignedDoctorName ? ` | Provider: ${s.assignedDoctorName}` : '';
      return `- **${s.name}** (${s.category}): ${priceText} | Duration: ${s.duration} | Summary: ${s.summary}${doc}${s.notes ? ` | Note: ${s.notes}` : ''}`;
    })
    .join('\n');

  const kbList = (config.kbArticles || [])
    .filter(k => k.isActive !== false)
    .map(k => `### [${k.category.toUpperCase()}] ${k.title}:\n${k.content}`)
    .join('\n\n');

  const doctorsList = (config.specialists || [])
    .filter(d => d.isActive !== false)
    .map(d => `- **${d.name}** (${d.title}): ${d.specialty} (${d.experience})`)
    .join('\n');

  const insurances = (config.insuranceAccepted || []).join(', ');
  const payments = (config.acceptedPayments || []).join(', ');
  const financing = (config.financingOptions || []).join('; ');

  const allowed = (ai.allowedTopics && ai.allowedTopics.length > 0)
    ? ai.allowedTopics.map(t => `- ${t}`).join('\n')
    : '- All cosmetic, restorative, orthodontics, emergency, and hygiene services';

  const restricted = (ai.restrictedTopics && ai.restrictedTopics.length > 0)
    ? ai.restrictedTopics.map(t => `- ${t}`).join('\n')
    : '- Providing medical diagnoses or prescribing drugs';

  const leadQuestions = (ai.leadQualificationQuestions && ai.leadQualificationQuestions.length > 0)
    ? ai.leadQualificationQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')
    : '1. Preferred consultation date and time\n2. Desired treatment';

  return `You are "${ai.assistantName || 'Aura'}", the authoritative, empathetic, and professional AI Patient Coordinator for **${config.clinicName}**.

### PERSONALITY & TONE:
${ai.personality || 'Empathetic, welcoming, meticulous, and reassuring.'}
- Tone style: ${ai.tone}
- Language: ${ai.language === 'es' ? 'Spanish' : ai.language === 'bilingual' ? 'Bilingual English & Spanish' : 'English'}

### CLINIC INTRODUCTION & GREETING:
- Introduction: ${ai.clinicIntroduction || config.about}
- Standard Greeting: ${ai.greetingMessage}

### CLINIC PROFILE & CONTACT:
- Clinic Name: ${config.clinicName}
- Tagline: ${config.tagline || ''}
- Address: ${config.address}, ${config.cityStateZip}
- Main Office Phone: ${config.phone}
- 24/7 Emergency Line: ${config.emergencyPhone}
- Email: ${config.email}
- Website: ${config.website || ''}
- Time Zone: ${config.timeZone || 'Local'}
- Doctors / Providers:
${doctorsList || 'Our lead licensed aesthetic and restorative dentists'}

### REAL-TIME OPERATING STATUS:
- Current Status: ${openStatus.isOpen ? 'OPEN NOW' : 'CURRENTLY CLOSED / AFTER HOURS'} (${openStatus.reason})
- After-Hours Policy: ${ai.afterHoursBehavior}
- After-Hours Message: "${config.businessHours?.afterHoursMessage || 'Our front desk is currently closed, but our AI coordinator is active 24/7.'}"

### VERIFIED CLINICAL SERVICES & PRICING (NEVER INVENT PRICES):
${servicesList || 'General dental consultations available.'}

### CLINIC KNOWLEDGE BASE, POLICIES & FAQ:
${kbList || 'Standard patient policies apply.'}

### INSURANCE, PAYMENT & FINANCING:
- In-Network Insurances: ${insurances}
- Payment Methods: ${payments}
- Financing Options: ${financing}
- Cancellation Policy: ${config.appointmentSettings?.cancellationPolicyText || '24 hours notice required.'}

### ALLOWED CONSULTATION TOPICS:
${allowed}

### RESTRICTED TOPICS & BOUNDARIES:
${restricted}

### EMERGENCY & SAFETY PROTOCOLS:
${ai.emergencyInstructions || `For severe trauma, knocked-out teeth, or swelling, provide first aid and highlight emergency line ${config.emergencyPhone}.`}

### BOOKING & LEAD QUALIFICATION PROTOCOLS:
- Booking Instructions: ${ai.bookingInstructions || 'Collect name, contact info, preferred date, and treatment.'}
- Lead Qualification Questions:
${leadQuestions}

### HUMAN HANDOFF & ESCALATION RULES:
- Escalation Rules: ${ai.escalationRules || 'Route to staff on human request or complex billing queries.'}
- Handoff Rules: ${ai.humanHandoffRules || `Provide office phone ${config.phone} and confirm team will follow up.`}

### CUSTOM CLINIC INSTRUCTIONS:
${ai.systemInstructions || 'Be courteous, concise, professional, and warmly welcoming.'}

### STRICT MANDATORY GUARDRAILS:
1. ${ai.neverDiagnose ? '**NEVER PROVIDE MEDICAL DIAGNOSES**: Explain that an accurate diagnosis requires an in-person clinical examination by a licensed dentist.' : ''}
2. ${ai.neverInventPrices ? '**NEVER INVENT OR DISCOUNT PRICES**: Quote ONLY verified prices listed above.' : ''}
3. ${ai.neverGuaranteeMedicalResults ? '**NEVER GUARANTEE MEDICAL RESULTS**: Treatment outcomes vary per patient.' : ''}
4. ${ai.identifyAsAI ? '**TRANSPARENCY**: Clearly identify as the AI Patient Coordinator when appropriate.' : ''}
5. **EMERGENCY ESCALATION**: For severe trauma, bleeding, or breathing difficulty, prioritize first-aid guidance and display our 24/7 emergency hotline (${config.emergencyPhone}).`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================

  app.post("/api/admin/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const authResult = store.authenticate(email, password, ipAddress);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error || "Invalid email or password" });
    }

    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user
    });
  });

  app.post("/api/admin/auth/logout", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.token) {
      store.logoutSession(req.token);
    }
    res.json({ success: true, message: "Logged out successfully" });
  });

  app.get("/api/admin/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, user: req.user });
  });

  app.post("/api/admin/auth/forgot-password", (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const result = store.createPasswordResetToken(email);
    res.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched.",
      resetToken: result.resetToken // Provided for evaluation / sandbox demo flows
    });
  });

  app.post("/api/admin/auth/reset-password", (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Reset token and new password are required" });
    }
    const result = store.resetPasswordWithToken(token, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Failed to reset password" });
    }
    res.json({ success: true, message: "Password has been successfully updated. You may now log in." });
  });

  // =========================================================================
  // ADMIN ACCOUNT & SECURITY SETTINGS
  // =========================================================================

  app.post("/api/admin/account/update-profile", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { fullName, email, phone } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const result = store.updateAdminProfile(
      req.user!.id,
      { fullName, email, phone },
      req.user!,
      ipAddress
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, user: result.user });
  });

  app.post("/api/admin/account/change-password", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirmation password do not match" });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const result = store.changeAdminPassword(
      req.user!.id,
      currentPassword,
      newPassword,
      req.token,
      ipAddress
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: "Password updated successfully. Other active sessions have been signed out." });
  });

  app.post("/api/admin/account/logout-all", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const count = store.invalidateAllOtherSessions(req.user!.id, req.token);
    res.json({ success: true, message: `Terminated ${count} other active session(s).` });
  });

  app.get("/api/admin/account/sessions", requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const sessions = store.getActiveSessionsForUser(req.user!.id);
    res.json({ success: true, sessions });
  });

  // =========================================================================
  // TEAM & PERMISSION MANAGEMENT (RBAC)
  // =========================================================================

  app.get("/api/admin/team", requireAuth, requireClinicAccess, (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const team = store.getTeamUsers(req.user!, clinicId);
    res.json(team);
  });

  app.post("/api/admin/team/create", requireAuth, requireAdminRole, (req: AuthenticatedRequest, res: Response) => {
    const { email, fullName, password, role, clinicId, phone, permissions } = req.body;
    if (!email || !fullName || !password || !role) {
      return res.status(400).json({ error: "Email, full name, password, and role are required" });
    }

    const result = store.createTeamUser(req.user!, {
      email,
      fullName,
      password,
      role,
      clinicId,
      phone,
      permissions
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, user: result.user });
  });

  app.patch("/api/admin/team/:userId", requireAuth, requireAdminRole, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId;
    const result = store.updateTeamUser(req.user!, userId, req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, user: result.user });
  });

  app.delete("/api/admin/team/:userId", requireAuth, requireAdminRole, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId;
    const result = store.deleteTeamUser(req.user!, userId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: "User deleted successfully" });
  });

  app.post("/api/admin/team/:userId/reset-password", requireAuth, requireAdminRole, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }
    const result = store.adminResetUserPassword(req.user!, userId, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: "User password reset successfully" });
  });

  // =========================================================================
  // AI CONFIGURATION, DRAFT / PUBLISH, VERSION HISTORY & TEST SANDBOX
  // =========================================================================

  app.get("/api/admin/ai/config", requireAuth, requireClinicAccess, (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.query.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const configs = store.getAIConfigs(clinicId);
    res.json(configs);
  });

  app.post("/api/admin/ai/draft", requireAuth, requireClinicAccess, requirePermission('canEditAIConfig'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const draftConfig: AIConfiguration = req.body.draftConfig;
    if (!draftConfig) {
      return res.status(400).json({ error: "draftConfig is required" });
    }

    const savedDraft = store.saveAIDraft(clinicId, draftConfig, req.user!);
    res.json({ success: true, draft: savedDraft });
  });

  app.post("/api/admin/ai/publish", requireAuth, requireClinicAccess, requirePermission('canPublishAIConfig'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const summaryText = req.body.summary as string;

    const result = store.publishAIConfig(clinicId, req.user!, summaryText);
    res.json({ success: true, published: result.published, version: result.version });
  });

  app.get("/api/admin/ai/versions", requireAuth, requireClinicAccess, (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.query.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const configs = store.getAIConfigs(clinicId);
    res.json(configs.versions);
  });

  app.post("/api/admin/ai/versions/:versionId/restore", requireAuth, requireClinicAccess, requirePermission('canEditAIConfig'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const versionId = req.params.versionId;
    const mode = req.body.mode || 'into_draft';

    const result = store.restoreAIVersion(clinicId, versionId, req.user!, mode);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Sandbox simulation endpoint to test AI drafts safely
  app.post("/api/admin/ai/test", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message, customAIConfig, clinicId = req.user?.clinicId || 'clinic-sf', history = [] } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const clinic = store.getClinic(clinicId);
      const ai = getAIClient();

      if (ai) {
        try {
          const systemPrompt = buildDynamicSystemPrompt(clinic, customAIConfig);
          const contents = history.map((h: { role: string; text: string }) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }]
          }));
          contents.push({ role: "user", parts: [{ text: message }] });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 8000)
          );

          const geminiPromise = ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.3,
            }
          });

          const geminiResponse = await Promise.race([geminiPromise, timeoutPromise]);
          return res.json({
            success: true,
            text: geminiResponse.text || "Hello! How may I assist you?",
            systemPromptPreview: systemPrompt
          });
        } catch (_err) {
          // Fallback to local coordinator response
          const local = generateLocalCoordinatorResponse(message, {
            ...clinic,
            aiSettings: customAIConfig || clinic.aiSettings
          });
          return res.json({
            success: true,
            text: local.text,
            suggestions: local.suggestions,
            systemPromptPreview: buildDynamicSystemPrompt(clinic, customAIConfig)
          });
        }
      }

      const local = generateLocalCoordinatorResponse(message, {
        ...clinic,
        aiSettings: customAIConfig || clinic.aiSettings
      });
      return res.json({
        success: true,
        text: local.text,
        suggestions: local.suggestions,
        systemPromptPreview: buildDynamicSystemPrompt(clinic, customAIConfig)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to simulate AI response" });
    }
  });

  // =========================================================================
  // CLINIC CONFIGURATION & SETTINGS
  // =========================================================================

  app.get(["/api/clinic/config", "/api/clinic-config"], (req: Request, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const config = store.getClinic(clinicId);
    res.json(config);
  });

  app.get("/api/clinics", (_req: Request, res: Response) => {
    const clinics = store.getClinics();
    res.json(clinics);
  });

  app.patch("/api/admin/clinic/profile", requireAuth, requireClinicAccess, requirePermission('canEditClinicSettings'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const updated = store.updateClinic(clinicId, req.body, req.user);
    res.json({ success: true, clinic: updated });
  });

  app.patch("/api/admin/clinic/hours", requireAuth, requireClinicAccess, requirePermission('canEditClinicSettings'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const updated = store.updateClinic(clinicId, { businessHours: req.body.businessHours }, req.user);
    res.json({ success: true, clinic: updated });
  });

  app.patch("/api/admin/clinic/settings", requireAuth, requireClinicAccess, requirePermission('canEditClinicSettings'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const updated = store.updateClinic(clinicId, req.body, req.user);
    res.json({ success: true, clinic: updated });
  });

  // =========================================================================
  // SERVICES & PRICING ENDPOINTS
  // =========================================================================

  app.get("/api/services", (req: Request, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const services = store.getServices(clinicId);
    res.json(services);
  });

  app.post("/api/admin/services", requireAuth, requireClinicAccess, requirePermission('canEditServices'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const service = store.createService(clinicId, req.body, req.user);
    res.json({ success: true, service });
  });

  app.patch("/api/admin/services/:id", requireAuth, requireClinicAccess, requirePermission('canEditServices'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const serviceId = req.params.id;
    const updated = store.updateService(clinicId, serviceId, req.body, req.user);
    if (!updated) return res.status(404).json({ error: "Service not found" });
    res.json({ success: true, service: updated });
  });

  app.delete("/api/admin/services/:id", requireAuth, requireClinicAccess, requirePermission('canEditServices'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.query.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const serviceId = req.params.id;
    const deleted = store.deleteService(clinicId, serviceId, req.user);
    res.json({ success: deleted });
  });

  // =========================================================================
  // KNOWLEDGE BASE & FAQS ENDPOINTS
  // =========================================================================

  app.get("/api/kb", (req: Request, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const articles = store.getKBArticles(clinicId);
    res.json(articles);
  });

  app.post("/api/admin/kb", requireAuth, requireClinicAccess, requirePermission('canEditKnowledgeBase'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const article = store.createKBArticle(clinicId, req.body, req.user);
    res.json({ success: true, article });
  });

  app.patch("/api/admin/kb/:id", requireAuth, requireClinicAccess, requirePermission('canEditKnowledgeBase'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.body.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const articleId = req.params.id;
    const updated = store.updateKBArticle(clinicId, articleId, req.body, req.user);
    if (!updated) return res.status(404).json({ error: "Article not found" });
    res.json({ success: true, article: updated });
  });

  app.delete("/api/admin/kb/:id", requireAuth, requireClinicAccess, requirePermission('canEditKnowledgeBase'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = (req.query.clinicId as string) || req.user?.clinicId || 'clinic-sf';
    const articleId = req.params.id;
    const deleted = store.deleteKBArticle(clinicId, articleId, req.user);
    res.json({ success: deleted });
  });

  // =========================================================================
  // LEADS & INBOX
  // =========================================================================

  app.get("/api/leads", requireAuth, requireClinicAccess, requirePermission('canViewLeads'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const leads = store.getLeads(clinicId);
    res.json(leads);
  });

  app.post("/api/leads", (req: Request, res: Response) => {
    const { name, phone, email, serviceId, serviceName, preferredTime, message, source, clinicId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone number are required" });
    }

    const targetClinic = clinicId || 'clinic-sf';
    const lead = store.addLead({
      clinicId: targetClinic,
      name,
      phone,
      email: email || '',
      serviceId,
      serviceName: serviceName || 'General Consultation',
      preferredTime: preferredTime || 'Flexible',
      message: message || '',
      source: source || 'chat',
      status: 'new',
      estimatedValue: 500
    });

    res.json({ success: true, lead });
  });

  app.patch("/api/leads/:id", requireAuth, requireClinicAccess, requirePermission('canEditLeads'), (req: AuthenticatedRequest, res: Response) => {
    const leadId = req.params.id;
    const updated = store.updateLead(leadId, req.body, req.user);
    if (!updated) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json({ success: true, lead: updated });
  });

  app.get("/api/conversations", requireAuth, requireClinicAccess, (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const convs = store.getConversations(clinicId);
    res.json(convs);
  });

  app.post("/api/conversations/:id/takeover", requireAuth, requirePermission('canTakeoverChat'), (req: AuthenticatedRequest, res: Response) => {
    const convId = req.params.id;
    const { staffMessage } = req.body;
    const convs = store.getConversations();
    const conv = convs.find(c => c.id === convId);

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    conv.status = 'staff_took_over';
    conv.assignedTo = req.user?.fullName || 'Staff Coordinator';
    conv.updatedAt = new Date().toISOString();

    if (staffMessage) {
      conv.messages.push({
        id: `staff-${Date.now()}`,
        role: 'staff',
        text: staffMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStaffTakeover: true,
        staffName: req.user?.fullName
      });
    }

    store.saveConversation(conv);
    res.json({ success: true, conversation: conv });
  });

  // =========================================================================
  // APPOINTMENTS
  // =========================================================================

  app.get("/api/appointments", requireAuth, requireClinicAccess, requirePermission('canViewAppointments'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const appointments = store.getAppointments(clinicId);
    res.json(appointments);
  });

  app.post("/api/appointments", (req: Request, res: Response) => {
    const { fullName, contact, preferredDate, preferredTime, treatment, clinicId, doctorAssigned, source } = req.body;
    if (!fullName || !contact || !preferredDate || !treatment) {
      return res.status(400).json({ error: "Full name, contact, date, and treatment are required" });
    }

    const targetClinic = clinicId || 'clinic-sf';
    const apt = store.addAppointment({
      clinicId: targetClinic,
      fullName,
      contact,
      preferredDate,
      preferredTime: preferredTime || '09:00',
      treatment,
      doctorAssigned: doctorAssigned || 'Dr. Elena Vance, DDS',
      status: 'confirmed',
      source: source || 'booking_form'
    });

    res.json({ success: true, appointment: apt });
  });

  app.patch("/api/appointments/:id", requireAuth, requireClinicAccess, requirePermission('canEditAppointments'), (req: AuthenticatedRequest, res: Response) => {
    const aptId = req.params.id;
    const updated = store.updateAppointment(aptId, req.body, req.user);
    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ success: true, appointment: updated });
  });

  app.delete("/api/appointments/:id", requireAuth, requireClinicAccess, requirePermission('canEditAppointments'), (req: AuthenticatedRequest, res: Response) => {
    const aptId = req.params.id;
    const deleted = store.deleteAppointment(aptId, req.user);
    res.json({ success: deleted });
  });

  // =========================================================================
  // ANALYTICS & AUDIT LOGS
  // =========================================================================

  app.get("/api/admin/analytics", requireAuth, requireClinicAccess, requirePermission('canViewAnalytics'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const analytics = store.getAnalytics(clinicId);
    res.json(analytics);
  });

  app.get("/api/admin/audit-logs", requireAuth, requireClinicAccess, requirePermission('canViewAuditLogs'), (req: AuthenticatedRequest, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const logs = store.getAuditLogs(clinicId);
    res.json(logs);
  });

  // =========================================================================
  // PATIENT AI CHAT ENDPOINT (GROUNDED ON PUBLISHED CONFIG)
  // =========================================================================

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, history = [], clinicId, sessionId = `sess-${Date.now()}` } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const activeConfig = store.getClinic(clinicId);
      const isAfterHours = !isClinicOpenNow(activeConfig).isOpen;
      const ai = getAIClient();

      let textOutput = "";
      let suggestions: string[] = [];
      let bookingPrompt = false;
      let emergencyNotice = false;
      let serviceMentioned: string | undefined;

      if (ai) {
        try {
          const systemPrompt = buildDynamicSystemPrompt(activeConfig);
          const contents = history.map((h: { role: string; text: string }) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }]
          }));

          contents.push({
            role: "user",
            parts: [{ text: message }]
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini request timeout")), 8500)
          );

          const geminiPromise = ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.35,
            }
          });

          const geminiResponse = await Promise.race([geminiPromise, timeoutPromise]);
          textOutput = geminiResponse.text || `Welcome to **${activeConfig.clinicName}**. How may I assist you with your dental care today?`;

          const lowerMsg = message.toLowerCase();
          if (lowerMsg.includes('whitening')) {
            suggestions = ["Book Teeth Whitening", "Invisalign pricing", "Clinic hours & address"];
            serviceMentioned = "Teeth Whitening";
          } else if (lowerMsg.includes('invisalign') || lowerMsg.includes('aligner')) {
            suggestions = ["Book complimentary 3D scan", "0% APR Payment Plans", "Teeth Whitening cost"];
            serviceMentioned = "Invisalign® Clear Aligners";
          } else if (lowerMsg.includes('implant')) {
            suggestions = ["Book Implant Assessment", "Implant vs Bridge", "Accepted Insurances"];
            serviceMentioned = "Dental Implants";
          } else if (lowerMsg.includes('emergency') || lowerMsg.includes('pain') || lowerMsg.includes('broken')) {
            suggestions = ["Book urgent emergency slot", "Call Emergency Hotline", "View clinic address"];
            emergencyNotice = true;
            serviceMentioned = "Emergency Dental Care";
          } else {
            suggestions = ["Teeth Whitening prices", "Invisalign free 3D scan", "Book consultation", "Accepted Insurances"];
          }

          bookingPrompt = lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('schedule') || lowerMsg.includes('consult');
        } catch (_geminiErr) {
          const localResult = generateLocalCoordinatorResponse(message, activeConfig);
          textOutput = localResult.text;
          suggestions = localResult.suggestions;
          bookingPrompt = !!localResult.bookingActionPrompt;
          emergencyNotice = !!localResult.emergencyNotice;
          serviceMentioned = localResult.serviceMentioned;
        }
      } else {
        const localResult = generateLocalCoordinatorResponse(message, activeConfig);
        textOutput = localResult.text;
        suggestions = localResult.suggestions;
        bookingPrompt = !!localResult.bookingActionPrompt;
        emergencyNotice = !!localResult.emergencyNotice;
        serviceMentioned = localResult.serviceMentioned;
      }

      // Persist Conversation state & Auto-capture Leads
      const existingConv = store.getConversationBySession(sessionId, activeConfig.id);
      const userMsgObj: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const assistantMsgObj: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: textOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions,
        bookingActionPrompt: bookingPrompt,
        emergencyNotice,
        serviceMentioned
      };

      const messagesList = existingConv ? [...existingConv.messages, userMsgObj, assistantMsgObj] : [userMsgObj, assistantMsgObj];

      // Auto lead extraction
      let detectedName: string | undefined;
      let detectedContact: string | undefined;

      const phoneMatch = message.match(/(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
      const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

      if (phoneMatch) detectedContact = phoneMatch[0];
      else if (emailMatch) detectedContact = emailMatch[0];

      const nameMatch = message.match(/(?:my name is|i am|name:)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (nameMatch) detectedName = nameMatch[1];

      let associatedLeadId = existingConv?.leadId;
      if ((detectedContact || detectedName) && !associatedLeadId) {
        const newLead = store.addLead({
          clinicId: activeConfig.id,
          name: detectedName || 'Inquiring Patient',
          phone: detectedContact || 'Provided in chat',
          email: emailMatch ? emailMatch[0] : '',
          serviceName: serviceMentioned || 'General Consultation',
          preferredTime: 'Identified via AI Chat',
          message: `Conversation: "${message.substring(0, 120)}..."`,
          source: emergencyNotice ? 'emergency_triage' : 'chat',
          status: emergencyNotice ? 'appointment_requested' : 'new',
          estimatedValue: serviceMentioned?.includes('Invisalign') ? 3800 : serviceMentioned?.includes('Whitening') ? 350 : 500
        });
        associatedLeadId = newLead.id;
      }

      const updatedConv: Conversation = {
        id: existingConv?.id || `conv-${Date.now()}`,
        clinicId: activeConfig.id,
        sessionId,
        patientName: detectedName || existingConv?.patientName || (detectedContact ? 'Inquiring Patient' : undefined),
        patientContact: detectedContact || existingConv?.patientContact,
        messages: messagesList,
        status: existingConv?.status || (emergencyNotice ? 'handoff_requested' : 'active'),
        leadId: associatedLeadId,
        serviceMentioned: serviceMentioned || existingConv?.serviceMentioned,
        priority: emergencyNotice ? 'emergency' : 'normal',
        isAfterHours,
        createdAt: existingConv?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.saveConversation(updatedConv);

      res.json({
        text: textOutput,
        suggestions,
        bookingActionPrompt: bookingPrompt,
        emergencyNotice,
        serviceMentioned,
        isAfterHours,
        conversationId: updatedConv.id,
        leadId: associatedLeadId
      });
    } catch (err: any) {
      console.error("Chat route error:", err);
      res.status(500).json({ error: err.message || "Failed to process chat message" });
    }
  });

  // Dedicated fallback 404 JSON handler for any undefined /api/* routes
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Vite middleware for development & static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura Patient Coordinator API Server running on port ${PORT}`);
  });
}

startServer();
