import { 
  ClinicConfig, 
  EmergencyGuide, 
  AdminUser, 
  Lead, 
  Conversation, 
  AppointmentBooking, 
  AuditLogEntry,
  AIConfiguration,
  AIVersion,
  fullAdminPermissions,
  defaultStaffPermissions
} from '../types';

export const defaultAIConfigSF: AIConfiguration = {
  assistantName: "Aura",
  personality: "Empathetic, meticulous, and welcoming dental concierge who conveys warmth, clinical precision, and calm assurance.",
  tone: "professional_warm",
  language: "en",
  greetingMessage: "Hello and welcome to Aura Dental & Aesthetic Studio! I am Aura, your AI Patient Coordinator. How may I assist your smile today?",
  clinicIntroduction: "Aura Dental & Aesthetic Studio is San Francisco's premier destination for high-precision cosmetic enhancement, Invisalign smile design, minimally invasive restorative therapies, and 24/7 dental trauma triage.",
  systemInstructions: "You are the clinical coordinator for Aura Dental & Aesthetic Studio in San Francisco. Guide patients through our cosmetic and restorative treatments with verified pricing, explain in-network insurance benefits, coordinate consultation slots, and dispatch immediate first-aid guidance for dental trauma. Quote prices ONLY from the verified treatment list and offer personalized in-person exams for individual treatment planning.",
  allowedTopics: [
    "Teeth whitening costs, procedures, and candidates",
    "Invisalign clear aligners timeline, digital scans, and pricing",
    "Dental implants single-tooth and full-arch solutions",
    "Porcelain veneers smile makeover consultation",
    "Routine exams, 3D digital x-rays, and preventative hygiene",
    "In-network PPO insurance coverage and benefit verification",
    "0% APR CareCredit and Sunbit patient financing plans",
    "Office hours, parking validation, and directions to 450 Sutter St",
    "Emergency dental trauma triage and same-day urgent booking"
  ],
  restrictedTopics: [
    "Providing definitive medical or radiographic diagnoses without an in-person exam",
    "Prescribing prescription medication dosages or antibiotics",
    "Inventing custom discounts or unverified treatment costs",
    "Promising permanent clinical outcomes without doctor evaluation"
  ],
  emergencyInstructions: "For acute pain, knocked-out teeth, facial swelling, or uncontrolled bleeding, provide immediate first-aid guidance, prioritize same-day emergency slots, and display our 24/7 emergency hotline (+1 415-555-9911).",
  bookingInstructions: "Collect the patient's full name, contact phone or email, desired treatment, and preferred date/time. Clearly state that our coordinator will confirm their operatory reservation immediately.",
  leadQualificationQuestions: [
    "Have you visited Aura Dental before, or is this your first consultation with us?",
    "Which treatment or aesthetic goal would you like Dr. Vance or Dr. Chen to focus on?",
    "Do you have a specific date or morning/afternoon preference for your visit?",
    "Will you be using dental insurance (Delta Dental, MetLife, Cigna, etc.) or exploring our 0% APR financing?"
  ],
  escalationRules: "Immediately route conversations to live staff when patients request human assistance, ask for international insurance Superbills, or report dental emergencies.",
  humanHandoffRules: "When transferring, provide direct phone (+1 415-555-0198) and email (concierge@auradentalstudio.com), and reassure the patient that front desk staff are reviewing their inquiry.",
  afterHoursBehavior: "standard_with_notice",
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

export const defaultAIVersionsSF: AIVersion[] = [
  {
    id: "ver-100",
    clinicId: "clinic-sf",
    versionNumber: 1,
    config: defaultAIConfigSF,
    status: "published",
    summary: "Initial verified production configuration with strict pricing grounding, emergency triage protocols, and 24/7 lead intake.",
    publishedAt: "2026-08-10T10:00:00.000Z",
    publishedBy: {
      id: "user-admin-sf",
      email: "admin@auradental.com",
      fullName: "Melissa Ross (Practice Manager - SF)"
    },
    createdAt: "2026-08-10T09:45:00.000Z"
  }
];

export const defaultAdminUsers: (AdminUser & { passwordHash: string })[] = [
  {
    id: 'user-super-1',
    email: 'superadmin@auraplatform.com',
    fullName: 'Dr. Sarah Sterling (Platform Director)',
    role: 'super_admin',
    phone: '+1 (415) 555-0100',
    permissions: fullAdminPermissions,
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    lastLoginAt: '2026-08-20T02:00:00.000Z',
    passwordHash: 'superAdmin2026!'
  },
  {
    id: 'user-admin-sf',
    email: 'admin@auradental.com',
    fullName: 'Melissa Ross (Practice Manager - SF)',
    role: 'clinic_admin',
    clinicId: 'clinic-sf',
    phone: '+1 (415) 555-0198',
    permissions: fullAdminPermissions,
    isActive: true,
    createdAt: '2026-01-10T09:00:00.000Z',
    lastLoginAt: '2026-08-19T16:30:00.000Z',
    passwordHash: 'auraAdmin2026!'
  },
  {
    id: 'user-admin-pa',
    email: 'admin.pa@auradental.com',
    fullName: 'David K. Liu (Clinic Director - Palo Alto)',
    role: 'clinic_admin',
    clinicId: 'clinic-pa',
    phone: '+1 (650) 555-0142',
    permissions: fullAdminPermissions,
    isActive: true,
    createdAt: '2026-02-01T09:00:00.000Z',
    lastLoginAt: '2026-08-18T14:15:00.000Z',
    passwordHash: 'auraAdminPA2026!'
  },
  {
    id: 'user-staff-sf',
    email: 'staff@auradental.com',
    fullName: 'Chloe Bennett (Lead Patient Coordinator)',
    role: 'staff',
    clinicId: 'clinic-sf',
    phone: '+1 (415) 555-0199',
    permissions: defaultStaffPermissions,
    isActive: true,
    createdAt: '2026-02-15T10:00:00.000Z',
    lastLoginAt: '2026-08-20T01:45:00.000Z',
    passwordHash: 'staffPass2026!'
  }
];

export const initialClinicSF: ClinicConfig = {
  id: 'clinic-sf',
  slug: 'san-francisco',
  clinicName: "Aura Dental & Aesthetic Studio",
  tagline: "Bespoke Cosmetic Dentistry & Modern Restorative Care",
  logo: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=120&h=120&q=80",
  address: "450 Sutter St, Suite 1420",
  cityStateZip: "San Francisco, CA 94108",
  phone: "+1 (415) 555-0198",
  emergencyPhone: "+1 (415) 555-9911",
  email: "concierge@auradentalstudio.com",
  website: "https://auradentalstudio.com",
  googleMapsUrl: "https://maps.google.com/?q=450+Sutter+St+San+Francisco+CA",
  timeZone: "America/Los_Angeles",
  socialLinks: {
    instagram: "https://instagram.com/auradentalstudio",
    facebook: "https://facebook.com/auradentalstudio",
    linkedin: "https://linkedin.com/company/aura-dental-studio"
  },
  branding: {
    primaryColor: "#0891b2",
    accentColor: "#10b981",
    motto: "Precision Dentistry Meets Effortless Elegance"
  },
  about: "Aura Dental & Aesthetic Studio is San Francisco's premier destination for high-precision cosmetic enhancement, minimally invasive restorative therapies, and 24/7 dental trauma triage. Powered by cutting-edge iTero® 3D digital impressions, painless laser whitening, and guided implantology.",
  workingHours: {
    weekdays: "Monday – Friday: 8:00 AM – 6:00 PM",
    saturday: "Saturday: 9:00 AM – 2:00 PM",
    sunday: "Sunday: Closed (24/7 On-Call Emergency Triage Only)",
  },
  businessHours: {
    schedule: [
      { day: 'monday', dayLabel: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', dayLabel: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', dayLabel: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'thursday', dayLabel: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', dayLabel: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', dayLabel: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00', hasBreak: false },
      { day: 'sunday', dayLabel: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '13:00', hasBreak: false }
    ],
    holidayClosures: [
      { id: 'hol-1', name: 'Labor Day', startDate: '2026-09-07', endDate: '2026-09-07', note: 'Emergency on-call triage active.' },
      { id: 'hol-2', name: 'Thanksgiving Break', startDate: '2026-11-26', endDate: '2026-11-27', note: 'Special holiday on-call hours.' }
    ],
    temporaryClosures: [],
    afterHoursMessage: "Our front desk is currently closed. However, our AI Coordinator is active 24/7 to answer questions, record consultation requests, and dispatch immediate first-aid instructions for dental emergencies."
  },
  emergencyPolicy: "We prioritize emergency patients with same-day emergency slots during clinic hours. For severe dental trauma, broken teeth, acute swelling, or unbearable toothache outside operating hours, our 24/7 on-call coordinator dispatches urgent triage instructions and schedules early priority slots.",
  services: [
    {
      id: "teeth-whitening",
      name: "Teeth Whitening",
      category: "cosmetic",
      startingPrice: "$350",
      price: "$350",
      promotionalPrice: "$299",
      priceRange: "$350 – $480",
      duration: "45 – 60 minutes",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-elena-vance",
      assignedDoctorName: "Dr. Elena Vance, DDS",
      displayOrder: 1,
      notes: "Price includes desensitizing gel and custom maintenance trays.",
      summary: "Advanced in-office LED laser whitening & custom medical-grade take-home kits that safely lift deep stains up to 8 shades in a single session.",
      keyBenefits: [
        "Instant 6–8 shades brighter in one 60-min visit",
        "Enamel-safe desensitizing formulation",
        "Includes custom maintenance trays and gel kit",
        "Removes coffee, wine, tea, and tobacco discoloration"
      ],
      candidateFor: "Patients with stained or dull teeth seeking an immediate, bright, and camera-ready smile before weddings, interviews, or events.",
      faqs: [
        {
          q: "Does in-office teeth whitening hurt?",
          a: "Most patients feel zero pain. We apply a protective gingival barrier and use an anti-sensitivity remineralizing agent to minimize any transient sensitivity."
        },
        {
          q: "How long do the whitening results last?",
          a: "Results typically last 12 to 24 months depending on diet, brushing habits, and tobacco or coffee consumption. Maintenance touch-up kits help extend longevity."
        },
        {
          q: "What is the cost comparison between in-office and take-home?",
          a: "In-office LED power whitening starts at $350. Custom take-home precision trays with professional gel start at $220. A combined package is $480."
        }
      ]
    },
    {
      id: "invisalign",
      name: "Invisalign® Clear Aligners",
      category: "orthodontics",
      startingPrice: "$3,800",
      price: "$3,800",
      promotionalPrice: "$3,499",
      priceRange: "$3,800 – $5,200",
      duration: "6 – 18 months average",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-marcus-chen",
      assignedDoctorName: "Dr. Marcus Chen, DMD, MS",
      displayOrder: 2,
      notes: "Complimentary initial 3D optical scan with $0 deposit to preview smile simulation.",
      summary: "Virtually invisible, removable smart-track aligners engineered to straighten teeth, close gaps, and correct bite alignments discreetly without metal brackets.",
      keyBenefits: [
        "100% metal-free, clear, and comfortable to wear",
        "Removable for meals, brushing, and special occasions",
        "Complementary 3D iTero® digital smile simulation",
        "Predictable progression with bi-weekly aligner swaps"
      ],
      candidateFor: "Adults and teens with crowded teeth, spacing gaps, overbite, underbite, or crossbite desiring discreet orthodontic treatment.",
      faqs: [
        {
          q: "How often do I need to wear Invisalign trays each day?",
          a: "Aligners should be worn 20 to 22 hours per day, removing them only for eating, drinking non-water beverages, and brushing."
        },
        {
          q: "Is there financing available for Invisalign?",
          a: "Yes, we provide 0% APR monthly financing starting as low as $129/month with CareCredit or Sunbit."
        }
      ]
    },
    {
      id: "dental-implants",
      name: "Dental Implants",
      category: "restorative",
      startingPrice: "$1,950",
      price: "$1,950",
      priceRange: "$1,950 – $3,400 per tooth",
      duration: "1 – 2 hours per surgical stage",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-elena-vance",
      assignedDoctorName: "Dr. Elena Vance, DDS",
      displayOrder: 3,
      summary: "Permanent titanium and ceramic tooth replacements with 3D CBCT guided placement for flawless chewing, bone preservation, and natural aesthetics.",
      keyBenefits: [
        "Permanent replacement that functions and looks like real teeth",
        "Prevents jawbone deterioration and facial collapse",
        "No damage to adjacent healthy teeth (unlike bridges)",
        "Over 98% lifetime success rate with Dr. Vance"
      ],
      candidateFor: "Patients missing one or more teeth, dealing with failing crowns, or seeking a stable alternative to loose dentures."
    },
    {
      id: "emergency-exam",
      name: "Emergency Dental Care & Relief",
      category: "emergency",
      startingPrice: "$150",
      price: "$150",
      priceRange: "$150 – $300 (Diagnostic & palliative)",
      duration: "30 – 45 minutes",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-elena-vance",
      assignedDoctorName: "Dr. Elena Vance, DDS",
      displayOrder: 4,
      summary: "Same-day urgent relief for acute toothaches, fractured teeth, lost crowns, abscesses, or facial swelling with digital triage.",
      keyBenefits: [
        "Immediate same-day palliative relief slots guaranteed",
        "High-definition low-radiation digital x-rays",
        "Gentle local anesthesia and infection containment",
        "Clear upfront estimate before any procedure is started"
      ],
      candidateFor: "Anyone suffering from sudden oral trauma, throbbing pain, or bleeding requiring immediate dental intervention."
    },
    {
      id: "preventative-cleaning",
      name: "Comprehensive Exam & Prophylaxis",
      category: "preventive",
      startingPrice: "$195",
      price: "$195",
      priceRange: "$195 – $280",
      duration: "50 minutes",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-elena-vance",
      assignedDoctorName: "Dr. Elena Vance, DDS",
      displayOrder: 5,
      summary: "Gentle ultrasonic biofilm removal, oral cancer screening, low-dose digital x-rays, and personalized periodontal assessment.",
      keyBenefits: [
        "Ultrasonic scaling that is gentle on enamel and gums",
        "High-resolution intraoral camera tour of your teeth",
        "Velscope® non-invasive oral cancer screening",
        "100% covered by most in-network PPO insurance plans"
      ],
      candidateFor: "Routine 6-month checkups, new patient baseline evaluations, and preventive maintenance."
    },
    {
      id: "porcelain-veneers",
      name: "Handcrafted Porcelain Veneers",
      category: "cosmetic",
      startingPrice: "$1,400",
      price: "$1,400",
      priceRange: "$1,400 – $2,200 per tooth",
      duration: "2 visits over 2 weeks",
      isActive: true,
      isBookable: true,
      aiCanMentionPrice: true,
      aiCanRecommend: true,
      assignedDoctorId: "dr-elena-vance",
      assignedDoctorName: "Dr. Elena Vance, DDS",
      displayOrder: 6,
      summary: "Ultra-thin custom ceramic laminates bonded to front teeth to fix chips, deep discoloration, gaps, and minor misalignments with lifelike translucency.",
      keyBenefits: [
        "Custom master-ceramist design to match your facial aesthetics",
        "Stain-resistant and ultra-durable porcelain",
        "Minimally invasive micro-preparation",
        "Lasts 15–20+ years with proper oral care"
      ],
      candidateFor: "Patients with worn enamel, severe internal staining, uneven tooth shapes, or smile asymmetry."
    }
  ],
  insuranceAccepted: [
    "Delta Dental Premier / PPO",
    "MetLife Dental",
    "Cigna Dental DPPO",
    "Guardian Dental",
    "Aetna Dental",
    "Anthem BlueCross BlueShield",
    "UnitedHealthcare Dental",
    "Humana Dental",
    "Principal Financial Group"
  ],
  acceptedPayments: [
    "Visa, MasterCard, American Express, Discover",
    "Apple Pay & Google Pay",
    "FSA / HSA Health Savings Cards",
    "Cash & Certified Cashier Checks",
    "CareCredit Healthcare Financing (0% APR)",
    "Sunbit Patient Financing"
  ],
  financingOptions: [
    "0% APR Interest-Free Financing for 6, 12, or 24 Months via CareCredit",
    "Sunbit Flexible Monthly Payments with 90% Approval Rate",
    "In-House Aura Smile Club Membership (20% off all cosmetic & restorative care)"
  ],
  specialists: [
    {
      id: "dr-elena-vance",
      name: "Dr. Elena Vance, DDS",
      title: "Lead Aesthetic & Restorative Dentist",
      specialty: "Cosmetic Dentistry & Implantology",
      experience: "14+ Years Clinical Experience (UCSF School of Dentistry)",
      image: "https://images.unsplash.com/photo-1594824813589-214434259b36?auto=format&fit=crop&w=300&h=300&q=80",
      bio: "Dr. Vance is a recognized fellow of the American Academy of Cosmetic Dentistry (AACD) and specializes in smile transformations and complex dental implant reconstructions.",
      email: "dr.vance@auradentalstudio.com",
      isActive: true
    },
    {
      id: "dr-marcus-chen",
      name: "Dr. Marcus Chen, DMD, MS",
      title: "Orthodontic Specialist",
      specialty: "Invisalign® Diamond Plus Provider",
      experience: "11+ Years Experience (Harvard School of Dental Medicine)",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&h=300&q=80",
      bio: "Dr. Chen has treated over 2,000 clear aligner cases and specializes in adolescent and adult smile alignment using non-extraction protocols.",
      email: "dr.chen@auradentalstudio.com",
      isActive: true
    }
  ],
  appointmentSettings: {
    appointmentTypes: [
      {
        id: "apt-free-scan",
        name: "Complimentary Invisalign 3D Smile Scan",
        durationMinutes: 30,
        consultationType: "in_person",
        serviceCategory: "orthodontics",
        assignedDoctorIds: ["dr-marcus-chen"],
        depositRequired: false,
        isActive: true
      },
      {
        id: "apt-whitening",
        name: "In-Office LED Teeth Whitening Session",
        durationMinutes: 60,
        consultationType: "in_person",
        serviceCategory: "cosmetic",
        assignedDoctorIds: ["dr-elena-vance"],
        depositRequired: true,
        depositAmount: 50,
        isActive: true
      },
      {
        id: "apt-implant-eval",
        name: "Dental Implant Consultation & 3D CBCT Scan",
        durationMinutes: 45,
        consultationType: "in_person",
        serviceCategory: "restorative",
        assignedDoctorIds: ["dr-elena-vance"],
        depositRequired: false,
        isActive: true
      },
      {
        id: "apt-emergency",
        name: "Same-Day Emergency Relief Exam",
        durationMinutes: 45,
        consultationType: "in_person",
        serviceCategory: "emergency",
        assignedDoctorIds: ["dr-elena-vance"],
        depositRequired: false,
        isActive: true
      },
      {
        id: "apt-routine-cleaning",
        name: "Preventative Hygiene & Doctor Examination",
        durationMinutes: 45,
        consultationType: "in_person",
        serviceCategory: "preventive",
        assignedDoctorIds: ["dr-elena-vance"],
        depositRequired: false,
        isActive: true
      }
    ],
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    timeWindows: [
      { start: "08:30", end: "12:30" },
      { start: "14:00", end: "17:30" }
    ],
    minNoticeHours: 2,
    cancellationPolicyText: "We kindly request at least 24 hours advance notice for appointment reschedules or cancellations. Late cancellations with less than 24h notice may incur a $50 administrative fee.",
    bookingUrl: "https://auradentalstudio.com/book",
    requireDeposit: false
  },
  aiSettings: {
    ...defaultAIConfigSF,
    welcomeMessage: defaultAIConfigSF.greetingMessage,
    clinicInstructions: defaultAIConfigSF.systemInstructions,
    greetingPrompt: "Welcome to Aura Dental! I can guide you through our cosmetic & restorative treatments, verify pricing, or schedule your personalized consultation.",
    humanHandoffBehavior: "transfer_to_inbox"
  },
  aiDraftConfig: { ...defaultAIConfigSF },
  aiPublishedConfig: { ...defaultAIConfigSF },
  aiVersions: defaultAIVersionsSF,
  kbArticles: [
    {
      id: "kb-1",
      clinicId: "clinic-sf",
      category: "parking_location",
      title: "Parking & Public Transportation at 450 Sutter St",
      content: "Valet and self-parking are available directly inside the 450 Sutter Garage adjacent to our building entrance. We offer 90-minute validation for patients undergoing active treatment. We are also a 5-minute walk from Montgomery BART/Muni station.",
      tags: ["parking", "directions", "garage", "bart", "muni"],
      isActive: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-08-01T12:00:00.000Z"
    },
    {
      id: "kb-2",
      clinicId: "clinic-sf",
      category: "payment_insurance",
      title: "How We Handle Dental Insurance Claims & Benefit Verification",
      content: "We are in-network with Delta Dental Premier, MetLife, Cigna, Guardian, Aetna, and Anthem BlueCross. Our front desk handles all claim submissions, electronic pre-authorizations, and benefits verifications directly with your insurer so you only pay your verified co-pay.",
      tags: ["insurance", "ppo", "delta dental", "cigna", "metlife", "claims"],
      isActive: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-08-05T14:00:00.000Z"
    },
    {
      id: "kb-3",
      clinicId: "clinic-sf",
      category: "cancellation_rescheduling",
      title: "Appointment Cancellation and Rescheduling Policy",
      content: "Patients may cancel or reschedule their visits at no charge with at least 24 hours advance notice. Cancellations made with less than 24 hours notice may be subject to a $50 late cancellation fee.",
      tags: ["cancel", "reschedule", "policy", "late fee"],
      isActive: true,
      createdAt: "2026-01-20T10:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z"
    },
    {
      id: "kb-4",
      clinicId: "clinic-sf",
      category: "payment_insurance",
      title: "CareCredit and Sunbit 0% Interest Financing Options",
      content: "We provide 6, 12, and 24-month 0% APR interest-free payment plans through CareCredit and Sunbit for all treatments over $500, including Invisalign and Dental Implants. Application takes under 2 minutes with no hard credit hit.",
      tags: ["financing", "carecredit", "sunbit", "payment plan", "0% apr"],
      isActive: true,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-08-10T09:00:00.000Z"
    },
    {
      id: "kb-5",
      clinicId: "clinic-sf",
      category: "treatment_info",
      title: "Invisalign vs Traditional Brackets Clinical Comparison",
      content: "Invisalign aligners are virtually invisible, removable for eating and brushing, and cause significantly less soft-tissue irritation than metal braces. Average treatment duration is 6–15 months. Dr. Marcus Chen uses 3D iTero digital scans with zero goopy impression trays.",
      tags: ["invisalign", "braces", "orthodontics", "itero"],
      isActive: true,
      createdAt: "2026-02-15T11:00:00.000Z",
      updatedAt: "2026-08-12T15:00:00.000Z"
    },
    {
      id: "kb-6",
      clinicId: "clinic-sf",
      category: "preparation_instructions",
      title: "Pre-Operative Preparation for Dental Implant Surgery",
      content: "Please eat a light meal 2 hours before local anesthesia surgery unless conscious IV sedation was planned. Continue taking your prescribed morning medications (unless blood thinners were adjusted with your physician). Arrange transportation home if taking oral sedatives.",
      tags: ["implants", "surgery", "prep", "instructions"],
      isActive: true,
      createdAt: "2026-02-20T14:00:00.000Z",
      updatedAt: "2026-08-14T10:00:00.000Z"
    },
    {
      id: "kb-7",
      clinicId: "clinic-sf",
      category: "clinic_policies",
      title: "Sterilization & Infection Control Protocols",
      content: "Our clinic exceeds OSHA and CDC sterilization standards with hospital-grade autoclave monitoring, surgical air HEPA filtration in all operatories, and disposable barrier protection for every patient encounter.",
      tags: ["sterilization", "cleanliness", "covid", "safety", "protocol"],
      isActive: true,
      createdAt: "2026-01-10T08:00:00.000Z",
      updatedAt: "2026-07-15T09:00:00.000Z"
    }
  ],
  notificationSettings: {
    emailNotifications: true,
    notificationEmails: ["concierge@auradentalstudio.com", "manager@auradentalstudio.com"],
    notifyOnNewLead: true,
    notifyOnAppointmentRequest: true,
    notifyOnHandoff: true,
    notifyOnEmergency: true,
    soundAlerts: true,
    desktopNotifications: true,
    smsAlerts: true,
    smsRecipientPhone: "+1 (415) 555-0198"
  },
  safetySettings: {
    neverInventPrices: true,
    neverInventAvailability: true,
    neverClaimConfirmedWithoutRealSync: true,
    neverDiagnose: true,
    neverGuaranteeMedicalResults: true,
    recommendSpecialistNotice: true,
    identifyAsAI: true,
    emergencyPhoneEscalation: true,
    customBannedClaims: [
      "Guaranteed 100% painless without anesthesia",
      "Exact quote without clinical exam",
      "Immediate permanent same-day tooth in all cases"
    ]
  }
};

export const initialClinicPA: ClinicConfig = {
  ...initialClinicSF,
  id: 'clinic-pa',
  slug: 'palo-alto',
  clinicName: "Aura Dental Studio — Palo Alto",
  tagline: "Silicon Valley Aesthetic & Precision Restorative Center",
  address: "2600 El Camino Real, Suite 310",
  cityStateZip: "Palo Alto, CA 94306",
  phone: "+1 (650) 555-0142",
  emergencyPhone: "+1 (650) 555-9922",
  email: "paloalto@auradentalstudio.com",
  website: "https://auradentalstudio.com/palo-alto",
  googleMapsUrl: "https://maps.google.com/?q=2600+El+Camino+Real+Palo+Alto+CA",
  timeZone: "America/Los_Angeles",
  about: "Serving Stanford and Silicon Valley with digital smile design, laser dentistry, and same-day dental crowns.",
  aiSettings: {
    ...defaultAIConfigSF,
    assistantName: "Aura PA",
    clinicIntroduction: "Aura Dental Studio Palo Alto is Silicon Valley's destination for digital cosmetic dentistry and restorative care."
  },
  aiDraftConfig: {
    ...defaultAIConfigSF,
    assistantName: "Aura PA"
  },
  aiPublishedConfig: {
    ...defaultAIConfigSF,
    assistantName: "Aura PA"
  },
  aiVersions: [
    {
      id: "ver-pa-100",
      clinicId: "clinic-pa",
      versionNumber: 1,
      config: { ...defaultAIConfigSF, assistantName: "Aura PA" },
      status: "published",
      summary: "Palo Alto clinic initial AI configuration launch.",
      publishedAt: "2026-08-12T10:00:00.000Z",
      publishedBy: {
        id: "user-admin-pa",
        email: "admin.pa@auradental.com",
        fullName: "David K. Liu (Clinic Director - Palo Alto)"
      },
      createdAt: "2026-08-12T09:30:00.000Z"
    }
  ]
};

export const initialLeads: Lead[] = [
  {
    id: 'lead-101',
    clinicId: 'clinic-sf',
    name: 'Sophia Montgomery',
    phone: '+1 (415) 555-8392',
    email: 'sophia.montgomery@techcorp.io',
    serviceId: 'invisalign',
    serviceName: 'Invisalign® Clear Aligners',
    preferredTime: 'Weekday Afternoons',
    message: 'Interested in Invisalign for crowding on lower incisors. Wanted to check if free 3D smile scan is available this Friday.',
    source: 'chat',
    status: 'qualified',
    createdAt: '2026-08-20T01:30:00.000Z',
    updatedAt: '2026-08-20T01:35:00.000Z',
    assignedStaff: 'Chloe Bennett',
    estimatedValue: 4200
  },
  {
    id: 'lead-102',
    clinicId: 'clinic-sf',
    name: 'David Reynolds',
    phone: '+1 (415) 555-9081',
    email: 'david.reynolds@sfdesign.org',
    serviceId: 'emergency-exam',
    serviceName: 'Emergency Dental Care',
    preferredTime: 'Same-day Urgent',
    message: 'Chipped front tooth while cycling on Market St. Sharp pain with cold water. Needs same-day emergency slot.',
    source: 'emergency_triage',
    status: 'appointment_requested',
    createdAt: '2026-08-19T10:15:00.000Z',
    updatedAt: '2026-08-19T10:20:00.000Z',
    assignedStaff: 'Chloe Bennett',
    estimatedValue: 450
  },
  {
    id: 'lead-103',
    clinicId: 'clinic-sf',
    name: 'Eleanor Sterling',
    phone: '+1 (415) 555-3341',
    email: 'e.sterling@pacificventures.com',
    serviceId: 'dental-implants',
    serviceName: 'Dental Implants',
    preferredTime: 'Morning Consult',
    message: 'Needs molar implant evaluation. Inquiring about 3D CBCT scan and recovery timeline.',
    source: 'booking_form',
    status: 'new',
    createdAt: '2026-08-19T14:20:00.000Z',
    updatedAt: '2026-08-19T14:20:00.000Z',
    estimatedValue: 2800
  }
];

export const initialConversations: Conversation[] = [
  {
    id: 'conv-201',
    clinicId: 'clinic-sf',
    sessionId: 'session-invisalign-881',
    patientName: 'Sophia Montgomery',
    patientContact: '+1 (415) 555-8392',
    status: 'resolved',
    leadId: 'lead-101',
    intent: 'Invisalign Pricing & Consultation',
    serviceMentioned: 'Invisalign® Clear Aligners',
    priority: 'normal',
    isAfterHours: false,
    createdAt: '2026-08-20T01:25:00.000Z',
    updatedAt: '2026-08-20T01:35:00.000Z',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        text: 'Hi there, how much does Invisalign cost at your San Francisco office?',
        timestamp: '1:25 AM'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        text: 'Invisalign® Clear Aligners at **Aura Dental & Aesthetic Studio** start at **$3,800** (ranging between $3,800 – $5,200 depending on complexity). We also offer complimentary 3D iTero smile scans with zero deposit to preview your digital simulation before starting!',
        timestamp: '1:26 AM',
        suggestions: ['Book complimentary 3D scan', '0% APR Payment Plans', 'Treatment timeline']
      },
      {
        id: 'msg-3',
        role: 'user',
        text: 'That sounds great! I would love to book the free scan this Friday afternoon. My name is Sophia Montgomery, phone is +1 (415) 555-8392.',
        timestamp: '1:29 AM'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        text: 'Wonderful, Sophia! I have recorded your request for a Complimentary Invisalign 3D Smile Scan this Friday afternoon. Our patient coordinator Chloe will reach out to verify your appointment slot.',
        timestamp: '1:30 AM',
        bookingActionPrompt: true
      }
    ]
  },
  {
    id: 'conv-202',
    clinicId: 'clinic-sf',
    sessionId: 'session-emergency-992',
    patientName: 'David Reynolds',
    patientContact: '+1 (415) 555-9081',
    status: 'staff_took_over',
    leadId: 'lead-102',
    intent: 'Dental Trauma Triage',
    serviceMentioned: 'Emergency Dental Care',
    priority: 'urgent',
    isAfterHours: false,
    createdAt: '2026-08-19T10:10:00.000Z',
    updatedAt: '2026-08-19T10:15:00.000Z',
    messages: [
      {
        id: 'msg-21',
        role: 'user',
        text: 'Help! I chipped my upper front tooth on my bike. It hurts when breathing air.',
        timestamp: '10:10 AM'
      },
      {
        id: 'msg-22',
        role: 'assistant',
        text: 'Please remain calm! If you have any broken fragments, place them in clean whole milk or saline. Avoid very cold/hot liquids. We have same-day emergency slots available right now at 450 Sutter St.',
        timestamp: '10:11 AM',
        emergencyNotice: true
      },
      {
        id: 'msg-23',
        role: 'user',
        text: 'I can be there in 20 minutes. My name is David Reynolds, 415-555-9081.',
        timestamp: '10:13 AM'
      },
      {
        id: 'msg-24',
        role: 'staff',
        text: 'Hi David, this is Chloe at the front desk. Dr. Vance has prepped Operatory 3 for you at 3:30 PM. We are holding your spot. See you shortly!',
        timestamp: '10:15 AM',
        isStaffTakeover: true,
        staffName: 'Chloe Bennett (Lead Coordinator)'
      }
    ]
  }
];

