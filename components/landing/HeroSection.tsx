import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
    onLoginClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-brand-bg">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse-soft"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-secondary/20 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center space-x-2 bg-brand-surface/30 backdrop-blur-md border border-brand-border px-4 py-1.5 rounded-full mb-8">
                        <Sparkles size={14} className="text-brand-primary" />
                        <span className="text-sm font-medium text-brand-textSecondary tracking-wide uppercase">The Clinical OS for Fertility</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-brand-textPrimary mb-8 tracking-tight leading-tight">
                        Powering the Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                            Fertility Clinics
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-brand-textSecondary max-w-3xl mx-auto mb-12 leading-relaxed">
                        A complete operating system that unifies care, operations, and intelligence across your entire clinical ecosystem.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <button
                            onClick={onLoginClick}
                            className="group relative px-8 py-4 bg-brand-primary text-white rounded-full font-bold text-lg shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Access Clinic Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>


                    </div>
                </motion.div>

                {/* Hero Feature Chips */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 flex flex-wrap justify-center gap-4 md:gap-8"
                >
                    {["Clinical Intelligence Engine", "Automated Workflows", "Real-time Patient Tracking"].map((feature, i) => (
                        <div key={i} className="px-6 py-3 rounded-2xl bg-brand-surface/20 border border-brand-border backdrop-blur-sm text-brand-textSecondary font-medium text-sm md:text-base shadow-lg">
                            {feature}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
