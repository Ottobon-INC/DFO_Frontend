import React from 'react';
import { motion } from 'framer-motion';

export const AutomationFlow: React.FC = () => {
    const steps = ["Inquiry", "Triage", "Scheduling", "Consultation", "Treatment", "Follow-up", "Completion"];

    return (
        <section className="py-24 bg-slate-950 overflow-x-hidden">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-0"
                >
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="px-8 py-4 bg-white/5 rounded-xl shadow-lg border border-white/10 font-bold text-slate-200 text-lg whitespace-nowrap hover:border-indigo-500/50 hover:text-indigo-400 hover:shadow-indigo-500/20 transition-all duration-300 cursor-default backdrop-blur-sm"
                            >
                                {step}
                            </motion.div>
                            {index < steps.length - 1 && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    whileInView={{ opacity: 1, scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 + 0.05 }}
                                    className="hidden md:block w-8 h-0.5 bg-white/20 mx-2"
                                ></motion.div>
                            )}
                        </React.Fragment>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
