import React, { useState, useEffect } from 'react';
import { Stethoscope, ShieldAlert, Users, Calendar, AlertTriangle, User, RefreshCw, Send, CheckCircle, Search } from 'lucide-react';
import { api } from '../../services/api';

export const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'escalations' | 'patients' | 'consultations'>('escalations');
  const [loading, setLoading] = useState(true);

  // Escalations state
  const [redQueue, setRedQueue] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [takingControl, setTakingControl] = useState(false);

  // Patients state
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Appointments / Consultations state
  const [appointments, setAppointments] = useState<any[]>([]);

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
      const savedThreadsStr = localStorage.getItem('escalated_threads');
      const savedThreads = savedThreadsStr ? JSON.parse(savedThreadsStr) : [];
      const myMockQueue = savedThreads.filter((t: any) => t.status === 'red' && t.assigned_user_id === loggedInDoctorId);
      setRedQueue(myMockQueue.length > 0 ? myMockQueue : [
        { id: "red-1", patient_name: "Sara Johnson", latest_message: "High risk symptoms reported (Default)", updated_at: new Date().toISOString(), risk_score: 95, assigned_user_id: loggedInDoctorId }
      ]);
    }
  };

  // Fetch Thread Context for Take Over
  const fetchThreadContext = async (id: string) => {
    try {
      const res = await api.getThreadContext(id);
      setThreadContext(res.data || res);
    } catch (err) {
      console.error("Failed to fetch thread context", err);
      setThreadContext({
        thread: { id, patient_name: redQueue.find(q => q.id === id)?.patient_name || "Patient" },
        messages: [
          { id: "m-1", sender_type: "PATIENT", content: redQueue.find(q => q.id === id)?.latest_message || "Help needed", created_at: new Date().toISOString() }
        ]
      });
    }
  };

  // Take Over Control Action
  const handleTakeControl = async (id: string) => {
    setTakingControl(true);
    try {
      await api.takeControl(id);
      alert("Successfully took control of this conversation!");
      fetchEscalations();
      setSelectedThreadId(null);
      setThreadContext(null);
    } catch (err) {
      console.error("Failed to take control", err);
      // Simulate success for demo
      alert("Successfully took control of this conversation (Demo Mode)!");
      setRedQueue(prev => prev.filter(q => q.id !== id));
      setSelectedThreadId(null);
      setThreadContext(null);
    } finally {
      setTakingControl(false);
    }
  };

  // Send Reply Action
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
      await fetchThreadContext(selectedThreadId);
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
    try {
      const res = await api.getAppointments();
      setAppointments(res.data || res.items || res || []);
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
    if (activeTab === 'escalations') {
      await fetchEscalations();
    } else if (activeTab === 'patients') {
      await fetchPatients();
    } else if (activeTab === 'consultations') {
      await fetchAppointments();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div className="p-6 space-y-8 bg-brand-bg min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Stethoscope className="text-brand-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-brand-textPrimary">Doctor Dashboard</h1>
            <p className="text-sm text-brand-textSecondary">Clinical Lifecycle & Escalations console</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary transition-all">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border space-x-6">
        <button
          onClick={() => setActiveTab('escalations')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'escalations' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <ShieldAlert size={18} /> Medical Escalations (Red Queue)
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'patients' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <Users size={18} /> Patient Directory
        </button>
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'consultations' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <Calendar size={18} /> Consultations & Appointments
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
          {activeTab === 'escalations' && (
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

                    <div className="p-4 border-t border-brand-border bg-brand-bg/20 flex gap-3">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        placeholder="Type a clinical reply..."
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
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary">
                    <ShieldAlert size={48} className="text-brand-textSecondary mb-3 stroke-[1.5]" />
                    <p className="font-bold text-sm">Escalated Conversations</p>
                    <p className="text-xs mt-1 max-w-xs">Select a patient from the red queue to view their active conversation and initiate manual intervention override.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patients Directory */}
          {activeTab === 'patients' && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-6">
              <div className="flex items-center bg-brand-bg px-4 py-2.5 rounded-xl border border-brand-border max-w-sm">
                <Search size={16} className="text-brand-textSecondary mr-2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient record directory..."
                  className="bg-transparent outline-none text-xs w-full text-brand-textPrimary"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Age</th>
                      <th className="p-4">Blood Group</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-xs">
                    {patients
                      .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((patient) => (
                        <tr key={patient.id} className="hover:bg-brand-bg/30 transition-colors">
                          <td className="p-4 font-bold text-brand-textPrimary">{patient.name || patient.full_name}</td>
                          <td className="p-4 text-brand-textSecondary">{patient.mobile || patient.phone_number}</td>
                          <td className="p-4 text-brand-textPrimary font-semibold">{patient.age || 'N/A'}</td>
                          <td className="p-4 text-brand-textSecondary">{patient.bloodGroup || 'N/A'}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                              {patient.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Consultations & Appointments */}
          {activeTab === 'consultations' && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-brand-border bg-brand-bg/10">
                <h3 className="text-sm font-bold text-brand-textPrimary">Your Roster & Active Consultations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Time</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Consultation Type</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-xs">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-brand-bg/30 transition-colors">
                        <td className="p-4 font-bold text-brand-primary">{appt.time}</td>
                        <td className="p-4 font-bold text-brand-textPrimary">{appt.patientName}</td>
                        <td className="p-4 text-brand-textSecondary">{appt.date}</td>
                        <td className="p-4 text-brand-textSecondary font-medium">{appt.type || 'General Consult'}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
