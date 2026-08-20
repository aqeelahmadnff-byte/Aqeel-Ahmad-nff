import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Navbar } from './components/Navbar';
import { ChatConcierge } from './components/ChatConcierge';
import { TreatmentCatalog } from './components/TreatmentCatalog';
import { EmergencyTriage } from './components/EmergencyTriage';
import { BookingModal } from './components/BookingModal';
import { AppointmentsHub } from './components/AppointmentsHub';
import { ClinicSettingsModal } from './components/ClinicSettingsModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LiveChatModal } from './components/admin/LiveChatModal';
import { ClinicConfig, AppointmentBooking } from './types';
import { initialClinicConfig } from './data/defaultClinic';
import { 
  Sparkles, 
  Phone, 
  AlertCircle, 
  ShieldCheck, 
  Calendar, 
  HeartHandshake,
  Clock,
  MapPin,
  CheckCircle2,
  Shield
} from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, activeClinic, activeClinicId } = useAdminAuth();
  const [viewMode, setViewMode] = useState<'patient' | 'admin'>('patient');
  const [activeTab, setActiveTab] = useState<'chat' | 'treatments' | 'emergency' | 'book' | 'appointments' | 'settings'>('chat');
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(initialClinicConfig);
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingPresetTreatment, setBookingPresetTreatment] = useState<string>('Teeth Whitening');
  const [isLiveChatModalOpen, setIsLiveChatModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync active clinic config from Admin Context if available
  useEffect(() => {
    if (activeClinic) {
      setClinicConfig(activeClinic);
    }
  }, [activeClinic]);

  // Support URL hash navigation (e.g. #/admin or #/patient)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('admin')) {
        setViewMode('admin');
      } else {
        setViewMode('patient');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch initial appointments and config from server
  useEffect(() => {
    async function loadData() {
      try {
        const [configRes, aptsRes] = await Promise.all([
          fetch(`/api/clinic/config?clinicId=${activeClinicId}`),
          fetch(`/api/appointments?clinicId=${activeClinicId}`)
        ]);

        if (configRes.ok) {
          const contentType = configRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const cData = await configRes.json();
            if (cData && cData.clinicName) {
              setClinicConfig(cData);
            } else if (cData && cData.config) {
              setClinicConfig(cData.config);
            }
          }
        }

        if (aptsRes.ok) {
          const contentType = aptsRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const aData = await aptsRes.json();
            if (Array.isArray(aData)) {
              setAppointments(aData);
            } else if (aData && Array.isArray(aData.appointments)) {
              setAppointments(aData.appointments);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial backend state:", err);
      }
    }
    loadData();
  }, [activeClinicId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBookAppointment = async (bookingData: Partial<AppointmentBooking>) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          clinicId: activeClinicId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.appointment) {
          setAppointments(prev => [data.appointment, ...prev]);
          showToast(`Consultation slot confirmed for ${data.appointment.fullName}!`);
        }
      }
    } catch (err) {
      console.error("Failed to book appointment:", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'pending' | 'rescheduled' | 'cancelled') => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        showToast(`Appointment status updated to ${status}`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        showToast(`Appointment removed`);
      }
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  };

  const handleSaveConfig = async (updatedConfig: ClinicConfig) => {
    try {
      const res = await fetch('/api/clinic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        setClinicConfig(updatedConfig);
        showToast("Clinic settings updated and synchronized with Aura!");
      }
    } catch (err) {
      console.error("Failed to save config:", err);
    }
  };

  const openBookingModalWithTreatment = (treatment?: string) => {
    if (treatment) setBookingPresetTreatment(treatment);
    setIsBookingModalOpen(true);
  };

  const handleSelectTreatmentForChat = () => {
    setActiveTab('chat');
  };

  // If in Admin mode, render the Admin Portal
  if (viewMode === 'admin') {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          onBackToPatientSite={() => {
            window.location.hash = '';
            setViewMode('patient');
          }}
        />
      );
    }

    return (
      <>
        <AdminDashboard
          onBackToPatientSite={() => {
            window.location.hash = '';
            setViewMode('patient');
          }}
          onOpenLiveChatModal={() => setIsLiveChatModalOpen(true)}
        />
        <LiveChatModal
          isOpen={isLiveChatModalOpen}
          onClose={() => setIsLiveChatModalOpen(false)}
          clinicConfig={clinicConfig}
          onBookAppointment={handleBookAppointment}
        />
      </>
    );
  }

  // Patient / Customer Facing Experience
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'book') {
            setIsBookingModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        clinicConfig={clinicConfig}
        unreadBookingsCount={appointments.filter(a => a.status === 'pending').length}
        onOpenAdmin={() => {
          window.location.hash = '/admin';
          setViewMode('admin');
        }}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <ChatConcierge
            clinicConfig={clinicConfig}
            onBookAppointment={handleBookAppointment}
            onOpenBookingModal={openBookingModalWithTreatment}
          />
        )}

        {activeTab === 'treatments' && (
          <TreatmentCatalog
            clinicConfig={clinicConfig}
            onSelectTreatmentForChat={handleSelectTreatmentForChat}
            onSelectTreatmentForBooking={openBookingModalWithTreatment}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyTriage
            clinicConfig={clinicConfig}
            onBookEmergencySlot={() => openBookingModalWithTreatment('Emergency Dental Care')}
            onAskAuraEmergency={(_symptom) => {
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsHub
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
            onDeleteBooking={handleDeleteBooking}
            onOpenNewBooking={() => setIsBookingModalOpen(true)}
            clinicConfig={clinicConfig}
          />
        )}

        {activeTab === 'settings' && (
          <ClinicSettingsModal
            clinicConfig={clinicConfig}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        clinicConfig={clinicConfig}
        onSubmitBooking={handleBookAppointment}
        presetTreatment={bookingPresetTreatment}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0f172a]/90 backdrop-blur-md border-t border-slate-800/80 mt-auto py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif italic text-white text-sm">{clinicConfig.clinicName}</p>
              <p className="text-[11px] text-slate-400">{clinicConfig.address}, {clinicConfig.cityStateZip}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <button onClick={() => setActiveTab('chat')} className="hover:text-emerald-400 transition-colors cursor-pointer">Chat with {clinicConfig.aiAssistantName || 'Aura'}</button>
            <button onClick={() => setActiveTab('treatments')} className="hover:text-emerald-400 transition-colors cursor-pointer">Treatments & FAQs</button>
            <button onClick={() => setActiveTab('emergency')} className="hover:text-red-400 text-red-400/90 font-semibold transition-colors cursor-pointer">24/7 Emergency</button>
            <button onClick={() => setActiveTab('appointments')} className="hover:text-emerald-400 transition-colors cursor-pointer">Bookings Hub</button>
            <button onClick={() => {
              window.location.hash = '/admin';
              setViewMode('admin');
            }} className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer">
              <Shield className="h-3 w-3" />
              <span>Practice Admin Portal</span>
            </button>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            <p className="text-emerald-400/80 font-medium">Aura AI Practice Suite v3.0</p>
            <p className="mt-0.5 text-slate-400">Emergency Line: {clinicConfig.emergencyPhone}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  );
}
