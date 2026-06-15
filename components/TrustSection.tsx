import React, { useEffect, useRef, useState } from 'react';
import { Lock, FileCheck, Globe } from 'lucide-react';

const TrustItem: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-start p-6 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4 text-brand-accent bg-brand-accent/10 p-3 rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-brand-primary/30 pl-3">{description}</p>
    </div>
  );
};

export const TrustSection: React.FC = () => {
  return (
    <section className="bg-brand-primary py-20 w-full relative overflow-hidden border-t border-brand-border">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(45deg, #0284C7 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <TrustItem
            icon={<Lock size={28} />}
            title="HIPAA & GDPR Compliant"
            description="Enterprise-grade encryption and data governance protocols ensuring maximum patient privacy and regulatory compliance."
            delay={0}
          />
          <TrustItem
            icon={<FileCheck size={28} />}
            title="Standardized Clinical Protocols"
            description="Built-in adherence to international medical standards and guidelines for treatment planning and execution."
            delay={200}
          />
          <TrustItem
            icon={<Globe size={28} />}
            title="Interoperable Architecture"
            description="HL7 and FHIR ready architecture allowing seamless communication with existing hospital legacy systems."
            delay={400}
          />
        </div>
      </div>
    </section>
  );
};