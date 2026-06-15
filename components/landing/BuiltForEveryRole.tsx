import React from 'react';
import { motion } from 'framer-motion';

export const BuiltForEveryRole: React.FC = () => {
    return (
        <section className="py-32 bg-brand-bg overflow-hidden border-t border-brand-border">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Vertical Divider Lines (Desktop) */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/3 w-px bg-brand-border/50"></div>
                    <div className="hidden md:block absolute top-0 bottom-0 right-1/3 w-px bg-brand-border/50"></div>

                    {/* CRO & Admin */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="p-6 text-center md:text-left"
                    >
                        <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold tracking-wider uppercase mb-6 border border-purple-500/20">Admin & CRO</span>
                        <h3 className="text-3xl font-bold text-brand-textPrimary mb-4">For CRO & Admin Teams</h3>
                        <p className="text-brand-textSecondary text-lg leading-relaxed">
                            Pipeline tracking, follow-up automation, drop-off analysis, intervention queue.
                        </p>
                    </motion.div>

                    {/* Doctors */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="p-6 text-center md:text-left"
                    >
                        <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase mb-6 border border-brand-primary/20">Clinical</span>
                        <h3 className="text-3xl font-bold text-brand-textPrimary mb-4">For Doctors</h3>
                        <p className="text-brand-textSecondary text-lg leading-relaxed">
                            Daily command center, patient caseload insight, clinical alerts, phase analysis.
                        </p>
                    </motion.div>

                    {/* Front Desk */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="p-6 text-center md:text-left"
                    >
                        <span className="inline-block px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-bold tracking-wider uppercase mb-6 border border-brand-secondary/20">Operations</span>
                        <h3 className="text-3xl font-bold text-brand-textPrimary mb-4">For Front Desk Teams</h3>
                        <p className="text-brand-textSecondary text-lg leading-relaxed">
                            Instant lead entry, schedule management, appointment flow, reminders.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
