import React from 'react';
import { motion } from 'framer-motion';

export const BuiltForEveryRole: React.FC = () => {
    return (
        <section id="roles" className="py-32 bg-mint-50 overflow-hidden border-t border-mint-200/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 relative">
                    
                    {/* CRO & Admin */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-gradient-to-br from-mint-200 via-mint-50 to-white hover:shadow-lg transition-all duration-300 border border-mint-200/50"
                    >
                        <div className="mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold tracking-wider uppercase border border-purple-500/20">Admin & CRO</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-medium text-mint-900 mb-4">For CRO & Admin Teams</h3>
                        <p className="text-mint-700/80 text-lg leading-relaxed">
                            Pipeline tracking, follow-up automation, drop-off analysis, intervention queue.
                        </p>
                    </motion.div>

                    {/* Doctors */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-gradient-to-br from-mint-300 via-mint-100 to-mint-50 hover:shadow-lg transition-all duration-300 border border-mint-200/50"
                    >
                        <div className="mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase border border-brand-primary/20">Clinical</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-medium text-mint-900 mb-4">For Doctors</h3>
                        <p className="text-mint-700/80 text-lg leading-relaxed">
                            Daily command center, patient caseload insight, clinical alerts, phase analysis.
                        </p>
                    </motion.div>

                    {/* Front Desk */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-gradient-to-br from-mint-200 via-white to-mint-50 hover:shadow-lg transition-all duration-300 border border-mint-200/50"
                    >
                        <div className="mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-bold tracking-wider uppercase border border-brand-secondary/20">Operations</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-medium text-mint-900 mb-4">For Front Desk Teams</h3>
                        <p className="text-mint-700/80 text-lg leading-relaxed">
                            Instant lead entry, schedule management, appointment flow, reminders.
                        </p>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
