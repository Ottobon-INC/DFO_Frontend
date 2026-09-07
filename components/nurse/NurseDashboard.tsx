import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, User, CheckCircle, AlertTriangle, Activity, ShieldAlert, FileText, Plus, Clock, Scale, Thermometer, Wind, Eye } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const NurseDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeAppointmentId, setActiveAppointmentId] = useState('');
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingVitals, setSavingVitals] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'allergies' | 'history'>('vitals');

  // Vitals State
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');

  // Allergies Form State
  const [allergyName, setAllergyName] = useState('');
  const [allergySeverity, setAllergySeverity] = useState('MEDIUM');
  const [allergyReaction, setAllergyReaction] = useState('');
  const [patientAllergies, setPatientAllergies] = useState<any[]>([]);

  // Medical History Form State
  const [conditionName, setConditionName] = useState('');
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  const formatTimeDisplay = (timeStr?: string, dateStr?: string) => {
    if (!timeStr && !dateStr) return '--:--';
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hour = parseInt(parts[0], 10);
      const min = parts[1]?.substring(0, 2) || '00';
      if (!isNaN(hour)) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${String(formattedHour).padStart(2, '0')}:${min} ${ampm}`;
      }
    }
    if (dateStr) {
      try {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }
    return timeStr || '--:--';
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, patientsRes, leadsRes] = await Promise.all([
        api.getAppointments(),
        api.getPatients().catch(() => ({ data: [] })),
        api.getLeads().catch(() => ({ data: [] }))
      ]);

      const rawAppts = Array.isArray(apptsRes?.data) ? apptsRes.data : (Array.isArray(apptsRes?.items) ? apptsRes.items : (Array.isArray(apptsRes) ? apptsRes : []));
      const patientsList = Array.isArray(patientsRes?.data) ? patientsRes.data : (Array.isArray(patientsRes?.items) ? patientsRes.items : (Array.isArray(patientsRes) ? patientsRes : []));
      const leadsList = Array.isArray(leadsRes?.data) ? leadsRes.data : (Array.isArray(leadsRes?.items) ? leadsRes.items : (Array.isArray(leadsRes) ? leadsRes : []));

      const patientMap = new Map();
      patientsList.forEach((p: any) => {
        patientMap.set(p.id, {
          id: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          phone: p.mobile || p.phone,
          uhid: p.uhid,
          gender: p.gender,
          age: p.age
        });
      });

      const leadMap = new Map();
      leadsList.forEach((l: any) => {
        leadMap.set(l.id, {
          name: l.name || l.patient_name,
          phone: l.phone || l.mobile,
          gender: l.gender,
          age: l.age
        });
      });

      const resolvedAppts = rawAppts.map((item: any) => {
        const patientInfo = patientMap.get(item.patient_id || item.patientId);
        const leadInfo = leadMap.get(item.lead_id) || leadMap.get(item.patient_id);

        const resolvedName = item.patient_name_snapshot || item.patient_name || item.patientName || patientInfo?.name || leadInfo?.name || 'Walk-In Patient';
        const resolvedPhone = item.patient_phone_snapshot || item.phone || patientInfo?.phone || leadInfo?.phone || '-';
        const resolvedUhid = item.uhid || patientInfo?.uhid || '-';
        const resolvedGender = item.sex_snapshot || item.gender || patientInfo?.gender || leadInfo?.gender || '-';
        const resolvedAge = item.patient_age_snapshot || item.age || patientInfo?.age || leadInfo?.age || '-';
        const timeDisplay = formatTimeDisplay(item.start_time || item.time || item.appointment_time, item.appointment_date);

        return {
          ...item,
          patientId: item.patient_id || item.patientId || patientInfo?.id,
          patientName: resolvedName,
          phone: resolvedPhone,
          uhid: resolvedUhid,
          gender: resolvedGender,
          age: resolvedAge,
          timeDisplay: timeDisplay,
          status: item.status || 'Scheduled'
        };
      });

      // Filter Checked-In or Waiting for vitals intake
      const vitalsQueue = resolvedAppts.filter(a => 
        a.status === 'Checked-In' || a.status === 'Waiting' || a.status === 'Arrived'
      );
      
      setAppointments(vitalsQueue);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vitals queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch patient existing medical dashboard metrics (Allergies & History) when patient selected
  const fetchPatientMetrics = async (pId: string) => {
    if (!pId) return;
    try {
      const res = await api.getPatientDashboardData(pId);
      if (res?.data) {
        setPatientAllergies(res.data.allergies?.filter((a: any) => a.allergy_name && !a.allergy_name.includes('No Known Allergies')) || []);
        setPatientHistory(res.data.medicalHistory?.filter((h: any) => h.condition_name && !h.condition_name.includes('No Prior Medical')) || []);
      }
    } catch (err) {
      console.log('Metrics not available for this ID:', err);
    }
  };

  const handleSelectPatient = (appt: any) => {
    const pId = appt.patientId || appt.patient_id;
    setSelectedPatientId(pId);
    setActiveAppointmentId(appt.id);
    setSelectedPatientData(appt);
    setActiveTab('vitals');
    
    // Clear vitals form
    setSystolic('');
    setDiastolic('');
    setTemperature('');
    setPulse('');
    setSpo2('');
    setRespiratoryRate('');
    setWeight('');
    setHeight('');
    setNotes('');

    if (pId) {
      fetchPatientMetrics(pId);
    }
  };

  // Add Allergy
  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergyName) return toast.error('Allergy name is required');
    if (!selectedPatientId) return toast.error('Please select a patient first');

    try {
      await api.addPatientAllergy(selectedPatientId, {
        allergy_name: allergyName,
        severity: allergySeverity,
        reaction: allergyReaction || undefined
      });
      toast.success('Allergy added successfully');
      setAllergyName('');
      setAllergyReaction('');
      fetchPatientMetrics(selectedPatientId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to add allergy');
    }
  };

  // Add Medical History
  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionName) return toast.error('Condition / Medical event name is required');
    if (!selectedPatientId) return toast.error('Please select a patient first');

    try {
      await api.addPatientMedicalHistory(selectedPatientId, {
        condition_name: conditionName,
        diagnosis_date: diagnosisYear ? `${diagnosisYear}-01-01` : undefined,
        notes: conditionNotes || undefined
      });
      toast.success('Medical history logged successfully');
      setConditionName('');
      setDiagnosisYear('');
      setConditionNotes('');
      fetchPatientMetrics(selectedPatientId);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to add condition');
    }
  };

  // Save Vitals & Complete Triage
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient from the queue.');
      return;
    }

    const vitalsPayload = [];
    const recorded_at = new Date().toISOString();

    if (systolic || diastolic) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Blood Pressure',
        value: `${systolic || '--'}/${diastolic || '--'}`,
        recorded_at
      });
    }
    if (temperature) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Temperature',
        value: `${temperature} °F`,
        recorded_at
      });
    }
    if (pulse) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Heart Rate',
        value: `${pulse} bpm`,
        recorded_at
      });
    }
    if (spo2) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'SpO2',
        value: `${spo2} %`,
        recorded_at
      });
    }
    if (respiratoryRate) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Respiratory Rate',
        value: `${respiratoryRate} /min`,
        recorded_at
      });
    }
    if (weight) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Weight',
        value: `${weight} kg`,
        recorded_at
      });
    }
    if (height) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Height',
        value: `${height} cm`,
        recorded_at
      });
    }
    if (notes) {
      vitalsPayload.push({
        patient_id: selectedPatientId,
        appointment_id: activeAppointmentId || undefined,
        vital_type: 'Clinical Notes',
        value: notes,
        recorded_at
      });
    }

    if (vitalsPayload.length === 0) {
      toast.error('Please enter at least one vital sign before saving.');
      return;
    }

    setSavingVitals(true);
    try {
      await api.savePatientVitalsBulk({ vitals: vitalsPayload });

      // Update appointment status to Waiting (Ready for consultation)
      if (activeAppointmentId) {
        try {
          await api.updateAppointmentStatus(activeAppointmentId, { status: 'Waiting' as any });
        } catch(e) {
          console.warn("Could not transition appointment to Waiting:", e);
        }
      }

      toast.success("Vitals saved & patient routed to Doctor's Consultation Queue!");
      
      // Reset form
      setSystolic('');
      setDiastolic('');
      setTemperature('');
      setPulse('');
      setSpo2('');
      setRespiratoryRate('');
      setWeight('');
      setHeight('');
      setNotes('');
      setSelectedPatientId('');
      setActiveAppointmentId('');
      setSelectedPatientData(null);
      
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save vitals.");
    } finally {
      setSavingVitals(false);
    }
  };

  // BMI Calculation
  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      const bmi = (w / (h * h)).toFixed(1);
      const bmiNum = parseFloat(bmi);
      let cat = 'Normal';
      let col = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      if (bmiNum < 18.5) { cat = 'Underweight'; col = 'text-amber-600 bg-amber-50 border-amber-200'; }
      else if (bmiNum >= 25 && bmiNum < 30) { cat = 'Overweight'; col = 'text-amber-600 bg-amber-50 border-amber-200'; }
      else if (bmiNum >= 30) { cat = 'Obese'; col = 'text-rose-600 bg-rose-50 border-rose-200'; }
      return { bmi, cat, col };
    }
    return null;
  };
  const bmiInfo = calculateBMI();

  // Clinical Helper Badges for BP & Pulse
  const getBpStatus = () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    if (isNaN(sys) || isNaN(dia) || sys < 50 || dia < 30) return null;
    if (sys > 140 || dia > 90) return { label: 'High BP (Hypertension)', col: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (sys < 90 || dia < 60) return { label: 'Low BP (Hypotension)', col: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Normal BP', col: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };
  const bpStatus = getBpStatus();

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg/50 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <Heart className="text-rose-500" /> Nurse Triage & Vitals Intake
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Record physiological vitals, clinical alerts, allergies, and medical history for checked-in patients
          </p>
        </div>
        <button 
          onClick={loadData} 
          className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg/50 transition-all shadow-2xs"
          title="Refresh Queue"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-6 overflow-hidden flex gap-6">
        
        {/* Left Pane: Awaiting Vitals Queue */}
        <div className="w-1/3 min-w-[300px] max-w-sm flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-brand-border bg-brand-bg/30 flex justify-between items-center">
             <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center gap-1.5">
               <Clock size={14} className="text-brand-primary" /> Awaiting Vitals
             </h3>
             <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded-md">
               {appointments.length} Patients
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {appointments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle className="mx-auto text-emerald-500/50 mb-2" size={32} />
                <p className="text-sm font-bold text-brand-textPrimary">Queue is Clear</p>
                <p className="text-xs text-brand-textSecondary mt-1">No checked-in patients awaiting vitals intake.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {appointments.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => handleSelectPatient(appt)}
                    className={`w-full text-left p-3.5 transition-all cursor-pointer ${
                      activeAppointmentId === appt.id 
                        ? 'bg-brand-primary/10 border-l-4 border-l-brand-primary shadow-xs' 
                        : 'hover:bg-brand-bg/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-brand-textPrimary">{appt.patientName}</span>
                      <span className="text-[10px] text-brand-textSecondary font-mono bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">
                        {appt.timeDisplay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-brand-textSecondary mt-1">
                      <span>{appt.gender} {appt.age && appt.age !== '-' ? `(${appt.age} yrs)` : ''}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {appt.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Pane: Clinical Intake Console */}
        <div className="flex-1 flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          {!selectedPatientId ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-textSecondary/40 mb-4 border border-brand-border">
                <User size={32} />
              </div>
              <p className="font-bold text-base text-brand-textPrimary">No Patient Selected</p>
              <p className="text-xs text-brand-textSecondary mt-1.5 max-w-sm">
                Select a patient from the queue on the left to record their vitals, log known allergies, and document medical history.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Patient Banner */}
              <div className="p-4 border-b border-brand-border bg-brand-bg/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm border border-brand-primary/20">
                    {String(selectedPatientData?.patientName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-textPrimary flex items-center gap-2">
                      {selectedPatientData?.patientName}
                      {selectedPatientData?.uhid && selectedPatientData.uhid !== '-' && (
                        <span className="text-[11px] font-mono text-brand-primary bg-brand-primary/10 px-1.5 py-0.2 rounded">
                          {selectedPatientData.uhid}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-brand-textSecondary">
                      {selectedPatientData?.gender} • {selectedPatientData?.age ? `${selectedPatientData.age} yrs` : 'Age N/A'} • Phone: {selectedPatientData?.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatientId('');
                    setActiveAppointmentId('');
                    setSelectedPatientData(null);
                  }}
                  className="text-xs font-semibold text-brand-textSecondary hover:text-brand-primary px-3 py-1.5 bg-brand-surface rounded-lg border border-brand-border shadow-2xs"
                >
                  Cancel Entry
                </button>
              </div>

              {/* Intake Navigation Tabs */}
              <div className="flex border-b border-brand-border bg-brand-surface px-4">
                <button
                  onClick={() => setActiveTab('vitals')}
                  className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'vitals' 
                      ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                      : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'
                  }`}
                >
                  <Activity size={14} /> Vital Signs
                </button>
                <button
                  onClick={() => setActiveTab('allergies')}
                  className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'allergies' 
                      ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                      : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'
                  }`}
                >
                  <ShieldAlert size={14} className="text-rose-500" /> Allergies & Alerts ({patientAllergies.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'history' 
                      ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                      : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'
                  }`}
                >
                  <FileText size={14} className="text-indigo-500" /> Medical History ({patientHistory.length})
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* TAB 1: VITALS */}
                {activeTab === 'vitals' && (
                  <form id="nurse-vitals-form" onSubmit={handleSaveVitals} className="space-y-6 max-w-3xl">
                    {/* BP & Pulse Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
                            BP Systolic
                          </label>
                          {bpStatus && <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${bpStatus.col}`}>{bpStatus.label}</span>}
                        </div>
                        <input
                          type="number"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                          placeholder="mmHg (e.g. 120)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          BP Diastolic
                        </label>
                        <input
                          type="number"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                          placeholder="mmHg (e.g. 80)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Pulse / Heart Rate
                        </label>
                        <input
                          type="number"
                          value={pulse}
                          onChange={(e) => setPulse(e.target.value)}
                          placeholder="BPM (e.g. 72)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Temp, SpO2, Respiratory Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Temperature (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="°F (e.g. 98.6)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Oxygen Saturation (SpO2 %)
                        </label>
                        <input
                          type="number"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          placeholder="% (e.g. 98)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Respiratory Rate
                        </label>
                        <input
                          type="number"
                          value={respiratoryRate}
                          onChange={(e) => setRespiratoryRate(e.target.value)}
                          placeholder="breaths/min (e.g. 16)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Weight, Height, BMI Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="kg (e.g. 68.5)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="cm (e.g. 165)"
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div className="bg-brand-bg p-2.5 rounded-xl border border-brand-border flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">Calculated BMI</span>
                        {bmiInfo ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-black text-brand-textPrimary font-mono">{bmiInfo.bmi}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${bmiInfo.col}`}>
                              {bmiInfo.cat}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-brand-textSecondary mt-0.5">Enter Wt & Ht</span>
                        )}
                      </div>
                    </div>

                    {/* Observations / Notes */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-textSecondary mb-1.5 uppercase tracking-wider">
                        Clinical Observations & Presenting Symptoms
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter patient chief complaints or observations during vitals intake (e.g. Patient complaining of severe headache, feeling dizzy)..."
                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>
                  </form>
                )}

                {/* TAB 2: ALLERGIES */}
                {activeTab === 'allergies' && (
                  <div className="space-y-6 max-w-2xl">
                    {/* Existing Allergies */}
                    <div>
                      <h4 className="text-xs font-bold text-brand-textPrimary mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldAlert size={14} className="text-rose-500" /> Recorded Patient Allergies
                      </h4>
                      {patientAllergies.length === 0 ? (
                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                          <CheckCircle size={15} className="text-emerald-600" />
                          <span>No known allergies recorded (NKA)</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {patientAllergies.map((a: any, idx: number) => (
                            <div key={idx} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-rose-900">{a.allergy_name}</p>
                                {a.reaction && <p className="text-[11px] text-rose-700 mt-0.5">Reaction: {a.reaction}</p>}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200 uppercase">
                                {a.severity || 'MEDIUM'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Allergy Form */}
                    <form onSubmit={handleAddAllergy} className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border space-y-3">
                      <h5 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-1">
                        <Plus size={13} className="text-brand-primary" /> Log New Allergy
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Allergy / Substance Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Penicillin, Peanuts, Sulfa..."
                            value={allergyName}
                            onChange={e => setAllergyName(e.target.value)}
                            className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Severity</label>
                          <select
                            value={allergySeverity}
                            onChange={e => setAllergySeverity(e.target.value)}
                            className="w-full bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                          >
                            <option value="LOW">Mild</option>
                            <option value="MEDIUM">Moderate</option>
                            <option value="HIGH">Severe</option>
                            <option value="CRITICAL">Critical (Anaphylaxis)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Observed Reaction / Symptoms</label>
                        <input
                          type="text"
                          placeholder="e.g. Skin rash, breathing difficulty, swelling..."
                          value={allergyReaction}
                          onChange={e => setAllergyReaction(e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                      >
                        + Add Allergy to File
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 3: MEDICAL HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-6 max-w-2xl">
                    {/* Existing History */}
                    <div>
                      <h4 className="text-xs font-bold text-brand-textPrimary mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <FileText size={14} className="text-indigo-500" /> Active Conditions & Past Medical History
                      </h4>
                      {patientHistory.length === 0 ? (
                        <div className="p-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-textSecondary">
                          No past medical conditions or chronic diseases recorded yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {patientHistory.map((h: any, idx: number) => (
                            <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-indigo-900">{h.condition_name}</p>
                                {h.notes && <p className="text-[11px] text-indigo-700 mt-0.5">{h.notes}</p>}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                                {h.status || 'ACTIVE'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Medical History Form */}
                    <form onSubmit={handleAddHistory} className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border space-y-3">
                      <h5 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-1">
                        <Plus size={13} className="text-brand-primary" /> Record Chronic Disease / Surgical History
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Condition / Disease / Surgery *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Hypertension, Type 2 Diabetes, Hypothyroidism..."
                            value={conditionName}
                            onChange={e => setConditionName(e.target.value)}
                            className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Year Diagnosed</label>
                          <input
                            type="number"
                            placeholder="e.g. 2021"
                            value={diagnosisYear}
                            onChange={e => setDiagnosisYear(e.target.value)}
                            className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-textSecondary mb-1 uppercase">Notes / Current Medication</label>
                        <input
                          type="text"
                          placeholder="e.g. On Metformin 500mg, controlled..."
                          value={conditionNotes}
                          onChange={e => setConditionNotes(e.target.value)}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                      >
                        + Add to Medical History
                      </button>
                    </form>
                  </div>
                )}

              </div>

              {/* Bottom Action Footer for Vitals */}
              {activeTab === 'vitals' && (
                <div className="p-4 border-t border-brand-border bg-brand-surface flex justify-end gap-3">
                  <button
                    type="submit"
                    form="nurse-vitals-form"
                    disabled={savingVitals}
                    className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {savingVitals ? (
                      'Saving Vitals...'
                    ) : (
                      <>
                        <CheckCircle size={15} /> Save Patient Vitals & Complete Triage
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
