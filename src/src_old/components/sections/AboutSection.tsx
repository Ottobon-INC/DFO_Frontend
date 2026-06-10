import { Card } from './LandingCard';
import { HeartPulse, Shield, MessageCircle, ArrowRight, Server } from 'lucide-react';
import { motion } from 'motion/react';

export function AboutSection() {
  const features = [
    {
      title: "Intelligent Triage",
      desc: "Continuous support powered by smart routing algorithms that provide immediate, localized guidance and filter high-risk cases in real-time.",
      icon: MessageCircle,
      delay: 0.1
    },
    {
      title: "Verified Connections",
      desc: "More than just an AI. We bridge the critical gap between patients and medical professionals when urgency or empathy is required.",
      icon: HeartPulse,
      delay: 0.2
    },
    {
      title: "Language Agnostic",
      desc: "Care beyond barriers. Our platform interprets intent and emotion across diverse linguistic landscapes to ensure inclusivity.",
      icon: Shield,
      delay: 0.3
    }
  ];

  return (
    <section id="about" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start mb-20 md:mb-28">
          <div className="w-full lg:w-3/5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted border border-border text-foreground text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
              <Server className="w-3.5 h-3.5" />
              <span>Core Infrastructure</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-950 tracking-tighter leading-[0.95]">
              The Operations Base for <br /> <span className="text-primary">Clinical Facilities.</span>
            </h2>
          </div>
          <div className="w-full lg:w-2/5 lg:pt-16">
            <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed border-l-4 border-sky-500/20 pl-8 py-2">
              JanmaSethu is not just a portal—it's a clinical OS. We elevate healthcare providers with the tools to manage 10x the patient volume without sacrificing care quality.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group bg-card transition-all duration-300 py-12 px-10 border border-border rounded-md shadow-none hover:border-primary">
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-foreground mb-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-6 transition-colors tracking-tight">{f.title}</h3>
              <p className="text-[15px] text-muted-foreground mb-10 font-medium leading-[1.7] transition-colors">
                {f.desc}
              </p>
              <button className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-primary group-hover:text-primary/80 transition-all hover:gap-4">
                Learn Methodology <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
