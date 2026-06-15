import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
    onLoginClick?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLoginClick }) => {
    return (
        <section className="py-32 bg-brand-bg text-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-brand-bg z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-bold text-brand-textPrimary mb-10 tracking-tight"
                >
                    Your Clinic. Supercharged.
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <button
                        onClick={onLoginClick}
                        className="group relative px-10 py-5 bg-brand-primary text-brand-bg rounded-full font-bold text-lg shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Access Clinic Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <p className="mt-6 text-brand-textSecondary font-medium text-sm">
                        For existing clinics & registered staff only.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
