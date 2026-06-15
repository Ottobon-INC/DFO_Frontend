import React from 'react';
import { motion } from 'framer-motion';
import { MockPipeline } from './mockups/MockPipeline';

const chips = [
    'Leads Pipeline',
    'Appointment Calendar',
    'CRO Desk',
    'Patients Timeline',
    'Clinical Alerts',
    'Active Caseload',
];

export const ProductExperience: React.FC = () => {
    return (
        <section className="py-24 bg-brand-bg relative overflow-hidden">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/3 mb-12 md:mb-0 z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-brand-textPrimary mb-6"
                    >
                        Your Entire Clinic — <br />
                        <span className="text-brand-primary">Connected</span>
                    </motion.h2>
                    <p className="text-brand-textSecondary text-lg mb-8">
                        A beautifully organized OS designed exclusively for fertility teams.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        {chips.map((chip, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.85 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.12,
                                    y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }
                                }}
                                animate={{ y: [0, -6, 0] }}
                                className="px-4 py-2 bg-brand-surface rounded-full shadow-sm border border-brand-border text-brand-textPrimary font-medium text-sm"
                            >
                                {chip}
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-2/3 relative">
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 }}
                        className="relative z-0"
                    >
                        {/* Real Dashboard Image */}
                        <div className="bg-brand-surface rounded-xl shadow-2xl border border-brand-border p-2 md:p-4 transform rotate-y-12 perspective-1000 h-64 md:h-96">
                            <div className="rounded-lg overflow-hidden border border-brand-border h-full">
                                <MockPipeline />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
