import React from 'react';
import { useClinicalData } from '@/hooks/useClinicalData';
import { Users, Activity, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DashboardView() {
  const { patients, threads, loading } = useClinicalData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded">
        <div className="flex flex-col items-center gap-3">
            <Activity className="w-6 h-6 text-sky-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Clinical Telemetry...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Registry', value: patients.length, sub: 'Verified', color: 'text-slate-900', bg: 'bg-slate-50' },
    { label: 'High Risk (RED)', value: patients.filter(p => p.riskLevel === 'RED').length, sub: 'Action Req', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Open Triage', value: threads.filter(t => t.status === 'OPEN').length, sub: 'In Queue', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'System SLA', value: '99.9%', sub: 'Optimal', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Tight KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded p-3 flex flex-col justify-between h-24 relative overflow-hidden group">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{kpi.label}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${kpi.bg} ${kpi.color}`}>
                {kpi.sub}
              </span>
            </div>
            <div className={`text-3xl font-black tracking-tight z-10 ${kpi.color}`}>{kpi.value}</div>
            {/* Subtle structural accent */}
            <div className={`absolute bottom-0 left-0 h-1 w-full ${kpi.bg} opactiy-50`} />
          </div>
        ))}
      </div>

      {/* Main Structural Grid */}
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-[18rem])] lg:h-[calc(100vh-13rem)]">
        
        {/* Left: Patient Flow Data Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded flex flex-col overflow-hidden">
          <div className="h-12 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest">Live Patient Flow</h3>
            </div>
            <Button variant="outline" size="sm" className="h-7 rounded border-slate-200 text-[9px] font-black uppercase tracking-widest px-3">
              Filter Pipeline
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto bg-white p-0">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white sticky top-0 z-10 box-border">
                <tr>
                  <th className="px-4 py-2 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">MRN / Patient</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">Triage Path</th>
                  <th className="px-4 py-2 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900 leading-tight">{p.name || 'Anonymous'}</span>
                        <span className="text-[10px] font-medium text-slate-400 font-mono">ID-{p.id.substring(0,6)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">    
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {idx % 2 === 0 ? 'Cardiac Protocol' : 'Standard Intake'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.riskLevel === 'RED' && (
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          p.riskLevel === 'RED' ? "text-red-600" : "text-emerald-600"
                        )}>
                            {p.riskLevel === 'RED' ? 'Escalated' : 'Stable'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active cases</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Actions & Alerts */}
        <div className="flex flex-col gap-4">
            
            {/* Action Block */}
            <div className="bg-slate-900 rounded border border-slate-800 p-4 shrink-0 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-24 h-24 text-sky-500" />
                </div>
                <div className="relative z-10">
                    <h3 className="font-black text-xs text-white uppercase tracking-widest mb-1">Command Center</h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-4 max-w-[200px]">
                        Global system lock and emergency override available.
                    </p>
                    <Button size="sm" className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded shadow-none text-[10px] font-black uppercase tracking-widest h-8">
                        Initiate Override
                    </Button>
                </div>
            </div>

            {/* Activity Stream */}
            <div className="flex-1 bg-white border border-slate-200 rounded flex flex-col overflow-hidden">
                <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 shrink-0">
                    <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Live Activity</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 bg-slate-50/50">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex gap-3 items-start relative pb-4 last:pb-0">
                        {i !== 6 && <div className="absolute left-[3px] top-4 bottom-0 w-px bg-slate-200" />}
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-slate-50 ${i === 1 ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                        <div className="flex flex-col pt-0.5">
                            <span className="text-[11px] font-bold text-slate-900 leading-tight">
                                {i === 1 ? 'Critical Vitals Received' : 'EHR Sync Successful'}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {i === 1 ? 'Just now' : `${i * 12}m ago`}
                            </span>
                        </div>
                    </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
