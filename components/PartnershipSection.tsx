import React, { useEffect, useRef, useState } from 'react';

export const PartnershipSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
     const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 bg-brand-bg overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          
          {/* Text Content */}
          <div className={`w-full md:w-1/2 mb-12 md:mb-0 md:pr-16 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-slate mb-6">
              Medcy IVF: Our Commitment to <span className="text-brand-teal">Families.</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              We believe every journey to parenthood deserves world-class science and empathetic support. By partnering with JanmaSethu, we have integrated the latest in AI-driven patient management to ensure no query goes unanswered and every treatment plan is tracked with precision.
            </p>
            <div className="flex items-center space-x-4">
              <div className="h-1 w-12 bg-brand-teal rounded-full"></div>
              <p className="text-sm font-semibold text-brand-slate italic">"Excellence in every embryo, empathy in every step."</p>
            </div>
          </div>

          {/* Visuals */}
          <div className={`w-full md:w-1/2 transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
              <div className="absolute inset-0 bg-brand-teal/20 group-hover:bg-brand-teal/10 transition-colors duration-500 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000" 
                alt="Clinic Interior" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
                <p className="text-xs font-bold text-brand-slate">State of the Art Laboratory</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};