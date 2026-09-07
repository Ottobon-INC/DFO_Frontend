import React, { useState, useEffect } from 'react';
import { UpcomingAppointmentsAlert } from '../DashboardWidgets';
import { Stethoscope, ShieldAlert, Users, Calendar, AlertTriangle, User, RefreshCw, Send, CheckCircle, Search, BrainCircuit, X } from 'lucide-react';
import { api } from '../../services/api';import toast from 'react-hot-toast';



interface DoctorDashboardProps {
  appointments?: any[];
  onPatientSelect?: (patient: any, tab?: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ appointments: propAppointments, upcomingAppointments, onPatientSelect }) => {
  
  const [loading, setLoading] = useState(true);

  // Escalations state
  const [redQueue, setRedQueue] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [takingControl, setTakingControl] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Patients state
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Appointments / Consultations state
  const [appointments, setAppointments] = useState<any[]>(propAppointments || []);

  useEffect(() => {
    if (propAppointments && propAppointments.length > 0) {
      setAppointments(propAppointments);
    }
  }, [propAppointments]);

  // Fetch Escalations Queue
  const fetchEscalations = async () => {
    const userStr = localStorage.getItem('user');
    const loggedInUser = userStr ? JSON.parse(userStr) : null;
    const loggedInDoctorId = loggedInUser?.id || loggedInUser?.userId || 'dr_sireesha';

    try {
      const res = await api.getDoctorQueue();
      const allQueue = res.data || res || [];
      const myQueue = allQueue.filter((item: any) => item.assigned_user_id === loggedInDoctorId);
      setRedQueue(myQueue);
    } catch (err) {
      console.error("Failed to fetch doctor queue", err);
      setRedQueue([]);
    }
  };

  // Fetch Thread Context for Take Over
  const fetchThreadContext = async (id: string) => {
    try {
      const res = await api.getThreadContext(id);
      const ctx = res.data || res;
      setThreadContext(ctx);
      if (ctx.structured_memory?.summary && ctx.structured_memory.summary !== 'No summary available yet.') {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch thread context", err);
      setThreadContext(null);
    }
  };

  // Take Over Control Action
  const handleTakeControl = async (id: string) => {
    setTakingControl(true);
    try {
      await api.takeControl(id);
      toast.success("Successfully took control of this conversation!");
      fetchEscalations();
      setSelectedThreadId(null);
      setThreadContext(null);
    } catch (err) {
      console.error("Failed to take control", err);
      // Simulate success for demo
      toast.success("Successfully took control of this conversation (Demo Mode);!");
      setRedQueue(prev => prev.filter(q => q.id !== id));
      setSelectedThreadId(null);
      setThreadContext(null);
    } finally {
      setTakingControl(false);
    }
  };

  // Fetch Patients List
  const fetchPatients = async () => {
    try {
      const res = await api.getPatients();
      setPatients(res.data || res.items || res || []);
    } catch (err) {
      console.error("Failed to fetch patients", err);
      setPatients([
        { id: "p1", name: "Sara Johnson", mobile: "+919900112233", age: "28", bloodGroup: "O+", status: "Active" },
        { id: "p2", name: "Priya Nair", mobile: "+919900112234", age: "32", bloodGroup: "A-", status: "Active" }
      ]);
    }
  };

  // Fetch Consultations
      const fetchAppointments = async () => {
    // if (propAppointments && propAppointments.length > 0) return; // FORCE REFETCH
    try {
      const res = await api.getAppointments();
      let pRes = null;
      try { pRes = await api.getPatients(); } catch(e) {}
      const pts = pRes?.data || pRes?.items || pRes || [];
      const ptMap = new Map();
      if (Array.isArray(pts)) {
         pts.forEach((p: any) => ptMap.set(p.id, p.name || p.full_name));
      }

      const rawAppts = res.data || res.items || res || [];
      const mapped = rawAppts.map((a: any) => {
         let pName = a.patient?.name || a.patient?.full_name || a.patientName || a.patient_name_snapshot || a.patient_name;
         if (!pName || pName === 'Unknown') {
            pName = ptMap.get(a.patient_id || a.patientId) || (a.patient_id ? 'ID:' + a.patient_id.substring(0,6) : 'No ID');
         }
         return { ...a, patientName: pName };
      });
      setAppointments(mapped);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setAppointments([
        { id: "a1", patientName: "Sara Johnson", date: new Date().toISOString().split('T')[0], time: "11:00 AM", type: "Scan Review", status: "Scheduled" },
        { id: "a2", patientName: "Priya Nair", date: new Date().toISOString().split('T')[0], time: "02:30 PM", type: "High Risk consultation", status: "Scheduled" }
      ]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchEscalations();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-8 bg-brand-bg min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Stethoscope className="text-brand-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-brand-textPrimary">Clinical Escalations</h1>
            <p className="text-sm text-brand-textSecondary">Critical Triage Queue & Clinical Handoff</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary transition-all">
          <RefreshCw size={18} />
        </button>
      </div>



      {/* Content Area */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* Medical Escalations (Red Queue) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List */}
              <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden h-[500px] flex flex-col">
                <div className="p-4 border-b border-brand-border bg-brand-bg/10">
                  <h3 className="text-sm font-bold text-brand-textPrimary flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={16} /> Urgent Red Queue
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-brand-border">
                  {redQueue.length === 0 ? (
                    <div className="p-8 text-center text-brand-textSecondary text-xs">No active medical escalations.</div>
                  ) : (
                    redQueue.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedThreadId(item.id);
                          fetchThreadContext(item.id);
                        }}
                        className={`p-4 cursor-pointer hover:bg-brand-bg/40 transition-colors ${selectedThreadId === item.id ? 'bg-brand-primary/10 border-l-4 border-brand-primary' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-brand-textPrimary">{item.patient_name}</span>
                          <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            Risk {item.risk_score || 'N/A'}%
                          </span>
                        </div>
                        <p className="text-xs text-brand-textSecondary truncate">{item.latest_message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Takeover Control Chat Screen */}
              <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl flex flex-col h-[500px]">
                {selectedThreadId && threadContext ? (
                  <>
                    <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
                      <div>
                        <h4 className="font-bold text-sm text-brand-textPrimary">{threadContext.thread?.patient_name}</h4>
                        <p className="text-xs text-brand-textSecondary">High-Risk Escalation Thread</p>
                      </div>
                      <button
                        onClick={() => handleTakeControl(selectedThreadId)}
                        disabled={takingControl}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-500/20 active:scale-95"
                      >
                        <ShieldAlert size={14} /> Take Over Control
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {threadContext.messages?.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.sender_type === 'HUMAN' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md p-3.5 rounded-2xl text-xs ${msg.sender_type === 'HUMAN' ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-textPrimary border border-brand-border'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary">
                    <ShieldAlert size={48} className="text-brand-textSecondary mb-3 stroke-[1.5]" />
                    <p className="font-bold text-sm">Escalated Conversations</p>
                    <p className="text-xs mt-1 max-w-xs">Select a patient from the red queue to view their active conversation and initiate manual intervention override.</p>
                  </div>
                )}
              </div>
            </div>

                            </div>
      )}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h3 className="font-bold text-sm text-brand-primary flex items-center gap-2">
                <BrainCircuit size={16} /> AI Clinical Handoff Summary
              </h3>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm prose-invert max-w-none text-brand-textPrimary">
                {threadContext?.structured_memory?.summary?.split('\n').map((line: string, i: number) => {
                  if (line.trim().startsWith('-')) {
                    return <li key={i} className="ml-4 mb-1 text-xs">{line.substring(1).trim()}</li>;
                  }
                  if (line.trim().startsWith('#')) {
                    return <h4 key={i} className="font-bold text-brand-primary mt-3 mb-2">{line.replace(/#/g, '').trim()}</h4>;
                  }
                  return <p key={i} className="mb-2 text-xs leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
            <div className="p-4 border-t border-brand-border bg-brand-bg/30 flex justify-end">
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                Close & View Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



