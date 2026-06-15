import React from 'react';
import { ArrowRight, Activity, Database, FileText, Heart } from 'lucide-react';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCtaClick }) => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-24 pb-12 bg-brand-bg">

      {/* Background: Soft Organic Shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-brand-soft/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-brand-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-[20%] w-[500px] h-[500px] bg-brand-warm/40 rounded-full blur-[80px] pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center text-center">

        {/* Trust Badge */}
        <div className="inline-block mb-8 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          <span className="text-brand-primary font-bold tracking-wider text-xs uppercase border border-brand-primary/10 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center">
            <Heart size={14} className="mr-2 text-brand-accent" fill="currentColor" />
            Advanced Fertility & Maternity Care OS
          </span>
        </div>

        {/* Main Title */}
        <h1 className="max-w-5xl mx-auto text-4xl md:text-6xl lg:text-7xl font-bold text-brand-textPrimary leading-[1.1] mb-8 tracking-tight animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          Bridging Life & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-secondary">Clinical Excellence.</span>
        </h1>

        {/* Subtitle */}
        <h3 className="text-lg md:text-xl text-brand-textSecondary max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
          JanmaSethu empowers hospitals with a unified platform for IVF workflows, maternity care, and pediatric records—ensuring every new beginning is safe and seamless.
        </h3>

        {/* CTA */}
        <button
          onClick={onCtaClick}
          className="mb-20 group relative px-10 py-5 bg-brand-primary text-white font-bold rounded-xl shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="relative z-10 flex items-center text-lg tracking-wide">
            Access Clinic Portal <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>

        {/* Dynamic SVG Visualization - Warm & Caring */}
        <div className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[500px] animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <svg className="w-full h-full" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#84C7C0" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#84C7C0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FF8B7B" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#FAD2D6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FAD2D6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Connecting Lines (Pipes) */}
            <path d="M400 250 L400 100" stroke="url(#flowGradient)" strokeWidth="3" strokeDasharray="8 8" className="animate-dash-flow" strokeLinecap="round" />
            <path d="M400 250 L150 380" stroke="url(#flowGradient)" strokeWidth="3" strokeDasharray="8 8" className="animate-dash-flow" strokeLinecap="round" />
            <path d="M400 250 L650 380" stroke="url(#flowGradient)" strokeWidth="3" strokeDasharray="8 8" className="animate-dash-flow" strokeLinecap="round" />

            {/* Moving Data Packets */}
            <circle r="6" fill="#FF8B7B" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" keyPoints="0;1" keyTimes="0;1" path="M400 250 L400 100">
                <mpath />
              </animateMotion>
            </circle>
            <circle r="4" fill="#84C7C0" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" begin="0.5s" keyPoints="1;0" keyTimes="0;1" path="M400 250 L400 100" />
            </circle>

            <circle r="6" fill="#FF8B7B" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" begin="1s" path="M400 250 L150 380" />
            </circle>
            <circle r="4" fill="#84C7C0" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" begin="1.5s" keyPoints="1;0" keyTimes="0;1" path="M400 250 L150 380" />
            </circle>

            <circle r="6" fill="#FF8B7B" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" begin="2s" path="M400 250 L650 380" />
            </circle>
            <circle r="4" fill="#84C7C0" opacity="0.9">
              <animateMotion repeatCount="indefinite" dur="4s" begin="2.5s" keyPoints="1;0" keyTimes="0;1" path="M400 250 L650 380" />
            </circle>

            {/* Center Node (Core) */}
            <g>
              <circle cx="400" cy="250" r="140" fill="url(#glow)" />
              <circle cx="400" cy="250" r="60" fill="white" stroke="#2D4F6C" strokeWidth="2" className="shadow-2xl" />
              <circle cx="400" cy="250" r="75" fill="none" stroke="#FF8B7B" strokeWidth="2" opacity="0.5">
                <animate attributeName="r" values="60;85;60" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <foreignObject x="370" y="220" width="60" height="60">
                <div className="flex items-center justify-center h-full w-full text-brand-primary">
                  <Heart size={32} fill="#FAD2D6" />
                </div>
              </foreignObject>
              <text x="400" y="340" textAnchor="middle" className="text-xs font-bold fill-brand-textSecondary uppercase tracking-widest">Patient Care Core</text>
            </g>

            {/* Top Node (EMR) */}
            <g className="hover:scale-105 transition-transform duration-300 origin-center cursor-pointer">
              <circle cx="400" cy="100" r="50" fill="white" stroke="#E2E8F0" strokeWidth="2" />
              <foreignObject x="375" y="75" width="50" height="50">
                <div className="flex items-center justify-center h-full w-full text-brand-secondary">
                  <FileText size={24} />
                </div>
              </foreignObject>
              <text x="400" y="35" textAnchor="middle" className="text-xs font-bold fill-brand-textSecondary bg-white/90 px-3 py-1 rounded shadow-sm">Maternity EMR</text>
            </g>

            {/* Left Node (Vitals) */}
            <g className="hover:scale-105 transition-transform duration-300 origin-center cursor-pointer">
              <circle cx="150" cy="380" r="50" fill="white" stroke="#E2E8F0" strokeWidth="2" />
              <foreignObject x="125" y="355" width="50" height="50">
                <div className="flex items-center justify-center h-full w-full text-brand-accent">
                  <Activity size={24} />
                </div>
              </foreignObject>
              <text x="150" y="455" textAnchor="middle" className="text-xs font-bold fill-brand-textSecondary bg-white/90 px-3 py-1 rounded shadow-sm">Fetal Monitoring</text>
            </g>

            {/* Right Node (Labs) */}
            <g className="hover:scale-105 transition-transform duration-300 origin-center cursor-pointer">
              <circle cx="650" cy="380" r="50" fill="white" stroke="#E2E8F0" strokeWidth="2" />
              <foreignObject x="625" y="355" width="50" height="50">
                <div className="flex items-center justify-center h-full w-full text-brand-secondary">
                  <Database size={24} />
                </div>
              </foreignObject>
              <text x="650" y="455" textAnchor="middle" className="text-xs font-bold fill-brand-textSecondary bg-white/90 px-3 py-1 rounded shadow-sm">Lab & Genetics</text>
            </g>

          </svg>
        </div>

      </div>
    </section>
  );
};