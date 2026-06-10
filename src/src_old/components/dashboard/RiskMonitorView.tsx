import React from "react";
import {
    AlertTriangle,
    Settings,
    ShieldCheck,
    Zap,
    Phone,
    MessageSquare,
    ArrowRight,
    Clock,
    UserPlus,
    Activity,
    FileText,
    Bell,
    CheckCircle2
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thread, Patient, Lead, Appointment, Role } from "@/types";
import { cn } from "@/lib/utils";

interface RiskMonitorProps {
    patients: Patient[];
    leads?: Lead[];
    appointments?: Appointment[];
    threads?: Thread[];
    role?: Role;
}

export const RiskMonitorView = ({ patients, leads = [], appointments = [], threads = [], role = 'DOCTOR' }: RiskMonitorProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isPrintingPoster, setIsPrintingPoster] = React.useState(false);

    const handleDownloadDutyPoster = () => {
        setIsPrintingPoster(true);
        setTimeout(() => {
            window.print();
            setIsPrintingPoster(false);
        }, 500);
    };

    // CRO Operational Dashboard
    if (role === 'CRO') {
        const activeLeads = leads.filter(l => l.status !== 'CONVERTED');
        const openThreads = threads.filter(t => t.status === 'OPEN');
        const breachedSLAs = openThreads.filter(t => {
            const diffMin = (Date.now() - new Date(t.slaDeadline || t.lastMessageTime).getTime()) / 60000;
            return diffMin > 15; // > 15 minutes old unresponded
        });
        const impendingAppointments = appointments.filter(a => {
            const timeDiff = new Date(a.startTime).getTime() - Date.now();
            return timeDiff > 0 && timeDiff < 3600000; // within next 1 hour
        });

        return (
            <div className="p-4 md:p-10 space-y-6 md:space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Escalation Board</h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Real-time alerts for service level agreements</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className="bg-amber-500/10 text-amber-500 border-none px-3 py-1.5 md:px-4 md:py-2 rounded-md text-[10px] tracking-widest gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-pulse" />
                            {breachedSLAs.length} Breaches
                        </Badge>
                        <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded border-border">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 rounded-md bg-primary text-primary-foreground shadow-none">
                                <Clock className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-black text-foreground">Overdue Responses Queue</h3>
                        </div>

                        <div className="grid gap-4">
                            {breachedSLAs.map((t) => (
                                <Card key={t.id} className="border-none shadow-none rounded-md bg-card overflow-hidden group hover:scale-[1.01] transition-all ring-1 ring-border">

                                    <CardContent className="p-0 flex flex-row items-stretch">
                                        <div className="w-1.5 md:w-2 bg-amber-500" />
                                        <div className="p-5 md:p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="h-12 w-12 md:h-16 md:w-16 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg border border-amber-500/20 shadow-inner shrink-0">
                                                    {t.patientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h4 className="text-lg md:text-xl font-black text-foreground leading-none">{t.patientName}</h4>
                                                        <Badge className="bg-primary text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest px-1.5">Action</Badge>
                                                    </div>
                                                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-tighter tabular-nums mb-2 md:mb-3">Pending: {new Date(t.slaDeadline).toLocaleTimeString()}</p>
                                                    <Badge variant="outline" className="rounded bg-amber-500/10 text-amber-500 border-none font-bold text-[8px] md:text-[9px] uppercase px-2 py-0.5 italic">SLA Alert</Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button className="w-full md:w-auto h-10 md:h-12 md:px-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] md:text-xs tracking-widest shadow-none">Resolve</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                             {breachedSLAs.length === 0 && (
                                <div className="p-8 bg-muted/50 rounded-[2.5rem] text-center border border-border">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No currently breached communication SLAs.</p>
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="space-y-8">
                        <Card className="border-none shadow-none rounded-md bg-card p-6 md:p-8 ring-1 ring-border">
                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <h4 className="font-black text-foreground uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-sky-500" /> Clinic Metrics
                                </h4>
                                <Badge className="bg-sky-500/10 text-sky-500 border-none font-black uppercase text-[8px] md:text-[9px]">Live</Badge>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <div className="p-4 md:p-6 rounded bg-muted border border-border">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 md:mb-2 font-mono">Active Queries</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl md:text-2xl font-black text-foreground">{openThreads.length}</span>
                                        <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 rounded bg-muted border border-border">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 md:mb-2 font-mono">At-Risk Leads</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl md:text-2xl font-black text-foreground">{activeLeads.length}</span>
                                        <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 rounded bg-muted border border-border">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 md:mb-2 font-mono">Arrivals Next Hr</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl md:text-2xl font-black text-foreground">{impendingAppointments.length}</span>
                                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                            </div>

                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Doctor/Nurse Clinical Dashboard
    const highRisk = patients.filter(p => p.riskLevel === 'RED');
    // For REAL stats instead of mock percentages:
    // Determine confidence by whether vitals were logged today
    const vitalsToday = patients.filter(p => p.lastVisit && p.lastVisit.startsWith(new Date().toISOString().split('T')[0])).length;
    const sysIntegrity = patients.length > 0 ? Math.round((vitalsToday / patients.length) * 100) : 100;

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Risk Monitor</h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Real-time physiological risk analysis</p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge className="bg-red-500/10 text-red-500 border-none px-3 py-1.5 md:px-4 md:py-2 rounded-md text-[10px] tracking-widest gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-ping" />
                        {highRisk.length} High Risk
                    </Badge>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn("h-9 w-9 md:h-10 md:w-10 rounded border-border transition-all", isSettingsOpen && "bg-primary text-primary-foreground border-primary")}
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>

            </div>

            {isSettingsOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    <Card className="p-4 rounded-md bg-sky-50 border-sky-100 ring-1 ring-sky-200">
                        <p className="text-[10px] font-black uppercase text-sky-600 mb-1">Alert Threshold</p>
                        <h4 className="text-sm font-bold text-sky-900">BP: 140/90 mmHg</h4>
                    </Card>
                    <Card className="p-4 rounded-md bg-amber-50 border-amber-100 ring-1 ring-amber-200">
                        <p className="text-[10px] font-black uppercase text-amber-600 mb-1">SLA Deadline</p>
                        <h4 className="text-sm font-bold text-amber-900">15 Minutes</h4>
                    </Card>
                    <Card className="p-4 rounded-md bg-indigo-50 border-indigo-100 ring-1 ring-indigo-200">
                        <p className="text-[10px] font-black uppercase text-indigo-600 mb-1">Sync Frequency</p>
                        <h4 className="text-sm font-bold text-indigo-900">Real-time</h4>
                    </Card>
                    <Card className="p-4 rounded-md bg-slate-50 border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Notifications</p>
                            <h4 className="text-sm font-bold text-slate-900">Enabled</h4>
                        </div>
                        <Badge className="bg-emerald-500 text-white border-none">Active</Badge>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 rounded-md bg-primary text-primary-foreground shadow-none">
                            <Zap className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">Priority Triage Queue</h3>
                    </div>

                    <div className="grid gap-4">
                        {highRisk.map((p) => (
                            <Card key={p.id} className="border-none shadow-none rounded-md bg-card overflow-hidden group hover:scale-[1.01] transition-all ring-1 ring-border">

                                <CardContent className="p-0 flex flex-row items-stretch">
                                    <div className="w-1.5 md:w-2 bg-red-500" />
                                    <div className="p-5 md:p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="h-12 w-12 md:h-16 md:w-16 rounded bg-red-500/10 text-red-500 flex items-center justify-center font-black text-lg border border-red-500/20 shadow-inner shrink-0">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h4 className="text-lg md:text-xl font-black text-foreground leading-none">{p.name}</h4>
                                                    <Badge className="bg-primary text-primary-foreground border-none font-black text-[8px] uppercase tracking-widest px-1.5">E-Case</Badge>
                                                </div>

                                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-tighter tabular-nums mb-2 md:mb-3">{p.phone} • Triage Required</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline" className="rounded bg-muted text-muted-foreground border-border font-bold text-[8px] md:text-[9px] uppercase px-1.5 py-0.5">BP: {p.vitals?.bp || '?'}</Badge>
                                                    <Badge variant="outline" className="rounded bg-red-500/10 text-red-500 border-none font-bold text-[8px] md:text-[9px] uppercase px-1.5 py-0.5 italic">Flag</Badge>
                                                </div>

                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2 md:gap-3">
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-md border-border hover:bg-muted transition-colors">
                                                    <Phone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                                </Button>
                                                <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-md border-border hover:bg-muted transition-colors">
                                                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                                </Button>
                                            </div>

                                            <Button className="flex-1 md:flex-none h-10 md:h-12 md:px-8 rounded-md bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] md:text-xs tracking-widest shadow-none">Critical Response</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {highRisk.length === 0 && (
                            <div className="p-8 bg-muted/50 rounded-[2.5rem] text-center border border-border">
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No RED risk patients currently tracked in the database.</p>
                            </div>
                        )}

                    </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                    <Card className="border-none shadow-none rounded-md bg-card p-6 md:p-8 ring-1 ring-border">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h4 className="font-black text-foreground uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Triage Metrics
                            </h4>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black uppercase text-[8px] md:text-[9px]">Live</Badge>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <div className="p-4 md:p-6 rounded bg-muted border border-border">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 md:mb-2 font-mono">Monitored Pool</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl md:text-2xl font-black text-foreground">{patients.length}</span>
                                    <div className="flex gap-0.5 md:gap-1">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("w-1 md:w-1.5 h-4 md:h-6 rounded-full", i < 5 ? "bg-emerald-500" : "bg-muted")} />)}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 md:p-6 rounded bg-muted border border-border">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 md:mb-2 font-mono">Critical Backlog</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl md:text-2xl font-black text-foreground">{highRisk.length}</span>
                                    <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Alerts</p>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handleDownloadDutyPoster}
                            className="w-full mt-6 md:mt-8 h-10 md:h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-none gap-2"
                        >
                            <FileText className="h-4 h-4" /> Download Duty Poster
                        </Button>

                    </Card>

                    <div className="p-6 md:p-8 rounded-md bg-indigo-600 text-white relative overflow-hidden group cursor-pointer shadow-none transition-transform active:scale-[0.98]">
                        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 transition-transform">
                            <AlertTriangle className="h-16 w-16 md:h-24 md:w-24" />
                        </div>
                        <h4 className="text-lg md:text-xl font-black relative z-10">Protocol</h4>
                        <p className="text-[10px] md:text-xs font-bold opacity-70 mt-2 md:mt-3 relative z-10 max-w-[180px] leading-relaxed uppercase tracking-widest mb-4 md:mb-6">Emergency alerts for doctors are active.</p>
                        <div className="relative z-10 flex items-center gap-2 font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] group-hover:gap-4 transition-all">
                            Manage Settings <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Duty Roster Print Template */}
            {isPrintingPoster && (
                <div 
                    className="fixed inset-0 z-[9999] bg-white p-16 overflow-visible print:block hidden font-sans"
                    id="duty-roster-print"
                >
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic">DFO CLINIC</h1>
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Clinical OS • Duty Roster</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black uppercase tracking-widest">Effective Date</p>
                            <p className="text-xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-widest bg-slate-100 p-2 inline-block">Morning Shift (08:00 - 14:00)</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Lead Clinician</span>
                                    <span>Dr. Alexander Smith</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Nursing Lead</span>
                                    <span>Sarah Jenkins, RN</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Administrative Lead</span>
                                    <span>Priya Sharma</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-black uppercase tracking-widest bg-slate-100 p-2 inline-block">Evening Shift (14:00 - 20:00)</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Lead Clinician</span>
                                    <span>Dr. Michael Ross</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Nursing Lead</span>
                                    <span>James Wilson, RN</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="font-bold">Administrative Lead</span>
                                    <span>Karthik Raj</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 p-8 rounded-md border-2 border-red-100 mb-12">
                        <h3 className="text-lg font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                            <Bell className="h-5 w-5" /> Emergency Protocols
                        </h3>
                        <p className="text-sm font-medium text-red-900 leading-relaxed">
                            In the event of a RED risk level breach, the lead clinician on shift must be paged immediately via the secondary radio channel. All triage responses must be logged in the Clinical OS within 90 seconds of detection.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-center p-4 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pooled</p>
                            <p className="text-2xl font-black">{patients.length}</p>
                        </div>
                        <div className="text-center p-4 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">High Risk Pool</p>
                            <p className="text-2xl font-black">{patients.filter(p => p.riskLevel === 'RED').length}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-900 text-white rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                            <p className="text-xl font-black">OPERATIONAL</p>
                        </div>
                    </div>

                    <div className="absolute bottom-16 left-16 right-16 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                        <span>DFO Clinical OS • Internal Document</span>
                        <span>Generated: {new Date().toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
