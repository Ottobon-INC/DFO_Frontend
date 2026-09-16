import React, { useState, useEffect, useMemo } from 'react';
import { Users, LogIn, Clock, Stethoscope, RefreshCw, CheckCircle2, Phone, Search, DoorOpen, Activity, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const QueueManagementView: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      const today = new Date().toISOString().split('T')[0];
      const [apptsRes, patientsRes, leadsRes, doctorsRes] = await Promise.all([
        api.getAppointments({ date: today, limit: 300 }),
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
        const resolvedDoctor = item.doctor_name_snapshot || docMap.get(item.doctor_id) || 'General OPD';
        const timeDisplay = formatTimeDisplay(item.start_time || item.time || item.appointment_time, item.appointment_date);

        return {
          ...item,
          patientName: resolvedName,
          phone: resolvedPhone,
          uhid: resolvedUhid,
          doctorName: resolvedDoctor,
          timeDisplay: timeDisplay,
          normalizedStatus: (item.status || '').toLowerCase(),
          queueStatus: (item.queue_status || item.queueStatus || '').toUpperCase()
        };
      });

      setAppointments(resolvedAppts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (appointmentId: string) => {
    setProcessingId(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, { status: 'Checked-In' });
      toast.success("Patient checked in! Moved to Waiting Queue.");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to Check-In");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCallPatient = async (id: string, patientName?: string) => {
    setProcessingId(id);
    try {
      await api.updateAppointmentStatus(id, { status: 'In-Consultation' } as any);
      toast.success(`${patientName || 'Patient'} called to consultation`);
      loadData();
    } catch (err) {
      console.error("Failed to call patient", err);
      toast.error("Failed to call patient");
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: string, patientName?: string) => {
    setProcessingId(id);
    try {
      await api.updateAppointmentStatus(id, { status: 'Completed' });
      toast.success(`Consultation completed for ${patientName || 'Patient'}`);
      loadData();
    } catch (err) {
      console.error("Failed to complete appointment", err);
      toast.error("Failed to complete appointment");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Filtering & Bucketing (Mutually Exclusive) ---
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const pName = (a.patientName || '').toLowerCase();
      const pPhone = (a.phone || '').toLowerCase();
      const pUhid = (a.uhid || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      return !search || pName.includes(search) || pPhone.includes(search) || pUhid.includes(search);
    });
  }, [appointments, searchTerm]);

  const { scheduled, waiting, inConsultation } = useMemo(() => {
    const _scheduled: any[] = [];
    const _waiting: any[] = [];
    const _inConsultation: any[] = [];

    filteredAppointments.forEach(a => {
      const isDoneOrConsult = a.normalizedStatus === 'in-consultation' || a.queueStatus === 'IN_CONSULTATION' || 
                              a.normalizedStatus === 'completed' || a.queueStatus === 'COMPLETED';
      
      const isWaiting = a.normalizedStatus === 'checked-in' || a.queueStatus === 'WAITING' || a.queueStatus === 'ARRIVED';
      
      const isExpected = a.normalizedStatus === 'scheduled' || a.normalizedStatus === 'arrived' || !a.normalizedStatus;

      // Ensure a patient only appears in ONE column (highest priority state wins)
      if (isDoneOrConsult) {
        _inConsultation.push(a);
      } else if (isWaiting) {
        _waiting.push(a);
      } else if (isExpected) {
        _scheduled.push(a);
      } else {
        // Fallback for any weird status
        _scheduled.push(a);
      }
    });

    // Sort the waiting column (oldest first)
    _waiting.sort((a, b) => {
      const timeA = new Date(a.checked_in_at || a.created_at || 0).getTime();
      const timeB = new Date(b.checked_in_at || b.created_at || 0).getTime();
      return timeA - timeB; 
    });

    return { scheduled: _scheduled, waiting: _waiting, inConsultation: _inConsultation };
  }, [filteredAppointments]);

  // --- Card Renderers ---
  const renderCard = (a: any, columnType: 'expected' | 'waiting' | 'done') => {
    const isProcessing = processingId === a.id;
    return (
      <div key={a.id} className="bg-brand-surface p-4 rounded-xl border border-brand-border/60 hover:border-brand-primary/30 hover:shadow-md transition-all group flex flex-col gap-3">
        {/* Header: Time & Doctor */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
            <Clock size={12} />
            {a.timeDisplay}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border/50">
            <Stethoscope size={12} className="text-purple-500" />
            <span className="truncate max-w-[100px]">{a.doctorName}</span>
          </div>
        </div>

        {/* Patient Details */}
        <div>
          <h4 className="font-bold text-brand-textPrimary text-[15px] truncate">{a.patientName}</h4>
          <div className="flex items-center gap-3 text-[11px] text-brand-textSecondary mt-1 font-medium">
            <span className="flex items-center gap-1">
              <Phone size={10} /> {a.phone}
            </span>
            {a.uhid && a.uhid !== '-' && (
              <span className="text-brand-textMuted">• {a.uhid}</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 mt-auto border-t border-brand-border/50">
          {columnType === 'expected' && (
            <button
              onClick={() => handleCheckIn(a.id)}
              disabled={isProcessing}
              className="w-full flex justify-center items-center gap-2 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <LogIn size={14} />}
              Check-In Patient
            </button>
          )}

          {columnType === 'waiting' && (
            <button
              onClick={() => handleCallPatient(a.id, a.patientName)}
              disabled={isProcessing}
              className="w-full flex justify-center items-center gap-2 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors border border-blue-200 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <DoorOpen size={14} />}
              Send to Doctor
            </button>
          )}

          {columnType === 'done' && (
             <div className="flex gap-2">
                {a.normalizedStatus !== 'completed' && a.queueStatus !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleComplete(a.id, a.patientName)}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center gap-2 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition-colors border border-purple-200 shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Complete
                  </button>
                ) : (
                  <div className="w-full py-1.5 text-center text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100 flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} />
                    Consultation Completed
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-[#f8fafc] animate-slide-up overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10 gap-3 shrink-0">
        <div>
          <h2 className="text-[20px] font-extrabold text-brand-textPrimary flex items-center gap-2 tracking-tight">
            <Activity className="text-brand-primary" size={24} /> Queue Control Board
          </h2>
          <p className="text-[13px] text-brand-textSecondary mt-0.5 font-medium">
            Live bird's-eye view of the clinic floor patient flow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-brand-bg/50 w-64"
            />
          </div>
          <button 
            onClick={loadData} 
            className="p-2.5 bg-brand-bg/50 border border-brand-border rounded-xl hover:bg-brand-surface text-brand-textSecondary transition-colors hover:text-brand-primary hover:border-brand-primary/30"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-[1000px]">
          
          {/* Column 1: Expected Arrivals */}
          <div className="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-white/60 border-b border-slate-200/60 flex items-center justify-between backdrop-blur-md">
              <h3 className="font-extrabold text-slate-700 flex items-center gap-2 text-[15px]">
                <LogIn size={18} className="text-blue-500" />
                Expected Arrivals
              </h3>
              <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {scheduled.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {scheduled.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <CheckCircle2 size={32} className="opacity-50" />
                  <span className="text-sm font-medium">No expected arrivals</span>
                </div>
              ) : (
                scheduled.map(a => renderCard(a, 'expected'))
              )}
            </div>
          </div>

          {/* Column 2: Waiting Inside */}
          <div className="flex-1 flex flex-col bg-brand-primary/5 rounded-2xl border border-brand-primary/10 overflow-hidden shadow-sm ring-1 ring-brand-primary/5">
            <div className="p-4 bg-white/60 border-b border-brand-primary/10 flex items-center justify-between backdrop-blur-md">
              <h3 className="font-extrabold text-brand-primary flex items-center gap-2 text-[15px]">
                <Users size={18} />
                Waiting Inside
              </h3>
              <span className="bg-brand-primary text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                {waiting.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {waiting.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-brand-primary/40 gap-2">
                  <Users size={32} className="opacity-50" />
                  <span className="text-sm font-medium">Waiting room is empty</span>
                </div>
              ) : (
                waiting.map(a => renderCard(a, 'waiting'))
              )}
            </div>
          </div>

          {/* Column 3: In Consultation & Done */}
          <div className="flex-1 flex flex-col bg-purple-50/50 rounded-2xl border border-purple-200/50 overflow-hidden shadow-sm">
            <div className="p-4 bg-white/60 border-b border-purple-200/50 flex items-center justify-between backdrop-blur-md">
              <h3 className="font-extrabold text-purple-700 flex items-center gap-2 text-[15px]">
                <Activity size={18} />
                In Consultation
              </h3>
              <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {inConsultation.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {inConsultation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-purple-300 gap-2">
                  <CheckCircle2 size={32} className="opacity-50" />
                  <span className="text-sm font-medium">No active consultations</span>
                </div>
              ) : (
                inConsultation.map(a => renderCard(a, 'done'))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
