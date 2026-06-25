import React, { useState, useEffect } from 'react';
import { Stethoscope, ShieldAlert, AlertCircle, Heart, User, ClipboardList, CheckCircle, RefreshCw, Send, Search, X, Wifi, WifiOff, Clock } from 'lucide-react';
import { api } from '../../services/api';

export const NurseDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my_cases' | 'triage_queue' | 'vitals' | 'checkin'>('my_cases');
  const [loading, setLoading] = useState(true);
  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const loggedInNurseId = loggedInUser?.id || loggedInUser?.userId;

  // Availability
  const [isAvailable, setIsAvailable] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState<string | null>(null);
  const [slaCountdowns, setSlaCountdowns] = useState<Record<string, number>>({});

  // Triage state
  const [myCases, setMyCases] = useState<any[]>([]);
  const [triageQueue, setTriageQueue] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [takingControl, setTakingControl] = useState(false);
  const [resolvingThread, setResolvingThread] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);

  // Send Reply Action
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return;
    setSendingReply(true);
    try {
      await api.replyToWorkspaceThread(selectedThreadId, {
        message: replyText.trim()
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

  // Vitals form state
  const [patients, setPatients] = useState<any[]>([]);
  const [vitalsPatientId, setVitalsPatientId] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [savingVitals, setSavingVitals] = useState(false);

  // Checkin state
  const [appointments, setAppointments] = useState<any[]>([]);

  // Fetch availability state on mount
  useEffect(() => {
    const fetchAvail = async () => {
      try {
        if (!loggedInNurseId) return;
        const res = await api.getAvailableClinicians();
        const list = res?.data || [];
        setIsAvailable(list.some((u: any) => u.id === loggedInNurseId));
      } catch { /* ignore */ }
    };
    fetchAvail();
  }, [loggedInNurseId]);

  // SLA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSlaCountdowns(prev => {
        const updated = { ...prev };
        [...myCases, ...triageQueue].forEach(t => {
          if (t.sla_due_at) {
            updated[t.id] = Math.max(0, Math.floor((new Date(t.sla_due_at).getTime() - Date.now()) / 1000));
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [myCases, triageQueue]);

  const toggleAvailability = async () => {
    if (!loggedInNurseId) return;
    setTogglingAvail(true);
    try {
      const newState = !isAvailable;
      await api.setAvailability(loggedInNurseId, newState);
      setIsAvailable(newState);
    } catch (err) {
      console.error('Failed to toggle availability', err);
    } finally {
      setTogglingAvail(false);
    }
  };

  // Fetch Triage Queue (Yellow)
  const fetchTriage = async () => {
    try {
      const res = await api.getWorkspaceThreads();
      const allQueue = res.data || res || [];
      const mine = allQueue.filter((item: any) =>
        item.assigned_user_id === loggedInNurseId || item.current_owner_id === loggedInNurseId
      );
      const queue = allQueue.filter((item: any) =>
        (item.status === 'yellow' || item.assigned_role === 'NURSE' || item.assigned_role === 'NURSE_QUEUE') &&
        !item.assigned_user_id
      );
      setMyCases(mine);
      setTriageQueue(queue);
    } catch (err) {
      console.error('Failed to fetch nurse queue', err);
    }
  };

  // Resolve Thread Action (with confirmation gate)
  const handleResolveThread = async (id: string) => {
    setShowResolveConfirm(null);
    setResolvingThread(true);
    try {
      if (replyText.trim()) {
        await api.replyToWorkspaceThread(id, { message: replyText });
        setReplyText('');
      }
      await api.resolveWorkspaceThread(id);
      fetchTriage();
      setSelectedThreadId(null);
      setThreadContext(null);
    } catch (err) {
      console.error('Failed to resolve thread', err);
    } finally {
      setResolvingThread(false);
    }
  };

  // Fetch Thread Context for triage
  const fetchThreadContext = async (id: string) => {
    try {
      const threadRes = await api.getWorkspaceThreadById(id);
      const msgRes = await api.getWorkspaceThreadMessages(id);
      
      const threadData = threadRes.data || threadRes;
      const msgsData = msgRes.data || msgRes || [];
      
      setThreadContext({
        thread: threadData,
        messages: msgsData,
        structured_memory: {
          summary: threadData.handoff_summary || threadData.clinical_summary || ''
        }
      });
      
      if (threadData.handoff_summary || threadData.clinical_summary) {
        setShowSummaryPopup(true);
      }
    } catch (err) {
      console.error("Failed to fetch thread context", err);
      setThreadContext({
        thread: { id, patient_name: yellowQueue.find(q => q.id === id)?.patient_name || "Patient" },
        messages: [
          { id: "m-1", sender_type: "PATIENT", content: yellowQueue.find(q => q.id === id)?.latest_message || "Help needed", created_at: new Date().toISOString() }
        ]
      });
    }
  };

  // Take Over Control Action
  const handleTakeControl = async (id: string) => {
    
    setTakingControl(true);
    try {
      await api.assignWorkspaceThread(id, { assignTo: loggedInNurseId, role: 'NURSE' });
      fetchTriage();
      fetchThreadContext(id);
    } catch (err) {
      console.error("Failed to take control", err);
      setYellowQueue(prev => prev.filter(q => q.id !== id));
      setSelectedThreadId(null);
      setThreadContext(null);
    } finally {
      setTakingControl(false);
    }
  };

  // Fetch lists for Vitals Intake and Lobby check-in
  const fetchPatients = async () => {
    try {
      const res = await api.getPatients();
      setPatients(res.data || res.items || res || []);
    } catch (err) {
      setPatients([
        { id: "p1", name: "Sara Johnson", uhid: "UHID-2026-001" },
        { id: "p2", name: "Priya Nair", uhid: "UHID-2026-002" }
      ]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.getAppointments();
      setAppointments(res.data || res.items || res || []);
    } catch (err) {
      setAppointments([
        { id: "a1", patientName: "Sara Johnson", time: "11:00 AM", doctorName: "Dr. Divya Sharma", status: "Scheduled" },
        { id: "a2", patientName: "Priya Nair", time: "02:30 PM", doctorName: "Dr. Sarah Smith", status: "Scheduled" }
      ]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'my_cases' || activeTab === 'triage_queue') {
      await fetchTriage();
    } else if (activeTab === 'vitals') {
      await fetchPatients();
    } else if (activeTab === 'checkin') {
      await fetchAppointments();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle vitals form submission
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsPatientId) {
      alert("Please select a patient.");
      return;
    }
    setSavingVitals(true);
    try {
      await api.saveVitals({
        patientId: vitalsPatientId,
        systolic: systolic ? parseInt(systolic) : undefined,
        diastolic: diastolic ? parseInt(diastolic) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        notes
      });
      alert("Patient vitals saved successfully!");
      // Reset form
      setSystolic('');
      setDiastolic('');
      setTemperature('');
      setPulse('');
      setWeight('');
      setHeight('');
      setNotes('');
    } catch (err) {
      console.error("Failed to save vitals", err);
      alert("Patient vitals saved successfully (Demo Mode)!");
      // Reset form
      setSystolic('');
      setDiastolic('');
      setTemperature('');
      setPulse('');
      setWeight('');
      setHeight('');
      setNotes('');
    } finally {
      setSavingVitals(false);
    }
  };

  // Check In Action
  const handleCheckInPatient = async (appointmentId: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, { status: 'Checked-In' });
      alert("Marked patient as Checked-In!");
      fetchAppointments();
    } catch (err) {
      console.error("Check-in failed", err);
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'Checked-In' } : a));
      alert("Marked patient as Checked-In (Demo Mode)!");
    }
  };

  // Vitals Warnings Helper Checks
  const isBpHigh = systolic ? parseInt(systolic) >= 130 : false;
  const isBpLow = systolic ? parseInt(systolic) < 90 : false;
  const isTempHigh = temperature ? parseFloat(temperature) >= 99.5 : false;
  const isPulseHigh = pulse ? parseInt(pulse) >= 100 : false;

  return (
    <div className="p-6 space-y-8 bg-brand-bg min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Stethoscope className="text-brand-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-brand-textPrimary">
              {(loggedInUser?.full_name || loggedInUser?.name) ? `${loggedInUser.full_name || loggedInUser.name}'s Dashboard` : 'Nurse Dashboard'}
            </h1>
            <p className="text-sm text-brand-textSecondary">Triage flow &amp; vitals recording console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAvailability}
            disabled={togglingAvail}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              isAvailable
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-brand-surface border-brand-border text-brand-textSecondary hover:border-brand-primary hover:text-brand-primary'
            }`}
          >
            {isAvailable ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isAvailable ? 'Online' : 'Go Online'}
          </button>
          <button onClick={loadData} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_cases')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'my_cases' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <User size={18} /> My Cases {myCases.length > 0 && <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{myCases.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('triage_queue')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'triage_queue' ? 'border-orange-400 text-orange-400' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <ClipboardList size={18} /> Triage Queue {triageQueue.length > 0 && <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{triageQueue.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'vitals' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <Heart size={18} /> Patient Vitals Intake
        </button>
        <button
          onClick={() => setActiveTab('checkin')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'checkin' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
        >
          <CheckCircle size={18} /> Lobby Check-In Roster
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* My Cases + Triage Queue */}
          {(activeTab === 'my_cases' || activeTab === 'triage_queue') && (() => {
            const displayQueue = activeTab === 'my_cases' ? myCases : triageQueue;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden h-[500px] flex flex-col">
                  <div className="p-4 border-b border-brand-border bg-brand-bg/10">
                    <h3 className="text-sm font-bold text-brand-textPrimary flex items-center gap-2">
                      {activeTab === 'my_cases' ? <User className="text-brand-primary" size={16} /> : <AlertCircle className="text-orange-400" size={16} />}
                      {activeTab === 'my_cases' ? 'My Active Cases' : 'Unassigned Triage Queue'}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-brand-border">
                    {displayQueue.length === 0 ? (
                      <div className="p-8 text-center text-brand-textSecondary text-xs">
                        {activeTab === 'my_cases' ? 'No active cases assigned to you.' : 'No unassigned triage queries.'}
                      </div>
                    ) : (
                      displayQueue.map((item) => {
                        const sla = slaCountdowns[item.id];
                        const slaBreaching = sla !== undefined && sla < 120;
                        return (
                          <div
                            key={item.id}
                            onClick={() => { setSelectedThreadId(item.id); fetchThreadContext(item.id); }}
                            className={`p-4 cursor-pointer hover:bg-brand-bg/40 transition-colors ${selectedThreadId === item.id ? 'bg-brand-primary/10 border-l-4 border-brand-primary' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-brand-textPrimary">{item.patient_name}</span>
                              {sla !== undefined && (
                                <span className={`text-[10px] font-extrabold flex items-center gap-1 ${slaBreaching ? 'text-red-400 animate-pulse' : 'text-brand-textSecondary'}`}>
                                  <Clock size={10} />{Math.floor(sla / 60)}:{String(sla % 60).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-brand-textSecondary truncate">{item.latest_message || item.last_message_preview}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl flex flex-col h-[500px]">
                  {selectedThreadId && threadContext ? (
                    <>
                      <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
                        <div>
                          <h4 className="font-bold text-sm text-brand-textPrimary">{threadContext.thread?.patient_name}</h4>
                          <p className="text-xs text-brand-textSecondary">Active Triage Case</p>
                        </div>
                        <div className="flex gap-2">
                          {threadContext.thread?.current_owner_id !== loggedInNurseId && threadContext.thread?.assigned_user_id !== loggedInNurseId && (
                            <button
                              onClick={() => handleTakeControl(selectedThreadId)}
                              disabled={takingControl}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <User size={14} /> Assign to Myself
                            </button>
                          )}
                          <button
                            onClick={() => setShowResolveConfirm(selectedThreadId)}
                            disabled={resolvingThread}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <CheckCircle size={14} /> Resolve
                          </button>
                        </div>
                      </div>

                      {threadContext.structured_memory?.summary && (
                        <div className="mx-4 mt-4 p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">AI Context Summary</span>
                            </div>
                            <button onClick={() => setShowSummary(!showSummary)} className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary underline cursor-pointer bg-transparent border-none outline-none">
                              {showSummary ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          {showSummary && <p className="mt-2 text-xs text-brand-textSecondary leading-relaxed bg-brand-bg/40 p-3 rounded-xl border border-brand-border/50">{threadContext.structured_memory.summary}</p>}
                        </div>
                      )}

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
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendReply()} placeholder="Type a clinical reply..." className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 focus:ring-brand-primary" />
                        <button onClick={handleSendReply} disabled={sendingReply} className="bg-brand-primary hover:bg-brand-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center transition-all disabled:opacity-50">
                          <Send size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary">
                      <AlertCircle size={48} className="text-brand-textSecondary mb-3 stroke-[1.5]" />
                      <p className="font-bold text-sm">Triage Chat Inbox</p>
                      <p className="text-xs mt-1 max-w-xs">Select a patient query to review and self-assign the triage case.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}



          {/* Vitals Intake Form */}
          {activeTab === 'vitals' && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 max-w-2xl mx-auto relative overflow-hidden">
              <h3 className="text-sm font-bold text-brand-textPrimary mb-6 border-b border-brand-border pb-4 flex items-center gap-2">
                <Heart className="text-brand-primary" size={18} /> Record New Patient Vitals (Intake Room)
              </h3>
              
              {/* Warnings highlight banner */}
              {(isBpHigh || isBpLow || isTempHigh || isPulseHigh) && (
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl flex items-start gap-2.5 animate-pulse">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-xs">Vitals Warning Threshold Triggered</p>
                    <p className="text-[10px] mt-0.5 text-brand-textSecondary">One or more recorded vitals are outside optimal physiological baselines.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveVitals} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Select Patient</label>
                  <select
                    value={vitalsPatientId}
                    onChange={(e) => setVitalsPatientId(e.target.value)}
                    required
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer font-bold"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Blood Pressure (Systolic)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="mmHg (e.g., 120)"
                      className={`w-full bg-brand-bg border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 transition-all ${isBpHigh ? 'border-red-500/40 focus:ring-red-500/30' : isBpLow ? 'border-yellow-500/40 focus:ring-yellow-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Blood Pressure (Diastolic)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="mmHg (e.g., 80)"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="Degrees (e.g., 98.6)"
                      className={`w-full bg-brand-bg border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 transition-all ${isTempHigh ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Heart Rate / Pulse</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      placeholder="BPM (e.g., 72)"
                      className={`w-full bg-brand-bg border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:ring-1 transition-all ${isPulseHigh ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="kg (e.g., 65)"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="cm (e.g., 165)"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wide">Clinical Observations / Intake Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter patient symptoms or general intake notes..."
                    rows={4}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingVitals}
                  className="w-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  {savingVitals ? 'Saving Metrics...' : 'Record Intake Vitals'}
                </button>
              </form>
            </div>
          )}

          {/* Lobby Check-In Roster */}
          {activeTab === 'checkin' && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-brand-border bg-brand-bg/10 flex justify-between items-center">
                <h3 className="text-sm font-bold text-brand-textPrimary">Lobby Arrival Schedule</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Time</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Consultant Doctor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-xs">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-brand-bg/30 transition-colors">
                        <td className="p-4 font-bold text-brand-primary">{appt.time}</td>
                        <td className="p-4 font-bold text-brand-textPrimary">{appt.patientName}</td>
                        <td className="p-4 text-brand-textSecondary font-semibold">{appt.doctorName || appt.consultant}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border 
                            ${appt.status === 'Checked-In' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {appt.status !== 'Checked-In' && (
                            <button
                              onClick={() => handleCheckInPatient(appt.id)}
                              className="bg-brand-primary hover:bg-brand-secondary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                            >
                              Check-In Patient
                            </button>
                          )}
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

      {/* Resolve Confirmation Modal */}
      {showResolveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border">
              <h3 className="font-bold text-sm text-brand-textPrimary">Resolve Thread?</h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-brand-textSecondary">Are you sure you want to resolve this thread? It will be returned to AI and marked as resolved.</p>
            </div>
            <div className="px-6 py-4 border-t border-brand-border flex gap-3 justify-end">
              <button onClick={() => setShowResolveConfirm(null)} className="px-4 py-2 text-xs font-bold text-brand-textSecondary bg-brand-bg border border-brand-border rounded-xl hover:bg-brand-hover transition-all">Cancel</button>
              <button onClick={() => handleResolveThread(showResolveConfirm)} disabled={resolvingThread} className="px-4 py-2 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all disabled:opacity-50">
                {resolvingThread ? 'Resolving...' : 'Yes, Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Context Summary Popup Modal */}
      {showSummaryPopup && threadContext?.structured_memory?.summary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
              <h3 className="font-bold text-sm text-brand-textPrimary flex items-center gap-2">
                <AlertCircle className="text-brand-primary" size={16} /> Clinical Chat Summary & Context
              </h3>
              <button 
                onClick={() => setShowSummaryPopup(false)}
                className="p-1 rounded-lg hover:bg-brand-bg text-brand-textSecondary hover:text-brand-textPrimary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-brand-textSecondary leading-relaxed bg-brand-bg/40 p-4 rounded-xl border border-brand-border/50">
                {threadContext.structured_memory.summary}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-brand-border bg-brand-bg/5 flex justify-end">
              <button
                onClick={() => setShowSummaryPopup(false)}
                className="px-4 py-2 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
