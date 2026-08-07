import React, { useState, useEffect } from 'react';
import { HeroSection } from './landing/HeroSection';
import { BuiltForEveryRole } from './landing/BuiltForEveryRole';
import { CoreFunctionalModules } from './landing/CoreFunctionalModules';
import { SecuritySection } from './landing/SecuritySection';
import { FertilitySpecific } from './landing/FertilitySpecific';

import { FinalCTA } from './landing/FinalCTA';

interface LandingPageProps {
    onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-mint-50 font-sans selection:bg-mint-200 selection:text-mint-900">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300 ${
                isScrolled ? 'bg-mint-50/90 backdrop-blur-md border-b border-mint-200/50' : 'bg-transparent border-b border-transparent pt-6'
            }`}>
                <div className="container mx-auto flex justify-between items-center max-w-7xl">
                    
                    {/* Logo */}
                    <div className="text-xl font-medium text-mint-900 tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-mint-900 rounded-full flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.93 11.64 3.96-2.53"/><path d="m11.64 9.93-2.53 3.96"/><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
                        </div>
                        Digital OP Desk
                    </div>
                    
                    {/* Center Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#roles" className="text-[13px] font-medium text-mint-900/80 hover:text-mint-900 transition-colors">Who It's For</a>
                        <a href="#modules" className="text-[13px] font-medium text-mint-900/80 hover:text-mint-900 transition-colors">Core Features</a>
                        <a href="#security" className="text-[13px] font-medium text-mint-900/80 hover:text-mint-900 transition-colors">Data Security</a>
                    </div>

                    {/* Right Button */}
                    <button
                        onClick={onLoginClick}
                        className="px-6 py-2.5 bg-mint-900 text-white rounded-full font-medium text-[13px] hover:bg-mint-700 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </nav>

            <main>
                <HeroSection onLoginClick={onLoginClick} />
                <BuiltForEveryRole />
                <CoreFunctionalModules />
                <SecuritySection />
                <FertilitySpecific />

                <FinalCTA onLoginClick={onLoginClick} />
            </main>


        </div>
    );
};

