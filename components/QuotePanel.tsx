import React from 'react';

export const QuotePanel: React.FC = () => {
  return (
    <div className="hidden md:flex md:w-1/2 bg-brand-teal relative overflow-hidden items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/1200/1600?grayscale&blur=2" 
          alt="Hopeful Horizon" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/90 to-brand-slate/80 mix-blend-multiply" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-12 text-white max-w-lg text-center flex flex-col items-center justify-center h-full">
        <div className="mb-8">
           {/* Abstract Logo Placeholder */}
           <div className="w-16 h-16 border-4 border-white/30 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 bg-white/80 rounded-full animate-pulse" />
           </div>
        </div>
        
        <blockquote className="font-serif text-3xl md:text-4xl leading-snug italic font-light tracking-wide text-white/95 mb-8">
          "A bridge of love, science, and support for the journey."
        </blockquote>
        
        <div className="mt-auto absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-white/20 pt-6">
           <span className="text-xs uppercase tracking-widest text-white/60">JanmaSethu CRM v2.0</span>
           <span className="text-xs text-white/60">© 2024</span>
        </div>
      </div>
    </div>
  );
};