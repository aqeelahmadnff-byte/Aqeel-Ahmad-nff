import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight,
  ShieldAlert,
  Clock,
  MapPin,
  Phone,
  Sparkle
} from 'lucide-react';
import { ChatMessage, ClinicConfig, AppointmentBooking } from '../types';
import { quickQuestions } from '../data/defaultClinic';
import { generateLocalCoordinatorResponse } from '../utils/coordinatorEngine';

interface ChatConciergeProps {
  clinicConfig: ClinicConfig;
  onBookAppointment: (bookingData: Partial<AppointmentBooking>) => void;
  onOpenBookingModal: (treatmentPreset?: string) => void;
}

export const ChatConcierge: React.FC<ChatConciergeProps> = ({
  clinicConfig,
  onBookAppointment,
  onOpenBookingModal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Hello and welcome to **${clinicConfig.clinicName}**! My name is **Aura**, your dedicated AI Patient Coordinator.\n\nI am here to warmly assist you with our dental treatments, clinic hours, emergency guidance, and scheduling your consultation.\n\nHow can I help brighten your smile today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "How much is Teeth Whitening?",
        "Tell me about Invisalign aligners",
        "How do Dental Implants work?",
        "I have a dental emergency",
        "Book a consultation appointment"
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Inline Quick Booking Form inside Chat
  const [showInlineBooking, setShowInlineBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    contact: '',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferredTime: '10:00 AM',
    treatment: 'Teeth Whitening',
    notes: ''
  });
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, showInlineBooking]);

  // Handle Text-to-Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !ttsEnabled) return;
    window.speechSynthesis.cancel();

    // Clean markdown symbols for cleaner voice
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[-*]\s+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Pick female or warm voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google UK English Female') || v.name.includes('Natural') || v.lang.startsWith('en'));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    stopSpeaking();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
          clinicConfigOverride: clinicConfig
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get coordinator response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text || "I am glad to assist you. How else can I help with your consultation?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions || [
          "Book a consultation",
          "Teeth Whitening cost",
          "Invisalign scan",
          "Emergency Care"
        ],
        bookingActionPrompt: data.bookingActionPrompt
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (ttsEnabled) {
        speakText(assistantMessage.text);
      }

      // Check if Aura is prompting for booking
      if (
        data.bookingActionPrompt ||
        messageContent.toLowerCase().includes('book') ||
        messageContent.toLowerCase().includes('appointment') ||
        messageContent.toLowerCase().includes('schedule')
      ) {
        // Auto-detect treatment
        let detected = 'Teeth Whitening';
        if (messageContent.toLowerCase().includes('invisalign')) detected = 'Invisalign® Clear Aligners';
        if (messageContent.toLowerCase().includes('implant')) detected = 'Dental Implants';
        if (messageContent.toLowerCase().includes('emergency')) detected = 'Emergency Dental Care';
        
        setBookingForm(prev => ({ ...prev, treatment: detected }));
        setShowInlineBooking(true);
      }

    } catch (_err) {
      // Graceful offline & network fallback using clinical coordinator engine
      const localResult = generateLocalCoordinatorResponse(messageContent, clinicConfig);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: localResult.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: localResult.suggestions,
        bookingActionPrompt: localResult.bookingActionPrompt
      };
      setMessages(prev => [...prev, fallbackMessage]);

      if (ttsEnabled) {
        speakText(fallbackMessage.text);
      }

      if (
        localResult.bookingActionPrompt ||
        messageContent.toLowerCase().includes('book') ||
        messageContent.toLowerCase().includes('appointment') ||
        messageContent.toLowerCase().includes('schedule')
      ) {
        let detected = 'Teeth Whitening';
        if (messageContent.toLowerCase().includes('invisalign')) detected = 'Invisalign® Clear Aligners';
        if (messageContent.toLowerCase().includes('implant')) detected = 'Dental Implants';
        if (messageContent.toLowerCase().includes('emergency')) detected = 'Emergency Dental Care';
        
        setBookingForm(prev => ({ ...prev, treatment: detected }));
        setShowInlineBooking(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInlineBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.fullName || !bookingForm.contact) return;

    onBookAppointment({
      fullName: bookingForm.fullName,
      contact: bookingForm.contact,
      preferredDate: bookingForm.preferredDate,
      preferredTime: bookingForm.preferredTime,
      treatment: bookingForm.treatment,
      notes: bookingForm.notes,
      source: 'chat'
    });

    const confirmationText = `🎉 **Consultation Request Confirmed!**\n\nThank you, **${bookingForm.fullName}**! We have reserved your preferred consultation slot on **${bookingForm.preferredDate} at ${bookingForm.preferredTime}** for **${bookingForm.treatment}**.\n\nOur patient care team will send confirmation details to **${bookingForm.contact}**. We look forward to welcoming you at ${clinicConfig.clinicName}!`;

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        text: confirmationText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ["What should I prepare for my visit?", "Where is the clinic located?", "Emergency contact info"]
      }
    ]);

    if (ttsEnabled) {
      speakText(`Thank you ${bookingForm.fullName}! Your consultation slot for ${bookingForm.treatment} on ${bookingForm.preferredDate} has been confirmed.`);
    }

    setBookingSuccessNotice(`Consultation reserved for ${bookingForm.fullName}!`);
    setShowInlineBooking(false);
    setBookingForm({
      fullName: '',
      contact: '',
      preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      treatment: 'Teeth Whitening',
      notes: ''
    });
  };

  const resetChat = () => {
    stopSpeaking();
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: `Hello again! I am **Aura**, your AI Patient Coordinator for **${clinicConfig.clinicName}**.\n\nHow can I help you today with treatments, pricing, or appointment scheduling?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          "How much is Teeth Whitening?",
          "Tell me about Invisalign aligners",
          "How do Dental Implants work?",
          "I have a dental emergency"
        ]
      }
    ]);
    setShowInlineBooking(false);
    setBookingSuccessNotice(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] max-w-5xl mx-auto bg-[#0f172a] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-800 overflow-hidden">
      {/* Top Coordinator Banner */}
      <div className="bg-[#020617] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              A
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-white">Aura</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900 border border-emerald-500/30 text-emerald-400">
                AI Coordinator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Secured Concierge for {clinicConfig.clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Audio Toggle */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setTtsEnabled(!ttsEnabled);
            }}
            title={ttsEnabled ? "Voice Readout: On (Click to Mute)" : "Voice Readout: Off (Click to Enable)"}
            className={`p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              ttsEnabled 
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            {ttsEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline text-xs">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Voice Off</span>
              </>
            )}
          </button>

          {/* Reset Chat */}
          <button
            onClick={resetChat}
            title="Start new conversation"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Test Scenarios Bar */}
      <div className="bg-[#020617]/70 border-b border-slate-800/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs text-slate-400 scrollbar-none">
        <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap flex items-center gap-1">
          <Sparkle className="w-3.5 h-3.5 text-emerald-400" />
          Quick Ask:
        </span>
        <button
          onClick={() => handleSendMessage("What are your Teeth Whitening options and prices?")}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 whitespace-nowrap transition-all text-xs"
        >
          ✨ Whitening Prices
        </button>
        <button
          onClick={() => handleSendMessage("How much does Invisalign cost and do you offer free scans?")}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 whitespace-nowrap transition-all text-xs"
        >
          🌟 Invisalign Details
        </button>
        <button
          onClick={() => handleSendMessage("What is the cost and procedure for Dental Implants?")}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 text-slate-300 whitespace-nowrap transition-all text-xs"
        >
          🦷 Dental Implants
        </button>
        <button
          onClick={() => handleSendMessage("I knocked out a tooth in an accident! What is your emergency procedure?")}
          className="px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 hover:bg-red-950/60 whitespace-nowrap transition-all text-xs font-semibold"
        >
          🚨 Emergency Care
        </button>
        <button
          onClick={() => handleSendMessage("Can you diagnose what medical condition is causing this dark lesion in my mouth?")}
          title="Tests mandatory constraint: Specialist examination response"
          className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-300 hover:bg-amber-950/60 whitespace-nowrap transition-all text-xs font-semibold"
        >
          ⚠️ Test Diagnosis Constraint
        </button>
        <button
          onClick={() => handleSendMessage("I would like to book a consultation appointment.")}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 whitespace-nowrap transition-all text-xs font-bold"
        >
          📅 Book Consultation
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#020617]/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-slate-800 border border-slate-700 text-white'
                  : 'bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-slate-200" />
              ) : (
                <Sparkles className="w-5 h-5 text-slate-950" />
              )}
            </div>

            {/* Bubble Content */}
            <div className={`max-w-[88%] sm:max-w-[78%] space-y-2.5`}>
              <div
                className={`p-5 rounded-3xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-800/90 text-white rounded-tr-none border border-slate-700/60 shadow-xl'
                    : 'bg-slate-800/80 backdrop-blur rounded-tl-none border border-slate-700/50 shadow-2xl text-slate-200'
                }`}
              >
                {/* Message Text with basic markdown rendering */}
                <div className="space-y-2 whitespace-pre-line">
                  {msg.text.split('\n\n').map((paragraph, idx) => {
                    return (
                      <p key={idx} className="leading-relaxed">
                        {paragraph.split('\n').map((line, lineIdx) => {
                          // Render bold **text**
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <React.Fragment key={lineIdx}>
                              {parts.map((part, pIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={pIdx} className="font-bold text-emerald-400">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                              {lineIdx < paragraph.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          );
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Footer metadata */}
                <div
                  className={`mt-3 flex items-center justify-between text-[11px] pt-2 border-t ${
                    msg.role === 'user'
                      ? 'border-slate-700/50 text-slate-400'
                      : 'border-slate-700/50 text-slate-400'
                  }`}
                >
                  <span className="text-slate-500">{msg.timestamp}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="hover:text-emerald-400 flex items-center gap-1 transition-colors text-slate-400"
                      title="Read out loud"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions chips below assistant messages */}
              {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-4 py-2 bg-slate-900/80 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400/50 rounded-full text-[11px] font-bold text-emerald-400 uppercase tracking-tighter transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>{suggestion}</span>
                      <ChevronRight className="w-3 h-3 text-emerald-500/60 group-hover:text-emerald-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-3xl rounded-tl-none text-sm text-slate-300 shadow-xl flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Aura is consulting clinic guidelines...</span>
            </div>
          </div>
        )}

        {/* Inline Booking Form Card */}
        {showInlineBooking && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-lg mx-auto transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Book Your Consultation</h4>
                  <p className="text-xs text-emerald-400/80">Direct concierge priority scheduling</p>
                </div>
              </div>
              <button
                onClick={() => setShowInlineBooking(false)}
                className="text-xs text-slate-400 hover:text-white font-medium"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleInlineBookingSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={bookingForm.fullName}
                    onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Phone / Email *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="alex@rivera.com"
                    value={bookingForm.contact}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Time *
                  </label>
                  <select
                    value={bookingForm.preferredTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Treatment *
                  </label>
                  <select
                    value={bookingForm.treatment}
                    onChange={(e) => setBookingForm({ ...bookingForm, treatment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Teeth Whitening">Teeth Whitening ($350)</option>
                    <option value="Invisalign® Clear Aligners">Invisalign® (Free Scan)</option>
                    <option value="Dental Implants">Dental Implants ($2,400)</option>
                    <option value="Emergency Dental Care">Emergency Care ($150)</option>
                    <option value="Preventive Care & Hygiene">Cleaning & Exam ($190)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Mention sensitivities, aesthetic goals, or questions..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInlineBooking(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 sm:p-5 bg-[#0f172a] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            id="chat-input-message"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Aura anything about treatments, pricing, emergency care, or book..."
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 text-sm bg-slate-950 rounded-2xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white placeholder:text-slate-600 transition-all"
          />

          <button
            type="button"
            onClick={() => setShowInlineBooking(true)}
            title="Open Consultation Scheduler"
            className="hidden sm:flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Book Slot</span>
          </button>

          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-3.5 rounded-2xl flex items-center justify-center font-black transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer active:scale-95'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Verified against {clinicConfig.clinicName} official guidelines.
          </span>
          <span className="hidden sm:inline text-slate-600">
            Press Enter to send
          </span>
        </div>
      </div>
    </div>
  );
};
