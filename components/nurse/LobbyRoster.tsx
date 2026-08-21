import React, { useState, useEffect } from 'react';
import { CheckCircle, Heart, User, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const LobbyRoster: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

      setAppointments(resolvedAppts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckInPatient = async (appointmentId: string) => {
    try {
      await api.updateAppointmentStatus(appointmentId, { status: 'Checked-In' });
      toast.success("Patient Checked-In successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to Check-In");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg/50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <CheckCircle className="text-brand-primary" /> Lobby Arrivals Roster
          </h2>
          <p className="text-sm text-brand-textSecondary mt-0.5">Monitor all incoming patients for the day</p>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg/50 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-brand-bg/50 text-brand-textSecondary text-xs font-bold uppercase tracking-wider border-b border-brand-border">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-brand-textSecondary">
                    No appointments for today.
                  </td>
                </tr>
              ) : (
                appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-brand-bg/30 transition-colors">
                    <td className="p-4 font-bold text-brand-primary">{appt.time}</td>
                    <td className="p-4 font-bold text-brand-textPrimary">{appt.patientName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border 
                        ${appt.status === 'Checked-In' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          appt.status === 'Waiting' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-brand-primary/10 text-brand-primary border-brand-primary/20'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {appt.status !== 'Checked-In' && appt.status !== 'Waiting' && appt.status !== 'Triage Complete' ? (
                        <button
                          onClick={() => handleCheckInPatient(appt.id)}
                          className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md active:scale-95"
                        >
                          Check-In Patient
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="bg-brand-surface text-brand-textPrimary border border-brand-border hover:border-brand-primary text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center justify-end gap-1.5 ml-auto"
                        >
                          <Heart size={14} className="text-brand-primary" /> Vitals Queue
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

