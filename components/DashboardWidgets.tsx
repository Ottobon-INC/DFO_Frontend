import React, { useState } from 'react';
import { CalendarDays, Clock, User, Users, Phone, ArrowRight, Activity, CheckCircle2, XCircle, AlertCircle, Plus, FileText, Stethoscope, UserPlus, Baby, Sparkles, ArrowDown, List, Filter } from 'lucide-react';
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
                                    <div className="p-2 bg-brand-surface rounded-lg shadow-sm text-brand-primary font-bold text-xs flex flex-col items-center min-w-[3.5rem] border border-brand-border">
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
                                        className="flex-1 py-1.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center"
                                    >
                                        <CheckCircle2 size={12} className="mr-1" /> Check In
                                    </button>
                                )}
                                {apt.status !== 'Canceled' && (
                                    <>
                                        <button
                                            onClick={() => onReschedule(apt.id)}
                                            className="flex-1 py-1.5 bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg text-xs font-bold rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <Clock size={12} className="mr-1" /> Reschedule
                                        </button>
                                        <button
                                            onClick={() => onCancel(apt.id)}
                                            className="py-1.5 px-3 bg-brand-surface border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
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
            <div className="p-3 bg-brand-surface rounded-full text-red-500 shadow-sm mr-4 border border-red-100">
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold text-brand-textPrimary">{leadsInQueue}</p>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Leads in Queue</p>
            </div>
        </div>

        <div className="flex items-center p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
            <div className="p-3 bg-brand-surface rounded-full text-brand-primary shadow-sm mr-4 border border-brand-primary/10">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-2xl font-bold text-brand-textPrimary">{leadsConvertedToday}</p>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">Converted Today</p>
            </div>
        </div>
    </div>
);

// --- Intervention Queue Widget (Admin/CRO) ---
export const InterventionQueueWidget: React.FC<{ leads: Lead[], onViewAll?: () => void, onViewLead?: (lead: Lead) => void, onReEngage?: (id: string) => void }> = ({ leads, onViewAll, onViewLead, onReEngage }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0 pr-1">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <List size={16} className="text-brand-primary mr-1.5" /> Pending Interventions
                </h3>
                {onViewAll && leads.length > 0 && (
                    <button onClick={onViewAll} className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                        View All
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-brand-surface rounded-xl border border-brand-border border-dashed">
                        <CheckCircle2 size={32} className="text-brand-primary/40 mb-2" />
                        <p className="text-sm font-bold text-brand-textPrimary">All caught up!</p>
                        <p className="text-xs text-brand-textSecondary mt-1">No pending interventions right now.</p>
                    </div>
                ) : (
                    leads.slice(0, 5).map(lead => (
                        <div key={lead.id} onClick={() => onViewLead && onViewLead(lead)} className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-bg border border-transparent hover:border-brand-border transition-all group cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs border border-brand-primary/20">
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-brand-textPrimary text-sm">{lead.name}</p>
                                    <p className="text-xs text-brand-textSecondary">{lead.phone} • <span className="text-brand-primary">{lead.inquiry || 'Follow-up required'}</span></p>
                                </div>
                            </div>
                            {onReEngage && (
                                <button onClick={(e) => { e.stopPropagation(); onReEngage(lead.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all text-xs font-bold shadow-sm">
                                    Action
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

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
                <span className="text-sm font-medium text-brand-textSecondary">Pending Lab Results</span>
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

    // Default fallback values if no data
    const kpis = {
        conversionRate: safeNum(data?.conversionRate),
        croSuccessRate: safeNum(data?.croSuccessRate),
        avgTimeToConversion: safeNum(data?.avgTimeToConversion),
        patientChurn: safeNum(data?.patientChurn),
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-5 rounded-xl bg-brand-surface shadow-sm border border-brand-border animate-pulse">
                        <div className="h-3 bg-brand-hover rounded w-1/2 mb-4"></div>
                        <div className="h-6 bg-brand-hover rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 h-full overflow-y-auto custom-scrollbar pb-1">
            <KPICard
                label="Conversion Rate"
                value={formatValue(kpis.conversionRate, '%')}
                subtitle="Patient journey success rate"
                colorClass="border-gray-800"
            />
            <KPICard
                label="Follow-up Success Rate"
                value={formatValue(kpis.croSuccessRate, '%')}
                subtitle="Intervention conversions"
                colorClass="border-brand-primary"
            />
            <KPICard
                label="Avg. Time to Conv."
                value={formatValue(kpis.avgTimeToConversion, ' Days')}
                subtitle="Mean turnaround time"
                colorClass="border-brand-primary"
            />
            <KPICard
                label="Patient Churn"
                value={formatValue(kpis.patientChurn, '%')}
                subtitle="Total drop-off rate"
                colorClass="border-red-500"
            />
        </div>
    );
};

const KPICard: React.FC<{ label: string; value: string; subtitle: string; colorClass: string; }> = ({ label, value, subtitle, colorClass }) => (
    <div className={`p-4 rounded-xl bg-brand-surface border flex flex-col justify-between flex-1 relative ${colorClass}`}>
        <p className="text-[11px] font-semibold text-brand-textPrimary mb-3">{label}</p>
        <p className="text-3xl font-bold text-brand-textPrimary tracking-tight mb-3">{value}</p>
        <p className="text-[9px] text-brand-textSecondary">{subtitle}</p>
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
        <div className="bg-brand-surface p-5 rounded-xl border border-brand-border h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-brand-textPrimary">Patient Acquisition Funnel</h3>
                    <p className="text-xs text-brand-textSecondary mt-0.5">30-day rolling window</p>
                </div>
                <select className="bg-transparent border-none text-brand-textSecondary text-[11px] font-medium focus:ring-0 cursor-pointer outline-none">
                    <option>Monthly View</option>
                    <option>Weekly View</option>
                    <option>Yearly View</option>
                </select>
            </div>

            {/* Funnel Stages - Professional List */}
            <div className="flex-1 flex flex-col space-y-0.5 bg-brand-hover p-1 rounded-xl border border-brand-border">
                
                {/* Stage 1 */}
                <div className="bg-brand-surface rounded-lg p-3 sm:p-4 border border-brand-border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">Stage 1</p>
                            <p className="text-sm font-semibold text-brand-textPrimary">New Leads</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-brand-textPrimary">{funnel.newLeads.toLocaleString()}</span>
                </div>

                {/* Drop-off 1 */}
                <div className="flex justify-start pl-[2.25rem] py-1">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-red-600">
                        <ArrowDown size={12} />
                        <span>{dropOff1}% drop-off</span>
                    </div>
                </div>

                {/* Stage 2 */}
                <div className="bg-brand-surface rounded-lg p-3 sm:p-4 border border-brand-border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">Stage 2</p>
                            <p className="text-sm font-semibold text-brand-textPrimary">1st Consult</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-brand-textPrimary">{funnel.firstConsult.toLocaleString()}</span>
                </div>

                {/* Drop-off 2 */}
                <div className="flex justify-start pl-[2.25rem] py-1">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-red-600">
                        <ArrowDown size={12} />
                        <span>{dropOff2}% drop-off</span>
                    </div>
                </div>

                {/* Stage 3 */}
                <div className="bg-brand-surface rounded-lg p-3 sm:p-4 border border-brand-accent/20 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent"></div>
                    <div className="flex items-center gap-3.5 pl-1">
                        <div className="p-2 bg-amber-50 text-brand-accent rounded-lg">
                            <Clock size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-semibold text-brand-textSecondary uppercase tracking-wider">Stage 3</p>
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 rounded-sm">Retention</span>
                            </div>
                            <p className="text-sm font-semibold text-brand-textPrimary">Follow-up / Stalled</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-brand-textPrimary">{funnel.followUp.toLocaleString()}</span>
                </div>

                {/* Drop-off 3 */}
                <div className="flex justify-start pl-[2.25rem] py-1">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-red-600">
                        <ArrowDown size={12} />
                        <span>{dropOff3}% drop-off</span>
                    </div>
                </div>

                {/* Stage 4: Converted */}
                <div className="bg-brand-surface rounded-lg p-3 sm:p-4 border border-brand-primary/20 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                    <div className="flex items-center gap-3.5 pl-1">
                        <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                            <Baby size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-brand-primaryDark uppercase tracking-wider">Final Stage</p>
                            <p className="text-sm font-semibold text-brand-textPrimary">Converted Patient</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-brand-primary">{funnel.converted.toLocaleString()}</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-5 text-center">
                <button
                    onClick={onViewDropOff}
                    className="text-sm font-medium text-brand-primary hover:text-brand-primaryDark flex items-center justify-center gap-1.5 w-full py-2"
                >
                    View detailed report <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
