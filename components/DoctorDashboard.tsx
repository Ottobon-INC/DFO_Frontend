import React, { useState } from 'react';
import {
    Calendar, Clock, Activity, Stethoscope, ClipboardList,
    CheckCircle2, Users, ArrowUpRight, Search, Filter,
    UserCheck, AlertCircle, Sparkles, HeartPulse, User
} from 'lucide-react';
import { Appointment, Patient } from '../types';

interface DoctorDashboardProps {
    appointments?: Appointment[];
    onPatientSelect: (patient: Patient, initialTab?: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ appointments = [], onPatientSelect }) => {
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const handleStartConsultation = (appt: Appointment) => {
        const patient: any = {
            id: appt.patientId || 'unknown',
            name: appt.patientName,
            assignedDoctorId: appt.doctorId
        };
        onPatientSelect(patient, 'consultation');
    };

    const displayAppointments = appointments;

    // Metrics
    const total = displayAppointments.length;
    const checkedIn = displayAppointments.filter(a => a.status === 'Checked-In' || a.status === 'Waiting').length;
    const completed = displayAppointments.filter(a => a.status === 'Completed' || a.status === 'Done').length;
    const scheduled = total - checkedIn - completed;

    // Filtered Queue
    const filteredQueue = displayAppointments.filter(appt => {
        const matchesSearch = !searchQuery || 
            appt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (appt.id && appt.id.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterStatus === 'WAITING') return appt.status === 'Checked-In' || appt.status === 'Waiting';
        if (filterStatus === 'COMPLETED') return appt.status === 'Completed' || appt.status === 'Done';
        return true;
    });

    return (
        <div className="space-y-4 w-full animate-fade-in">
            {/* Top Clinical Header & Stat Cards */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-brand-border">
                <div>
                    <h1 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                        <Stethoscope className="text-brand-primary" size={22} />
                        OPD Consultation Queue
                    </h1>
                    <p className="text-xs text-brand-textSecondary mt-0.5">
                        Live patient queue & clinical consultation workspace
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-brand-surface px-3 py-1.5 rounded-md border border-brand-border text-xs font-semibold text-brand-textPrimary flex items-center gap-1.5 shadow-sm">
                        <Clock size={14} className="text-brand-primary" />
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[10px] text-brand-textSecondary uppercase">IST</span>
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar (Compact, High Density) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-brand-surface p-3.5 rounded-lg border border-brand-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-brand-textSecondary">Total Patients</p>
                        <p className="text-2xl font-black text-brand-textPrimary mt-0.5">{total}</p>
                    </div>
                    <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar size={18} />
                    </div>
                </div>

                <div className="bg-brand-surface p-3.5 rounded-lg border border-brand-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Waiting in Clinic
                        </p>
                        <p className="text-2xl font-black text-amber-600 mt-0.5">{checkedIn}</p>
                    </div>
                    <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Users size={18} />
                    </div>
                </div>

                <div className="bg-brand-surface p-3.5 rounded-lg border border-brand-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-brand-textSecondary">Scheduled Later</p>
                        <p className="text-2xl font-black text-brand-textPrimary mt-0.5">{scheduled > 0 ? scheduled : 0}</p>
                    </div>
                    <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                </div>

                <div className="bg-brand-surface p-3.5 rounded-lg border border-brand-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-emerald-600">Completed</p>
                        <p className="text-2xl font-black text-emerald-600 mt-0.5">{completed}</p>
                    </div>
                    <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                </div>
            </div>

            {/* Main Clinical Queue Surface */}
            <div className="bg-brand-surface rounded-lg border border-brand-border shadow-sm overflow-hidden flex flex-col">
                {/* Filter & Search Toolbar */}
                <div className="p-3 border-b border-brand-border bg-slate-50/70 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-brand-border shadow-2xs">
                        <button
                            onClick={() => setFilterStatus('ALL')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                filterStatus === 'ALL'
                                    ? 'bg-brand-primary text-white shadow-xs'
                                    : 'text-brand-textSecondary hover:text-brand-textPrimary'
                            }`}
                        >
                            All ({total})
                        </button>
                        <button
                            onClick={() => setFilterStatus('WAITING')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                                filterStatus === 'WAITING'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-brand-textSecondary hover:text-amber-600'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Waiting ({checkedIn})
                        </button>
                        <button
                            onClick={() => setFilterStatus('COMPLETED')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                filterStatus === 'COMPLETED'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-brand-textSecondary hover:text-emerald-600'
                            }`}
                        >
                            Completed ({completed})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
                        <input
                            type="text"
                            placeholder="Search patient name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-md text-xs font-medium text-brand-textPrimary placeholder:text-brand-textSecondary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>
                </div>

                {/* Queue Patient Rows */}
                <div className="divide-y divide-brand-border overflow-x-auto">
                    {filteredQueue.map((appt, idx) => {
                        const isCheckedIn = appt.status === 'Checked-In' || appt.status === 'Waiting';
                        const isDone = appt.status === 'Completed' || appt.status === 'Done';

                        return (
                            <div 
                                key={appt.id || idx} 
                                className={`p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                                    isCheckedIn ? 'bg-amber-50/20' : ''
                                }`}
                            >
                                {/* Left: Token / Time + Patient Details */}
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Token / Time Badge */}
                                    <div className={`w-14 h-12 rounded-md border flex flex-col items-center justify-center shrink-0 ${
                                        isCheckedIn 
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                                            : isDone
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        <span className="text-[9px] font-extrabold uppercase tracking-tight">
                                            #{String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className="text-xs font-bold leading-tight">
                                            {appt.time || '10:00 AM'}
                                        </span>
                                    </div>

                                    {/* Patient Info */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm text-brand-textPrimary truncate hover:text-brand-primary cursor-pointer" onClick={() => handleStartConsultation(appt)}>
                                                {appt.patientName}
                                            </h3>
                                            {isCheckedIn && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    Waiting in Room
                                                </span>
                                            )}
                                            {isDone && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    <CheckCircle2 size={10} /> Completed
                                                </span>
                                            )}
                                        </div>

                                        {/* Secondary metadata: Type, Doctor, Vitals */}
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-brand-textSecondary">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-700">
                                                <Stethoscope size={11} className="text-brand-primary" />
                                                {appt.type || 'General Consultation'}
                                            </span>
                                            {appt.doctorName && (
                                                <span className="text-[11px]">
                                                    • Dr. {appt.doctorName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Fast Actions */}
                                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                                    {isDone ? (
                                        <button
                                            onClick={() => handleStartConsultation(appt)}
                                            className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-brand-border bg-white text-brand-textSecondary hover:text-brand-textPrimary hover:bg-slate-50 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                            View Summary
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStartConsultation(appt)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-all active:scale-98 ${
                                                isCheckedIn
                                                    ? 'bg-brand-primary hover:bg-brand-primaryDark text-white shadow-brand-primary/20'
                                                    : 'bg-white border border-brand-border text-brand-textPrimary hover:border-brand-primary hover:text-brand-primary'
                                            }`}
                                        >
                                            <span>{isCheckedIn ? 'Start Consult' : 'Open Patient'}</span>
                                            <ArrowUpRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredQueue.length === 0 && (
                        <div className="py-12 px-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                                <ClipboardList size={20} />
                            </div>
                            <h4 className="text-xs font-bold text-brand-textPrimary">No patients found</h4>
                            <p className="text-xs text-brand-textSecondary mt-0.5 max-w-sm mx-auto">
                                {searchQuery ? 'No patients matched your search query.' : 'There are no patients currently scheduled in this queue.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
