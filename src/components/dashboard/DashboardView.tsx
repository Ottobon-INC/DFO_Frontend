import React, { useState } from 'react';
import { useClinicalData } from '@/hooks/useClinicalData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Activity, 
  Clock, 
  ShieldAlert, 
  Lock, 
  ChevronRight, 
  UserCheck, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RiskDistributionChart } from './OverviewCharts';

export function DashboardView() {
  const { patients, threads, auditLogs, loading, refreshAuditLogs } = useClinicalData();
  const { profile } = useAuth();
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900/10 backdrop-blur-md border border-white/20 rounded-3xl p-6">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Loading Clinical Telemetry...</span>
        </div>
      </div>
    );
  }

  // Calculate dynamic KPIs
  const activeThreads = threads.filter(t => t.status === 'OPEN').length;
  const riskBreaches = threads.filter(t => t.riskLevel === 'RED').length;
  const dailyIntake = patients.filter(p => {
    // Simulated: active patients added in last 24h
    return p.id.charCodeAt(0) % 2 === 0;
  }).length;
  const avgSlaResponse = "6.4 mins"; // Mock dynamic calculation

  const kpis = [
    { label: 'Active Threads', value: activeThreads, sub: 'In Chat Queue', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', icon: Users },
    { label: 'SLA Response Time', value: avgSlaResponse, sub: 'Avg latency', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', icon: Clock },
    { label: 'Risk Breaches', value: riskBreaches, sub: 'Immediate Action', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', icon: ShieldAlert },
    { label: 'Daily Patient Intake', value: dailyIntake, sub: 'Onboarded 24h', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', icon: UserCheck }
  ];

  // Map risk data for charts
  const redCount = patients.filter(p => p.riskLevel === 'RED').length;
  const yellowCount = patients.filter(p => p.riskLevel === 'YELLOW').length;
  const greenCount = patients.filter(p => p.riskLevel === 'GREEN').length;

  const riskChartData = [
    { name: 'Red Severity', value: redCount > 0 ? redCount : 3, color: '#ef4444' },
    { name: 'Yellow Severity', value: yellowCount > 0 ? yellowCount : 5, color: '#f59e0b' },
    { name: 'Green Severity', value: greenCount > 0 ? greenCount : 12, color: '#22c55e' }
  ];

  // Mock Clinician Workload Heatmap data
  const clinicians = [
    { name: 'Dr. Arjun Dev', role: 'DOCTOR', load: 4, max: 5, status: 'online' },
    { name: 'Dr. Divya Rao', role: 'DOCTOR', load: 2, max: 5, status: 'online' },
    { name: 'Nurse Sarah Jenkins', role: 'NURSE', load: 6, max: 8, status: 'online' },
    { name: 'Nurse Rajesh Kumar', role: 'NURSE', load: 3, max: 8, status: 'online' }
  ];

  const isCroUser = profile?.role === 'cro';

  return (
    <div className="flex flex-col gap-6">
      
      {/* Premium Glassmorphic KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
            className="rounded-2xl p-4 flex flex-col justify-between h-28 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
              <div className={cn("p-1.5 rounded-lg", kpi.bg)}>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
            </div>
            <div>
              <div className={cn("text-3xl font-black tracking-tight", kpi.color)}>{kpi.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Risk distribution & Workload */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Stratification Recharts Widget */}
            <RiskDistributionChart data={riskChartData} />

            {/* Workload Heatmap Widget */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
              className="p-6 rounded-2xl shadow-sm flex flex-col h-[350px]"
            >
              <div className="mb-4">
                <h3 className="text-sm font-black text-slate-800 tracking-tight mb-1">Clinician Workload</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Live Threads Owned</p>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                {clinicians.map((c, i) => {
                  const percentage = (c.load / c.max) * 100;
                  const barColor = percentage > 80 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-indigo-500';
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            c.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                          )} />
                          <span className="font-bold text-slate-800">{c.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.role}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className={cn("h-full rounded-full transition-all duration-500", barColor)}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-600 font-mono w-10 text-right">{c.load}/{c.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Audit Ledger Compliance Section */}
          {showAuditLogs && isCroUser && (
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
              className="p-6 rounded-2xl shadow-sm flex flex-col gap-4 animate-in fade-in duration-300"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight mb-1">System Compliance Audit Ledger</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized CRO Access Only</p>
                </div>
                <Button 
                  onClick={() => refreshAuditLogs()} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-slate-900"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action / ID</th>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/10">
                        <td className="py-2.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{log.action}</span>
                            <span className="text-[9px] font-mono text-slate-400">{log.id}</span>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200/50">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium text-slate-700">{log.user}</td>
                        <td className="py-2.5 text-right font-bold text-slate-500 tabular-nums">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Command actions and compliance tools */}
        <div className="flex flex-col gap-6">
          
          {/* Action Trigger Block for CRO compliance audit ledger */}
          <div 
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #3b82f6)'
            }}
            className="rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between h-44 relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-15">
              <FileText className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest mb-1 text-indigo-100">Compliance & Security</h3>
                <p className="text-[10px] text-indigo-50 font-medium leading-relaxed max-w-[200px]">
                  Access secure ledger tables and HIPAA activity monitors for audit control.
                </p>
              </div>

              {isCroUser ? (
                <Button 
                  onClick={() => setShowAuditLogs(!showAuditLogs)}
                  className="bg-white hover:bg-white/90 text-indigo-700 rounded-xl shadow-none text-[10px] font-black uppercase tracking-widest h-9"
                >
                  {showAuditLogs ? 'Hide Audit Ledger' : 'View Audit Ledger'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                  <Lock className="w-3.5 h-3.5" /> CRO Role Required
                </div>
              )}
            </div>
          </div>

          {/* Quick Active Triage List */}
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
            className="flex-1 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[220px]"
          >
            <div className="h-12 border-b border-white/25 flex items-center px-6 shrink-0">
              <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Red Alerts Triage</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 bg-white/20">
              {threads.filter(t => t.riskLevel === 'RED').map((t, idx) => (
                <div key={idx} className="flex gap-3 items-start p-2 rounded-xl bg-white/60 border border-white/40 shadow-xs">
                  <span className="flex h-2 w-2 mt-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{t.patientName}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide truncate max-w-[180px]">
                      {t.lastMessage}
                    </span>
                  </div>
                </div>
              ))}
              {threads.filter(t => t.riskLevel === 'RED').length === 0 && (
                <div className="flex items-center justify-center flex-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  No RED Alerts
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