export const initialBookings: AppointmentBooking[] = [
  {
    id: 'apt-301',
    clinicId: 'clinic-sf',
    fullName: 'Sophia Montgomery',
    contact: '+1 (415) 555-8392',
    preferredDate: '2026-08-21',
    preferredTime: '14:00',
    treatment: 'Invisalign® Clear Aligners',
    doctorAssigned: 'Dr. Marcus Chen, DMD, MS',
    status: 'confirmed',
    createdAt: '2026-08-20T01:30:00.000Z',
    source: 'chat'
  },
  {
    id: 'apt-302',
    clinicId: 'clinic-sf',
    fullName: 'David Reynolds',
    contact: '+1 (415) 555-9081',
    preferredDate: '2026-08-20',
    preferredTime: '15:30',
    treatment: 'Emergency Dental Care',
    doctorAssigned: 'Dr. Elena Vance, DDS',
    status: 'confirmed',
    createdAt: '2026-08-19T10:15:00.000Z',
    source: 'emergency_triage'
  },
  {
    id: 'apt-303',
    clinicId: 'clinic-sf',
    fullName: 'Eleanor Sterling',
    contact: '+1 (415) 555-3341',
    preferredDate: '2026-08-22',
    preferredTime: '10:00',
    treatment: 'Dental Implants',
    doctorAssigned: 'Dr. Elena Vance, DDS',
    status: 'pending',
    createdAt: '2026-08-19T14:20:00.000Z',
    source: 'booking_form'
  }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    clinicId: 'clinic-sf',
    clinicName: 'Aura Dental & Aesthetic Studio',
    userId: 'user-admin-sf',
    userEmail: 'admin@auradental.com',
    userRole: 'clinic_admin',
    action: 'PUBLISH_AI_CONFIG',
    entityType: 'ai_config',
    entityId: 'ver-100',
    fieldChanged: 'versionNumber',
    previousValue: 'None',
    newValue: 'v1.0 (Production Verified)',
    timestamp: '2026-08-10T10:00:00.000Z',
    ipAddress: '198.51.100.42'
  },
  {
    id: 'log-2',
    clinicId: 'clinic-sf',
    clinicName: 'Aura Dental & Aesthetic Studio',
    userId: 'user-admin-sf',
    userEmail: 'admin@auradental.com',
    userRole: 'clinic_admin',
    action: 'UPDATE_SERVICE_PRICING',
    entityType: 'service',
    entityId: 'teeth-whitening',
    fieldChanged: 'startingPrice',
    previousValue: '$320',
    newValue: '$350',
    timestamp: '2026-08-18T11:20:00.000Z',
    ipAddress: '198.51.100.42'
  },
  {
    id: 'log-3',
    clinicId: 'clinic-sf',
    clinicName: 'Aura Dental & Aesthetic Studio',
    userId: 'user-admin-sf',
    userEmail: 'admin@auradental.com',
    userRole: 'clinic_admin',
    action: 'CREATE_KB_ARTICLE',
    entityType: 'kb',
    entityId: 'kb-4',
    fieldChanged: 'title',
    previousValue: 'None',
    newValue: 'CareCredit and Sunbit 0% Interest Financing Options',
    timestamp: '2026-08-15T09:40:00.000Z',
    ipAddress: '198.51.100.42'
  },
  {
    id: 'log-4',
    clinicId: 'clinic-sf',
    clinicName: 'Aura Dental & Aesthetic Studio',
    userId: 'user-super-1',
    userEmail: 'superadmin@auraplatform.com',
    userRole: 'super_admin',
    action: 'UPDATE_STAFF_PERMISSIONS',
    entityType: 'team',
    entityId: 'user-staff-sf',
    fieldChanged: 'permissions',
    previousValue: 'standard',
    newValue: 'canTakeoverChat, canViewLeads, canViewAppointments',
    timestamp: '2026-08-12T14:10:00.000Z',
    ipAddress: '203.0.113.19'
  }
];

