import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export function CTASection({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  return (
    <section className="py-32 relative overflow-hidden bg-slate-950">
      {/* Background Enhancements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-border/20" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-md p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64 rotate-12" />
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded bg-card/10 border border-border/20 text-white text-xs font-bold uppercase tracking-wider mb-8"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Enterprise Platform</span>
              </motion.div>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.95]">
                Optimize Your <br /> <span className="text-primary">Clinical Workflows.</span>
              </h2>
              
              <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl font-medium leading-relaxed">
                Equip your hospital with the operational architecture and patient routing systems of the JanmaSethu Digital Front Office.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                <Button
                  size="lg"
                  onClick={onEnterDashboard}
                  className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-md text-xs font-bold uppercase tracking-wider transition-colors group"
                >
                  Request Platform Access
                  <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center gap-8 py-4 sm:py-0 sm:ml-6 border-t sm:border-t-0 sm:border-l border-white/10 px-6">
                    <div className="flex flex-col items-start">
                        <span className="text-white font-black text-xl leading-none">2.4k+</span>
                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Live Clinicians</span>
                    </div>
                    <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-white font-black text-[10px] uppercase tracking-widest">Global Ops</span>
                        </div>
                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1 italic">Verified 256-bit AES</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-12 text-slate-500 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             {/* Simple visual placeholders for partner logos */}
             <div className="flex items-center gap-2 font-black italic tracking-tighter text-xl"><Globe className="w-6 h-6" /> GLOBAL_HEALTH</div>
             <div className="flex items-center gap-2 font-black italic tracking-tighter text-xl"><ShieldCheck className="w-64 h-64 hidden" /> TRUST_MED</div>
             <div className="flex items-center gap-2 font-black italic tracking-tighter text-xl uppercase">ISO_27001</div>
          </div>
        </div>
      </div>
    </section>
  );
}
