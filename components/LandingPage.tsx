import React from 'react';
import { HeroSection } from './landing/HeroSection';
import { OSLayers } from './landing/OSLayers';
import { TeamExperiencePanels } from './landing/TeamExperiencePanels';
import { ClinicalIntelligence } from './landing/ClinicalIntelligence';
import { AutomationFlow } from './landing/AutomationFlow';
import { FertilitySpecific } from './landing/FertilitySpecific';
import { WhyClinicsTrust } from './landing/WhyClinicsTrust';
import { FinalCTA } from './landing/FinalCTA';

interface LandingPageProps {
    onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-primary selection:text-brand-bg">
            {/* Navigation (Minimal) */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border h-20 flex items-center">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="text-2xl font-bold text-brand-textPrimary tracking-tight">JanmaSethu</div>
                    <button
                        onClick={onLoginClick}
                        className="px-6 py-2.5 bg-brand-primary text-brand-bg rounded-full font-bold text-sm hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Login
                    </button>
                </div>
            </nav>

            <main>
                <HeroSection onLoginClick={onLoginClick} />
                <OSLayers />
                <TeamExperiencePanels />
                <ClinicalIntelligence />
                <AutomationFlow />
                <FertilitySpecific />
                <WhyClinicsTrust />
                <FinalCTA onLoginClick={onLoginClick} />
            </main>

            <footer className="bg-brand-bg border-t border-brand-border py-12">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-brand-textSecondary text-sm font-medium">
                        JanmaSethu Clinical OS · <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a> · <a href="#" className="hover:text-brand-primary transition-colors">Terms of Use</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};
