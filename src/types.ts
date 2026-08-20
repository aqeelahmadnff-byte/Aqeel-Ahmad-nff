export type AdminRole = 'super_admin' | 'clinic_admin' | 'staff';

export interface StaffPermissions {
  canViewLeads: boolean;
  canEditLeads: boolean;
  canViewAppointments: boolean;
  canEditAppointments: boolean;
  canTakeoverChat: boolean;
  canViewAnalytics: boolean;
  canEditServices: boolean;
  canEditKnowledgeBase: boolean;
  canEditClinicSettings: boolean;
  canEditAIConfig: boolean;
  canPublishAIConfig: boolean;
  canViewAuditLogs: boolean;
  canManageTeam: boolean;
}

export const defaultStaffPermissions: StaffPermissions = {
  canViewLeads: true,
  canEditLeads: true,
  canViewAppointments: true,
  canEditAppointments: true,
  canTakeoverChat: true,
  canViewAnalytics: true,
  canEditServices: false,
  canEditKnowledgeBase: false,
  canEditClinicSettings: false,
  canEditAIConfig: false,
  canPublishAIConfig: false,
  canViewAuditLogs: false,
  canManageTeam: false
};

export const fullAdminPermissions: StaffPermissions = {
  canViewLeads: true,
  canEditLeads: true,
  canViewAppointments: true,
  canEditAppointments: true,
  canTakeoverChat: true,
  canViewAnalytics: true,
  canEditServices: true,
  canEditKnowledgeBase: true,
  canEditClinicSettings: true,
  canEditAIConfig: true,
  canPublishAIConfig: true,
  canViewAuditLogs: true,
  canManageTeam: true
};

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  clinicId?: string; // Optional for super_admin who has global access
  phone?: string;
  permissions?: StaffPermissions;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ClinicService {
  id: string;
  name: string;
  category: 'cosmetic' | 'orthodontics' | 'restorative' | 'emergency' | 'preventive' | 'general';
  price?: string;
  startingPrice: string;
  promotionalPrice?: string;
  priceRange?: string;
  duration: string;
  isActive: boolean;
  isBookable: boolean;
  aiCanMentionPrice: boolean;
  aiCanRecommend: boolean;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  notes?: string;
  summary: string;
  keyBenefits: string[];
  candidateFor: string;
  displayOrder: number;
  faqs?: { q: string; a: string }[];
}

export interface Specialist {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  image?: string;
  bio?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface BusinessDayHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  dayLabel: string;
  isOpen: boolean;
  openTime: string; // e.g. "08:00"
  closeTime: string; // e.g. "18:00"
  hasBreak: boolean;
  breakStart?: string; // e.g. "13:00"
  breakEnd?: string; // e.g. "14:00"
}

