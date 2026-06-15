import React, { useEffect, useRef, useState } from 'react';

const ShowcaseItem: React.FC<{ image: string; title: string; subtitle: string; delay: number }> = ({ image, title, subtitle, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`relative group overflow-hidden rounded-2xl shadow-lg aspect-[4/3] transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300"></div>
      <div className="absolute bottom-0 left-0 p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-gray-300">{subtitle}</p>
      </div>
    </div>
  );
};

export const VisualShowcase: React.FC = () => {
  return (
    <section className="py-20 bg-white border-t border-brand-border">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-brand-textPrimary mb-4">Integrated Care Environments</h2>
          <p className="text-brand-textSecondary max-w-2xl mx-auto">Bridging the gap between digital management and physical patient care across all hospital departments.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ShowcaseItem 
            image="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=800"
            title="Advanced Diagnostics"
            subtitle="Seamless integration with pathology and imaging labs."
            delay={0}
          />
          <ShowcaseItem 
            image="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"
            title="In-Patient Care"
            subtitle="Real-time monitoring for surgical and recovery wards."
            delay={200}
          />
          <ShowcaseItem 
            image="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800"
            title="Consultation Suites"
            subtitle="Distraction-free EMR access for deeper patient connection."
            delay={400}
          />
        </div>
      </div>
    </section>
  );
};