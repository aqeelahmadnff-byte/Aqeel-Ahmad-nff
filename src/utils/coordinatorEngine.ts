import { ClinicConfig, KnowledgeBaseArticle } from '../types';

export interface CoordinatorResult {
  text: string;
  suggestions: string[];
  bookingActionPrompt?: boolean;
  emergencyNotice?: boolean;
  serviceMentioned?: string;
  isAfterHours?: boolean;
}

/**
 * Evaluates whether a clinic is currently open based on real schedule configuration
 */
export function isClinicOpenNow(config: ClinicConfig): { isOpen: boolean; reason: string } {
  try {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday ...
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDayKey = dayKeys[dayIndex];

    // Check holiday closures
    const dateString = now.toISOString().split('T')[0];
    const holiday = config.businessHours?.holidayClosures?.find(
      h => dateString >= h.startDate && dateString <= h.endDate
    );
    if (holiday) {
      return { isOpen: false, reason: `Closed for Holiday: ${holiday.name}` };
    }

    // Check temporary closures
    const tempClosure = config.businessHours?.temporaryClosures?.find(
      t => dateString >= t.startDate && dateString <= t.endDate
    );
    if (tempClosure) {
      return { isOpen: false, reason: `Temporarily Closed: ${tempClosure.reason}` };
    }

    // Check day schedule
    const schedule = config.businessHours?.schedule?.find(s => s.day === currentDayKey);
    if (!schedule || !schedule.isOpen) {
      return { isOpen: false, reason: `Closed on ${currentDayKey.charAt(0).toUpperCase() + currentDayKey.slice(1)}s` };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
    const openMin = (openH || 8) * 60 + (openM || 0);
    const closeMin = (closeH || 18) * 60 + (closeM || 0);

    if (currentMinutes < openMin || currentMinutes >= closeMin) {
      return { isOpen: false, reason: `Outside operating hours (${schedule.openTime} – ${schedule.closeTime})` };
    }

    // Check lunch break
    if (schedule.hasBreak && schedule.breakStart && schedule.breakEnd) {
      const [bStartH, bStartM] = schedule.breakStart.split(':').map(Number);
      const [bEndH, bEndM] = schedule.breakEnd.split(':').map(Number);
      const breakStartMin = bStartH * 60 + (bStartM || 0);
      const breakEndMin = bEndH * 60 + (bEndM || 0);

      if (currentMinutes >= breakStartMin && currentMinutes < breakEndMin) {
        return { isOpen: false, reason: `Lunch / Midday Staff Break (${schedule.breakStart} – ${schedule.breakEnd})` };
      }
    }

    return { isOpen: true, reason: `Open Now (${schedule.openTime} – ${schedule.closeTime})` };
  } catch (_e) {
    return { isOpen: true, reason: 'Open according to standard clinic schedule' };
  }
}

/**
 * Searches the clinic's custom Knowledge Base for matching articles
 */
function searchKnowledgeBase(query: string, articles: KnowledgeBaseArticle[] = []): KnowledgeBaseArticle | null {
  const lower = query.toLowerCase();
  const activeArticles = articles.filter(a => a.isActive !== false);

  for (const article of activeArticles) {
    const titleMatch = article.title.toLowerCase().split(' ').some(w => w.length > 3 && lower.includes(w));
    const tagMatch = article.tags?.some(tag => lower.includes(tag.toLowerCase()));
    if (titleMatch || tagMatch) {
      return article;
    }
  }
  return null;
}

export function generateLocalCoordinatorResponse(userMsg: string, config: ClinicConfig): CoordinatorResult {
  const lower = userMsg.toLowerCase().trim();
  const aiSettings = config.aiSettings || {
    assistantName: 'Aura',
    canDiscussPrices: true,
    canRecommendTreatments: true,
    canAnswerFaqs: true,
    tone: 'professional_warm'
  };

  const openStatus = isClinicOpenNow(config);
  const isAfterHours = !openStatus.isOpen;

  // 1. Mandatory Medical Diagnosis Guardrail
  const complexMedicalTriggers = [
    'what disease', 'diagnose me', 'do i have cancer', 'is this tumor',
    'what illness', 'what is wrong with my jaw', 'why is my bone decomposing',
    'prescription', 'prescribe me', 'antibiotic dosage', 'amoxicillin dose',
    'what medical condition', 'diagnose my symptom', 'is this malignant',
    'do i have leukemia', 'diagnose my mouth'
  ];

  if (complexMedicalTriggers.some(trigger => lower.includes(trigger))) {
    return {
      text: `For an accurate medical diagnosis and clinical assessment, our specialist needs to examine your oral health in person at **${config.clinicName}**.\n\n` +
            `Would you like me to book a comprehensive clinical evaluation with our lead dentist this week?`,
      suggestions: [
        "Yes, book an in-person evaluation",
        "What are your clinic hours?",
        "What is your emergency policy?"
      ],
      bookingActionPrompt: true
    };
  }

  // 2. Human Handoff Intent
  if (
    lower.includes('human') || 
    lower.includes('real person') || 
    lower.includes('staff') || 
    lower.includes('agent') || 
    lower.includes('receptionist') ||
    lower.includes('talk to someone') ||
    lower.includes('representative')
  ) {
    return {
      text: `I have alerted our front desk team at **${config.clinicName}**.\n\n` +
            `📞 **Direct Phone**: Call our reception directly at **${config.phone}**.\n` +
            `💬 If you provide your name and phone number or question below, a clinic coordinator will take over this thread immediately.`,
      suggestions: [
        "Call Front Desk",
        "Book an appointment online",
        "Ask a treatment question"
      ],
      bookingActionPrompt: false
    };
  }

  // 3. Emergency Queries & Immediate First Aid
  if (
    lower.includes('emergency') || 
    lower.includes('knocked out') || 
    lower.includes('severe pain') || 
    lower.includes('bleeding') || 
    lower.includes('broken tooth') || 
    lower.includes('swelling') ||
    lower.includes('trauma') ||
    lower.includes('abscess')
  ) {
    const emergencyGuide = lower.includes('knocked out') 
      ? `**Immediate First Aid Tip**: Hold the knocked-out tooth strictly by the crown (never the root), gently rinse in cold milk or saline for 5 seconds, and preserve in cold whole milk. Reach our clinic within 60 minutes for highest reimplantation survival.`
      : `**First Aid Guidance**: Rinse with warm salt water, apply a cold compress to the exterior cheek to reduce swelling, and avoid placing aspirin directly onto gums.`;

    const emergencyService = config.services?.find(s => s.category === 'emergency');
    const priceText = aiSettings.canDiscussPrices && emergencyService?.startingPrice
      ? `Starting at **${emergencyService.startingPrice}** (includes high-definition digital diagnostic X-rays and acute pain management plan)`
      : `Priced transparently based on diagnostic triage`;

    return {
      text: `Hello, I understand dental emergencies can be distressing. At **${config.clinicName}**, your urgent relief is our top priority.\n\n` +
            `🚨 **Emergency Care Protocol**:\n` +
            `- **24/7 Urgent Hotline**: Call **${config.emergencyPhone}** for immediate doctor triage.\n` +
            `- **Same-Day Priority**: We guarantee same-day emergency relief slots during operating hours.\n` +
            `- **Emergency Exam Fee**: ${priceText}.\n\n` +
            `${emergencyGuide}\n\n` +
            (isAfterHours ? `⚠️ *Note*: ${config.businessHours?.afterHoursMessage || 'Our clinic is currently outside standard hours, but our 24/7 on-call emergency line is active.'}\n\n` : '') +
            `Would you like me to reserve an immediate priority emergency slot for you right now?`,
      suggestions: [
        "Book urgent emergency slot",
        "Call Emergency Hotline",
        "View clinic address & hours",
        "Teeth Whitening info"
      ],
      bookingActionPrompt: true,
      emergencyNotice: true,
      serviceMentioned: 'Emergency Dental Care',
      isAfterHours
    };
  }

  // 4. Knowledge Base match
  const matchedKb = searchKnowledgeBase(userMsg, config.kbArticles);
  if (matchedKb) {
    return {
      text: `### ${matchedKb.title}\n\n${matchedKb.content}\n\nCan I assist you with anything else regarding your visit to **${config.clinicName}**?`,
      suggestions: [
        "Book an appointment",
        "View Treatment Catalog",
        "Clinic Hours & Location"
      ]
    };
  }

  // 5. Dynamic Matching for configured Services
  const activeServices = (config.services || []).filter(s => s.isActive !== false);
  for (const serv of activeServices) {
    const servName = serv.name.toLowerCase();
    const servId = serv.id.toLowerCase();
    const tokens = servName.split(/[\s®-]+/).filter(t => t.length > 3);

    const matches = tokens.some(t => lower.includes(t)) || lower.includes(servId);
    if (matches) {
      let priceStatement = '';
      if (!aiSettings.canDiscussPrices || !serv.aiCanMentionPrice) {
        priceStatement = `Pricing for **${serv.name}** depends on a personalized clinical consultation and individual oral assessment.`;
      } else if (serv.priceRange) {
        priceStatement = `**Investment**: Starts at **${serv.startingPrice}** (${serv.priceRange}).`;
      } else {
        priceStatement = `**Starting Price**: **${serv.startingPrice}**.`;
      }

      const benefits = serv.keyBenefits && serv.keyBenefits.length > 0 
        ? `\n\n✨ **Key Highlights**:\n` + serv.keyBenefits.slice(0, 3).map(b => `- ${b}`).join('\n')
        : '';

      const notesText = serv.notes ? `\n- *Note*: ${serv.notes}` : '';

      return {
        text: `At **${config.clinicName}**, our **${serv.name}** is performed with modern clinical precision:\n\n` +
              `- ${priceStatement}\n` +
              `- **Appointment Duration**: ${serv.duration}\n` +
              `- **Overview**: ${serv.summary}${benefits}${notesText}\n\n` +
              `Would you like to reserve your appointment or ask any questions about this treatment?`,
        suggestions: [
          `Book ${serv.name}`,
          "What payment plans are available?",
          "Check Clinic Hours",
          "Other Treatments"
        ],
        bookingActionPrompt: serv.isBookable !== false,
        serviceMentioned: serv.name
      };
    }
  }

  // 6. Clinic Hours, Address, Location, Phone
  if (
    lower.includes('hour') || 
    lower.includes('time') || 
    lower.includes('open') || 
    lower.includes('address') || 
    lower.includes('location') || 
    lower.includes('phone') || 
    lower.includes('where') ||
    lower.includes('contact') ||
    lower.includes('closed')
  ) {
    const scheduleSummary = config.businessHours?.schedule?.map(
      s => `- **${s.dayLabel}**: ${s.isOpen ? `${s.openTime} – ${s.closeTime}` : 'Closed'}${s.hasBreak ? ` *(Break ${s.breakStart}–${s.breakEnd})*` : ''}`
    ).join('\n') || `- **Weekdays**: ${config.workingHours.weekdays}\n- **Saturday**: ${config.workingHours.saturday}\n- **Sunday**: ${config.workingHours.sunday}`;

    return {
      text: `Here are the location and operating details for **${config.clinicName}**:\n\n` +
            `📍 **Address**: ${config.address}, ${config.cityStateZip}\n` +
            `📞 **Front Desk Phone**: **${config.phone}**\n` +
            `🚨 **24/7 Emergency Line**: **${config.emergencyPhone}**\n` +
            `📧 **Email**: ${config.email}\n` +
            (config.website ? `🌐 **Website**: [${config.website}](${config.website})\n\n` : '\n') +
            `🕒 **Status**: **${openStatus.isOpen ? '🟢 OPEN NOW' : '🔴 CURRENTLY CLOSED'}** (${openStatus.reason})\n\n` +
            `📅 **Standard Schedule**:\n${scheduleSummary}\n\n` +
            (isAfterHours ? `*${config.businessHours?.afterHoursMessage || 'Our AI coordinator is available 24/7 to record your bookings.'}*\n\n` : '') +
            `Would you like to schedule an appointment during our clinic hours?`,
      suggestions: [
        "Book consultation slot",
        "View Treatment Catalog",
        "Accepted Insurances",
        "Emergency Care details"
      ],
      bookingActionPrompt: true,
      isAfterHours
    };
  }

  // 7. Insurance, Financing & Payment Methods
  if (
    lower.includes('insurance') || 
    lower.includes('finance') || 
    lower.includes('payment') || 
    lower.includes('plan') || 
    lower.includes('cost') || 
    lower.includes('carecredit') ||
    lower.includes('sunbit') ||
    lower.includes('apr')
  ) {
    const insuranceList = (config.insuranceAccepted || []).join(', ');
    const financingList = (config.financingOptions || []).map(f => `- ${f}`).join('\n');
    const paymentList = (config.acceptedPayments || []).join(' • ');

    return {
      text: `At **${config.clinicName}**, we believe premium dental care should be accessible, transparent, and manageable:\n\n` +
            `💳 **Accepted In-Network Insurances**:\n${insuranceList}\n\n` +
            `✨ **Financing & Monthly Payment Options**:\n${financingList}\n\n` +
            `💵 **Accepted Payment Methods**:\n${paymentList}\n\n` +
            `Would you like us to verify your insurance benefits or discuss a customized payment plan for your treatment?`,
      suggestions: [
        "Book a consultation",
        "Invisalign pricing",
        "Teeth Whitening cost",
        "Dental Implants quote"
      ],
      bookingActionPrompt: true
    };
  }

  // 8. Direct Booking Intent
  if (
    lower.includes('book') || 
    lower.includes('schedule') || 
    lower.includes('appointment') || 
    lower.includes('consultation') || 
    lower.includes('slot') || 
    lower.includes('reserve') ||
    lower.includes('visit')
  ) {
    return {
      text: `I would be delighted to arrange your consultation at **${config.clinicName}**!\n\n` +
            `Please share your details below or use our interactive scheduler:\n` +
            `1. **Full Name**\n` +
            `2. **Phone Number or Email**\n` +
            `3. **Desired Treatment**\n` +
            `4. **Preferred Date & Time**\n\n` +
            `Our front desk coordinator will confirm your reserved operatory slot immediately!`,
      suggestions: [
        "Book Teeth Whitening",
        "Book Invisalign 3D Scan",
        "Book Dental Implant Exam",
        "Check Clinic Hours"
      ],
      bookingActionPrompt: true
    };
  }

  // 9. Default Warm Greeting & Coordinator Capabilities
  const serviceBullets = (config.services || [])
    .filter(s => s.isActive !== false)
    .slice(0, 4)
    .map(s => `- **${s.name}**: ${s.aiCanMentionPrice ? `From ${s.startingPrice}` : 'Personalized consultation'} (${s.duration})`)
    .join('\n');

  return {
    text: `Hello! I am **${aiSettings.assistantName || 'Aura'}**, your AI Patient Coordinator at **${config.clinicName}**.\n\n` +
          `${config.aiSettings?.greetingPrompt || 'I am ready to assist you with our clinical treatments, pricing, and appointments:'}\n\n` +
          `${serviceBullets}\n` +
          `- 🚨 **24/7 Emergency Triage & Same-Day Relief**\n` +
          `- 📅 **Consultation Booking & Verified Insurance**\n\n` +
          `How may I best assist your smile today?`,
    suggestions: [
      "How much is Teeth Whitening?",
      "Tell me about Invisalign",
      "Dental Implants cost & timeline",
      "I have a dental emergency",
      "Book an appointment"
    ]
  };
}
