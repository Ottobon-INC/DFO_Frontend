import React, { useEffect, useState, useRef } from 'react';

const MetricItem: React.FC<{ label: string; value: string; suffix: string; delay: number }> = ({ label, value, suffix, delay }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const endValue = parseInt(value.replace(/\D/g, ''));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 1500; 
    const increment = endValue / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, endValue]);

  return (
    <div 
      ref={ref}
      className={`flex flex-col items-center justify-center p-8 transform transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-5xl md:text-7xl font-extrabold text-white mb-2 tracking-tighter flex items-baseline">
        {count}<span className="text-brand-coral text-3xl md:text-5xl ml-1">{suffix}</span>
      </div>
      <div className="text-white/60 font-bold text-sm uppercase tracking-widest text-center">{label}</div>
    </div>
  );
};

export const MetricsSection: React.FC = () => {
  return (
    <section className="bg-brand-darkBg py-20 w-full relative overflow-hidden border-t border-brand-border">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(45deg, #FF6B6B 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="flex justify-center">
             <MetricItem label="Lead Conversion Lift" value="25" suffix="%" delay={0} />
          </div>
          <div className="flex justify-center">
             <MetricItem label="Follow-Up Rate" value="98" suffix="%" delay={200} />
          </div>
          <div className="flex justify-center">
             <MetricItem label="Patients Managed" value="340" suffix="+" delay={400} />
          </div>
        </div>
      </div>
    </section>
  );
};