import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, ShieldAlert, Send, RefreshCw, CheckCircle, Search, 
  Clock, Phone, User, Stethoscope, AlertTriangle, MessageCircle, ChevronRight, Activity
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const FrontDeskTicketsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (threadContext?.messages?.length) {
      scrollToBottom();
    }
  }, [threadContext?.messages]);

  // Load Live Front Desk Escalation Queue
  const fetchLiveTickets = async () => {
    try {
      const res = await api.getFrontDeskQueue();
      const rawList = res?.data || res || [];
      const list = Array.isArray(rawList) ? rawList : [];
      setTickets(list);

      if (list.length > 0 && !selectedThreadId) {
        const firstId = list[0].id;
        setSelectedThreadId(firstId);
        fetchThreadContext(firstId, list);
      }
    } catch (err) {
      console.error('Failed to fetch front desk live tickets', err);
      toast.error('Could not load live WhatsApp tickets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch full conversation context
  const fetchThreadContext = async (id: string, currentTickets: any[] = tickets) => {
    try {
      const res = await api.getThreadContext(id);
      const raw = res?.data || res;
      const thread = raw?.thread || (!Array.isArray(raw) ? raw : null) || currentTickets.find((t: any) => t.id === id) || { id, patient_name: 'Patient' };
      const messages = raw?.messages || (Array.isArray(raw) ? raw : (raw?.data?.messages || []));
      setThreadContext({ ...raw, thread, messages });
    } catch (err) {
      console.error('Failed to fetch thread context', err);
      const fallback = currentTickets.find((t: any) => t.id === id) || { id, patient_name: 'Patient' };
      setThreadContext({ thread: fallback, messages: [] });
    }
  };

  useEffect(() => {
    fetchLiveTickets();
    const interval = setInterval(fetchLiveTickets, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTicket = (id: string) => {
    setSelectedThreadId(id);
    fetchThreadContext(id);
  };

  // Reply to WhatsApp Chat
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return;
    const textToSend = replyText.trim();
    setSendingReply(true);
    try {
      await api.sendThreadReply(selectedThreadId, textToSend, 'Front Desk Agent', 'HUMAN');
      toast.success('Reply sent to patient on WhatsApp!');
      setReplyText('');
      // Optimistic update
      setThreadContext((prev: any) => {
        if (!prev) return prev;
        const currentMsgs = prev.messages || [];
        return {
          ...prev,
          messages: [
            ...currentMsgs,
            {
              id: `temp-${Date.now()}`,
              thread_id: selectedThreadId,
              sender_id: 'Staff',
              sender_type: 'HUMAN',
              content: textToSend,
              created_at: new Date().toISOString()
            }
          ]
        };
      });
      setTimeout(() => fetchThreadContext(selectedThreadId), 1000);
    } catch (err: any) {
      console.error('Failed to send reply', err);
      toast.error(err?.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  // Take Over Control
  const handleTakeControl = async (id: string) => {
    setActionLoading(true);
    try {
      await api.takeControl(id);
      toast.success('Front Desk has taken over this conversation!');
      fetchLiveTickets();
      fetchThreadContext(id);
    } catch (err: any) {
      console.error('Failed to take control', err);
      toast.error(err?.message || 'Failed to take over conversation');
    } finally {
      setActionLoading(false);
    }
  };

  // Escalate to Doctor
  const handleEscalateToDoctor = async (id: string) => {
    setActionLoading(true);
    try {
      await api.sendThreadReply(id, '[SYSTEM NOTE: Escalated to Doctor by Front Desk]', 'System', 'HUMAN');
      toast.success('Escalated to Doctor queue!');
      fetchLiveTickets();
      fetchThreadContext(id);
    } catch (err: any) {
      console.error('Failed to escalate to doctor', err);
      toast.error('Failed to escalate to doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    const name = (t.patient_name || t.patientName || '').toLowerCase();
    const phone = (t.user_id || t.phone || '').toLowerCase();
    const msg = (t.last_message_preview || t.reason || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || msg.includes(q);
  });

  return (
    <div className="p-6 space-y-6 bg-brand-bg min-h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-sm">
            <MessageCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-brand-textPrimary">WhatsApp Live Tickets</h1>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live DB
              </span>
            </div>
            <p className="text-xs text-brand-textSecondary mt-0.5">Real-time incoming WhatsApp escalations & patient inquiries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setLoading(true); fetchLiveTickets(); }}
            className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-2xs"
            title="Refresh Tickets"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tickets List */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-sm">
          <div className="p-3.5 border-b border-brand-border bg-brand-bg/20 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand-textPrimary flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-brand-accent" /> Active Queue ({filteredTickets.length})
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
              <input
                type="text"
                placeholder="Search patient, phone, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-brand-bg border border-brand-border rounded-xl text-brand-textPrimary placeholder:text-brand-textSecondary/50 focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-brand-border/60 custom-scrollbar">
            {loading ? (
              <div className="py-16 flex justify-center items-center">
                <div className="w-7 h-7 border-3 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-brand-textSecondary text-xs">
                <MessageSquare size={32} className="mx-auto opacity-30 mb-2" />
                No active escalated WhatsApp tickets.
              </div>
            ) : (
              filteredTickets.map((item) => {
                const isSelected = selectedThreadId === item.id;
                const isRed = item.status === 'red';
                const isYellow = item.status === 'yellow';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTicket(item.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-brand-primary/10 border-l-4 border-brand-primary' 
                        : 'hover:bg-brand-bg/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-brand-textPrimary">
                          {item.patient_name || item.patientName || (item.user_id && item.user_id.length <= 13 ? `+${item.user_id}` : `Patient #${item.id.substring(0, 6)}`)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        isRed 
                          ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                          : isYellow 
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' 
                            : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {isRed ? (item.risk_score ? `Risk ${item.risk_score}%` : 'Urgent') : (isYellow ? 'Escalated' : 'Active')}
                      </span>
                    </div>

                    {item.user_id && (
                      <div className="flex items-center gap-1 text-[11px] text-brand-textSecondary mb-1 font-mono">
                        <Phone size={10} className="opacity-70" />
                        <span>+{item.user_id.replace(/\D/g, '')}</span>
                      </div>
                    )}

                    <p className="text-xs text-brand-textSecondary truncate font-normal">
                      {item.last_message_preview || item.reason || 'Patient requested support via WhatsApp'}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-brand-border/30 text-[10px] text-brand-textSecondary/70">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> WhatsApp
                      </span>
                      {item.updated_at && (
                        <span>{new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Chat Window */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl flex flex-col h-[650px] shadow-sm overflow-hidden">
          {selectedThreadId && threadContext ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-brand-border flex flex-wrap justify-between items-center gap-3 bg-brand-bg/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-brand-textPrimary">
                      {threadContext.thread?.patient_name || threadContext.patient_name || (threadContext.thread?.user_id && threadContext.thread.user_id.length <= 13 ? `+${threadContext.thread.user_id}` : 'Patient')}
                    </h3>
                    {threadContext.thread?.user_id && (
                      <span className="text-[11px] text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border/60 font-mono">
                        +{threadContext.thread.user_id.replace(/\D/g, '')}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      WhatsApp Connected
                    </span>
                  </div>
                  <p className="text-xs text-brand-textSecondary mt-0.5">
                    {threadContext.thread?.escalation_reason || 'Live WhatsApp Patient Support Thread'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEscalateToDoctor(selectedThreadId)}
                    disabled={actionLoading}
                    className="bg-brand-surface hover:bg-brand-bg border border-brand-border text-brand-textPrimary text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <Stethoscope size={13} className="text-blue-400" /> Escalate to Doctor
                  </button>
                  <button
                    onClick={() => handleTakeControl(selectedThreadId)}
                    disabled={actionLoading}
                    className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <CheckCircle size={13} /> Take Over Control
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-brand-bg/5">
                {(!threadContext.messages || threadContext.messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary">
                    <MessageSquare size={36} className="opacity-30 mb-2" />
                    <p className="text-xs font-semibold">No messages recorded in this WhatsApp thread yet.</p>
                    <p className="text-[11px] opacity-70 mt-1">Send a message below to begin interacting with the patient.</p>
                  </div>
                ) : (
                  threadContext.messages.map((msg: any) => {
                    const isStaff = msg.sender_type === 'HUMAN';
                    const isBot = msg.sender_type === 'AI';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-brand-textSecondary mb-0.5 px-1 font-medium">
                          {isStaff ? 'Front Desk / Staff' : (isBot ? 'Medcy WhatsApp Assistant' : (threadContext.thread?.patient_name || 'Patient'))}
                        </span>
                        <div className={`max-w-md p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isStaff 
                            ? 'bg-brand-primary text-white rounded-tr-none' 
                            : (isBot 
                                ? 'bg-brand-surface text-brand-textPrimary border border-brand-border/80 rounded-tl-none' 
                                : 'bg-brand-bg text-brand-textPrimary border border-brand-border rounded-tl-none')
                        }`}>
                          {msg.content}
                        </div>
                        {msg.created_at && (
                          <span className="text-[9px] text-brand-textSecondary/70 mt-0.5 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <div className="p-3.5 border-t border-brand-border bg-brand-surface flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message to the patient on WhatsApp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                  disabled={sendingReply}
                  className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-brand-textPrimary placeholder:text-brand-textSecondary/60 focus:outline-none focus:border-brand-primary transition-all"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Send size={14} /> {sendingReply ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary">
              <MessageCircle size={48} className="text-brand-textSecondary mb-3 stroke-[1.5] opacity-50" />
              <p className="font-bold text-sm text-brand-textPrimary">Select an Escalated Conversation</p>
              <p className="text-xs mt-1 max-w-xs text-brand-textSecondary">Choose an active patient ticket from the left queue to view the full WhatsApp chat history and respond in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
