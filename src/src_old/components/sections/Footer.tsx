import { Globe, ShieldCheck, Heart, ShieldAlert } from 'lucide-react';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-50/50 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 py-24 border-b border-slate-100">
          <div className="lg:col-span-4 max-w-sm">
            <div className="flex items-center gap-3 mb-10">
              <Logo />
            </div>
            <p className="text-muted-foreground text-sm font-medium leading-[1.8] mb-10">
              The clinical management platform for modern parenthood care. Empowering healthcare providers with automated workflows, triage routing, and unified operations.
            </p>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5" /> HIPAA Compliant
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" /> ISO 27001
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12 lg:pl-12">
            <div>
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-10">Platform OS</h4>
              <ul className="space-y-5">
                {['Operations Hub', 'Triage Workflows', 'SLA Analytics', 'Staff Routing'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-10">Resources</h4>
              <ul className="space-y-5">
                {['Compliance Docs', 'API Reference', 'Security Hub', 'Help Center'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] mb-10">Global Ops</h4>
              <div className="space-y-6">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-900 group">
                        <Globe className="w-4 h-4 text-sky-500" />
                        <span className="text-sm font-black underline decoration-slate-200 underline-offset-4 group-hover:decoration-sky-500 transition-all">USA HQ</span>
                    </div>
                    <span className="text-[12px] font-medium text-slate-400 ml-6">Delaware, USA</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-900 group">
                        <ShieldCheck className="w-4 h-4 text-sky-500" />
                        <span className="text-sm font-black underline decoration-slate-200 underline-offset-4 group-hover:decoration-sky-500 transition-all">Regional Hub</span>
                    </div>
                    <span className="text-[12px] font-medium text-slate-400 ml-6">Verified Clinical Node</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <p>© {new Date().getFullYear()} DFO CLINIC OS. PRODUCTION SYSTEM.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Internal Governance</a>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground bg-muted px-5 py-2.5 rounded border border-border mt-4 md:mt-0 shadow-none">
            Verified Medical Software <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
