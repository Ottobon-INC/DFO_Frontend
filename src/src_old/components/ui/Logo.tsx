import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Concept: A stark, interlocking square geometric representing 'Systems' intersecting 'Healthcare Data'. Solid lines, no gradients, max 2 colors. */}
      <svg 
        width="28" 
        height="28" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Right Structural Block - Represents System/Infrastructure */}
        <rect x="14" y="4" width="14" height="24" fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="square"/>
        {/* Left Data Block - Represents Clinical Information passing through */}
        <path d="M4 10H20V22H4V10Z" fill="white" stroke="#0F172A" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"/>
        <path d="M8 16H16" stroke="#0F172A" strokeWidth="3" strokeLinecap="square"/>
      </svg>
      <div className="flex flex-col">
        <span className="font-black text-slate-950 leading-none tracking-tight text-lg">DFO</span>
        <span className="font-bold text-sky-600 leading-none tracking-[0.2em] text-[8px] uppercase">OS</span>
      </div>
    </div>
  );
};
