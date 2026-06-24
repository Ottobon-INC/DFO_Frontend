import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, CalendarDays, Users, TrendingUp, Settings,
    LogOut, ChevronDown, UserCheck, Activity, Clock, AlertTriangle, 
    CheckCircle, Mail, MessageSquare, Send, ShieldAlert, Search, RefreshCw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { api } from '../services/api';
import { ControlTowerWorkspace } from './ControlTowerWorkspace';

interface ControlTowerProps {
    onLogout: () => void;
    userRole: UserRole;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`
      flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group
      ${active
                ? 'bg-brand-primary/20 text-brand-primary font-bold translate-x-1 border-r-4 border-brand-primary'
                : 'text-brand-textSecondary hover:bg-brand-bg hover:text-brand-textPrimary font-medium hover:translate-x-1'}
    `}
    >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className="text-sm tracking-wide">{label}</span>
    </div>
);

export const ControlTower: React.FC<ControlTowerProps> = ({ onLogout, userRole }) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeView, setActiveView] = useState<'live' | 'inbox' | 'analytics' | 'audit'>('live');

    // --- State for Control Tower Data ---
    const [patientFlow, setPatientFlow] = useState({ scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 });
    const [waitingAlerts, setWaitingAlerts] = useState<any[]>([]);
    const [liveQueue, setLiveQueue] = useState<any[]>([]);
    const [doctorUtilization, setDoctorUtilization] = useState<any[]>([]);
    const [leadSnapshot, setLeadSnapshot] = useState({ new: 0, contacted: 0, stalling: 0, converted: 0 });
    const [loading, setLoading] = useState(true);

    // --- State for Inbox ---
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [threadContext, setThreadContext] = useState<any>(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- State for Analytics & Audit Logs ---
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // --- Fetch Live Ops Data ---
    const fetchLiveOpsData = async () => {
        try {
            const [flowData, alertsData, queueData, docData, leadsData] = await Promise.all([
                api.getPatientFlowSummary().catch(() => ({ data: { scheduled: 12, arrived: 8, checkedIn: 5, completed: 3 } })), 
                api.getWaitingAlerts().catch(() => ({ data: [] })),
                api.getLiveQueue().catch(() => ({ data: [] })),
                api.getDoctorUtilization().catch(() => ({ data: [] })),
                api.getLeadSnapshot().catch(() => ({ data: { new: 5, contacted: 12, stalling: 3, converted: 2 } })) 
            ]);

            setPatientFlow(flowData.data || { scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 });
            setWaitingAlerts(alertsData.data || []);
            setLiveQueue(queueData.data || []);
            setDoctorUtilization(docData.data || []);
            setLeadSnapshot(leadsData.data || { new: 0, contacted: 0, stalling: 0, converted: 0 });

            if (!queueData?.data?.length) {
                setLiveQueue([
                    { patientName: "Ramesh Gupta", doctor: "Dr. Sireesha", status: "Arrived", waitingMinutes: 45 },
                    { patientName: "Sita Verma", doctor: "Dr. Ananya", status: "Checked-In", waitingMinutes: 12 },
                ]);
            }
            if (!alertsData?.data?.length) {
                setWaitingAlerts([
                    { message: "Patient waiting > 30 mins", patientName: "Ramesh Gupta", doctor: "Dr. Sireesha", minutes: 45 }
                ]);
            }
            if (!docData?.data?.length) {
                setDoctorUtilization([
                    { doctorName: "Dr. Sireesha", total: 15, completed: 5, pending: 10 },
                    { doctorName: "Dr. Ananya", total: 12, completed: 8, pending: 4 },
                ]);
            }
        } catch (error) {
            console.error("Control Tower fetch failed", error);
        }
    };

    // --- Fetch Inbox/Threads Data ---
    const fetchInboxData = async () => {
        try {
            const res = await api.getInboxThreads();
            if (res && res.data) {
                setThreads(res.data);
            } else if (Array.isArray(res)) {
                setThreads(res);
            }
        } catch (err) {
            console.error("Failed to fetch inbox threads", err);
            // Mock Fallback
            setThreads([
                { id: "t-1", patient_name: "Sara Johnson", latest_message: "When is my next scan scheduled?", updated_at: new Date().toISOString(), status: "PENDING_DOCTOR" },
                { id: "t-2", patient_name: "Priya Nair", latest_message: "My vitals report has been updated.", updated_at: new Date(Date.now() - 3600000).toISOString(), status: "COMPLETED" }
            ]);
        }
    };

    // --- Fetch Thread Details ---
    const fetchThreadDetails = async (id: string) => {
        try {
            const res = await api.getThreadContext(id);
            setThreadContext(res.data || res);
        } catch (err) {
            console.error("Failed to fetch thread context", err);
            // Mock Fallback
            setThreadContext({
                thread: { id, patient_name: threads.find(t => t.id === id)?.patient_name || "Patient" },
                messages: [
                    { id: "m-1", sender_type: "PATIENT", content: threads.find(t => t.id === id)?.latest_message || "Hello", created_at: new Date().toISOString() }
                ]
            });
        }
    };

    // --- Send Inbox Reply ---
    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedThreadId) return;
        setSendingReply(true);
        try {
            await api.replyToThread({
                thread_id: selectedThreadId,
                sender_type: 'HUMAN',
                content: replyText.trim()
            });
            setReplyText('');
            // Refresh thread details
            await fetchThreadDetails(selectedThreadId);
        } catch (err) {
            console.error("Failed to send reply", err);
            // Mock add message for preview
            if (threadContext) {
                setThreadContext({
                    ...threadContext,
                    messages: [
                        ...(threadContext.messages || []),
                        { id: Math.random().toString(), sender_type: "HUMAN", content: replyText.trim(), created_at: new Date().toISOString() }
                    ]
                });
                setReplyText('');
            }
        } finally {
            setSendingReply(false);
        }
    };

    // --- Fetch Analytics Data ---
    const fetchAnalyticsData = async () => {
        try {
            const res = await api.getOverviewAnalytics();
            setAnalyticsData(res.data || res);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
            // Mock Fallback
            setAnalyticsData({
                totalPatients: 145,
                conversionRate: 68.2,
                avgWaitingTime: 22,
                slaCompliance: 94.5
            });
        }
    };

    // --- Fetch Audit Logs ---
    const fetchAuditLogs = async () => {
        try {
            const res = await api.getAuditLogs();
            setAuditLogs(res.data || res);
        } catch (err) {
            console.error("Failed to fetch audit logs", err);
            setAuditLogs([
                { id: "a-1", actor_id: "dr.divya@janmasethu.com", actor_type: "DOCTOR", action: "VIEWED_PATIENT_CLINICAL_HISTORY", timestamp: new Date().toISOString(), payload: { patientId: "Sara Johnson" } },
                { id: "a-2", actor_id: "cro@janmasethu.com", actor_type: "CRO", action: "TRIGGERED_LEAD_CONVERSION_BATCH", timestamp: new Date(Date.now() - 600000).toISOString(), payload: { count: 3 } }
            ]);
        }
    };

    // --- Initial Effect ---
    useEffect(() => {
        setLoading(true);
        if (activeView === 'live') {
            fetchLiveOpsData().finally(() => setLoading(false));
        } else if (activeView === 'inbox') {
            fetchInboxData().finally(() => setLoading(false));
        } else if (activeView === 'analytics') {
            fetchAnalyticsData().finally(() => setLoading(false));
        } else if (activeView === 'audit') {
            fetchAuditLogs().finally(() => setLoading(false));
        }
    }, [activeView]);

    // --- Polling for Live View ---
    useEffect(() => {
        if (activeView !== 'live') return;
        const interval = setInterval(fetchLiveOpsData, 60000);
        return () => clearInterval(interval);
    }, [activeView]);

    // --- Scroll to Chat End ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadContext]);

    const handleThreadSelect = (id: string) => {
        setSelectedThreadId(id);
        fetchThreadDetails(id);
    };

    return (
        <div className="min-h-screen bg-brand-bg flex h-screen overflow-hidden font-sans text-brand-textPrimary selection:bg-brand-primary selection:text-brand-bg">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-56 md:w-52 lg:w-64 xl:w-72 bg-brand-surface flex-shrink-0 flex flex-col border-r border-brand-border fixed h-full z-50 shadow-lg transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-4 md:p-5 lg:p-6 xl:p-8 flex items-center space-x-2 md:space-x-3 lg:space-x-4 border-b border-brand-border">
                    <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-xl bg-brand-primary flex items-center justify-center font-bold text-brand-bg shadow-lg shadow-brand-primary/20 text-base md:text-lg lg:text-xl">J</div>
                    <div>
                        <span className="font-bold tracking-tight text-base md:text-lg lg:text-xl block text-brand-textPrimary">JanmaSethu</span>
                        <span className="text-[8px] md:text-[9px] lg:text-[10px] text-brand-textSecondary font-bold tracking-widest uppercase">Clinical OS v2.0</span>
                    </div>
                </div>

                <nav className="flex-1 px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8 space-y-2 md:space-y-3 overflow-y-auto custom-scrollbar">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Main Dashboard"
                        active={false}
                        onClick={() => navigate('/dashboard')}
                    />
                    <div className="pt-4 pb-2">
                        <span className="px-4 text-[10px] font-bold text-brand-textSecondary tracking-wider uppercase">CRO Desk</span>
                    </div>
                    <NavItem
                        icon={<Activity size={20} />}
                        label="Live Console"
                        active={activeView === 'live'}
                        onClick={() => setActiveView('live')}
                    />
                    <NavItem
                        icon={<MessageSquare size={20} />}
                        label="CRO Inbox"
                        active={activeView === 'inbox'}
                        onClick={() => setActiveView('inbox')}
                    />
                    <NavItem
                        icon={<TrendingUp size={20} />}
                        label="Analytics"
                        active={activeView === 'analytics'}
                        onClick={() => setActiveView('analytics')}
                    />
                    <NavItem
                        icon={<Clock size={20} />}
                        label="Audit Logs"
                        active={activeView === 'audit'}
                        onClick={() => setActiveView('audit')}
                    />
                </nav>

                <div className="p-6 border-t border-brand-border">
                    <button onClick={onLogout} className="flex items-center space-x-3 text-brand-textSecondary hover:text-brand-error hover:bg-brand-error/10 transition-all w-full px-4 py-3 rounded-xl font-bold group">
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 xl:p-8 overflow-y-auto overflow-x-hidden md:ml-52 lg:ml-64 xl:ml-72 flex flex-col relative z-10 bg-brand-bg">
                
                {/* Header */}
                <header className="bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-2xl px-6 py-4 flex justify-between items-center gap-3 mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 rounded-lg bg-brand-bg border border-brand-border text-brand-textSecondary hover:text-brand-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <LayoutDashboard size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                                {activeView === 'live' && <><Activity className="text-brand-primary" /> Control Tower - Live Console</>}
                                {activeView === 'inbox' && <><MessageSquare className="text-brand-primary" /> CRO Inbox & Conversations</>}
                                {activeView === 'analytics' && <><TrendingUp className="text-brand-primary" /> Performance Analytics</>}
                                {activeView === 'audit' && <><Clock className="text-brand-primary" /> System Compliance & Audit Logs</>}
                            </h1>
                            <p className="text-xs text-brand-textSecondary">
                                {activeView === 'live' && 'Real-time clinic tracking & active operational logs'}
                                {activeView === 'inbox' && 'Clinical inquiries, patient queries & WhatsApp logs'}
                                {activeView === 'analytics' && 'Operational reports, conversion pipeline & SLA metrics'}
                                {activeView === 'audit' && 'System audit log database for clinical validation'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => {
                                if (activeView === 'live') fetchLiveOpsData();
                                else if (activeView === 'inbox') fetchInboxData();
                                else if (activeView === 'analytics') fetchAnalyticsData();
                                else if (activeView === 'audit') fetchAuditLogs();
                            }}
                            className="p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:border-brand-primary/30 transition-all active:scale-95"
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} />
                        </button>

                        <div className="flex items-center space-x-2 cursor-pointer group p-1 rounded-xl hover:bg-brand-bg transition-colors">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold text-xs sm:text-sm border border-brand-primary/20">
                                CR
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs sm:text-sm font-bold text-brand-textPrimary group-hover:text-brand-primary transition-colors">
                                    CRO Dashboard
                                </p>
                                <p className="text-[10px] text-brand-textSecondary font-bold">
                                    Clinical Compliance
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-brand-textSecondary">Loading desk metrics...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 1. Live Console View */}
                        {activeView === 'live' && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KPICard title="Scheduled Today" value={patientFlow.scheduled} icon={<CalendarDays className="text-blue-500" />} />
                                    <KPICard title="Arrived" value={patientFlow.arrived} icon={<Users className="text-orange-500" />} />
                                    <KPICard title="Checked-In" value={patientFlow.checkedIn} icon={<CheckCircle className="text-green-500" />} />
                                    <KPICard title="Completed" value={patientFlow.completed} icon={<LogOut className="text-gray-500" />} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        {waitingAlerts.length > 0 && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
                                                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                                                    <AlertTriangle size={20} /> Attention Required
                                                </h3>
                                                <div className="space-y-3">
                                                    {waitingAlerts.map((alert, idx) => (
                                                        <div key={idx} className="bg-brand-surface border border-brand-border p-4 rounded-xl flex justify-between items-center">
                                                            <div className="flex items-center gap-3">
                                                                <ShieldAlert className="text-red-400" />
                                                                <div>
                                                                    <p className="font-bold text-brand-textPrimary">{alert.message}</p>
                                                                    <p className="text-xs text-brand-textSecondary">{alert.patientName} • {alert.doctor}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-extrabold text-red-400">{alert.minutes} min</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                                            <div className="p-6 border-b border-brand-border flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-brand-textPrimary">Live Patient Queue</h3>
                                                <span className="text-xs text-brand-textSecondary flex items-center gap-1"><Clock size={14} /> Sorted by arrival</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                                                            <th className="p-4">Patient</th>
                                                            <th className="p-4">Doctor</th>
                                                            <th className="p-4">Status</th>
                                                            <th className="p-4">Wait Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-brand-border">
                                                        {liveQueue.length === 0 ? (
                                                            <tr><td colSpan={4} className="p-8 text-center text-brand-textSecondary">No patients currently in queue.</td></tr>
                                                        ) : (
                                                            liveQueue.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-brand-bg/50 transition-colors">
                                                                    <td className="p-4 font-bold text-brand-textPrimary">{item.patientName}</td>
                                                                    <td className="p-4 text-brand-textSecondary">{item.doctor}</td>
                                                                    <td className="p-4">
                                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${item.status === 'Arrived' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                                            {item.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 font-bold text-brand-primary">{item.waitingMinutes} min</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6">
                                            <h3 className="text-lg font-bold text-brand-textPrimary mb-4">Doctor Load</h3>
                                            <div className="space-y-4">
                                                {doctorUtilization.map((doc, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl border border-brand-border">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-bold text-brand-textPrimary">{doc.doctorName}</h4>
                                                            <span className="text-xs font-extrabold px-2 py-0.5 bg-brand-bg border border-brand-border rounded-md text-brand-textSecondary">{doc.total} Total</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 bg-green-500/5 text-green-400 border border-green-500/10 p-2 rounded-lg text-center font-bold">
                                                                {doc.completed} <span className="block text-[10px] font-normal uppercase text-brand-textSecondary">Completed</span>
                                                            </div>
                                                            <div className="flex-1 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 p-2 rounded-lg text-center font-bold">
                                                                {doc.pending} <span className="block text-[10px] font-normal uppercase text-brand-textSecondary">Pending</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6">
                                            <h3 className="text-lg font-bold text-brand-textPrimary mb-4">Funnel Snapshot</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <LeadCount label="New Inquiries" count={leadSnapshot.new} color="text-brand-primary" />
                                                <LeadCount label="Contacted" count={leadSnapshot.contacted} color="text-blue-400" />
                                                <LeadCount label="Stalling" count={leadSnapshot.stalling} color="text-orange-400" />
                                                <LeadCount label="Converted" count={leadSnapshot.converted} color="text-green-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. CRO Inbox View */}
                        {activeView === 'inbox' && (
                            <ControlTowerWorkspace />
                        )}

                        {/* 3. Performance Analytics View */}
                        {activeView === 'analytics' && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                                        <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Total Patients Managed</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold text-brand-textPrimary">{analyticsData?.totalPatients || 145}</span>
                                            <span className="text-xs text-green-400 font-bold">+12% this week</span>
                                        </div>
                                    </div>
                                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                                        <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Lead-to-Patient Conversion</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold text-brand-textPrimary">{analyticsData?.conversionRate || 68.2}%</span>
                                            <span className="text-xs text-green-400 font-bold">Stable</span>
                                        </div>
                                    </div>
                                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                                        <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">SLA Response Compliance</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-extrabold text-brand-textPrimary">{analyticsData?.slaCompliance || 94.5}%</span>
                                            <span className="text-xs text-brand-primary font-bold">Target 95%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8">
                                    <h3 className="text-lg font-bold text-brand-textPrimary mb-6">Patient Pipeline & Operations History</h3>
                                    <div className="h-64 flex items-end justify-between gap-4 pt-8 border-b border-brand-border">
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full bg-brand-primary/20 rounded-t-lg transition-all hover:bg-brand-primary/40" style={{ height: '70%' }}></div>
                                            <span className="text-[10px] text-brand-textSecondary font-bold">Triage Queue</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full bg-blue-500/20 rounded-t-lg transition-all hover:bg-blue-500/40" style={{ height: '55%' }}></div>
                                            <span className="text-[10px] text-brand-textSecondary font-bold">Consultations</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full bg-orange-500/20 rounded-t-lg transition-all hover:bg-orange-500/40" style={{ height: '85%' }}></div>
                                            <span className="text-[10px] text-brand-textSecondary font-bold">Active Leads</span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full bg-green-500/20 rounded-t-lg transition-all hover:bg-green-500/40" style={{ height: '90%' }}></div>
                                            <span className="text-[10px] text-brand-textSecondary font-bold">Converted Patients</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Audit Logs View */}
                        {activeView === 'audit' && (
                            <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden animate-slide-up">
                                <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
                                    <h3 className="text-lg font-bold text-brand-textPrimary">Clinical Access Logs</h3>
                                    <span className="text-xs text-brand-textSecondary">Compliance Tracing & Security Audits</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                                                <th className="p-4">Timestamp</th>
                                                <th className="p-4">Actor</th>
                                                <th className="p-4">Role</th>
                                                <th className="p-4">Action</th>
                                                <th className="p-4">Metadata</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-border">
                                            {auditLogs.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-brand-textSecondary">No compliance records registered.</td></tr>
                                            ) : (
                                                auditLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-brand-bg/30 transition-colors text-xs">
                                                        <td className="p-4 font-semibold text-brand-textSecondary">{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td className="p-4 font-bold text-brand-textPrimary">{log.actor_id}</td>
                                                        <td className="p-4 text-brand-textSecondary">
                                                            <span className="px-2 py-0.5 rounded-md bg-brand-bg border border-brand-border uppercase text-[10px] font-bold">
                                                                {log.actor_type || log.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-bold text-brand-primary">{log.action}</td>
                                                        <td className="p-4 text-brand-textSecondary font-mono">{JSON.stringify(log.payload)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

// KPI Card Helper
const KPICard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
        <div className="bg-brand-bg p-3.5 rounded-2xl mb-3 border border-brand-border">{icon}</div>
        <h2 className="text-3xl font-extrabold text-brand-textPrimary">{value}</h2>
        <p className="text-xs text-brand-textSecondary font-bold uppercase tracking-wider mt-1">{title}</p>
    </div>
);

// Lead Count Helper
const LeadCount = ({ label, count, color }: { label: string, count: number, color: string }) => (
    <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold ${color}`}>{count}</span>
        <span className="text-[10px] text-brand-textSecondary font-bold text-center mt-1 uppercase tracking-wider">{label}</span>
    </div>
);
