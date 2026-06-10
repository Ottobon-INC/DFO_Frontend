import React from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { AboutSection } from '../components/sections/AboutSection';
import { DFOArchitecture } from '../components/sections/DFOArchitecture';
import { RoleBasedSystem } from '../components/sections/RoleBasedSystem';
import { CoreFeatures } from '../components/sections/CoreFeatures';
import { CTASection } from '../components/sections/CTASection';
import { Navbar } from '../components/sections/Navbar';
import { Footer } from '../components/sections/Footer';

export function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar onLogin={onLogin} />
      <main className="flex-grow w-full">
        <HeroSection onEnterDashboard={onLogin} />
        <div id="about" className="relative"><AboutSection /></div>
        <DFOArchitecture />
        <div id="roles" className="relative"><RoleBasedSystem /></div>
        <div id="features" className="relative"><CoreFeatures /></div>
        <CTASection onEnterDashboard={onLogin} />
      </main>
      <Footer />
    </div>
  );
}
