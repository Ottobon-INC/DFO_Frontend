import React, { useState } from 'react';
import {
  ClipboardList, HeartPulse, Users,
  TrendingUp, Calendar, Shield, Baby, Stethoscope, Dna
} from 'lucide-react';

const RoleFeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex items-start p-6 bg-white rounded-xl border border-brand-primary/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-secondary to-brand-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    <div className="flex-shrink-0 w-12 h-12 bg-brand-soft/30 rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-secondary group-hover:text-white transition-colors">
      {icon}
    </div>
    <div className="ml-4">
      <h4 className="text-lg font-bold text-brand-textPrimary mb-2">{title}</h4>
      <p className="text-sm text-brand-textSecondary leading-relaxed">{description}</p>
    </div>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'clinical' | 'staff'>('clinical');

  return (
    <section className="py-24 bg-brand-bg relative z-20">
      <div className="container mx-auto px-6">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-textPrimary mb-4">
            Specialized Care Modules
          </h2>
          <p className="text-brand-textSecondary text-lg">
            Designed for the unique workflows of Fertility Clinics, Maternity Wards, and Pediatric Centers.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-brand-surface p-1.5 rounded-xl border border-brand-border">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'admin'
                ? 'bg-white text-brand-primary shadow-sm ring-1 ring-black/5'
                : 'text-brand-textSecondary hover:text-brand-primary'
                }`}
            >
              Administration
            </button>
            <button
              onClick={() => setActiveTab('clinical')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'clinical'
                ? 'bg-white text-brand-primary shadow-sm ring-1 ring-black/5'
                : 'text-brand-textSecondary hover:text-brand-primary'
                }`}
            >
              Clinical Teams
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'staff'
                ? 'bg-white text-brand-primary shadow-sm ring-1 ring-black/5'
                : 'text-brand-textSecondary hover:text-brand-primary'
                }`}
            >
              Patient Services
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">

          {activeTab === 'admin' && (
            <>
              <RoleFeatureCard
                icon={<TrendingUp size={24} />}
                title="Growth Analytics"
                description="Track IVF success rates, patient acquisition costs, and revenue per cycle with precision dashboards."
              />
              <RoleFeatureCard
                icon={<Users size={24} />}
                title="Patient Pipeline"
                description="Manage the journey from initial inquiry to successful delivery with our integrated CRM."
              />
              <RoleFeatureCard
                icon={<Shield size={24} />}
                title="Compliance Core"
                description="Built-in adherence to medical data standards ensuring patient privacy and institutional security."
              />
            </>
          )}

          {activeTab === 'clinical' && (
            <>
              <RoleFeatureCard
                icon={<Dna size={24} />}
                title="Embryology Lab"
                description=" specialized modules for tracking gametes, embryos, and cryopreservation data."
              />
              <RoleFeatureCard
                icon={<Baby size={24} />}
                title="Maternity EMR"
                description="Timeline-based records for antenatal care, delivery notes, and postnatal follow-ups."
              />
              <RoleFeatureCard
                icon={<Stethoscope size={24} />}
                title="Smart Diagnostics"
                description="AI-assisted interpretation of ultrasound scans and hormonal profiles."
              />
            </>
          )}

          {activeTab === 'staff' && (
            <>
              <RoleFeatureCard
                icon={<Calendar size={24} />}
                title="Cycle Scheduling"
                description="Complex appointment management for time-sensitive IVF procedures and scans."
              />
              <RoleFeatureCard
                icon={<ClipboardList size={24} />}
                title="Digital Onboarding"
                description="Paperless registration with consent forms and medical history collection."
              />
              <RoleFeatureCard
                icon={<HeartPulse size={24} />}
                title="Care Coordination"
                description="Seamless communication between front desk, nurses, and doctors to reduce wait times."
              />
            </>
          )}

        </div>
      </div>
    </section>
  );
};