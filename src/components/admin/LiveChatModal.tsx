import React from 'react';
import { ChatConcierge } from '../ChatConcierge';
import { ClinicConfig, AppointmentBooking } from '../../types';
import { X, Sparkles, Bot, ShieldCheck } from 'lucide-react';

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicConfig: ClinicConfig;
  onBookAppointment: (booking: Partial<AppointmentBooking>) => void;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  isOpen,
  onClose,
  clinicConfig,
  onBookAppointment
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-serif">
                  Live AI Coordinator Testing Sandbox
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Target: {clinicConfig.clinicName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interacting with the live Gemini AI Coordinator grounded in your practice database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Chat Component */}
        <div className="flex-1 overflow-hidden p-4">
          <ChatConcierge
            clinicConfig={clinicConfig}
            onBookAppointment={onBookAppointment}
            onOpenBookingModal={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
