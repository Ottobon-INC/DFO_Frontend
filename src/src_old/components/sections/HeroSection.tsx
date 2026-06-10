import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Activity, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function HeroSection({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 bg-white overflow-hidden border-b border-slate-200">
      
      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative z-10 w-full max-w-[1400px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Structured Content Block */}
          <div className="flex flex-col max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-widest mb-6 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Clinical Operations</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-slate-950 leading-[1.05] tracking-tight mb-6">
              Data-Driven <span className="text-sky-600">Patient Flow</span> Infrastructure.
            </h1>

            <p className="text-lg text-slate-600 mb-10 font-medium leading-relaxed">
              Replace fragmented tools with a robust, grid-aligned clinical dashboard. 
              Manage patient triage, track real-time SLA deadlines, and coordinate multidisciplinary teams from a unified interface built for speed and clarity.
            </p>

            <div className="flex items-center gap-4 border-t border-slate-100 pt-8">
              <Button
                size="lg"
                onClick={onEnterDashboard}
                className="h-12 px-6 sm:px-8 bg-sky-600 hover:bg-sky-700 text-white shadow-none rounded-md text-xs font-bold uppercase tracking-widest transition-colors group"
              >
                Launch Dashboard Workspace
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Real-time Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aura Intelligence</span>
                </div>
            </div>

          </div>

          {/* Right: Embedded Real UI Preview */}
          <div className="relative w-full h-[600px] border border-slate-200 bg-slate-50 rounded-lg overflow-hidden shadow-sm hidden lg:flex flex-col select-none pointer-events-none">
             {/* Mock Dashboard Topbar */}
             <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
                <Logo />
                <div className="flex gap-4 items-center">
                    <div className="h-8 rounded md bg-slate-100 border border-slate-200 px-3 flex items-center w-48 text-[10px] text-slate-400 font-bold">Search records...</div>
                    <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white text-[10px] font-bold">DR</div>
                </div>
             </div>
             {/* Mock Dashboard Body */}
             <div className="flex flex-1 overflow-hidden">
                {/* Mock Sidebar */}
                <div className="w-48 border-r border-slate-200 bg-white flex flex-col p-4 gap-2">
                    <div className="p-2 bg-sky-50 text-sky-700 rounded text-xs font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> Triage Queue</div>
                    <div className="p-2 text-slate-500 rounded text-xs font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Patient Registry</div>
                    <div className="p-2 text-slate-500 rounded text-xs font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Records</div>
                </div>
                {/* Mock Main Engine */}
                <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Wait Time</span>
                            <span className="text-2xl font-black text-slate-900 mt-2">14<span className="text-sm">m</span></span>
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Cases</span>
                            <span className="text-2xl font-black text-sky-600 mt-2">24</span>
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded p-4 flex flex-col justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SLA Breaches</span>
                            <span className="text-2xl font-black text-red-600 mt-2">0</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-white border border-slate-200 rounded flex flex-col">
                        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex bg-white justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Active Triage Feed</span>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            {[1,2,3].map((i) => (
                                <div key={i} className="p-3 border border-slate-100 rounded bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-white text-[10px] ${i === 1 ? 'bg-red-500' : i === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}>P{i}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 leading-tight">Patient Assessment {Math.floor(Math.random() * 1000)}</span>
                                            <span className="text-[10px] font-medium text-slate-500">ID: MRN-{10420 + i}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded px-3 py-1 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {i * 4} min ago
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