export const emergencyGuides: EmergencyGuide[] = [
  {
    id: "knocked-out-tooth",
    title: "Knocked-Out (Avulsed) Tooth",
    urgency: "critical",
    firstAid: [
      "Find the tooth immediately; hold it strictly by the top white crown, NEVER the root.",
      "If dirty, gently rinse with cold milk or saline for 5 seconds (do not scrub or use soap).",
      "Try to gently reinsert it into the socket, or place it in a cup of cold whole milk.",
      "Contact our emergency hotline (+1 415-555-9911) and arrive within 30 to 60 minutes for best reimplantation success."
    ],
    warningNote: "Time is critical. Teeth reimplanted within 60 minutes have the highest survival rate.",
    suggestedAction: "Call Emergency Hotline Immediately"
  },
  {
    id: "severe-toothache",
    title: "Severe Throbbing Toothache / Abscess",
    urgency: "urgent",
    firstAid: [
      "Rinse your mouth with warm salt water (1/2 tsp salt in 8 oz water).",
      "Gently floss to remove any trapped food debris around the affected tooth.",
      "Take an over-the-counter pain reliever like ibuprofen if medically safe (never place aspirin directly on the gums).",
      "Apply a cold compress to the outside of your cheek for 15 minutes at a time to reduce swelling."
    ],
    warningNote: "Facial swelling accompanied by difficulty swallowing or breathing requires immediate emergency room evaluation.",
    suggestedAction: "Book Same-Day Emergency Slot"
  },
  {
    id: "broken-chipped-tooth",
    title: "Broken or Fractured Tooth",
    urgency: "urgent",
    firstAid: [
      "Save any broken tooth fragments in a moist container or clean water.",
      "Rinse your mouth with lukewarm water to clean the area.",
      "Cover sharp edges with sugarless chewing gum or orthodontic wax to protect your tongue and cheek.",
      "Avoid eating hard foods or consuming extreme hot/cold liquids."
    ],
    warningNote: "If the inner pink pulp is exposed or bleeding, prompt treatment is required to prevent infection.",
    suggestedAction: "Book Priority Consultation"
  },
  {
    id: "lost-crown-filling",
    title: "Lost Crown or Loose Filling",
    urgency: "moderate",
    firstAid: [
      "Keep the dislodged crown safe and bring it to your appointment.",
      "Apply a small dab of over-the-counter dental cement or toothpaste inside the crown to temporarily place it over the tooth.",
      "Do not chew on that side of the mouth.",
      "Schedule a quick visit so we can properly sterilize and re-cement the crown."
    ],
    warningNote: "Do not use household superglue under any circumstances.",
    suggestedAction: "Schedule Restoration Appointment"
  }
];

export const quickQuestions = [
  "How much does Teeth Whitening cost and how long does it take?",
  "Am I a good candidate for Invisalign vs braces?",
  "What is the procedure and timeline for Dental Implants?",
  "I have a sudden dental emergency. What should I do?",
  "What are your working hours and location?",
  "I'd like to book a consultation for an appointment."
];

export const initialClinicConfig: ClinicConfig = initialClinicSF;
