import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Conversation, ChatMessage } from '../../../types';
import { 
  MessageSquare, 
  Search, 
  Send, 
  UserCheck, 
  AlertTriangle, 
  MoonStar, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  Sparkles, 
  User,
  Shield,
  Bot
} from 'lucide-react';

export const ConversationInboxTab: React.FC = () => {
  const { activeClinicId, authFetch, user } = useAdminAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'handoff' | 'emergency'>('all');
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await authFetch(`/api/admin/conversations?clinicId=${activeClinicId}`);
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
        if (!selectedConvId && data.length > 0) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Polling every 5s for live chat updates
    return () => clearInterval(interval);
  }, [activeClinicId, authFetch]);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  const handleStaffReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    setIsSending(true);
    try {
      const res = await authFetch(`/api/admin/conversations/${selectedConv.id}/message`, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: activeClinicId,
          text: replyText.trim(),
          senderName: `${user?.name || 'Staff Specialist'} (Front Desk)`
        })
      });

      if (res.ok) {
        setReplyText('');
        await fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleResolved = async (conv: Conversation) => {
    const nextStatus = conv.status === 'resolved' ? 'active' : 'resolved';
    try {
      await authFetch(`/api/admin/conversations/${conv.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          clinicId: activeClinicId,
          updates: { status: nextStatus }
        })
      });
      await fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesFilter = filterMode === 'all' || 
      (filterMode === 'handoff' && (c.status === 'handoff_requested' || c.status === 'staff_took_over')) ||
      (filterMode === 'emergency' && c.priority === 'emergency');

    const matchesSearch = !searchQuery ||
      c.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Live AI Conversation Inbox</h1>
          <p className="text-sm text-slate-400">
            Real-time patient chat stream, clinical escalation triage, and staff takeover console.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterMode === 'all' ? 'bg-cyan-950 border-cyan-800 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            All Threads ({conversations.length})
          </button>
          <button
            onClick={() => setFilterMode('handoff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterMode === 'handoff' ? 'bg-amber-950 border-amber-800 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Handoffs ({conversations.filter(c => c.status === 'handoff_requested' || c.status === 'staff_took_over').length})
          </button>
          <button
            onClick={() => setFilterMode('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterMode === 'emergency' ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Emergencies ({conversations.filter(c => c.priority === 'emergency').length})
          </button>
        </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 min-h-0 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row overflow-hidden">
        {/* Left List Pane */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active conversations matching criteria.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected ? 'bg-slate-800/80 border-l-2 border-cyan-500' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-xs text-white truncate">
                          {conv.patientName || 'Anonymous Patient'}
                        </span>
                        {conv.priority === 'emergency' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            EMERGENCY
                          </span>
                        )}
                        {conv.status === 'handoff_requested' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                            HANDOFF
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {lastMsg?.text || 'Chat started'}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{conv.messages.length} msgs</span>
                      {conv.isAfterHours && (
                        <span className="flex items-center gap-0.5 text-indigo-400">
                          <MoonStar className="h-2.5 w-2.5" />
                          <span>After-Hours</span>
                        </span>
                      )}
                      {conv.status === 'resolved' && (
                        <span className="text-emerald-400 font-medium">Resolved</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Message Thread & Takeover Pane */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                  {selectedConv.patientName ? selectedConv.patientName.charAt(0) : <User className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {selectedConv.patientName || 'Anonymous Visitor'}
                    </h2>
                    {selectedConv.status === 'staff_took_over' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Staff Handling
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {selectedConv.patientPhone && <span>📞 {selectedConv.patientPhone}</span>}
                    {selectedConv.patientEmail && <span>✉️ {selectedConv.patientEmail}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleResolved(selectedConv)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedConv.status === 'resolved'
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{selectedConv.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}</span>
                </button>
              </div>
            </div>

            {/* Chat Transcript Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
              {selectedConv.messages.map(msg => {
                const isUser = msg.sender === 'user';
                const isStaff = msg.sender === 'staff';
                const isBot = msg.sender === 'bot';

                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md lg:max-w-lg rounded-2xl p-3.5 text-xs shadow-md ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : isStaff
                        ? 'bg-indigo-900/90 text-indigo-100 border border-indigo-700 rounded-bl-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                        <span className="font-semibold flex items-center gap-1">
                          {isUser ? 'Patient' : isStaff ? '👨‍⚕️ Staff Takeover' : '🤖 AI Coordinator'}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Human Staff Takeover Input */}
            <form onSubmit={handleStaffReply} className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Take over chat and reply directly to patient..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {isSending ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reply</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500 text-sm">
            Select a conversation thread to view the live transcript.
          </div>
        )}
      </div>
    </div>
  );
};
