import React, { useState, useEffect } from 'react';
import { CheckCircle, Heart, User, RefreshCw, Clock, Stethoscope, Phone, Search, Calendar, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const LobbyRoster: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

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
      const [apptsRes, patientsRes, leadsRes, doctorsRes] = await Promise.all([
        api.getAppointments(),
        api.getPatients().catch(() => ({ data: [] })),
        api.getLeads().catch(() => ({ data: [] })),
        api.getDoctors().catch(() => ({ data: [] }))
      ]);

      const rawAppts = Array.isArray(apptsRes?.data) ? apptsRes.data : (Array.isArray(apptsRes?.items) ? apptsRes.items : (Array.isArray(apptsRes) ? apptsRes : []));
      const patientsList = Array.isArray(patientsRes?.data) ? patientsRes.data : (Array.isArray(patientsRes?.items) ? patientsRes.items : (Array.isArray(patientsRes) ? patientsRes : []));
      const leadsList = Array.isArray(leadsRes?.data) ? leadsRes.data : (Array.isArray(leadsRes?.items) ? leadsRes.items : (Array.isArray(leadsRes) ? leadsRes : []));
      const doctorsList = Array.isArray(doctorsRes?.data) ? doctorsRes.data : (Array.isArray(doctorsRes) ? doctorsRes : []);

      const patientMap = new Map();
      patientsList.forEach((p: any) => {
        patientMap.set(p.id, {
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          phone: p.mobile || p.phone,
          uhid: p.uhid
        });
      });

      const leadMap = new Map();
      leadsList.forEach((l: any) => {
        leadMap.set(l.id, {
          name: l.name || l.patient_name,
          phone: l.phone || l.mobile
        });
      });

      const docMap = new Map();
      doctorsList.forEach((d: any) => {
        docMap.set(d.id || d.doctorId, d.name || `Dr. ${d.user?.firstName || ''} ${d.user?.lastName || ''}`.trim());
      });

      const resolvedAppts = rawAppts.map((item: any) => {
        const patientInfo = patientMap.get(item.patient_id || item.patientId);
        const leadInfo = leadMap.get(item.lead_id) || leadMap.get(item.patient_id);

        const resolvedName = item.patient_name_snapshot || item.patient_name || item.patientName || patientInfo?.name || leadInfo?.name || 'Walk-In Patient';
        const resolvedPhone = item.patient_phone_snapshot || item.phone || patientInfo?.phone || leadInfo?.phone || '-';
        const resolvedUhid = item.uhid || patientInfo?.uhid || '-';
        const resolvedDoctor = item.doctor_name_snapshot || docMap.get(item.doctor_id) || 'Assigned Duty Doctor';
        const timeDisplay = formatTimeDisplay(item.start_time || item.time || item.appointment_time, item.appointment_date);

        return {
          ...item,
          patientName: resolvedName,
          phone: resolvedPhone,
          uhid: resolvedUhid,
          doctorName: resolvedDoctor,
          timeDisplay: timeDisplay,
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
    setProcessingId(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, { status: 'Checked-In' });
      toast.success("Patient checked in! Moved to Vitals Queue.");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to Check-In");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = appointments.filter(a => {
    const matchesSearch = !searchTerm || 
      a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm) ||
      a.uhid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const checkedInCount = appointments.filter(a => a.status === 'Checked-In' || a.status === 'Waiting').length;
  const scheduledCount = appointments.filter(a => a.status === 'Scheduled' || a.status === 'Arrived').length;
  const completedCount = appointments.filter(a => a.status === 'Completed' || a.status === 'In-Consultation').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg/50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10 gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <CheckCircle className="text-brand-primary" /> Lobby Arrivals & Reception Roster
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Front desk check-in gate: Check in arriving patients to generate queue tokens and transfer them to the nurse vitals queue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/dashboard/nurse')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            <Heart size={14} className="text-rose-600" /> Go to Vitals Queue ({checkedInCount})
          </button>
          <button 
            onClick={loadData} 
            className="p-2 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg/50 transition-all shadow-2xs"
            title="Refresh Roster"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-brand-surface border border-brand-border p-3.5 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">Scheduled Today</p>
            <p className="text-xl font-black text-brand-textPrimary mt-0.5">{scheduledCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Clock size={16} />
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border p-3.5 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">Checked-In / In Triage</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{checkedInCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <UserCheck size={16} />
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border p-3.5 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">In Consultation / Done</p>
            <p className="text-xl font-black text-brand-primary mt-0.5">{completedCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Stethoscope size={16} />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* Filter Bar */}
          <div className="p-3.5 border-b border-brand-border bg-brand-bg/20 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-3 text-brand-textSecondary" />
              <input
                type="text"
                placeholder="Search patient, phone, UHID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold text-brand-textPrimary outline-none focus:border-brand-primary shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Checked-In">Checked-In</option>
                <option value="Waiting">Waiting (Triage)</option>
                <option value="In-Consultation">In-Consultation</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-bg/40 text-brand-textSecondary text-[11px] font-bold uppercase tracking-wider border-b border-brand-border sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="p-3.5">Appt. Time</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Assigned Doctor</th>
                  <th className="p-3.5">Reason / Token</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-brand-textSecondary">
                      <Calendar size={32} className="mx-auto opacity-30 mb-2" />
                      <p className="font-bold text-sm text-brand-textPrimary">No appointments found</p>
                      <p className="text-xs text-brand-textSecondary mt-1">No appointments matching current search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(appt => (
                    <tr key={appt.id} className="hover:bg-brand-bg/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-brand-primary flex items-center gap-1.5 font-mono text-xs">
                          <Clock size={13} className="opacity-70" /> {appt.timeDisplay}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div>
                          <p className="font-bold text-brand-textPrimary text-xs">{appt.patientName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-brand-textSecondary">
                            {appt.uhid && appt.uhid !== '-' && <span className="font-mono text-brand-primary/80">{appt.uhid}</span>}
                            <span>{appt.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-brand-textPrimary flex items-center gap-1">
                          <Stethoscope size={13} className="text-indigo-500 opacity-80" /> {appt.doctorName}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div>
                          <p className="text-brand-textPrimary truncate max-w-[180px]">{appt.visit_reason || appt.type || 'Consultation'}</p>
                          {appt.token_number && (
                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Token #{appt.token_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${
                          appt.status === 'Checked-In' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          appt.status === 'Waiting' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          appt.status === 'In-Consultation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          appt.status === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          appt.status === 'Canceled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {appt.status !== 'Checked-In' && appt.status !== 'Waiting' && appt.status !== 'In-Consultation' && appt.status !== 'Completed' && appt.status !== 'Canceled' ? (
                          <button
                            disabled={processingId === appt.id}
                            onClick={() => handleCheckInPatient(appt.id)}
                            className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                          >
                            {processingId === appt.id ? 'Checking In...' : 'Check-In Patient'}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/dashboard/nurse')}
                            className="bg-brand-surface text-brand-textPrimary border border-brand-border hover:border-brand-primary text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-end gap-1.5 ml-auto shadow-2xs"
                          >
                            <Heart size={13} className="text-rose-500" /> Vitals Queue
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
    </div>
  );
};
