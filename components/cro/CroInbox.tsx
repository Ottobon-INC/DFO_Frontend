import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, Send, MessageSquare, ShieldAlert, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { DOCTORS } from '../../constants';

export const CroInbox: React.FC = () => {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscating] = useState(false);

  // Selection states for target clinicians
  const [selectedDocId, setSelectedDocId] = useState(DOCTORS[0]?.id || '');
  const [selectedNurseId, setSelectedNurseId] = useState('nurse_divya');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchInboxData = async () => {
    try {
      const res = await api.getInboxThreads();
      const allThreads = res.data || res || [];
      // Filter out threads that have an assigned user (only display unassigned threads to CRO)
      const unassignedThreads = allThreads.filter((t: any) => !t.assigned_user_id);
      setThreads(unassignedThreads);
    } catch (err) {
      console.error(err);

      // Load escalated threads tracker from localStorage fallback db
      const savedThreadsStr = localStorage.getItem('escalated_threads');
      const savedThreads = savedThreadsStr ? JSON.parse(savedThreadsStr) : [];
      const assignedIds = new Set(savedThreads.map((t: any) => t.id));

      // Multi-thread pipeline mock state (increased count)
      const mockThreads = [
        { id: "t-1", patient_name: "Sara Johnson", latest_message: "When is my next scan scheduled?", updated_at: new Date().toISOString(), status: "green", assigned_user_id: null },
        { id: "t-2", patient_name: "Priya Nair", latest_message: "My vitals report has been updated.", updated_at: new Date(Date.now() - 3600000).toISOString(), status: "green", assigned_user_id: null },
        { id: "t-3", patient_name: "Karan Johar", latest_message: "What is the procedure for semen analysis?", updated_at: new Date(Date.now() - 7200000).toISOString(), status: "green", assigned_user_id: null },
        { id: "t-4", patient_name: "Anjali Sharma", latest_message: "Fasting requirements for glucose check?", updated_at: new Date(Date.now() - 10800000).toISOString(), status: "green", assigned_user_id: null },
        { id: "t-5", patient_name: "Rahul Khanna", latest_message: "Refill request for my daily prescription.", updated_at: new Date(Date.now() - 14400000).toISOString(), status: "green", assigned_user_id: null },
        { id: "t-6", patient_name: "Meera Sen", latest_message: "Do you accept credit card payments for scans?", updated_at: new Date(Date.now() - 18000000).toISOString(), status: "green", assigned_user_id: null },
        { id: "t-7", patient_name: "Kabir Malhotra", latest_message: "BP query and emergency guidance request.", updated_at: new Date(Date.now() - 21600000).toISOString(), status: "green", assigned_user_id: null }
      ];

      // Filter out mock threads that were escalated locally
      const filteredMocks = mockThreads.filter(t => !assignedIds.has(t.id));
      setThreads(filteredMocks);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetails = async (id: string) => {
    try {
      const res = await api.getThreadContext(id);
      setThreadContext(res.data || res);
    } catch (err) {
      console.error(err);

      const savedThreadsStr = localStorage.getItem('escalated_threads');
      const savedThreads = savedThreadsStr ? JSON.parse(savedThreadsStr) : [];
      const savedThread = savedThreads.find((t: any) => t.id === id);

      const matched = threads.find(t => t.id === id) || savedThread;
      setThreadContext({
        thread: { id, patient_name: matched?.patient_name || "Patient", status: matched?.status || "green" },
        messages: [
          { id: "m-1", sender_type: "PATIENT", content: matched?.latest_message || "Hello", created_at: new Date().toISOString() }
        ]
      });
    }
  };

  const handleEscalate = async (targetStatus: 'red' | 'yellow', assignedUserId: string) => {
    if (!selectedThreadId) return;
    setEscating(true);
    try {
      await api.escalateThread(selectedThreadId, targetStatus, assignedUserId);
      alert(`Successfully escalated thread to ${targetStatus === 'red' ? 'Doctor' : 'Nurse'} queue!`);

      // Save escalation state to localStorage as a fallback database trigger for demo routing
      const savedThreadsStr = localStorage.getItem('escalated_threads') || '[]';
      const savedThreads = JSON.parse(savedThreadsStr);
      const existingIdx = savedThreads.findIndex((t: any) => t.id === selectedThreadId);
      const matched = threads.find(t => t.id === selectedThreadId);

      const escalationPayload = {
        id: selectedThreadId,
        patient_name: matched?.patient_name || "Patient",
        latest_message: matched?.latest_message || "Urgent escalation",
        updated_at: new Date().toISOString(),
        status: targetStatus,
        assigned_user_id: assignedUserId
      };

      if (existingIdx >= 0) {
        savedThreads[existingIdx] = escalationPayload;
      } else {
        savedThreads.push(escalationPayload);
      }
      localStorage.setItem('escalated_threads', JSON.stringify(savedThreads));

      setSelectedThreadId(null);
      setThreadContext(null);
      await fetchInboxData();
    } catch (err: any) {
      console.error(err);
      alert(`Escalation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setEscating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return;
    setSendingReply(true);
    try {
      await api.replyToThread({
        thread_id: selectedThreadId,
        sender_type: 'HUMAN',
        content: replyText.trim()
      });
      setReplyText('');
      await fetchThreadDetails(selectedThreadId);
    } catch (err) {
      console.error(err);
      if (threadContext) {
        setThreadContext({
          ...threadContext,
          messages: [
            ...(threadContext.messages || []),
            { id: Math.random().toString(), sender_type: "HUMAN", content: replyText.trim(), created_at: new Date().toISOString() }
          ]
        });
        setReplyText('');
      }
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadContext]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-hidden min-h-[500px] h-[calc(100vh-230px)] animate-slide-up bg-brand-surface border border-brand-border rounded-2xl p-4">
      {/* Threads List */}
      <div className="w-80 bg-brand-bg/20 border border-brand-border rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-brand-border">
          <div className="relative flex items-center bg-brand-bg rounded-xl px-3 py-2 border border-brand-border">
            <Search size={16} className="text-brand-textSecondary mr-2" />
            <input placeholder="Search inbox..." className="bg-transparent outline-none text-xs w-full text-brand-textPrimary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-brand-border custom-scrollbar">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-textSecondary">
              All threads assigned. No unassigned cases.
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  fetchThreadDetails(thread.id);
                }}
                className={`p-4 cursor-pointer hover:bg-brand-bg/50 transition-colors ${selectedThreadId === thread.id ? 'bg-brand-primary/10 border-l-4 border-brand-primary' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-brand-textPrimary">{thread.patient_name}</span>
                  <span className="text-[10px] text-brand-textSecondary">{new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-brand-textSecondary truncate">{thread.latest_message}</p>
                {thread.status === 'red' && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold bg-red-600 text-white rounded-md shadow-sm">Doctor Queue</span>
                )}
                {thread.status === 'yellow' && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold bg-orange-500 text-white rounded-md shadow-sm">Nurse Queue</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Conversation Area */}
      <div className="flex-1 bg-brand-bg/10 border border-brand-border rounded-2xl flex flex-col overflow-hidden">
        {selectedThreadId && threadContext ? (
          <>
            <div className="px-6 py-4 border-b border-brand-border bg-brand-bg/30 flex justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-brand-textPrimary">{threadContext.thread?.patient_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-brand-textSecondary">Active WhatsApp Thread</span>
                  {threadContext.thread?.status === 'red' ? (
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-600 text-white rounded-md shadow-sm">Escalated to Doctor</span>
                  ) : threadContext.thread?.status === 'yellow' ? (
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-orange-500 text-white rounded-md shadow-sm">Escalated to Nurse</span>
                  ) : (
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-green-500 text-white rounded-md shadow-sm">AI Active</span>
                  )}
                </div>
              </div>

              {/* Escalation Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-brand-bg border border-brand-border rounded-xl p-1.5 gap-1.5">
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="bg-transparent text-[11px] text-brand-textPrimary outline-none font-bold border-none px-2 cursor-pointer max-w-[130px] rounded-lg"
                  >
                    {DOCTORS.map(doc => (
                      <option key={doc.id} value={doc.id} className="bg-brand-bg text-brand-textPrimary font-semibold">{doc.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleEscalate('red', selectedDocId)}
                    disabled={escalating || threadContext.thread?.status === 'red'}
                    className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${threadContext.thread?.status === 'red'
                        ? 'bg-red-500/10 text-red-400/50 border border-red-500/10 cursor-not-allowed opacity-50'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer'
                      }`}
                  >
                    <ShieldAlert size={13} /> Escalate to Doctor
                  </button>
                </div>

                <div className="flex items-center bg-brand-bg border border-brand-border rounded-xl p-1.5 gap-1.5">
                  <select
                    value={selectedNurseId}
                    onChange={(e) => setSelectedNurseId(e.target.value)}
                    className="bg-transparent text-[11px] text-brand-textPrimary outline-none font-bold border-none px-2 cursor-pointer max-w-[120px] rounded-lg"
                  >
                    <option value="nurse_divya" className="bg-brand-bg text-brand-textPrimary font-semibold">Nurse Divya</option>
                    <option value="nurse_sarah" className="bg-brand-bg text-brand-textPrimary font-semibold">Nurse Sarah</option>
                  </select>
                  <button
                    onClick={() => handleEscalate('yellow', selectedNurseId)}
                    disabled={escalating || threadContext.thread?.status === 'yellow'}
                    className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 ${threadContext.thread?.status === 'yellow'
                        ? 'bg-orange-500/10 text-orange-400/50 border border-orange-500/10 cursor-not-allowed opacity-50'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer'
                      }`}
                  >
                    <Activity size={13} /> Escalate to Nurse
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {threadContext.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'HUMAN' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-4 rounded-2xl text-xs font-medium border ${msg.sender_type === 'HUMAN' ? 'bg-brand-primary text-white border-brand-primary/30 rounded-tr-none' : 'bg-brand-bg text-brand-textPrimary border-brand-border rounded-tl-none'}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className={`block text-[9px] mt-1.5 text-right ${msg.sender_type === 'HUMAN' ? 'text-white/70' : 'text-brand-textSecondary'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-brand-border bg-brand-bg/20 flex gap-3">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type a clinical or operational reply..."
                className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button
                onClick={handleSendReply}
                disabled={sendingReply}
                className="bg-brand-primary hover:bg-brand-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-textSecondary p-8">
            <Mail size={48} className="mb-4 stroke-[1.5]" />
            <p className="font-bold text-sm">Select a Conversation</p>
            <p className="text-xs mt-1">Select a thread from the left pane to view the chat and dispatch replies.</p>
          </div>
        )}
      </div>
    </div>
  );
};
