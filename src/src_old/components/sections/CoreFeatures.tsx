import { Network, Activity, Clock, Users, Shield, Calendar, Edit3, FileText, History, Bell, BarChart3, ChevronRight, MoveRight } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  { icon: Network, title: "Operations Hub", desc: "Centralized monitoring layer that tracks workflows, detects risks, and enforces clinic rules." },
  { icon: Activity, title: "Risk Engine", desc: "Monitors patient history and immediate keywords to automatically assign clinical risk levels." },
  { icon: Clock, title: "SLA Monitoring", desc: "Tracks response times for critical cases and escalates automatically if untouched." },
  { icon: Users, title: "Thread Assignment", desc: "Smart routing of cases manually by CRO or automatically based on workload and role." },
  { icon: Shield, title: "Human Takeover", desc: "Locks the thread when a doctor takes control, instantly disabling AI responses to avoid conflicts." },
  { icon: Calendar, title: "Appointment Lifecycle", desc: "End-to-end handling of bookings, rescheduling, and automated missed-consultation detection." },
  { icon: Edit3, title: "Review Workflow", desc: "Dedicated interface for staff to start, manage, and close patient interactions with structured notes." },
  { icon: FileText, title: "Prescription Engine", desc: "Generates and stores structured prescriptions with medicine, dosage, and duration tracking." },
  { icon: History, title: "Deep Patient History", desc: "Unified timeline of all past interactions, consultations, prescriptions, and reports." },
  { icon: Bell, title: "Notification System", desc: "Automated alerts sent via WhatsApp & dashboard to keep patients and doctors synchronized." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights into system health, response times, and clinical load distribution." },
];

export function CoreFeatures() {
  return (
    <section id="features" className="py-24 md:py-32 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-16 md:mb-24">
           <motion.p 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               className="text-xs font-bold uppercase tracking-wider text-primary mb-4"
             >
               Full Capability Suite
             </motion.p>
           <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-6 leading-tight">
             The Foundation of <br className="hidden sm:block" /> <span className="text-muted-foreground">Modern Clinical Ops.</span>
           </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border overflow-hidden rounded shadow-none">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white p-8 md:p-10 group hover:bg-slate-50 transition-colors cursor-default"
            >
              <div className="w-14 h-14 rounded bg-muted text-muted-foreground flex items-center justify-center mb-8 shadow-none group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-[11px] md:text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
                {feature.title}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                {feature.desc}
              </p>
            </motion.div>
          ))}
          
          <div className="bg-foreground p-8 md:p-10 flex flex-col justify-between group cursor-pointer overflow-hidden relative min-h-[250px]">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Network className="w-48 h-48 text-background" />
             </div>
             <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-black text-background leading-tight mb-4 tracking-tight">Custom <br /> Deployment?</h3>
                <p className="text-background/70 text-xs md:text-sm font-medium leading-relaxed max-w-[180px]">
                   Partner with our clinical engineering team for bespoke protocols.
                </p>
             </div>
             <button className="relative z-10 mt-8 text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                Contact Ops <MoveRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </section>
  );
}
