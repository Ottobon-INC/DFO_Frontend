import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Clock, Stethoscope, CheckCircle2, Volume2, Users, 
  Trash2, UserPlus, Activity, Sparkles, Search, 
  Filter, DoorOpen, ArrowUpRight, ChevronRight, User, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface WaitingRoomViewProps {
  onOpenWalkIn?: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({ onOpenWalkIn }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [callingId, setCallingId] = useState<string | null>(null);

  const formatDoctorName = (nameSnapshot?: string, doctorObj?: any) => {
    let raw = nameSnapshot || doctorObj?.name || (doctorObj ? `${doctorObj.first_name || ''} ${doctorObj.last_name || ''}`.trim() : '') || '';
    raw = raw.trim();
    if (!raw || raw.toLowerCase() === 'unassigned' || raw.toLowerCase() === 'doctor') {
      return 'General OPD';
    }
    if (/^dr\.?\s+/i.test(raw)) {
      return raw.replace(/^dr\.?\s+/i, 'Dr. ');
    }
    return `Dr. ${raw}`;
  };

  const fetchQueue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [apptRes, docRes] = await Promise.all([
        api.getAppointments({ date: today, limit: 200 }),
        api.getDoctors()
      ]);

      const items = Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data?.items || []);
      const docsList = Array.isArray(docRes.data) ? docRes.data : (Array.isArray(docRes) ? docRes : []);
      setDoctors(docsList);
      
      const queueItems = items.filter((a: any) => {
        const status = (a.status || '').toLowerCase();
        const queueStatus = (a.queue_status || a.queueStatus || '').toUpperCase();
        
        const isWaiting = status === 'checked-in' || queueStatus === 'WAITING' || queueStatus === 'ARRIVED';
        const isInConsult = status === 'in-consultation' || queueStatus === 'IN_CONSULTATION';
        const isDone = status === 'completed' || queueStatus === 'COMPLETED';
        
        return isWaiting || isInConsult || isDone;
      });

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
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCallPatient = async (id: string, patientName?: string) => {
    setCallingId(id);
    try {
      await api.updateAppointmentStatus(id, { status: 'In-Consultation' } as any);
      toast.success(`${patientName || 'Patient'} called into consultation cabin`);
      fetchQueue();
    } catch (err) {
      console.error("Failed to call patient", err);
      toast.error("Failed to update queue status");
    } finally {
      setCallingId(null);
    }
  };

  const handleComplete = async (id: string, patientName?: string) => {
    try {
      await api.updateAppointmentStatus(id, { status: 'Completed' });
      toast.success(`Consultation completed for ${patientName || 'Patient'}`);
      fetchQueue();
    } catch (err) {
      console.error("Failed to complete appointment", err);
      toast.error("Failed to complete appointment");
    }
  };

  const handleCancel = async (id: string, patientName?: string) => {
    if (!window.confirm(`Remove ${patientName || 'patient'} from the active queue?`)) return;
    try {
      await api.updateAppointmentStatus(id, { status: 'Canceled', cancellation_reason: 'Patient left waiting room' } as any);
      toast.success("Patient removed from waiting queue");
      fetchQueue();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      toast.error("Failed to remove patient");
    }
  };

  // Filter and Sort Strictly by Arrival / Token (FIFO)
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const pName = (a.patient_name_snapshot || a.patient_name || a.name || '').toLowerCase();
      const pPhone = (a.phone_snapshot || a.phone || '').toLowerCase();
      const docName = (a.doctor_name_snapshot || a.doctor?.name || '').toLowerCase();
      const docId = a.doctor_id || a.doctorId;
      
      const matchesSearch = !searchFilter.trim() || 
        pName.includes(searchFilter.toLowerCase()) || 
        pPhone.includes(searchFilter.toLowerCase()) || 
        docName.includes(searchFilter.toLowerCase());

      const matchesDoctor = selectedDoctorFilter === 'all' || docId === selectedDoctorFilter;

      return matchesSearch && matchesDoctor;
    });
  }, [appointments, searchFilter, selectedDoctorFilter]);

  const waiting = useMemo(() => {
    return filteredAppointments
      .filter(a => {
        const status = (a.status || '').toLowerCase();
        const qStatus = (a.queue_status || a.queueStatus || '').toUpperCase();
        return status === 'checked-in' || qStatus === 'WAITING' || qStatus === 'ARRIVED';
      })
      .sort((a, b) => {
        const tokenA = parseInt(a.token_number || a.token || '0');
        const tokenB = parseInt(b.token_number || b.token || '0');
        if (tokenA > 0 && tokenB > 0 && tokenA !== tokenB) {
          return tokenA - tokenB;
        }
        const timeA = new Date(a.checked_in_at || a.created_at || a.appointment_date || 0).getTime();
        const timeB = new Date(b.checked_in_at || b.created_at || b.appointment_date || 0).getTime();
        return timeA - timeB;
      });
  }, [filteredAppointments]);

  const inConsultation = useMemo(() => {
    return filteredAppointments
      .filter(a => {
        const status = (a.status || '').toLowerCase();
        const qStatus = (a.queue_status || a.queueStatus || '').toUpperCase();
        return status === 'in-consultation' || qStatus === 'IN_CONSULTATION';
      })
      .sort((a, b) => {
        const timeA = new Date(a.consultation_started_at || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.consultation_started_at || b.updated_at || b.created_at || 0).getTime();
        return timeA - timeB;
      });
  }, [filteredAppointments]);

  const completedTodayCount = useMemo(() => {
    return appointments.filter(a => (a.status || '').toLowerCase() === 'completed').length;
  }, [appointments]);

  const getInitials = (name: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col space-y-5 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-brand-surface border border-brand-border/80 rounded-2xl p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Live Status */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Users size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
                  Live Waiting Room & QMS
                </h1>
                <div className="flex items-center gap-2 text-xs text-brand-textSecondary mt-0.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Real-Time Sync</span>
                  <span>•</span>
                  <span>Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-brand-bg/70 border border-brand-border rounded-xl px-4 py-2.5 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary block">In Queue</span>
              <span className="text-xl font-extrabold text-brand-primary tracking-tight">{waiting.length}</span>
            </div>

            <div className="bg-brand-bg/70 border border-brand-border rounded-xl px-4 py-2.5 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary block">In Doctor Cabin</span>
              <span className="text-xl font-extrabold text-brand-accent tracking-tight">{inConsultation.length}</span>
            </div>

            <div className="bg-brand-bg/70 border border-brand-border rounded-xl px-4 py-2.5 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary block">Seen Today</span>
              <span className="text-xl font-extrabold text-emerald-500 tracking-tight">{completedTodayCount}</span>
            </div>
          </div>

        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-brand-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-brand-textSecondary" />
              <input
                type="text"
                placeholder="Search patient, phone, doctor..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2 text-xs text-brand-textPrimary placeholder:text-brand-textSecondary outline-none focus:border-brand-primary"
              />
            </div>

            {/* Doctor Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
              >
                <option value="all">All Consultants</option>
                {doctors.map(d => (
                  <option key={d.id || d.doctorId} value={d.id || d.doctorId}>
                    {d.name || `Dr. ${d.user?.firstName || ''} ${d.user?.lastName || ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-brand-textSecondary w-full md:w-auto justify-end">
            <span>Showing <strong>{waiting.length + inConsultation.length}</strong> active patient visits</span>
          </div>
        </div>
      </div>

      {/* Main Split Queue Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-hidden">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: WAITING ROOM QUEUE                                              */}
          {/* ========================================================================= */}
          <div className="flex flex-col bg-brand-surface border border-brand-border/80 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Column Header */}
            <div className="p-4 px-5 border-b border-brand-border bg-brand-bg/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-textPrimary">
                  Waiting Queue
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {waiting.length} in line
              </span>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {waiting.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mx-auto mb-3 text-brand-textSecondary">
                    <Clock size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-textPrimary mb-1">Queue is clear</h3>
                  <p className="text-xs text-brand-textSecondary max-w-xs mx-auto mb-4">
                    There are currently no patients waiting in the reception lounge.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-secondary shadow-sm transition-all"
                  >
                    <UserPlus size={14} /> New Patient Check-In
                  </button>
                </div>
              ) : (
                waiting.map((appt, idx) => {
                  const tokenNum = appt.token_number || (idx + 1);
                  const isFirst = idx === 0;
                  const docName = formatDoctorName(appt.doctor_name_snapshot, appt.doctor);
                  const patientName = appt.patient_name_snapshot || appt.patient_name || appt.name || 'Unknown Patient';
                  const arrivalTime = new Date(appt.checked_in_at || appt.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                  const visitType = appt.type || appt.visit_reason || 'Consultation';

                  return (
                    <div 
                      key={appt.id}
                      className={`relative rounded-2xl p-4 transition-all duration-200 border ${
                        isFirst 
                          ? 'bg-brand-primary/[0.03] border-brand-primary/40 shadow-md shadow-brand-primary/5 hover:border-brand-primary' 
                          : 'bg-brand-bg/60 border-brand-border hover:border-brand-border/80 hover:bg-brand-bg'
                      } group flex items-center justify-between gap-4`}
                    >
                      {/* Left: Token & Patient Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        
                        {/* Token Pill */}
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border font-mono ${
                          isFirst 
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm' 
                            : 'bg-brand-surface text-brand-textPrimary border-brand-border shadow-2xs'
                        }`}>
                          <span className="text-sm font-extrabold leading-none">#{tokenNum}</span>
                          <span className={`text-[8px] font-sans font-bold uppercase tracking-tighter mt-0.5 ${
                            isFirst ? 'text-white/80' : 'text-brand-textSecondary'
                          }`}>
                            {isFirst ? 'NEXT' : `POS ${idx + 1}`}
                          </span>
                        </div>

                        {/* Patient Avatar & Text */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-brand-textPrimary truncate">
                              {patientName}
                            </h3>
                            {isFirst && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0">
                                Next Up
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-textSecondary mt-1">
                            <span className="inline-flex items-center gap-1 font-medium text-brand-textPrimary truncate">
                              <Stethoscope size={12} className="text-brand-primary flex-shrink-0" />
                              {docName}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Clock size={11} className="flex-shrink-0" />
                              {arrivalTime}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-brand-surface border border-brand-border text-[10px] font-medium text-brand-textSecondary truncate">
                              {visitType}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Remove Action with confirmation */}
                        <button
                          onClick={() => handleCancel(appt.id, patientName)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-brand-textSecondary hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                          title="Remove patient from waiting queue"
                        >
                          <Trash2 size={15} />
                        </button>

                        {/* Primary Call In Button */}
                        <button
                          onClick={() => handleCallPatient(appt.id, patientName)}
                          disabled={callingId === appt.id}
                          className={`py-2 px-4 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                            isFirst
                              ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-brand-primary/25'
                              : 'bg-brand-surface hover:bg-brand-primary hover:text-white text-brand-textPrimary border border-brand-border hover:border-transparent'
                          }`}
                        >
                          <Volume2 size={14} className={isFirst ? 'animate-pulse' : ''} />
                          <span>Call In</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: IN CONSULTATION (DOCTOR CABINS)                                 */}
          {/* ========================================================================= */}
          <div className="flex flex-col bg-brand-surface border border-brand-border/80 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Column Header */}
            <div className="p-4 px-5 border-b border-brand-border bg-brand-bg/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse"></div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-textPrimary">
                  In Doctor Cabin (Active Consultation)
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                {inConsultation.length} active
              </span>
            </div>

            {/* In-Consultation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {inConsultation.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mx-auto mb-3 text-brand-textSecondary">
                    <DoorOpen size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-textPrimary mb-1">No active consultations</h3>
                  <p className="text-xs text-brand-textSecondary max-w-xs mx-auto">
                    Call a waiting patient from the queue to start their clinical consultation.
                  </p>
                </div>
              ) : (
                inConsultation.map((appt, idx) => {
                  const tokenNum = appt.token_number || (idx + 1);
                  const docName = formatDoctorName(appt.doctor_name_snapshot, appt.doctor);
                  const patientName = appt.patient_name_snapshot || appt.patient_name || appt.name || 'Unknown Patient';
                  const visitType = appt.type || appt.visit_reason || 'Consultation';

                  return (
                    <div 
                      key={appt.id}
                      className="bg-brand-bg/60 border border-brand-accent/30 rounded-2xl p-4 transition-all flex items-center justify-between gap-4 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent"></div>

                      {/* Left Details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                        <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex flex-col items-center justify-center flex-shrink-0 text-brand-accent font-mono font-extrabold">
                          <span className="text-sm leading-none">#{tokenNum}</span>
                          <span className="text-[8px] font-sans font-bold uppercase tracking-tighter mt-0.5">CABIN</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-brand-textPrimary truncate">{patientName}</h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-accent/10 text-brand-accent border border-brand-accent/20 flex-shrink-0">
                              In Session
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-textSecondary mt-1">
                            <span className="inline-flex items-center gap-1 font-medium text-brand-textPrimary truncate">
                              <Stethoscope size={12} className="text-brand-accent flex-shrink-0" />
                              {docName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-brand-surface border border-brand-border text-[10px] font-medium text-brand-textSecondary truncate">
                              {visitType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Complete Visit Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleComplete(appt.id, patientName)}
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                        >
                          <CheckCircle2 size={14} />
                          <span>Complete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
