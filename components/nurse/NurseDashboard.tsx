import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, User, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const NurseDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vitalsPatientId, setVitalsPatientId] = useState('');
  const [activeAppointmentId, setActiveAppointmentId] = useState('');
  
  // Vitals form state
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [savingVitals, setSavingVitals] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, patientsRes, leadsRes] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getLeads().catch(() => ({ data: [] }))
      ]);

      const rawAppts = Array.isArray(apptsRes?.data) ? apptsRes.data : (Array.isArray(apptsRes?.items) ? apptsRes.items : (Array.isArray(apptsRes) ? apptsRes : []));
      const patientsList = Array.isArray(patientsRes?.data) ? patientsRes.data : (Array.isArray(patientsRes?.items) ? patientsRes.items : (Array.isArray(patientsRes) ? patientsRes : []));
      const leadsList = Array.isArray(leadsRes?.data) ? leadsRes.data : (Array.isArray(leadsRes?.items) ? leadsRes.items : (Array.isArray(leadsRes) ? leadsRes : []));

      const patientMap = new Map();
      patientsList.forEach((p: any) => patientMap.set(p.id, p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()));

      const leadMap = new Map();
      leadsList.forEach((l: any) => leadMap.set(l.id, l.name || l.patient_name));

      const resolvedAppts = rawAppts.map((item: any) => {
        let resolvedName = item.patient_name_snapshot || item.patient_name || item.patientName || item.name;
        if (!resolvedName || resolvedName === 'Unknown') {
          if (item.patient_id || item.patientId) {
             resolvedName = patientMap.get(item.patient_id || item.patientId);
          }
        }
        if (!resolvedName || resolvedName === 'Unknown') {
          resolvedName = leadMap.get(item.lead_id) || leadMap.get(item.patient_id);
        }
        
        return {
          ...item,
          patientName: resolvedName || 'Unknown Patient',
          id: item.id || Math.random().toString(),
          time: item.appointment_time ? new Date(item.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : item.time || '--:--',
          status: item.status || 'Scheduled'
        };
      });

      // Filter only Checked-In or Waiting for vitals queue
      const vitalsQueue = resolvedAppts.filter(a => a.status === 'Checked-In' || a.status === 'Waiting');
      
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

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVitals(true);

    const vitalsPayload = [];
    if (systolic || diastolic) {
      vitalsPayload.push({
        patient_id: vitalsPatientId,
        vital_type: 'Blood Pressure',
        value: `${systolic || '--'}/${diastolic || '--'}`,
        recorded_at: new Date().toISOString()
      });
    }
    if (temperature) {
      vitalsPayload.push({
        patient_id: vitalsPatientId,
        vital_type: 'Temperature',
        value: temperature,
        recorded_at: new Date().toISOString()
      });
    }
    if (pulse) {
      vitalsPayload.push({
        patient_id: vitalsPatientId,
        vital_type: 'Heart Rate',
        value: pulse,
        recorded_at: new Date().toISOString()
      });
    }

    try {
      if (vitalsPayload.length > 0) {
        await api.savePatientVitalsBulk({ vitals: vitalsPayload });
      }
      
      if (activeAppointmentId) {
         try {
           await api.updateAppointmentStatus(activeAppointmentId, { status: 'Expected' as any });
         } catch(e) { console.error("Could not update status to waiting", e) }
      }

      toast.success("Vitals saved successfully!");
      
      // Reset form fields
      setSystolic('');
      setDiastolic('');
      setTemperature('');
      setPulse('');
      setWeight('');
      setHeight('');
      setNotes('');
      setVitalsPatientId('');
      setActiveAppointmentId('');
      
      loadData(); // Refresh queue
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vitals.");
    } finally {
      setSavingVitals(false);
    }
  };

  const isBpHigh = Number(systolic) > 130 || Number(diastolic) > 85;
  const isBpLow = Number(systolic) < 90 && systolic !== '';
  const isTempHigh = Number(temperature) > 99.5;
  const isPulseHigh = Number(pulse) > 100;
  const isFormEmpty = !systolic && !diastolic && !temperature && !pulse && !weight && !height && !notes;

  const activePatientName = appointments.find(a => (a.patientId || a.patient_id || 'p1') === vitalsPatientId)?.patientName || 'Unknown Patient';

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <Heart className="text-brand-primary" /> Vitals Intake Queue
          </h2>
          <p className="text-sm text-brand-textSecondary mt-0.5">Patients ready for clinical vitals measurement</p>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg/50 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex gap-6">
        
        {/* Left Pane: Queue */}
        <div className="w-1/3 min-w-[320px] flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-border bg-brand-bg/20 flex justify-between items-center">
             <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest">Awaiting Vitals</h3>
             <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-1 rounded-md">{appointments.length} Patients</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-brand-primary/50 mb-3" size={32} />
                <p className="text-sm font-bold text-brand-textPrimary mt-4">Queue is clear</p>
                <p className="text-xs text-brand-textSecondary mt-1">No checked-in patients waiting for vitals.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {appointments.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => {
                      setVitalsPatientId(appt.patientId || appt.patient_id || 'p1');
                      setActiveAppointmentId(appt.id);
                    }}
                    className={`w-full text-left p-4 transition-all ${
                      activeAppointmentId === appt.id 
                        ? 'bg-brand-primary/5 border-l-2 border-l-brand-primary' 
                        : 'hover:bg-brand-bg/30 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-brand-textPrimary">{appt.patientName}</span>
                      <span className="text-[10px] text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded">{appt.time}</span>
                    </div>
                    <span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-[10px] font-bold">
                      {appt.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Pane: Vitals Form */}
        <div className="flex-1 flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden relative">
          <div className="p-4 border-b border-brand-border bg-brand-bg/20 flex justify-between items-center">
             <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest">Clinical Vitals Entry</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {!vitalsPatientId ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary">
                <User size={64} className="mb-4 opacity-20 text-brand-textPrimary stroke-[1]" />
                <p className="font-bold text-lg text-brand-textPrimary">No Patient Selected</p>
                <p className="text-sm mt-2 max-w-sm text-center">Please select a patient from the waiting queue on the left to record their physiological vitals.</p>
              </div>
            ) : (
              <div className="animate-fade-in max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border">
                  <div>
                    <h3 className="text-xl font-bold text-brand-textPrimary">{activePatientName}</h3>
                    <p className="text-sm text-brand-primary font-bold mt-1">Recording Vitals</p>
                  </div>
                  <button onClick={() => { setVitalsPatientId(''); setActiveAppointmentId(''); }} className="text-xs text-brand-textSecondary hover:text-brand-primary px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border hover:border-brand-primary transition-all">
                    Cancel Entry
                  </button>
                </div>

                {(isBpHigh || isBpLow || isTempHigh || isPulseHigh) && (
                  <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl flex items-start gap-3 animate-pulse">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-sm">Vitals Warning Threshold</p>
                      <p className="text-xs mt-1 opacity-80">One or more recorded vitals are outside optimal physiological baselines.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSaveVitals} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Blood Pressure (Systolic)</label>
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        placeholder="mmHg (e.g., 120)"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:ring-1 transition-all ${(isBpHigh || isBpLow) ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Blood Pressure (Diastolic)</label>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        placeholder="mmHg (e.g., 80)"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:ring-1 transition-all ${(isBpHigh || isBpLow) ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Temperature (°F)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="°F (e.g., 98.6)"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:ring-1 transition-all ${isTempHigh ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Heart Rate</label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        placeholder="BPM (e.g., 72)"
                        className={`w-full bg-brand-bg border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:ring-1 transition-all ${isPulseHigh ? 'border-red-500/40 focus:ring-red-500/30' : 'border-brand-border focus:border-brand-primary focus:ring-brand-primary'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="kg (e.g., 65)"
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary mb-2 uppercase tracking-wider">Clinical Observations / Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter patient symptoms or general intake notes..."
                      rows={4}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-sm text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingVitals || isFormEmpty}
                      className="w-full bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      <CheckCircle size={18} /> {savingVitals ? 'Saving Metrics...' : 'Save Patient Vitals'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

