import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { Clock, User, Stethoscope, CheckCircle, Volume2, Users, XCircle } from 'lucide-react';

interface WaitingRoomViewProps {
  // Can add props if needed
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchQueue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Note: Ideally the backend allows IN queries for status, but we can fetch all for today and filter
      const response = await api.getAppointments({ date: today });
      const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      
      const queueItems = items.filter((a: any) => ['Checked-In', 'In-Consultation'].includes(a.status));
      setAppointments(queueItems);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleCallPatient = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, { status: 'In-Consultation' } as any);
      fetchQueue();
    } catch (err) {
      console.error("Failed to call patient", err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, { status: 'Completed' });
      fetchQueue();
    } catch (err) {
      console.error("Failed to complete appointment", err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this walk-in?')) return;
    try {
      await api.updateAppointmentStatus(id, { status: 'Canceled', cancellation_reason: 'Patient left waiting room' } as any);
      fetchQueue();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
    }
  };

  const waiting = appointments.filter(a => a.status === 'Checked-In');
  const inConsultation = appointments.filter(a => a.status === 'In-Consultation');

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-brand-textPrimary flex items-center gap-3">
            <Users className="text-brand-primary w-7 h-7" />
            Live Waiting Room
          </h1>
          <p className="text-sm text-brand-textSecondary mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Auto-updating • Last synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-brand-bg border border-brand-border rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-brand-textSecondary font-semibold uppercase tracking-wider mb-1">Waiting</p>
            <p className="text-2xl font-black text-brand-primary">{waiting.length}</p>
          </div>
          <div className="bg-brand-bg border border-brand-border rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-brand-textSecondary font-semibold uppercase tracking-wider mb-1">In Consult</p>
            <p className="text-2xl font-black text-brand-accent">{inConsultation.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          
          {/* Waiting Column */}
          <div className="flex flex-col bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-brand-bg border-b border-brand-border px-6 py-4">
              <h2 className="font-bold text-brand-textPrimary flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-secondary" /> Checked-In (Waiting)
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {waiting.length === 0 ? (
                <div className="text-center text-brand-textSecondary py-10 font-medium">No patients waiting</div>
              ) : (
                waiting.map(appt => (
                  <div key={appt.id} className="bg-brand-bg border border-brand-border rounded-xl p-5 hover:border-brand-primary/50 transition-colors flex justify-between items-center group">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                        <span className="text-2xl font-black text-brand-primary tracking-tighter">{appt.token_number || '-'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-textPrimary mb-1">{appt.patient_name_snapshot || 'Unknown'}</h3>
                        <div className="flex items-center gap-4 text-xs text-brand-textSecondary font-medium">
                          <span className="flex items-center gap-1"><Stethoscope size={12}/> {appt.doctor_name_snapshot || 'Doctor'}</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {new Date(appt.checked_in_at || appt.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="bg-brand-surface text-brand-textSecondary border border-brand-border px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                      <button
                        onClick={() => handleCallPatient(appt.id)}
                        className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                      >
                        <Volume2 size={16} /> Call
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Consultation Column */}
          <div className="flex flex-col bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-brand-bg border-b border-brand-border px-6 py-4">
              <h2 className="font-bold text-brand-textPrimary flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand-accent" /> In Consultation
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {inConsultation.length === 0 ? (
                <div className="text-center text-brand-textSecondary py-10 font-medium">No ongoing consultations</div>
              ) : (
                inConsultation.map(appt => (
                  <div key={appt.id} className="bg-brand-bg border border-brand-border rounded-xl p-5 hover:border-brand-accent/50 transition-colors flex justify-between items-center group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent"></div>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                        <span className="text-2xl font-black text-brand-accent tracking-tighter">{appt.token_number || '-'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-textPrimary mb-1">{appt.patient_name_snapshot || 'Unknown'}</h3>
                        <div className="flex items-center gap-4 text-xs text-brand-textSecondary font-medium">
                          <span className="flex items-center gap-1"><Stethoscope size={12}/> {appt.doctor_name_snapshot || 'Doctor'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleComplete(appt.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Finish
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
