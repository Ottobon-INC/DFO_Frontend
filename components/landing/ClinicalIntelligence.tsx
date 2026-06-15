import React from 'react';
import { motion } from 'framer-motion';

export const ClinicalIntelligence: React.FC = () => {
    const pills = [
        "Detects abnormalities before they escalate",
        "Flags missed medication in real time",
        "Surfaces high-risk patients automatically",
        "Highlights caseload imbalances",
        "Predicts patient drop-off early"
    ];

    return (
        <section className="py-32 bg-brand-bg text-brand-textPrimary relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-bg z-0"></div>

            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-5xl font-bold mb-16 tracking-tight text-brand-textPrimary drop-shadow-[0_0_25px_rgba(136,189,242,0.2)]"
                >
                    The Intelligence That Makes Your Clinic Smarter
                </motion.h2>

                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    {pills.map((text, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(136,189,242,0.15)', boxShadow: '0 0 20px rgba(136,189,242,0.1)' }}
                            className="px-6 py-3 rounded-full bg-brand-surface border border-brand-border backdrop-blur-md text-brand-textPrimary font-medium text-lg cursor-default transition-all duration-300"
                        >
                            {text}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
