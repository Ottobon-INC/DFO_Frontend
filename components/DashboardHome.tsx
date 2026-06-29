import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, Lead, UserRole, Patient } from '../types';
import { AppointmentWidget, QuickLeadWidget, LeadsWidget, CROStatusWidget, InterventionQueueWidget, FinancialSnapshotWidget, KPIWidget, ConversionFunnelWidget, KPIData, FunnelData } from './DashboardWidgets';
import { DoctorDashboard } from './DoctorDashboard';
import { LeadDetailsModal } from './LeadDetailsModal';
import { api } from '../services/api';

interface DashboardHomeProps {
    userRole: UserRole;
    leads: Lead[];
    appointments: Appointment[];
    leadsInCROQueue: number;
    leadsConvertedToday: number;
    onCheckIn: (id: string) => void;
    onReschedule: (id: string) => void;
    onCancelAppointment: (id: string) => void;
    onUpdateLead: (lead: Lead) => void;
    onOpenAddLeadModal: () => void;
    onNavigateToLeads: (filter: string) => void;
    onPatientSelect: (patient: Patient, initialTab?: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    userRole,
    leads,
    appointments,
    leadsInCROQueue,
    leadsConvertedToday,
    onCheckIn,
    onReschedule,
    onCancelAppointment,
    onUpdateLead,
    onOpenAddLeadModal,
    onNavigateToLeads,
    onPatientSelect
}) => {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
    const [kpiLoading, setKpiLoading] = useState(false);
    const [kpiError, setKpiError] = useState<string | null>(null);

    const navigate = useNavigate();
    const [hiddenLeadIds, setHiddenLeadIds] = useState<Set<string>>(new Set());

    // New state for modal
    const [selectedLeadForModal, setSelectedLeadForModal] = useState<Lead | null>(null);

    const handleReEngage = async (lead: Lead) => {
        try {
            await api.reEngageLead(lead.id);
            // Optimistically remove from view
            setHiddenLeadIds(prev => {
                const newSet = new Set(prev);
                newSet.add(lead.id);
                return newSet;
            });
        } catch (error) {
            console.error('Failed to re-engage lead:', error);
            // Fallback: Navigate to lead details so user can try manually
            navigate('/dashboard/leads', { state: { selectedLeadId: lead.id } });
        }
    };

    // Fetch CRO dashboard data when component mounts (for Admin/CRO users)
    useEffect(() => {
        if (userRole === UserRole.ADMIN || userRole === UserRole.CRO) {
            const fetchCRODashboard = async () => {
                setKpiLoading(true);
                setKpiError(null);
                try {
                    const response = await api.getCRODashboard();
                    console.log('CRO Dashboard API Response:', response); // Debug log

                    if (response.success && response.data?.kpis) {
                        const apiKpis = response.data.kpis;

                        // Map backend keys to frontend keys with null guards
                        const mappedKpiData: KPIData = {
                            conversionRate: apiKpis.conversionRate ?? 0,
                            croSuccessRate: apiKpis.croSuccessRate ?? 0,
                            // Backend uses avgTimeToConvertDays, not avgTimeToConversion
                            avgTimeToConversion: apiKpis.avgTimeToConvertDays ?? 0,
                            // Backend uses patientChurnRate, not patientChurn
                            patientChurn: apiKpis.patientChurnRate ?? 0,
                            // Trends may not be in the response, default to 0
                            conversionRateTrend: apiKpis.conversionRateTrend ?? 0,
                            croSuccessRateTrend: apiKpis.croSuccessRateTrend ?? 0,
                            avgTimeToConversionTrend: apiKpis.avgTimeToConvertDaysTrend ?? 0,
                            patientChurnTrend: apiKpis.patientChurnRateTrend ?? 0,
                        };

                        console.log('Mapped KPI Data:', mappedKpiData); // Debug log
                        setKpiData(mappedKpiData);
                    }

                    if (response.success && response.data?.funnel && !Array.isArray(response.data.funnel)) {
                        setFunnelData(response.data.funnel as FunnelData);
                    }
                } catch (error: any) {
                    console.error('Failed to fetch CRO dashboard:', error);
                    setKpiError(error.message || 'Failed to load dashboard data');
                    // Keep showing default/mock data on error
                } finally {
                    setKpiLoading(false);
                }
            };

            fetchCRODashboard();
        }
    }, [userRole, leads, leadsInCROQueue, leadsConvertedToday]); // Refetch when data changes

    return (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 max-w-[1600px] mx-auto animate-fade-in overflow-hidden">

            {userRole === UserRole.ADMIN || userRole === UserRole.CRO ? (
                // --- Admin / CRO Layout ---
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 xl:gap-8 overflow-hidden">
                    {/* Top Row: KPIs */}
                    <div className="min-h-[90px] sm:min-h-[100px] lg:min-h-[120px] xl:h-40 flex-shrink-0 overflow-x-auto">
                        <KPIWidget data={kpiData || undefined} loading={kpiLoading} />
                    </div>

                    {/* Bottom Row: Main Content - Stack on mobile/tablet, side-by-side on lg+ */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 min-h-0 overflow-hidden">
                        {/* Funnel */}
                        <div className="lg:col-span-8 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] xl:min-h-[450px]">
                            <ConversionFunnelWidget
                                data={funnelData || undefined}
                                onViewDropOff={() => onNavigateToLeads('Stalling - Sent to CRO')}
                            />
                        </div>

                        {/* Right Side: Queue */}
                        <div className="lg:col-span-4 flex flex-col">
                            <div className="h-full min-h-[400px]">
                                <InterventionQueueWidget
                                    leads={leads.filter(l => l.status === 'Stalling - Sent to CRO' && !hiddenLeadIds.has(l.id))}
                                    onViewAll={() => onNavigateToLeads('Stalling - Sent to CRO')}
                                    onViewLead={(lead) => setSelectedLeadForModal(lead)}
                                    onReEngage={handleReEngage}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (userRole === UserRole.DOCTOR) ? (
                // --- Doctor / Nurse Dashboard ---
                <div>
                    <DoctorDashboard
                        appointments={appointments.filter(a => a.doctorId === 'dr1')}
                        onPatientSelect={onPatientSelect}
                    />
                </div>
            ) : (
                // --- Front Desk Layout - Stack on mobile/tablet, side-by-side on lg+ ---
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 overflow-hidden">
                    {/* Left Column: Appointments (Wider) */}
                    <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                        <div className="min-h-[320px] sm:min-h-[400px] lg:min-h-[500px] xl:h-[600px]">
                            <AppointmentWidget
                                appointments={appointments}
                                onCheckIn={onCheckIn}
                                onReschedule={onReschedule}
                                onCancel={onCancelAppointment}
                            />
                        </div>
                        <div className="min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] xl:h-[350px]">
                            <LeadsWidget leads={leads} onSendToCRO={(id) => onUpdateLead({ ...leads.find(l => l.id === id)!, status: 'Stalling - Sent to CRO' })} />
                        </div>
                    </div>

                    {/* Right Column: Tools & Stats (Narrower) */}
                    <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                        <div className="min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] xl:h-[350px] flex-shrink-0">
                            <QuickLeadWidget onOpenAddModal={onOpenAddLeadModal} />
                        </div>
                        <div className="min-h-[180px] sm:min-h-[220px] lg:min-h-[260px] xl:h-[280px] flex-shrink-0">
                            <CROStatusWidget leadsInQueue={leadsInCROQueue} leadsConvertedToday={leadsConvertedToday} />
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Details Modal - Available for all roles */}
            <LeadDetailsModal
                isOpen={!!selectedLeadForModal}
                onClose={() => setSelectedLeadForModal(null)}
                lead={selectedLeadForModal}
                onUpdateLead={(updatedLead) => {
                    onUpdateLead(updatedLead);
                    setSelectedLeadForModal(updatedLead);
                }}
                onConvert={(lead) => {
                    navigate('/dashboard/patients', { state: { leadToConvert: lead } });
                    setSelectedLeadForModal(null);
                }}
            />
        </div>
    );
};
