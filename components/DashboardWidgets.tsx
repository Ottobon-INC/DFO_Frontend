import React, { useState } from 'react';
import { CalendarDays, Clock, User, Users, Phone, ArrowRight, Activity, CheckCircle2, XCircle, AlertCircle, Plus, FileText, Stethoscope, UserPlus, Baby, Sparkles, ArrowDown } from 'lucide-react';
import { Appointment, Lead } from '../types';

// --- Appointment Widget ---
export const AppointmentWidget: React.FC<{
    appointments: Appointment[];
    onCheckIn: (id: string) => void;
    onReschedule: (id: string) => void;
    onCancel: (id: string) => void;
}> = ({ appointments, onCheckIn, onReschedule, onCancel }) => {
    // Filter for Today's Appointments
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const todaysAppointments = appointments.filter(apt => apt.date === todayStr);

    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border h-full flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            <div className="mb-6 relative z-10">
                <h3 className="text-lg font-bold text-brand-textPrimary flex items-center">
                    <CalendarDays className="mr-2 text-brand-primary" size={20} /> Today's Schedule
                </h3>
                <p className="text-xs text-brand-textSecondary font-medium mt-1">
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
                {todaysAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary">
                        <CalendarDays size={48} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">No appointments for today</p>
                    </div>
                ) : (
                    todaysAppointments.map((apt) => (
                        <div key={apt.id} className="p-4 rounded-xl bg-brand-bg border border-brand-border hover:border-brand-primary/50 transition-all group/item">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-brand-primary font-bold text-xs flex flex-col items-center min-w-[3.5rem] border border-brand-border">
                                        <span>
                                            {(() => {
                                                const t = apt.time || '';
                                                if (t.includes(' ')) return t.split(' ')[0];
                                                const h = parseInt(t.split(':')[0] || '0');
                                                const m = t.split(':')[1] || '00';
                                                const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                                                return `${h12}:${m}`;
                                            })()}
                                        </span>
                                        <span className="text-[10px] text-brand-textSecondary">
                                            {(() => {
                                                const t = apt.time || '';
                                                if (t.includes(' ')) return t.split(' ')[1];
                                                const h = parseInt(t.split(':')[0] || '0');
                                                return h >= 12 ? 'PM' : 'AM';
                                            })()}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brand-textPrimary text-sm">{apt.patientName}</h4>
                                        <p className="text-xs text-brand-textSecondary flex items-center mt-0.5">
                                            <User size={10} className="mr-1" /> {apt.doctorName} • <span className="text-brand-primary ml-1 font-medium">{apt.type}</span>
                                            {apt.status === 'Canceled' && (
                                                <span className="ml-2 text-red-500 font-bold text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Canceled</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-brand-textSecondary mt-1 flex items-center">
                                            <CalendarDays size={10} className="mr-1" /> {apt.date}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-3 pt-3 border-t border-brand-border flex space-x-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                {apt.status !== 'Checked-In' && apt.status !== 'Canceled' && (
                                    <button
                                        onClick={() => onCheckIn(apt.id)}
                                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center"
                                    >
                                        <CheckCircle2 size={12} className="mr-1" /> Check In
                                    </button>
                                )}
                                {apt.status !== 'Canceled' && (
                                    <>
                                        <button
                                            onClick={() => onReschedule(apt.id)}
                                            className="flex-1 py-1.5 bg-white border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <Clock size={12} className="mr-1" /> Reschedule
                                        </button>
                                        <button
                                            onClick={() => onCancel(apt.id)}
                                            className="py-1.5 px-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                                            title="Cancel Appointment"
                                        >
                                            <XCircle size={12} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

// --- Quick Lead Widget (Lead Onboarding) ---
export const QuickLeadWidget: React.FC<{ onOpenAddModal: () => void }> = ({ onOpenAddModal }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border h-full flex flex-col relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <div className="relative z-10 mb-6">
                <h3 className="text-lg font-bold flex items-center text-brand-textPrimary">
                    <Plus className="mr-2 text-brand-primary" size={20} /> Lead Onboarding
                </h3>
                <p className="text-brand-textSecondary text-xs mt-1">Quickly register new leads from camps or walk-ins.</p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center space-y-4 relative z-10">
                <div className="p-4 bg-brand-bg rounded-full border border-brand-border">
                    <User size={32} className="text-brand-primary" />
                </div>
                <p className="text-center text-sm text-brand-textSecondary max-w-[200px]">
                    Click below to open the full lead registration form.
                </p>
                <button
                    onClick={onOpenAddModal}
                    className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all active:scale-95 flex items-center justify-center"
                >
                    <Plus size={18} className="mr-2" /> Add New Lead
                </button>
            </div>
        </div>
    );
};

// --- Leads Widget ---
export const LeadsWidget: React.FC<{ leads: Lead[], onSendToCRO: (id: string) => void }> = ({ leads, onSendToCRO }) => (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-brand-textPrimary flex items-center">
                <Activity className="mr-2 text-brand-primary" size={20} /> Recent Inquiries
            </h3>
            <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded text-xs font-bold">{leads.length} New</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-bg border border-transparent hover:border-brand-border transition-all group">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-textSecondary font-bold text-xs border border-brand-border">
                            {lead.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-brand-textPrimary text-sm">{lead.name}</p>
                            <p className="text-xs text-brand-textSecondary">{lead.phone} • <span className="text-brand-primary">{lead.inquiry}</span></p>
                        </div>
                    </div>
                    {lead.status === 'New Inquiry' && (
                        <button
                            onClick={() => onSendToCRO(lead.id)}
                            className="text-xs font-bold text-brand-error border border-brand-error/30 px-3 py-1.5 rounded-lg hover:bg-brand-error/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            Send to CRO
                        </button>
                    )}
                    {lead.status !== 'New Inquiry' && (
                        <span className="text-[10px] font-bold text-brand-textSecondary bg-brand-bg px-2 py-1 rounded border border-brand-border">{lead.status}</span>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// --- CRO Status Widget ---
export const CROStatusWidget: React.FC<{ leadsInQueue: number, leadsConvertedToday: number }> = ({ leadsInQueue, leadsConvertedToday }) => (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-sm border border-brand-border h-full flex flex-col justify-center space-y-6">
        <h3 className="text-lg font-bold text-brand-textPrimary mb-2">CRO Desk Status</h3>

        <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="p-3 bg-white rounded-full text-red-500 shadow-sm mr-4 border border-red-100">
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold text-brand-textPrimary">{leadsInQueue}</p>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Leads in Queue</p>
            </div>
        </div>

        <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="p-3 bg-white rounded-full text-green-500 shadow-sm mr-4 border border-green-100">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold text-brand-textPrimary">{leadsConvertedToday}</p>
                <p className="text-xs font-bold text-green-500 uppercase tracking-wide">Converted Today</p>
            </div>
        </div>
    </div>
);

// --- Intervention Queue Widget (Admin/CRO) ---
export const InterventionQueueWidget: React.FC<{
    leads: Lead[],
    onViewAll: () => void,
    onViewLead?: (lead: Lead) => void,
    onReEngage?: (lead: Lead) => void
}> = ({ leads, onViewAll, onViewLead, onReEngage }) => (
    <div className="bg-brand-surface p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border border-brand-border h-full flex flex-col relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-brand-primary/5 rounded-bl-full -mr-4 sm:-mr-6 lg:-mr-8 -mt-4 sm:-mt-6 lg:-mt-8 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4 lg:mb-6 relative z-10">
            <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-brand-textPrimary flex items-center">
                    <AlertCircle className="mr-1.5 sm:mr-2 text-brand-primary flex-shrink-0" size={16} />
                    <span className="truncate">Intervention Queue</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-brand-textSecondary font-medium mt-0.5 sm:mt-1">High priority leads requiring attention.</p>
            </div>
            <button onClick={onViewAll} className="text-[10px] sm:text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg transition-all active:scale-95 border border-brand-primary/20 whitespace-nowrap flex-shrink-0">
                View All
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 sm:space-y-3 relative z-10 pr-1 sm:pr-2">
            {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary space-y-2 sm:space-y-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-success/10 flex items-center justify-center text-brand-success border border-brand-success/20">
                        <CheckCircle2 size={20} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-center">All caught up! No stalled leads.</p>
                </div>
            ) : (
                leads.map(lead => (
                    <div key={lead.id} className="p-2.5 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl bg-brand-bg border border-brand-border hover:border-brand-primary/50 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-brand-textPrimary text-xs sm:text-sm truncate">{lead.name}</h4>
                                <p className="text-[10px] sm:text-xs text-brand-textSecondary mt-0.5 sm:mt-1 flex items-center">
                                    <Clock size={10} className="mr-1 flex-shrink-0" /> Stalled: <span className="font-semibold text-brand-textPrimary ml-1">2 Days</span>
                                </p>
                            </div>
                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-bold bg-brand-error/10 text-brand-error border border-brand-error/20 flex-shrink-0">
                                Priority
                            </span>
                        </div>

                        <div className="flex gap-1.5 sm:gap-2">
                            <button
                                onClick={() => onViewLead && onViewLead(lead)}
                                className="flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-md sm:rounded-lg hover:border-brand-primary transition-colors flex items-center justify-center"
                            >
                                View Details
                            </button>
                            <button
                                onClick={() => onReEngage ? onReEngage(lead) : (onViewLead && onViewLead(lead))}
                                className="flex-1 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold text-white bg-brand-primary rounded-md sm:rounded-lg hover:bg-brand-secondary transition-colors shadow-sm shadow-brand-primary/20"
                            >
                                Re-Engage
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// --- Financial Snapshot Widget (Admin/CRO) ---
// --- Financial Snapshot Widget (Admin/CRO) - Removed
export const FinancialSnapshotWidget: React.FC = () => null;

// --- Active Caseload Widget (New) ---
export const ActiveCaseloadWidget: React.FC = () => (
    <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden text-brand-textPrimary p-6 relative h-full">
        <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <h2 className="font-bold text-lg flex items-center mb-6 relative z-10 text-brand-textPrimary">
            <Users size={20} className="mr-2 text-brand-primary" /> Active Caseload
        </h2>

        <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl border border-brand-border">
                <span className="text-sm font-medium text-brand-textSecondary">IVF Stimulation Phase</span>
                <span className="text-lg font-bold text-brand-textPrimary">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl border border-brand-border">
                <span className="text-sm font-medium text-brand-textSecondary">Awaiting Transfer</span>
                <span className="text-lg font-bold text-brand-textPrimary">5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl border border-brand-border">
                <span className="text-sm font-medium text-brand-textSecondary">Beta HCG Wait</span>
                <span className="text-lg font-bold text-brand-textPrimary">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl border border-brand-border">
                <span className="text-sm font-medium text-brand-textSecondary">Postpartum Care</span>
                <span className="text-lg font-bold text-brand-textPrimary">3</span>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t border-brand-border flex justify-between items-center relative z-10">
            <div className="text-center">
                <p className="text-3xl font-bold text-brand-primary">28</p>
                <p className="text-xs text-brand-textSecondary uppercase tracking-wider font-bold">Total Patients</p>
            </div>
            <div className="text-center">
                <p className="text-3xl font-bold text-brand-secondary">92%</p>
                <p className="text-xs text-brand-textSecondary uppercase tracking-wider font-bold">Success Rate</p>
            </div>
        </div>
    </div>
);

// --- KPI Data Type ---
export interface KPIData {
    conversionRate: number;
    croSuccessRate: number;
    avgTimeToConversion: number;
    patientChurn: number;
    conversionRateTrend: number;
    croSuccessRateTrend: number;
    avgTimeToConversionTrend: number;
    patientChurnTrend: number;
}

export interface FunnelData {
    newLeads: number;
    firstConsult: number;
    followUp: number;
    converted: number;
}

// --- KPI Widget (Admin/CRO) - Grid Stack ---
export const KPIWidget: React.FC<{ data?: KPIData; loading?: boolean }> = ({ data, loading }) => {
    // Helper to safely format numbers - returns '-' for undefined/NaN
    const safeNum = (val: number | undefined | null): number => {
        if (val === undefined || val === null || isNaN(val)) return 0;
        return val;
    };

    const formatValue = (val: number | undefined | null, suffix: string = ''): string => {
        const num = safeNum(val);
        // Round to 1 decimal place if needed
        const rounded = Math.round(num * 10) / 10;
        return `${rounded}${suffix}`;
    };

    const formatTrend = (val: number | undefined | null, suffix: string = ''): string => {
        const num = safeNum(val);
        const prefix = num >= 0 ? '+' : '';
        return `${prefix}${num}${suffix}`;
    };

    // Default fallback values if no data
    const kpis = {
        conversionRate: safeNum(data?.conversionRate),
        croSuccessRate: safeNum(data?.croSuccessRate),
        avgTimeToConversion: safeNum(data?.avgTimeToConversion),
        patientChurn: safeNum(data?.patientChurn),
        conversionRateTrend: safeNum(data?.conversionRateTrend),
        croSuccessRateTrend: safeNum(data?.croSuccessRateTrend),
        avgTimeToConversionTrend: safeNum(data?.avgTimeToConversionTrend),
        patientChurnTrend: safeNum(data?.patientChurnTrend),
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border bg-brand-surface border-brand-border animate-pulse">
                        <div className="h-3 bg-brand-bg rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-brand-bg rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
            <KPICard
                label="Conversion Rate"
                value={formatValue(kpis.conversionRate, '%')}
                trend={kpis.conversionRateTrend >= 0 ? 'up' : 'down'}
                trendValue={formatTrend(kpis.conversionRateTrend, '%')}
                color="bg-brand-surface border-brand-border"
                valueColor="text-brand-textPrimary"
            />
            <KPICard
                label="CRO Success Rate"
                value={formatValue(kpis.croSuccessRate, '%')}
                trend={kpis.croSuccessRateTrend >= 0 ? 'up' : 'down'}
                trendValue={formatTrend(kpis.croSuccessRateTrend, '%')}
                color="bg-brand-surface border-brand-border"
                valueColor="text-brand-textPrimary"
            />
            <KPICard
                label="Avg. Time to Conv."
                value={formatValue(kpis.avgTimeToConversion, ' Days')}
                trend={kpis.avgTimeToConversionTrend <= 0 ? 'up' : 'down'}
                trendValue={formatTrend(kpis.avgTimeToConversionTrend, ' Days')}
                color="bg-brand-surface border-brand-border"
                valueColor="text-brand-textPrimary"
            />
            <KPICard
                label="Patient Churn"
                value={formatValue(kpis.patientChurn, '%')}
                trend={kpis.patientChurnTrend <= 0 ? 'up' : 'down'}
                trendValue={formatTrend(kpis.patientChurnTrend, '%')}
                color="bg-brand-surface border-brand-border"
                valueColor="text-brand-textPrimary"
            />
        </div>
    );
};

const KPICard: React.FC<{ label: string; value: string; trend: 'up' | 'down' | 'neutral'; trendValue: string; color: string; valueColor?: string }> = ({ label, value, trend, trendValue, color, valueColor = 'text-brand-textPrimary' }) => (
    <div className={`p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border flex flex-col justify-center flex-1 shadow-sm ${color}`}>
        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase opacity-60 mb-0.5 sm:mb-1 tracking-wider text-brand-textSecondary">{label}</p>
        <div className="flex justify-between items-end">
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${valueColor}`}>{value}</p>
            <div className="flex items-center mb-0.5 sm:mb-1 bg-brand-bg px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                <span className={`text-[10px] sm:text-xs font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-brand-error' : 'text-brand-textSecondary'}`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
                </span>
            </div>
        </div>
    </div>
);

// --- Conversion Funnel Widget (Center Column) ---
export const ConversionFunnelWidget: React.FC<{ data?: FunnelData; onViewDropOff: () => void }> = ({ data, onViewDropOff }) => {
    // Default values
    const funnel = data || {
        newLeads: 0,
        firstConsult: 0,
        followUp: 0,
        converted: 0
    };

    // Calculate drop-offs
    const calcDropOff = (start: number, end: number) => {
        if (start === 0) return 0;
        const drop = ((start - end) / start) * 100;
        return Math.round(drop);
    };

    const dropOff1 = calcDropOff(funnel.newLeads, funnel.firstConsult);
    const dropOff2 = calcDropOff(funnel.firstConsult, funnel.followUp);
    const dropOff3 = calcDropOff(funnel.followUp, funnel.converted);

    return (
        <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl shadow-sm border border-brand-border h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                <div>
                    <h3 className="text-xl font-extrabold text-brand-textPrimary flex items-center">
                        <Activity className="mr-2 text-brand-primary" size={24} />
                        Conversion Pipeline
                    </h3>
                    <p className="text-sm text-brand-textSecondary mt-0.5 font-medium">Tracking patient journey performance.</p>
                </div>
                <div className="relative group">
                    <select className="appearance-none bg-brand-bg pl-3 pr-8 py-2 rounded-lg border border-brand-border text-xs font-bold text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 cursor-pointer transition-all shadow-sm transform hover:scale-105">
                        <option>Monthly View</option>
                        <option>Weekly View</option>
                        <option>Yearly View</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-textSecondary">
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Funnel Stages - Stepper Timeline Vertical Layout */}
            <div className="flex-1 flex flex-col justify-between relative z-10 px-2 space-y-0">

                {/* --- Lead Stage --- */}
                <div className="flex items-center group">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center mr-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <UserPlus size={18} />
                        </div>
                        <div className="h-full w-0.5 bg-gray-100 my-1 group-hover:bg-blue-100 transition-colors"></div>
                    </div>
                    {/* Content Card */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-default">
                        <div>
                            <p className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-0.5">Stage 1</p>
                            <h4 className="font-bold text-brand-textPrimary text-sm">New Leads</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-brand-textPrimary">{funnel.newLeads.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Drop-off Indicator 1 */}
                <div className="flex justify-start ml-5 pl-[19px] relative -mt-3 -mb-3 z-0">
                    <span className="text-[9px] font-bold text-red-400 bg-red-50/50 px-2 py-0.5 rounded-full border border-red-50 flex items-center">
                        <ArrowDown size={10} className="mr-1" /> {dropOff1}% Drop-off
                    </span>
                </div>

                {/* --- Consult Stage --- */}
                <div className="flex items-center group pt-2">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center mr-4">
                        <div className="h-4 w-0.5 bg-gray-100 mb-1 group-hover:bg-indigo-100 transition-colors"></div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Stethoscope size={18} />
                        </div>
                        <div className="h-full w-0.5 bg-gray-100 my-1 group-hover:bg-indigo-100 transition-colors"></div>
                    </div>
                    {/* Content Card */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-default">
                        <div>
                            <p className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-0.5">Stage 2</p>
                            <h4 className="font-bold text-brand-textPrimary text-sm">1st Consult</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-brand-textPrimary">{funnel.firstConsult.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Drop-off Indicator 2 */}
                <div className="flex justify-start ml-5 pl-[19px] relative -mt-3 -mb-3 z-0">
                    <span className="text-[9px] font-bold text-red-400 bg-red-50/50 px-2 py-0.5 rounded-full border border-red-50 flex items-center">
                        <ArrowDown size={10} className="mr-1" /> {dropOff2}% Drop-off
                    </span>
                </div>

                {/* --- Retention Stage (Hero) --- */}
                <div className="flex items-center group pt-2">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center mr-4">
                        <div className="h-4 w-0.5 bg-gray-100 mb-1 group-hover:bg-amber-100 transition-colors"></div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-100 group-hover:scale-110 transition-transform duration-300">
                            <Clock size={18} />
                        </div>
                        <div className="h-full w-0.5 bg-gray-100 my-1 group-hover:bg-amber-100 transition-colors"></div>
                    </div>
                    {/* Content Card */}
                    <div className="flex-1 bg-gradient-to-r from-amber-50/50 to-white border border-amber-100/50 rounded-xl p-3 flex justify-between items-center shadow-lg shadow-amber-500/5 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-200 transition-all cursor-default transform scale-[1.02] origin-left z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Stage 3</p>
                                <span className="text-[8px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                    <Sparkles size={8} /> RETENTION ZONE
                                </span>
                            </div>
                            <h4 className="font-bold text-brand-textPrimary text-sm">Follow-up / Stalled</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-amber-900">{funnel.followUp.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Drop-off Indicator 3 */}
                <div className="flex justify-start ml-5 pl-[19px] relative -mt-3 -mb-3 z-0">
                    <span className="text-[9px] font-bold text-red-400 bg-red-50/50 px-2 py-0.5 rounded-full border border-red-50 flex items-center">
                        <ArrowDown size={10} className="mr-1" /> {dropOff3}% Drop-off
                    </span>
                </div>

                {/* --- Converted Stage --- */}
                <div className="flex items-center group pt-2">
                    {/* Icon Column */}
                    <div className="flex flex-col items-center mr-4">
                        <div className="h-4 w-0.5 bg-gray-100 mb-1 group-hover:bg-emerald-100 transition-colors"></div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Baby size={18} />
                        </div>
                    </div>
                    {/* Content Card */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-default">
                        <div>
                            <p className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-0.5">Final Stage</p>
                            <h4 className="font-bold text-brand-textPrimary text-sm">Converted Patient</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-emerald-700">{funnel.converted.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={onViewDropOff}
                    className="text-xs font-bold text-brand-textSecondary hover:text-brand-primary bg-transparent text-center flex items-center gap-1 group transition-colors"
                >
                    <span>View Detail Drop-off Report</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
