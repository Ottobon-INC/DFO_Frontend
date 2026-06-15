import React, { useState } from 'react';

interface HeaderProps {
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent ${isScrolled ? 'bg-white/95 backdrop-blur-md border-brand-border shadow-sm' : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20 transform group-hover:scale-105 transition-transform duration-300">
            <span className="font-bold text-white text-xl">J</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-brand-textPrimary leading-none group-hover:text-brand-primary transition-colors">JanmaSethu</span>
            <span className="text-[10px] font-bold tracking-widest text-brand-textSecondary uppercase mt-0.5">Clinical OS</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onLoginClick}
          className="group bg-brand-primary hover:bg-brand-primaryHover text-white text-sm font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-brand-primary/20 transform active:scale-95 transition-all duration-200 overflow-hidden relative"
        >
          <span className="relative z-10 flex items-center">
            Staff Portal
          </span>
          <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    </nav>
  );
};