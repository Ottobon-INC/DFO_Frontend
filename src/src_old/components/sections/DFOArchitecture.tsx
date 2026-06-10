import { motion } from 'motion/react';
import { User, MessageSquareText, ShieldAlert, GitMerge, FileText, ClipboardList, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const FlowNode = ({ icon: Icon, title, description, isActive = false, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "flex flex-col items-center text-center p-6 md:p-8 rounded-md relative z-10 w-full transition-all group",
      isActive ? "bg-card shadow-none border border-primary/50" : "bg-card border border-border"
    )}
  >
    <div className={cn(
      "w-14 h-14 md:w-16 md:h-16 rounded flex items-center justify-center mb-6 transition-transform group-hover:scale-105",
      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    )}>
      <Icon className="w-7 h-7 md:w-8 md:h-8" />
    </div>
    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-3">{title}</h4>
    <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-[140px]">{description}</p>
    
    {isActive && (
       <div className="absolute top-2 right-2 w-3 h-3 bg-sky-500 rounded-full border-2 border-white animate-pulse" />
    )}
  </motion.div>
);

export function DFOArchitecture() {
  return (
    <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24">
          <div className="max-w-2xl">
            <motion.p 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               className="text-xs font-bold uppercase tracking-wider text-primary mb-4"
             >
               Architecture & Flow
             </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter leading-tight">
              Closed-Loop <br className="hidden sm:block" /> <span className="text-muted-foreground">Clinical Governance.</span>
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium max-w-sm pb-1 leading-relaxed">
            Every interaction is logged, stratified by risk, and routed through a hardened medical triaging system.
          </p>
        </div>

        <div className="w-full max-w-7xl mx-auto py-10 relative">
          {/* Connecting Line - Optimized for different screens */}
          <div className="hidden lg:block absolute top-[102px] left-[5%] right-[5%] h-[2px] bg-slate-200 z-0">
             <motion.div 
               initial={{ width: 0 }}
               whileInView={{ width: '100%' }}
               transition={{ duration: 1.5, ease: "easeInOut" }}
               className="h-full bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]" 
             />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8 lg:gap-4 relative z-10">
            <FlowNode 
              icon={User} 
              title="Patient" 
              description="Sends Query via WhatsApp/App" 
              delay={0.1}
            />
            <FlowNode 
              icon={MessageSquareText} 
              title="Assistant" 
              description="Front-line Contextual Support" 
              isActive={true}
              delay={0.2}
            />
            <FlowNode 
              icon={ShieldAlert} 
              title="Risk Engine" 
              description="Patient Risk Analysis" 
              delay={0.3}
            />
            <FlowNode 
              icon={GitMerge} 
              title="Triage Hub" 
              description="Automated Role Routing" 
              isActive={true}
              delay={0.4}
            />
            <FlowNode 
              icon={FileText} 
              title="Clinical Review" 
              description="Review & Add Notes" 
              delay={0.5}
            />
            <FlowNode 
              icon={ClipboardList} 
              title="Continuity" 
              description="Scheduled Follow-ups" 
              delay={0.6}
            />
          </div>
        </div>

        <div className="mt-16 md:mt-24 text-center">
           <button className="inline-flex items-center gap-4 px-10 py-5 bg-card border border-border rounded text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted transition-all shadow-none group hover:border-primary">
              Explore Connectivity Protocol
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-primary" />
           </button>
        </div>
      </div>
    </section>
  );
}
