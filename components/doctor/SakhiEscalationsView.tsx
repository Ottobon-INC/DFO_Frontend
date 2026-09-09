import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  Search, 
  Phone, 
  CheckCircle2, 
  Send, 
  Paperclip, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface EscalationItem {
  id: string;
  patient_name: string;
  phone?: string;
  category: 'Critical' | 'Post-Care' | 'Pre-Care';
  tag: string;
  reason: string;
  time: string;
  stage_info?: string;
  attending_doctor?: string;
  status: string;
  messages?: any[];
}

export const SakhiEscalationsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Critical' | 'Post-Care' | 'Pre-Care'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [customMessages, setCustomMessages] = useState<Record<string, any[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchEscalations = async () => {
    const userStr = localStorage.getItem('user');
    const loggedInUser = userStr ? JSON.parse(userStr) : null;
    const loggedInDoctorId = loggedInUser?.id || loggedInUser?.userId;

    if (!loggedInDoctorId) {
      setEscalations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getSakhiEscalations(loggedInDoctorId);
      const data = res.data || res || [];
      if (Array.isArray(data) && data.length > 0) {
        const mapped: EscalationItem[] = data.map((item: any, idx: number) => {
          const isCritical = item.reason?.toLowerCase().includes('critical') || 
                             item.reason?.toLowerCase().includes('missed') || 
                             item.reason?.toLowerCase().includes('alert') ||
                             item.reason?.toLowerCase().includes('ohss');
          const isPost = item.reason?.toLowerCase().includes('cramp') || 
                         item.reason?.toLowerCase().includes('post') ||
                         item.reason?.toLowerCase().includes('bleeding');
          const cat = isCritical ? 'Critical' : (isPost ? 'Post-Care' : 'Pre-Care');

          const patientName = item.patient_name || item.name || (item.user_id ? `Patient (${item.user_id})` : 'Patient');
          return {
            id: item.id || `esc-backend-${idx}`,
            patient_name: patientName,
            phone: item.metadata?.phone || item.phone || '',
            category: cat,
            tag: item.metadata?.tag || `Fertility (${cat === 'Post-Care' ? 'IVF' : 'IUI'}) • ${cat}`,
            reason: item.reason || 'Clinical alert raised by Sakhi AI assistant',
            time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            stage_info: item.metadata?.stage_info || 'Clinical Review',
            attending_doctor: item.metadata?.attending_doctor || item.attending_doctor_name || 'Attending Doctor',
            status: item.status || 'PENDING'
          };
        });

        setEscalations(mapped);
        if (!selectedId || !mapped.find(c => c.id === selectedId)) {
          setSelectedId(mapped[0]?.id || '');
        }
      } else {
        setEscalations([]);
        setSelectedId('');
      }
    } catch (err) {
      console.error("Failed to fetch Sakhi escalations", err);
      setEscalations([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const selectedEscalation = escalations.find(e => e.id === selectedId) || escalations[0];

  useEffect(() => {
    if (selectedEscalation?.id) {
      api.getEscalationMessages(selectedEscalation.id)
        .then(res => {
          const msgs = res.data || res || [];
          if (Array.isArray(msgs)) {
            setCustomMessages(prev => ({
              ...prev,
              [selectedEscalation.id]: msgs.map((m: any) => ({
                id: m.id,
                sender: m.role === 'assistant' || m.role === 'triage_alert' ? 'SAKHI AI TRIAGE PROTOCOL' : (m.role === 'doctor' ? (m.sender || 'Doctor') : selectedEscalation.patient_name),
                role: m.role === 'assistant' ? 'triage_alert' : m.role,
                content: m.content,
                time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
              }))
            }));
          }
        })
        .catch(err => {
          console.error('Failed to fetch escalation messages:', err);
          setCustomMessages(prev => ({
            ...prev,
            [selectedEscalation.id]: []
          }));
        });
    }
  }, [selectedId, selectedEscalation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedEscalation, customMessages, replyText]);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveSakhiEscalation(id);
      toast.success(`${selectedEscalation?.patient_name || 'Patient'} escalation marked as resolved`);
    } catch (err) {
      toast.error(`Failed to resolve escalation`);
    }

    setEscalations(prev => {
      const remaining = prev.filter(e => e.id !== id);
      if (selectedId === id && remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleCallPatient = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
      toast.success(`Initiating clinical call to ${phone}...`);
    } else {
      toast.error('No contact number available');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEscalation) return;

    const userStr = localStorage.getItem('user');
    const loggedInUser = userStr ? JSON.parse(userStr) : null;
    const doctorName = loggedInUser?.name || selectedEscalation.attending_doctor || 'Doctor';

    const newMsg = {
      id: `reply-${Date.now()}`,
      sender: doctorName,
      role: 'doctor',
      content: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCustomMessages(prev => ({
      ...prev,
      [selectedEscalation.id]: [
        ...(prev[selectedEscalation.id] || selectedEscalation.messages || []),
        newMsg
      ]
    }));

    setReplyText('');
    toast.success('Message sent to patient via Sakhi');
  };

  const filteredEscalations = escalations.filter(item => {
    const matchesSearch = item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

  const countAll = escalations.length;
  const countCritical = escalations.filter(e => e.category === 'Critical').length;
  const countPostCare = escalations.filter(e => e.category === 'Post-Care').length;
  const countPreCare = escalations.filter(e => e.category === 'Pre-Care').length;

  const currentMessages = customMessages[selectedEscalation?.id] || selectedEscalation?.messages || [];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased p-4 lg:p-6 overflow-hidden">
      
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs">
            <Stethoscope size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Sakhi AI Clinical Messaging & Escalations
            </h1>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              Medcy Fertility & IVF Center • Reproductive Endocrinology & IVF Lab
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 shadow-xs">
            <Sparkles size={13} className="text-sky-500 fill-sky-500/20" />
            IVF & Fertility
          </span>
          <button 
            onClick={fetchEscalations}
            title="Refresh Escalations"
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Console */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* Left Escalation Queue List */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          
          {/* Search Bar */}
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fertility patients..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-500 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            {/* Filter Badges */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setActiveFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeFilter === 'All'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'All' ? 'bg-sky-700/60 text-white' : 'bg-slate-200 text-slate-700'}`}>{countAll}</span>
              </button>

              <button
                onClick={() => setActiveFilter('Critical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeFilter === 'Critical'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/70 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle size={12} className={activeFilter === 'Critical' ? 'text-white' : 'text-rose-500'} />
                Critical <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'Critical' ? 'bg-rose-600 text-white' : 'bg-rose-200/80 text-rose-800'}`}>{countCritical}</span>
              </button>

              <button
                onClick={() => setActiveFilter('Post-Care')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeFilter === 'Post-Care'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100'
                }`}
              >
                Post-Care <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'Post-Care' ? 'bg-emerald-700/60 text-white' : 'bg-emerald-200/80 text-emerald-800'}`}>{countPostCare}</span>
              </button>

              <button
                onClick={() => setActiveFilter('Pre-Care')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeFilter === 'Pre-Care'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-sky-50 text-sky-700 border border-sky-200/70 hover:bg-sky-100'
                }`}
              >
                Pre-Care <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === 'Pre-Care' ? 'bg-sky-600 text-white' : 'bg-sky-200/80 text-sky-800'}`}>{countPreCare}</span>
              </button>
            </div>
          </div>

          {/* List Scroll View */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredEscalations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No escalations matching filter.
              </div>
            ) : (
              filteredEscalations.map((item) => {
                const isSelected = selectedId === item.id;
                const initials = item.patient_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 transition-all cursor-pointer relative flex items-start space-x-3 group ${
                      isSelected
                        ? 'bg-sky-50/50 border-l-[3.5px] border-l-sky-600'
                        : 'hover:bg-slate-50 border-l-[3.5px] border-l-transparent'
                    }`}
                  >
                    {/* Avatar Circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs ${
                      isSelected
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/70'
                    }`}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-sky-950' : 'text-slate-900'}`}>
                          {item.patient_name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 ml-2 whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>

                      {/* Tag pill */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-sky-600">
                          {item.tag.split('•')[0]?.trim()}
                        </span>
                        {item.tag.includes('•') && (
                          <>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md ${
                              item.category === 'Post-Care'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.category === 'Critical'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-sky-50 text-sky-700'
                            }`}>
                              {item.tag.split('•')[1]?.trim()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-slate-500 line-clamp-1 group-hover:text-slate-700 transition-colors">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Escalation Chat Console */}
        {selectedEscalation ? (
          <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            
            {/* Patient Header Card */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  {selectedEscalation.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                      {selectedEscalation.patient_name}
                    </h2>
                    <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                      Fertility ({selectedEscalation.category === 'Post-Care' ? 'IVF' : 'IUI'})
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                    {selectedEscalation.phone} • {selectedEscalation.stage_info} • Attending: {selectedEscalation.attending_doctor}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCallPatient(selectedEscalation.phone)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
                >
                  <Phone size={13} className="fill-white" />
                  Call
                </button>
                <button
                  onClick={() => handleResolve(selectedEscalation.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all active:scale-95"
                >
                  <CheckCircle2 size={14} className="text-slate-400 hover:text-emerald-600" />
                  Resolve
                </button>
              </div>
            </div>

            {/* Sub-Header Disclaimer */}
            <div className="py-2.5 px-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-center text-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck size={14} className="text-sky-600" />
                Messages are medically triaged and logged under the patient record.
              </span>
            </div>

            {/* Chat History View */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40 custom-scrollbar">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <p className="text-xs font-semibold text-slate-500">No conversation history found for this patient escalation.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Direct patient messages will appear here once received.</p>
                </div>
              ) : (
                currentMessages.map((msg, idx) => {
                if (msg.role === 'patient') {
                  return (
                    <div key={msg.id || idx} className="flex flex-col items-start space-y-1">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 mb-1">
                          <User size={13} className="text-sky-600" />
                          <span>{msg.sender || selectedEscalation.patient_name}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.role === 'triage_alert') {
                  return (
                    <div key={msg.id || idx} className="flex flex-col items-start space-y-1">
                      <div className="bg-white border border-rose-200/90 rounded-2xl rounded-tl-sm px-4 py-3.5 max-w-[85%] shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600 uppercase tracking-wide mb-1.5">
                          <AlertTriangle size={14} className="text-rose-500" />
                          <span>{msg.sender || 'SAKHI AI TRIAGE PROTOCOL'}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {msg.content}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-2 text-right font-medium">
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Doctor / Reply role
                return (
                  <div key={msg.id || idx} className="flex flex-col items-end space-y-1">
                    <div className="bg-sky-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-xs">
                      <div className="text-[11px] font-bold text-sky-100 mb-0.5">
                        {msg.sender}
                      </div>
                      <p className="text-xs leading-relaxed text-white whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      <div className="text-[10px] text-sky-200 mt-1.5 text-right font-medium">
                        {msg.time}
                      </div>
                    </div>
                  </div>
                );
              }))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex-shrink-0"
                title="Attach medical reports"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${selectedEscalation.patient_name}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-sky-500 transition-all text-slate-800 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={!replyText.trim() || sendingReply}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xs transition-all flex-shrink-0 active:scale-95"
              >
                <Send size={14} />
                Send
              </button>
            </form>

          </div>
        ) : (
          <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-8 text-center text-slate-400 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col items-center space-y-2">
              <Stethoscope size={36} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No Escalation Selected</p>
              <p className="text-xs text-slate-400">Select an escalation from the left queue to view the conversation</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