export interface HolidayClosure {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface TemporaryClosure {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  specialInstructions?: string;
}

export interface BusinessHoursConfig {
  schedule: BusinessDayHours[];
  holidayClosures: HolidayClosure[];
  temporaryClosures: TemporaryClosure[];
  afterHoursMessage: string;
  lunchBreakSummary?: string;
}

export interface AppointmentTypeOption {
  id: string;
  name: string;
  durationMinutes: number;
  consultationType: 'in_person' | 'telehealth' | 'both';
  serviceCategory?: string;
  assignedDoctorIds: string[];
  depositRequired: boolean;
  depositAmount?: number;
  isActive: boolean;
}

export interface AppointmentSettings {
  appointmentTypes: AppointmentTypeOption[];
  availableDays: string[];
  timeWindows: { start: string; end: string }[];
  minNoticeHours: number;
  cancellationPolicyText: string;
  bookingUrl?: string;
  requireDeposit: boolean;
}

export type AIAssistantTone = 'professional_warm' | 'luxury_concierge' | 'direct_efficient' | 'empathetic_clinical';
export type AIAssistantLanguage = 'en' | 'es' | 'bilingual';

export interface AIConfiguration {
  assistantName: string;
  personality: string;
  tone: AIAssistantTone;
  language: AIAssistantLanguage;
  greetingMessage: string;
  clinicIntroduction: string;
  systemInstructions: string;
  allowedTopics: string[];
  restrictedTopics: string[];
  emergencyInstructions: string;
  bookingInstructions: string;
  leadQualificationQuestions: string[];
  escalationRules: string;
  humanHandoffRules: string;
  afterHoursBehavior: 'auto_reply_and_queue' | 'emergency_only' | 'standard_with_notice';
  canDiscussPrices: boolean;
  canCaptureLeads: boolean;
  canCollectAppointments: boolean;
  canSendToBooking: boolean;
  canEscalateToStaff: boolean;
  canAnswerFaqs: boolean;
  canRecommendTreatments: boolean;
  neverDiagnose: boolean;
  neverGuaranteeMedicalResults: boolean;
  neverInventPrices: boolean;
  identifyAsAI: boolean;
}

export interface AIVersion {
  id: string;
  clinicId: string;
  versionNumber: number;
  config: AIConfiguration;
  status: 'published' | 'draft' | 'archived';
  summary: string;
  publishedAt: string;
  publishedByName?: string;
  publishedBy: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
}

export type AIVersionHistory = AIVersion;

export const defaultAIConfiguration: AIConfiguration = {
  assistantName: 'Aura',
  personality: 'Empathetic, welcoming, meticulous, and reassuring.',
  tone: 'professional_warm',
  language: 'en',
  greetingMessage: 'Hello! I am Aura, your AI Patient Coordinator. How may I assist you with your smile today?',
  clinicIntroduction: 'Welcome to Aura Dental Studio. We specialize in high-end cosmetic, restorative, and family dentistry.',
  systemInstructions: 'Always be courteous, concise, and warmly welcoming. Focus on patient comfort and transparency.',
  allowedTopics: [
    'Teeth Whitening and veneers duration',
    'Invisalign clear aligner timelines',
    'Dental implants consultation process',
    'Accepted dental insurance providers',
    'Payment plans and 0% financing',
    'Clinic parking and directions'
  ],
  restrictedTopics: [
    'Prescribing medications or antibiotics',
    'Giving definitive clinical diagnoses without an in-person exam',
    'Quoting unauthorized discounts or unlisted prices',
    'Discussing non-dental medical conditions'
  ],
  emergencyInstructions: 'For severe pain, knocked-out teeth, uncontrolled bleeding, or facial trauma, prioritize first aid guidance and provide our 24/7 Emergency Line immediately.',
  bookingInstructions: 'Collect the patient\'s full name, preferred contact info, treatment of interest, and ideal day/time.',
  leadQualificationQuestions: [
    'Are you experiencing any acute discomfort or sensitivity?',
    'When was your last dental examination or cleaning?',
    'What is your primary smile goal (cosmetic, alignment, restorative, or hygiene)?'
  ],
  escalationRules: 'If a patient expresses urgent pain or requests human staff intervention, offer immediate office phone contact and flag the conversation for coordinator review.',
  humanHandoffRules: 'Provide the front desk direct phone number and confirm that our clinical coordinator team will follow up promptly.',
  afterHoursBehavior: 'standard_with_notice',
  canDiscussPrices: true,
  canCaptureLeads: true,
  canCollectAppointments: true,
  canSendToBooking: true,
  canEscalateToStaff: true,
  canAnswerFaqs: true,
  canRecommendTreatments: true,
  neverDiagnose: true,
  neverGuaranteeMedicalResults: true,
  neverInventPrices: true,
  identifyAsAI: true
};

export interface AIAssistantSettings extends AIConfiguration {
  welcomeMessage?: string;
  clinicInstructions?: string;
  greetingPrompt?: string;
  humanHandoffBehavior?: 'prompt_phone_and_notify' | 'transfer_to_inbox' | 'email_alert';
}

export type KBCategory = 
  | 'faqs' 
  | 'treatment_info' 
  | 'preparation_instructions'
  | 'payment_insurance'
  | 'cancellation_rescheduling'
  | 'clinic_policies'
  | 'parking_location' 
  | 'doctor_credentials' 
  | 'custom';

export interface KnowledgeBaseArticle {
  id: string;
  clinicId: string;
  category: KBCategory;
  title: string;
  content: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  notificationEmails: string[];
  notifyOnNewLead: boolean;
  notifyOnAppointmentRequest: boolean;
  notifyOnHandoff: boolean;
  notifyOnEmergency: boolean;
  soundAlerts: boolean;
  desktopNotifications: boolean;
  smsAlerts?: boolean;
  smsRecipientPhone?: string;
}

export interface AISafetySettings {
  neverInventPrices: boolean;
  neverInventAvailability: boolean;
  neverClaimConfirmedWithoutRealSync: boolean;
  neverDiagnose: boolean;
  neverGuaranteeMedicalResults: boolean;
  recommendSpecialistNotice: boolean;
  identifyAsAI: boolean;
  emergencyPhoneEscalation: boolean;
  customBannedClaims?: string[];
}

export interface ClinicConfig {
  id: string;
  slug: string;
  clinicName: string;
  tagline?: string;
  logo?: string;
  address: string;
  cityStateZip: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website?: string;
  googleMapsUrl?: string;
  timeZone?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    motto?: string;
  };
  about: string;
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  businessHours: BusinessHoursConfig;
  emergencyPolicy: string;
  services: ClinicService[];
  insuranceAccepted: string[];
  acceptedPayments: string[];
  financingOptions: string[];
  specialists: Specialist[];
  appointmentSettings: AppointmentSettings;
  aiSettings: AIAssistantSettings;
  aiDraftConfig?: AIConfiguration;
  aiPublishedConfig?: AIConfiguration;
  aiVersions?: AIVersion[];
  kbArticles: KnowledgeBaseArticle[];
  notificationSettings: NotificationSettings;
  safetySettings: AISafetySettings;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'staff';
  text: string;
  timestamp: string;
  suggestions?: string[];
  bookingActionPrompt?: boolean;
  emergencyNotice?: boolean;
  serviceMentioned?: string;
  isStaffTakeover?: boolean;
  staffName?: string;
  collectedInfo?: {
    name?: string;
    contact?: string;
    preferredDate?: string;
    preferredTime?: string;
    treatment?: string;
  };
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment_requested' | 'booked' | 'closed' | 'lost';

export interface Lead {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  email: string;
  serviceId?: string;
  serviceName: string;
  preferredTime?: string;
  message: string;
  source: 'chat' | 'booking_form' | 'emergency_triage' | 'manual';
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
  estimatedValue?: number;
}

export type ConversationStatus = 'active' | 'handoff_requested' | 'staff_took_over' | 'resolved' | 'closed';

export interface Conversation {
  id: string;
  clinicId: string;
  sessionId: string;
  patientName?: string;
  patientContact?: string;
  messages: ChatMessage[];
  status: ConversationStatus;
  leadId?: string;
  intent?: string;
  serviceMentioned?: string;
  priority: 'normal' | 'urgent' | 'emergency';
  isAfterHours: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  notes?: string;
}

export interface AppointmentBooking {
  id: string;
  clinicId: string;
  fullName: string;
  contact: string; // Phone or Email
  preferredDate: string;
  preferredTime: string;
  treatment: string;
  appointmentTypeId?: string;
  doctorAssigned?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'rescheduled' | 'cancelled';
  createdAt: string;
  source: 'chat' | 'booking_form' | 'emergency_triage' | 'admin_manual';
}

export interface EmergencyGuide {
  id: string;
  title: string;
  urgency: 'critical' | 'urgent' | 'moderate';
  firstAid: string[];
  warningNote: string;
  suggestedAction: string;
}

export interface AuditLogEntry {
  id: string;
  clinicId?: string;
  clinicName?: string;
  userId: string;
  userEmail: string;
  userRole: AdminRole;
  action: string; // e.g., 'UPDATE_ACCOUNT', 'CHANGE_PASSWORD', 'PUBLISH_AI_CONFIG', 'CREATE_SERVICE', 'DELETE_KB', 'UPDATE_STAFF_PERMISSIONS'
  entityType: 'account' | 'security' | 'team' | 'ai_config' | 'ai_version' | 'clinic' | 'service' | 'hours' | 'kb' | 'lead' | 'appointment' | 'conversation';
  entityId?: string;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
}

export type AuditLog = AuditLogEntry;

export interface DashboardMetrics {
  totalConversations: number;
  newLeads: number;
  appointmentRequests: number;
  conversationsToday: number;
  leadsToday: number;
  afterHoursConversations: number;
  conversionRate: number;
  handoffsCount: number;
  revenuePotential: number;
  treatmentBreakdown: { name: string; count: number; value: number }[];
  dailyTraffic: { date: string; conversations: number; leads: number; bookings: number }[];
  leadStatusCounts: Record<LeadStatus, number>;
}
