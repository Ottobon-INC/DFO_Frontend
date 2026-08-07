import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, ShieldAlert, Activity, UserCheck, CheckCircle, Clock,
  MessageSquare, AlertTriangle, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  User, Database, BrainCircuit, Calendar
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { api } from '../services/api';
import { TimelineContainer } from './timeline/TimelineContainer';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_KEY || ''
);

const orgSupabase = createClient(
  import.meta.env.VITE_ORG_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_ORG_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_KEY || ''
);

import { BookAppointmentModal, AppointmentActionCard } from './AppointmentModals';

export const ControlTowerWorkspace: React.FC = () => {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetails, setThreadDetails] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEarlier, setShowEarlier] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  // Lead & Appointments state
  const [lead, setLead] = useState<any>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showActionCard, setShowActionCard] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Gap 6 + Gap 7: Booking Context Panel state
  const [bookingContext, setBookingContext] = useState<any>(null);
  const [loadingBookingContext, setLoadingBookingContext] = useState(false);
  const [showBookingPanel, setShowBookingPanel] = useState(true);

  // Modals state
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateRole, setEscalateRole] = useState('DOCTOR');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [handoffText, setHandoffText] = useState('');

  const [filter, setFilter] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<string>('CRO');
  const [userId, setUserId] = useState<string>('');
  const [clinicians, setClinicians] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch lead and appointments whenever selected thread details update
  useEffect(() => {
    if (!threadDetails?.user_id) return;
    const loadLeadAndAppointments = async () => {
      try {
        setLoadingLead(true);
        const res = await api.getLeads({ phone: threadDetails.user_id });
        if (res && res.success && res.data && res.data.items && res.data.items.length > 0) {
          setLead(res.data.items[0]);
        } else if (res && res.data && res.data.length > 0) {
          setLead(res.data[0]);
        } else {
          setLead(null);
        }

        if (threadDetails.patient_id) {
          const apptRes = await api.getPatientAppointments(threadDetails.patient_id);
          setAppointments(apptRes.data || apptRes || []);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error('Failed to load lead/appointments:', err);
      } finally {
        setLoadingLead(false);
      }
    };
    loadLeadAndAppointments();
  }, [threadDetails]);

  // Lead status updates
  const handleUpdateLeadStatus = async (status: string) => {
    if (!lead?.id) return;
    try {
      await api.updateLead(lead.id, { status });
      const res = await api.getLeads({ phone: threadDetails.user_id });
      if (res && res.success && res.data && res.data.items && res.data.items.length > 0) {
        setLead(res.data.items[0]);
      } else if (res && res.data && res.data.length > 0) {
        setLead(res.data[0]);
      }
    } catch (err) {
      alert('Failed to update lead status');
    }
  };

  // Appointment creation
  const handleBookConfirm = async (formData: any) => {
    try {
      const payload = {
        patient_id: threadDetails?.patient_id || lead?.id || undefined,
        name: formData.name,
        phone: formData.phone,
        appointment_date: formData.date,
        start_time: formData.time,
        doctor_id: formData.consultant || 'dr_sireesha',
        type: formData.visit_reason || 'In-Person',
        visit_reason: formData.problem || 'Routine consultation',
        status: 'Scheduled'
      };
      await api.createAppointment(payload);
      if (lead?.id) {
        await api.updateLead(lead.id, { status: 'Appointment Booked' });
      }
      setShowBookModal(false);
      
      // Refresh context
      if (threadDetails?.patient_id) {
        const apptRes = await api.getPatientAppointments(threadDetails.patient_id);
        setAppointments(apptRes.data || apptRes || []);
      }
      const res = await api.getLeads({ phone: threadDetails?.user_id });
      if (res && res.success && res.data && res.data.items && res.data.items.length > 0) {
        setLead(res.data.items[0]);
      }
    } catch (e: any) {
      alert('Failed to book appointment: ' + e.message);
    }
  };

  // Appointment cancellation
  const handleCancelAppointment = async () => {
    if (!selectedAppointment?.id) return;
    try {
      await api.updateAppointmentStatus(selectedAppointment.id, { status: 'Canceled' });
      setShowActionCard(false);
      if (threadDetails?.patient_id) {
        const apptRes = await api.getPatientAppointments(threadDetails.patient_id);
        setAppointments(apptRes.data || apptRes || []);
      }
    } catch (e: any) {
      alert('Failed to cancel appointment: ' + e.message);
    }
  };

  // Load user from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserRole((u.role || 'CRO').toUpperCase());
        setUserId(u.id || '');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch threads list
  const fetchThreads = async () => {
    try {
      const res = await api.getWorkspaceThreads();
      setThreads(res.data || res || []);
    } catch (err) {
      console.error('Failed to load workspace threads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinicians list dynamically
  const fetchClinicians = async () => {
    try {
      const res = await api.getWorkspaceClinicians();
      setClinicians(res.data || res || []);
    } catch (err) {
      console.error('Failed to load clinicians list:', err);
    }
  };

  // Fetch single thread context
  const fetchThreadContext = async (threadId: string) => {
    try {
      const threadRes = await api.getWorkspaceThreadById(threadId);
      const msgRes = await api.getWorkspaceThreadMessages(threadId);
      setThreadDetails(threadRes.data || threadRes);
      setMessages(msgRes.data || msgRes || []);
    } catch (err) {
      console.error('Failed to load thread details:', err);
    }
  };

  // Gap 6 + Gap 7: Fetch booking context for Operator/Doctor workspace
  const fetchBookingContext = async (threadId: string) => {
    try {
      setLoadingBookingContext(true);
      const res = await fetch(`/api/threads/${threadId}/booking-context`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': (() => {
            try {
              const u = JSON.parse(localStorage.getItem('user') || '{}');
              return u.token ? `Bearer ${u.token}` : '';
            } catch { return ''; }
          })(),
        }
      });
      if (res.ok) {
        const json = await res.json();
        setBookingContext(json.data || null);
      }
    } catch (err) {
      console.error('Failed to load booking context:', err);
    } finally {
      setLoadingBookingContext(false);
    }
  };

  const msgCountRef = useRef(0);

  // Initial Load & Real-Time Setup with Polling Fallback
  useEffect(() => {
    fetchThreads();
    fetchClinicians();

    // Subscribe to conversation_threads updates
    const threadsSubscription = supabase
      .channel('threads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_threads' }, () => {
        fetchThreads();
      })
      .subscribe();

    // Polling fallback for threads (every 5 seconds)
    const threadPollInterval = setInterval(() => {
      fetchThreads();
    }, 5000);

    return () => {
      supabase.removeChannel(threadsSubscription);
      clearInterval(threadPollInterval);
    };
  }, []);

  // Subscribe to messages when selectedThreadId changes
  useEffect(() => {
    if (!selectedThreadId) return;

    const loadContext = async () => {
      try {
        const threadRes = await api.getWorkspaceThreadById(selectedThreadId);
        const msgRes = await api.getWorkspaceThreadMessages(selectedThreadId);

        const fetchedThread = threadRes.data || threadRes;
        const fetchedMsgs = msgRes.data || msgRes || [];

        setThreadDetails(fetchedThread);
        setMessages(fetchedMsgs);
        msgCountRef.current = fetchedMsgs.length;
        
        // Load booking context dynamically
        fetchBookingContext(selectedThreadId);

        // Scroll to bottom on initial load
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch (err) {
        console.error('Failed to load thread context:', err);
      }
    };

    loadContext();

    // Setup polling fallback for messages (every 3 seconds) to ensure real-time messages display
    const msgPollInterval = setInterval(async () => {
      try {
        const msgRes = await api.getWorkspaceThreadMessages(selectedThreadId);
        const fetchedMsgs = msgRes.data || msgRes || [];
        setMessages(fetchedMsgs);

        if (fetchedMsgs.length > msgCountRef.current) {
          msgCountRef.current = fetchedMsgs.length;
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.error('Failed to poll message updates:', err);
      }
    }, 3000);

    // Subscribe to messages (will fail on self-hosted but acts as backup)
    const msgsSubscription = orgSupabase
      .channel(`messages-${selectedThreadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sakhi_conversations_new',
        filter: `user_id=eq.${threadDetails?.user_id || ''}`
      }, (payload) => {
        let sender_type = 'HUMAN';
        if (payload.new.message_type === 'user') {
          sender_type = 'PATIENT';
        } else if (payload.new.message_type === 'sakhi') {
          sender_type = 'AI';
        }
        const newMsg = {
          id: payload.new.id.toString(),
          thread_id: selectedThreadId,
          sender_id: payload.new.message_type === 'user' ? threadDetails?.user_id : 'SYSTEM',
          sender_type: sender_type,
          message: payload.new.message_text,
          content: payload.new.message_text,
          created_at: payload.new.created_at
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          msgCountRef.current = updated.length;
          return updated;
        });
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgsSubscription);
      clearInterval(msgPollInterval);
    };
  }, [selectedThreadId, threadDetails?.user_id]);

  // SLA timer countdown display
  const getSlaRemaining = (slaDueStr: string) => {
    if (!slaDueStr) return null;
    const diff = new Date(slaDueStr).getTime() - Date.now();
    if (diff <= 0) return 'SLA Expired';
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min remaining`;
  };

  // Handle assign
  const handleAssign = async (assignTo: string, role: string) => {
    if (!selectedThreadId) return;
    try {
      await api.assignWorkspaceThread(selectedThreadId, { assignTo, role });
      await fetchThreadContext(selectedThreadId);
    } catch (e) {
      alert('Assignment failed: ' + (e as any).message);
    }
  };

  // Handle doctor takeover
  const handleDoctorTakeover = async () => {
    if (!selectedThreadId) return;
    try {
      await api.assignWorkspaceThread(selectedThreadId, { assignTo: userId, role: 'DOCTOR' });
      await api.takeControl(selectedThreadId);
      await fetchThreadContext(selectedThreadId);
    } catch (e: any) {
      alert('Takeover failed: ' + e.message);
    }
  };

  // Handle escalate
  const handleEscalate = async (status: string, reason: string, score: number) => {
    if (!selectedThreadId) return;
    try {
      await api.escalateWorkspaceThread(selectedThreadId, { reason, status, riskScore: score });
      await fetchThreadContext(selectedThreadId);
    } catch (e) {
      alert('Escalation failed');
    }
  };

  // Handle reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return;
    setSendingReply(true);
    try {
      await api.replyToWorkspaceThread(selectedThreadId, { message: replyText.trim() });
      setReplyText('');
    } catch (e) {
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle resolve
  const handleResolve = async () => {
    if (!selectedThreadId) return;
    try {
      await api.resolveWorkspaceThread(selectedThreadId);
      await fetchThreadContext(selectedThreadId);
      setShowResolveConfirm(false);
    } catch (e) {
      alert('Failed to resolve thread');
    }
  };

  // Handle Escalation Modal Submit
  const handleEscalateSubmit = async () => {
    if (!selectedThreadId || !escalateReason.trim()) return;
    try {
      const riskScore = escalateRole === 'DOCTOR' ? 90 : 70;
      const status = escalateRole === 'DOCTOR' ? 'red' : 'yellow';
      await api.escalateWorkspaceThread(selectedThreadId, { reason: escalateReason, status, riskScore });
      await api.assignWorkspaceThread(selectedThreadId, { assignTo: 'QUEUE', role: escalateRole });
      await fetchThreadContext(selectedThreadId);
      setShowEscalateModal(false);
      setEscalateReason('');
    } catch (e) {
      alert('Escalation failed');
    }
  };

  // Handle Summary Modal Submit
  const handleSummarySubmit = async () => {
    if (!selectedThreadId) return;
    try {
      await api.refreshWorkspaceSummary(selectedThreadId, {
        clinicalSummary: summaryText,
        handoffSummary: handoffText
      });
      await fetchThreadContext(selectedThreadId);
      setShowSummaryModal(false);
    } catch (e) {
      alert('Failed to update summary');
    }
  };

  // Handle refresh summary click
  const handleRefreshSummary = () => {
    if (!selectedThreadId || !threadDetails) return;
    setSummaryText(threadDetails.clinical_summary || '');
    setHandoffText(threadDetails.handoff_summary || '');
    setShowSummaryModal(true);
  };


  // Filter messages for collapse option (hide greetings etc)
  const isGreetingMessage = (msg: string) => {
    const lowValueKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'namaste', 'thank you', 'thanks'];
    return lowValueKeywords.some(kw => msg.toLowerCase().trim() === kw);
  };

  const filteredMessages = showEarlier
    ? messages
    : messages.filter(m => !isGreetingMessage(m.message));

  const getFilteredThreads = () => {
    if (userRole !== 'CRO' && userRole !== 'ADMIN') return threads;
    switch (filter) {
      case 'AI_ACTIVE':
        return threads.filter(t => t.current_owner_type === 'AI' || t.status === 'AI_ACTIVE' || t.status === 'active');
      case 'NURSE':
        return threads.filter(t => t.current_owner_type === 'NURSE' || t.status === 'NURSE_ASSIGNED');
      case 'DOCTOR':
        return threads.filter(t => t.current_owner_type === 'DOCTOR' || t.status === 'DOCTOR_ASSIGNED');
      case 'HIGH_RISK':
        return threads.filter(t => (t.risk_score && t.risk_score >= 70) || t.status === 'red');
      case 'SLA_BREACH':
        return threads.filter(t => t.sla_due_at && new Date(t.sla_due_at).getTime() < Date.now() && t.status !== 'RESOLVED' && t.status !== 'AI_ACTIVE');
      case 'RESOLVED':
        return threads.filter(t => t.status === 'RESOLVED' || t.resolved_at);
      default:
        return threads;
    }
  };

  const getAssignedClinicianName = () => {
    if (!threadDetails?.assigned_user_id) return '';
    // Prefer the name returned directly by the backend (current_owner_name)
    if (threadDetails?.current_owner_name) return threadDetails.current_owner_name;
    // Fallback: look up in local clinicians list
    const clinician = clinicians.find(c => c.id === threadDetails.assigned_user_id);
    return clinician ? clinician.name : threadDetails.assigned_to || 'Clinician';
  };

  const isAssigned = threadDetails?.assigned_role === 'DOCTOR' || threadDetails?.assigned_role === 'NURSE';

  return (
    <div className="flex gap-6 overflow-hidden h-[calc(100vh-200px)] animate-slide-up bg-brand-surface border border-brand-border rounded-2xl p-4">

      {/* LEFT PANEL - Thread List */}
      <div className="w-80 bg-brand-bg/20 border border-brand-border rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-brand-border bg-brand-surface">
          <h3 className="text-sm font-bold text-brand-textPrimary flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-primary" /> Real-time Operator Queue
          </h3>
        </div>

        {/* CRO / ADMIN FILTERS */}
        {(userRole === 'CRO' || userRole === 'ADMIN') && (
          <div className="px-3 py-2 border-b border-brand-border bg-brand-bg/5 flex flex-wrap gap-1">
            {['ALL', 'AI_ACTIVE', 'NURSE', 'DOCTOR', 'HIGH_RISK', 'SLA_BREACH', 'RESOLVED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${filter === f ? 'bg-brand-primary text-white' : 'bg-brand-bg hover:bg-brand-border text-brand-textSecondary'
                  }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-brand-border custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-brand-textSecondary">Loading operator queue...</div>
          ) : getFilteredThreads().length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-textSecondary">No conversations found.</div>
          ) : (
            getFilteredThreads().map((thread) => {
              const sla = getSlaRemaining(thread.sla_due_at);
              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-4 cursor-pointer hover:bg-brand-bg/50 transition-colors ${selectedThreadId === thread.id ? 'bg-brand-primary/10 border-l-4 border-brand-primary' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-brand-textPrimary flex items-center gap-1.5">
                      {thread.status === 'DOCTOR_ASSIGNED' || thread.current_owner_type === 'DOCTOR' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Doctor Assigned" />
                      ) : thread.status === 'NURSE_ASSIGNED' || thread.current_owner_type === 'NURSE' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" title="Nurse Assigned" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" title="AI Active" />
                      )}
                      {thread.patient_name}
                    </span>
                    <span className="text-[10px] text-brand-textSecondary">
                      {thread.last_message_at ? new Date(thread.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {thread.escalation_reason && (
                    <p className="text-[10px] text-red-400 font-medium mb-1.5">{thread.escalation_reason}</p>
                  )}
                  <p className="text-xs text-brand-textSecondary truncate mb-2">{thread.last_message_preview || 'No messages'}</p>
                  <div className="flex justify-between items-center text-[10px] text-brand-textSecondary">
                    <span className="bg-brand-bg border border-brand-border px-1.5 py-0.5 rounded capitalize">
                      {thread.channel}
                    </span>
                    {sla && (
                      <span className={`font-bold px-1.5 py-0.5 rounded ${sla === 'SLA Expired' ? 'bg-red-500/10 text-red-400' : 'bg-brand-primary/10 text-brand-primary'
                        }`}>
                        {sla}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Unified Workspace */}
      <div className="flex-1 bg-brand-bg/10 border border-brand-border rounded-2xl flex flex-col overflow-hidden">
        {selectedThreadId && threadDetails ? (
          <>
            {/* 1. Patient Header */}
            <div className="px-6 py-4 border-b border-brand-border bg-brand-surface flex justify-between items-center">
              <div>
                <h3 className="font-bold text-brand-textPrimary flex items-center gap-2 text-base">
                  {threadDetails.patient_name}
                  <span className="text-[10px] bg-brand-bg border border-brand-border px-2 py-0.5 rounded uppercase font-semibold text-brand-textSecondary">
                    {threadDetails.channel}
                  </span>
                </h3>
                <p className="text-xs text-brand-textSecondary mt-1">
                  Status: <span className="font-bold capitalize">{threadDetails.status?.toLowerCase().replace('_', ' ')}</span> • Assigned to: <span className="font-bold">{getAssignedClinicianName() || 'None'}</span>
                </p>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {(userRole === 'CRO' || userRole === 'ADMIN') && (
                  <>
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      className="px-3 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-red-200"
                    >
                      <ShieldAlert size={14} /> Escalate Case
                    </button>

                    <div className="flex items-center bg-brand-bg border border-brand-border rounded-xl p-1 gap-1">
                      <select
                        onChange={(e) => handleAssign(e.target.value, 'DOCTOR')}
                        className="bg-transparent text-[11px] text-brand-textPrimary outline-none border-none px-2 cursor-pointer font-bold"
                        value={threadDetails.assigned_role === 'DOCTOR' ? (threadDetails.assigned_user_id || '') : ""}
                      >
                        <option value="" disabled>Assign Doctor</option>
                        {clinicians.filter(c => c.role?.toLowerCase() === 'doctor').map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.is_available ? ' 🟢' : ' 🔴'}</option>
                        ))}
                      </select>
                      <select
                        onChange={(e) => handleAssign(e.target.value, 'NURSE')}
                        className="bg-transparent text-[11px] text-brand-textPrimary outline-none border-none px-2 cursor-pointer font-bold"
                        value={threadDetails.assigned_role === 'NURSE' ? (threadDetails.assigned_user_id || '') : ""}
                      >
                        <option value="" disabled>Assign Nurse</option>
                        {clinicians.filter(c => c.role?.toLowerCase() === 'nurse').map(c => (
                          <option key={c.id} value={c.id}>{c.name}{c.is_available ? ' 🟢' : ' 🔴'}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {((threadDetails.current_owner_type === 'DOCTOR' && userRole === 'DOCTOR' && threadDetails.current_owner_id === userId) ||
                  (threadDetails.current_owner_type === 'NURSE' && userRole === 'NURSE' && threadDetails.current_owner_id === userId) ||
                  userRole === 'CRO' || userRole === 'ADMIN') && (
                  <button
                    onClick={() => setShowResolveConfirm(true)}
                    className="px-3 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-green-500/10 cursor-pointer"
                  >
                    <CheckCircle size={14} /> Resolve & Return to AI
                  </button>
                )}

                {userRole === 'DOCTOR' && threadDetails.status === 'red' && threadDetails.current_owner_id !== userId && (
                  <button
                    onClick={handleDoctorTakeover}
                    className="px-3 py-2 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-brand-primary/10 cursor-pointer border-none"
                  >
                    <UserCheck size={14} /> Accept Case & Take Control
                  </button>
                )}
              </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex px-6 pt-2 gap-4 border-b border-brand-border bg-brand-surface">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'overview' ? 'text-brand-primary border-brand-primary' : 'text-brand-textSecondary border-transparent hover:text-brand-textPrimary'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${activeTab === 'timeline' ? 'text-brand-primary border-brand-primary' : 'text-brand-textSecondary border-transparent hover:text-brand-textPrimary'}`}
              >
                Clinical Timeline
              </button>
            </div>

            {/* Scrollable details view */}
              {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Gap 6 + Gap 7: Booking & Active Patient Context Card */}
              {bookingContext && (
                <div className="bg-brand-primary/5 border border-brand-primary/10 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-brand-border/30">
                    <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={15} /> Janmasethu Care Context
                    </h4>
                    <span className="text-[10px] bg-brand-primary/20 text-brand-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Stage: {bookingContext.booking?.stage || 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                    <div className="bg-brand-surface p-3 rounded-xl border border-brand-border/60">
                      <span className="text-[9px] text-brand-textSecondary uppercase font-bold block mb-1">Patient Profile</span>
                      <div className="space-y-1">
                        <p className="text-brand-textPrimary font-bold">{bookingContext.patient?.name}</p>
                        <p className="text-[10px] text-brand-textSecondary">Gender: {bookingContext.patient?.gender || 'N/A'}</p>
                        <p className="text-[10px] text-brand-textSecondary">Location: {bookingContext.patient?.location || 'N/A'}</p>
                        <p className="text-[10px] text-brand-textSecondary">Phone: {bookingContext.patient?.phone}</p>
                      </div>
                    </div>

                    <div className="bg-brand-surface p-3 rounded-xl border border-brand-border/60">
                      <span className="text-[9px] text-brand-textSecondary uppercase font-bold block mb-1">Booking Details</span>
                      <div className="space-y-1">
                        <p className="text-brand-textPrimary font-bold">{bookingContext.booking?.hospital || 'No Hospital Selected'}</p>
                        {bookingContext.booking?.doctor && (
                          <p className="text-[10px] text-brand-textSecondary">Doctor: <span className="font-bold">{bookingContext.booking.doctor}</span></p>
                        )}
                        {bookingContext.booking?.slot && (
                          <p className="text-[10px] text-brand-textSecondary">Slot: <span className="font-bold">{bookingContext.booking.date} at {bookingContext.booking.slot}</span></p>
                        )}
                        {bookingContext.booking?.appointment_status && (
                          <p className="text-[10px] text-brand-textSecondary">Appt Status: <span className="font-bold capitalize text-green-600">{bookingContext.booking.appointment_status}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="bg-brand-surface p-3 rounded-xl border border-brand-border/60">
                      <span className="text-[9px] text-brand-textSecondary uppercase font-bold block mb-1">Lead Pipeline</span>
                      <div className="space-y-1">
                        <p className="text-brand-textPrimary font-bold">Status: {bookingContext.lead?.status || 'No Active Lead'}</p>
                        <p className="text-[10px] text-brand-textSecondary">Topic: {bookingContext.lead?.problem || 'N/A'}</p>
                        <p className="text-[10px] text-brand-textSecondary">Source: {bookingContext.lead?.source || 'N/A'}</p>
                        <p className="text-[10px] text-brand-textSecondary">Router Context: <span className="font-bold text-brand-primary">{bookingContext.conversation_context}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Operator Notes in Doctor view */}
                  {userRole === 'DOCTOR' && bookingContext.operator_notes?.length > 0 && (
                    <div className="border-t border-brand-border/30 pt-3">
                      <span className="text-[9px] text-brand-textSecondary uppercase font-bold block mb-2">Clinical Care / Operator Notes</span>
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {bookingContext.operator_notes.map((n: any, idx: number) => (
                          <div key={idx} className="bg-brand-surface p-2.5 rounded-lg border border-brand-border/40 text-[11px]">
                            <p className="text-brand-textPrimary font-medium">{n.note}</p>
                            <p className="text-[9px] text-brand-textSecondary mt-1">Added by {n.created_by} on {new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lead Details & Operations Card */}
              {lead && (
                <div className="bg-brand-surface border border-brand-border p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                    <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                      <User size={15} className="text-brand-primary" /> Lead Status & Details
                    </h4>
                    <select
                      value={lead.status || 'New'}
                      onChange={(e) => handleUpdateLeadStatus(e.target.value)}
                      className="bg-brand-bg text-xs text-brand-textPrimary border border-brand-border rounded-lg px-2 py-1 outline-none font-semibold cursor-pointer"
                    >
                      {['New', 'Contacted', 'Interested', 'Appointment Booked', 'Waiting for Patient', 'Escalated to Doctor', 'Closed', 'Lost'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-brand-textSecondary uppercase font-bold block mb-1">Source</span>
                      <span className="text-brand-textPrimary">{lead.source || 'WhatsApp'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-textSecondary uppercase font-bold block mb-1">Problem Description</span>
                      <span className="text-brand-textPrimary">{lead.problem || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Operations Card */}
              <div className="bg-brand-surface border border-brand-border p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                  <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={15} className="text-brand-primary" /> Appointment Operations
                  </h4>
                  {appointments.filter(a => a.status !== 'Canceled').length === 0 ? (
                    <button
                      onClick={() => setShowBookModal(true)}
                      className="px-3 py-1.5 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition-all cursor-pointer border-none"
                    >
                      Book Appointment
                    </button>
                  ) : null}
                </div>
                {appointments.filter(a => a.status !== 'Canceled').length > 0 ? (
                  <div className="space-y-3">
                    {appointments.filter(a => a.status !== 'Canceled').map(appt => (
                      <div key={appt.id} className="flex justify-between items-center p-3 bg-brand-bg rounded-xl border border-brand-border">
                        <div>
                          <p className="text-xs font-bold text-brand-textPrimary">{appt.appointment_date} @ {appt.start_time}</p>
                          <p className="text-[10px] text-brand-textSecondary">Doctor ID: {appt.doctor_id} • Status: {appt.status}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setShowActionCard(true);
                          }}
                          className="px-2.5 py-1 text-xs border border-brand-border rounded-lg text-brand-textSecondary hover:bg-brand-hover font-semibold transition-all cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-textSecondary italic">No active appointments scheduled.</p>
                )}
              </div>

              {/* 2. AI Handoff Summary */}
              <div className="bg-brand-primary/5 border border-brand-primary/10 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                    <BrainCircuit size={15} /> AI Clinical Handoff Report
                  </h4>
                  <button
                    onClick={handleRefreshSummary}
                    className="p-1.5 rounded-lg hover:bg-brand-primary/10 text-brand-textSecondary hover:text-brand-primary transition-colors cursor-pointer"
                    title="Update or Add summary"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {threadDetails.handoff_summary ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-brand-border/30 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] text-brand-textSecondary uppercase tracking-wider font-bold block mb-1">Risk Score</span>
                        <span className="text-lg font-extrabold text-red-500">{threadDetails.risk_score || 50}/100</span>
                      </div>
                      {threadDetails.escalation_reason && (
                        <div>
                          <span className="text-[10px] text-brand-textSecondary uppercase tracking-wider font-bold block mb-1">Escalation Reason</span>
                          <span className="text-xs font-semibold text-brand-textPrimary">{threadDetails.escalation_reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-brand-textSecondary leading-relaxed space-y-2 font-medium">
                      {threadDetails.handoff_summary.split('\n').map((line: string, i: number) => {
                            if (line.includes(':')) {
                              const parts = line.split(':');
                              return (
                                <div key={i} className="mt-1">
                                  <span className="font-extrabold text-brand-textPrimary">{parts[0]}:</span>
                                  <span>{parts.slice(1).join(':')}</span>
                                </div>
                              );
                            }
                            return <p key={i}>{line}</p>;
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-brand-textSecondary text-center py-6 italic font-medium">
                        No clinical summary generated for this thread yet.<br />
                        Click the refresh icon above to generate or write one manually.
                      </div>
                    )}
                  </div>

                  {/* 3. Complete Chat Timeline */}
                  <div className="border-t border-brand-border pt-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Conversation Log</h4>
                      <button
                        onClick={() => setShowEarlier(!showEarlier)}
                        className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                      >
                        {showEarlier ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showEarlier ? 'Hide Greetings' : 'Show Earlier Messages'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {filteredMessages.map((msg) => {
                        const isPatient = msg.sender_type === 'PATIENT' || msg.sender_type === 'USER';
                        const isAI = msg.sender_type === 'AI';
                        const isSystem = msg.sender_type === 'SYSTEM';

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <span className="bg-brand-bg text-[10px] font-bold px-3 py-1 rounded-full text-brand-textSecondary border border-brand-border">
                                {msg.message}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-md p-3.5 rounded-2xl text-xs font-medium border ${isPatient
                                ? 'bg-brand-bg text-brand-textPrimary border-brand-border rounded-tl-none'
                                : isAI
                                  ? 'bg-brand-primary/10 text-brand-textPrimary border-brand-primary/20 rounded-tr-none'
                                  : 'bg-brand-primary text-white border-brand-primary/30 rounded-tr-none'
                              }`}>
                              <div className="flex justify-between items-center gap-4 mb-1 text-[9px] opacity-75">
                                <span className="font-extrabold uppercase">
                                  {isPatient ? 'Patient' : isAI ? 'AI Assistant' : msg.sender_type}
                                </span>
                                <span>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="leading-relaxed">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-brand-surface h-full">
                  {threadDetails.patient_id || threadDetails.patient_id_ref ? (
                    <TimelineContainer patientId={threadDetails.patient_id || threadDetails.patient_id_ref} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary text-center opacity-70">
                      <p className="font-bold text-sm">No Patient Associated</p>
                      <p className="text-xs mt-1">This thread is not yet associated with a specific patient profile.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Reply Composer */}
              {activeTab === 'overview' && (
                <div className="p-4 border-t border-brand-border bg-brand-surface">
                  {isAssigned ? (
                    <div className="space-y-3">
                      <div className="w-full bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl text-xs text-center text-brand-textSecondary font-semibold">
                        🔒 Thread has been locked to {getAssignedClinicianName()} ({threadDetails.assigned_role}).
                      </div>
                      <div className="flex gap-3 opacity-50">
                        <input
                          disabled
                          value=""
                          placeholder="Type your response to the patient..."
                          className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none cursor-not-allowed"
                        />
                        <button
                          disabled
                          className="bg-brand-primary text-white rounded-xl px-5 py-3 flex items-center justify-center transition-all cursor-not-allowed"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (!threadDetails.current_owner_type || threadDetails.current_owner_type === 'AI' || threadDetails.current_owner_id === userId || userRole === 'CRO' || userRole === 'ADMIN' || (threadDetails.current_owner_id === 'dr_sireesha' && userId === '24efa0aa-16d8-4b59-8c1b-91847d7b5599') || (threadDetails.current_owner_id === 'nurse_divya' && userId === 'adf72781-93d8-4827-ad1f-607d40c0edf3')) ? (
                    <div className="flex gap-3">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        placeholder="Type your response to the patient..."
                        className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="bg-brand-primary hover:bg-brand-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl text-xs text-center text-brand-textSecondary font-semibold">
                      🔒 Only the assigned clinician ({threadDetails.current_owner_type} - {threadDetails.current_owner_id}) can reply to this thread.
                    </div>
                  )}
                </div>
              )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-textSecondary p-8">
            <User size={48} className="mb-4 stroke-[1.5]" />
            <p className="font-bold text-sm">Select a Conversation</p>
            <p className="text-xs mt-1">Select a patient thread from the left pane to view details and reply.</p>
          </div>
        )}
          </div>


      {/* Modals */}
      {showResolveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-sm text-brand-textPrimary">
                {userRole === 'DOCTOR' ? 'Conclude Consultation?' : 'Resolve Thread?'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-brand-textSecondary">
                {userRole === 'DOCTOR' 
                  ? 'Are you sure you want to conclude this consultation? The thread will be returned to AI automation.'
                  : 'Are you sure you want to resolve this thread? It will be returned to AI automation and marked as resolved.'}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end">
              <button onClick={() => setShowResolveConfirm(false)} className="px-4 py-2 text-xs font-bold text-brand-textSecondary bg-brand-bg border border-brand-border rounded-xl hover:bg-brand-hover transition-all">Cancel</button>
              <button onClick={handleResolve} className="px-4 py-2 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all">
                {userRole === 'DOCTOR' ? 'Yes, Conclude' : 'Yes, Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-red-500/10">
              <h3 className="font-bold text-sm text-red-500 flex items-center gap-2"><ShieldAlert size={16} /> Escalate Thread</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase">Escalate To Queue</label>
                <select 
                  value={escalateRole} 
                  onChange={(e) => setEscalateRole(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-red-400 font-bold"
                >
                  <option value="DOCTOR">Doctor / Specialist (Red Queue)</option>
                  <option value="NURSE">Nurse / Triage (Yellow Queue)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase">Reason for Escalation</label>
                <textarea 
                  value={escalateReason} 
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Provide clinical context for the clinician..."
                  rows={3}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-red-400"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end bg-brand-bg/50">
              <button onClick={() => setShowEscalateModal(false)} className="px-4 py-2 text-xs font-bold text-brand-textSecondary bg-brand-surface border border-brand-border rounded-xl hover:bg-brand-hover transition-all">Cancel</button>
              <button onClick={handleEscalateSubmit} disabled={!escalateReason.trim()} className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all disabled:opacity-50">Escalate Now</button>
            </div>
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center">
              <h3 className="font-bold text-sm text-brand-primary flex items-center gap-2"><BrainCircuit size={16} /> Edit AI Context Summary</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase">Clinical Summary</label>
                <textarea 
                  value={summaryText} 
                  onChange={(e) => setSummaryText(e.target.value)}
                  rows={4}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase">Handoff Bullet Points</label>
                <textarea 
                  value={handoffText} 
                  onChange={(e) => setHandoffText(e.target.value)}
                  rows={6}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary font-mono text-[10px]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end bg-brand-bg/50">
              <button onClick={() => setShowSummaryModal(false)} className="px-4 py-2 text-xs font-bold text-brand-textSecondary bg-brand-surface border border-brand-border rounded-xl hover:bg-brand-hover transition-all">Cancel</button>
              <button onClick={handleSummarySubmit} className="px-4 py-2 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all">Save Summary</button>
            </div>
          </div>
        </div>
      )}

      {showBookModal && (
        <BookAppointmentModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          onConfirm={handleBookConfirm}
          initialData={{
            name: lead?.name || threadDetails?.patient_name || '',
            phone: lead?.phone || threadDetails?.user_id || '',
            patientId: threadDetails?.patient_id || lead?.id || undefined
          }}
        />
      )}

      {showActionCard && selectedAppointment && (
        <AppointmentActionCard
          appointment={selectedAppointment}
          onClose={() => setShowActionCard(false)}
          onCancel={handleCancelAppointment}
        />
      )}

    </div>
  );
};
