import React from 'react';
import { motion } from 'framer-motion';

export const OSLayers: React.FC = () => {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        A Multi-Layer Operating System for Fertility Practices
                    </h2>
                </motion.div>

                <div className="space-y-6">
                    {/* Layer 1 - Operations */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.2)' }}
                        className="bg-white/5 p-7 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm transition-all duration-300 cursor-default group"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white tracking-wide uppercase group-hover:text-indigo-400 transition-colors">Operations Layer</h3>
                            <div className="flex flex-wrap gap-3 text-slate-400 font-medium text-sm md:text-base">
                                <span>Leads</span> <span className="text-slate-600">•</span>
                                <span>Appointments</span> <span className="text-slate-600">•</span>
                                <span>Follow-ups</span> <span className="text-slate-600">•</span>
                                <span>Tasks</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Layer 2 - Clinical */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        whileHover={{ scale: 1.02, x: 10, backgroundColor: 'rgba(255,255,255,0.1)', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.2)' }}
                        className="bg-white/5 p-7 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm transition-all duration-300 cursor-default group"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white tracking-wide uppercase group-hover:text-indigo-400 transition-colors">Clinical Layer</h3>
                            <div className="flex flex-wrap gap-3 text-slate-400 font-medium text-sm md:text-base">
                                <span>Caseloads</span> <span className="text-slate-600">•</span>
                                <span>Alerts</span> <span className="text-slate-600">•</span>
                                <span>Medication Tracking</span> <span className="text-slate-600">•</span>
                                <span>Lab Signals</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Layer 3 - Intelligence */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        whileHover={{ scale: 1.02, x: -10, backgroundColor: 'rgba(255,255,255,0.1)', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.2)' }}
                        className="bg-white/5 p-7 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm transition-all duration-300 cursor-default group"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white tracking-wide uppercase group-hover:text-indigo-400 transition-colors">Intelligence Layer</h3>
                            <div className="flex flex-wrap gap-3 text-slate-400 font-medium text-sm md:text-base">
                                <span>Drop-off Prediction</span> <span className="text-slate-600">•</span>
                                <span>Risk Scoring</span> <span className="text-slate-600">•</span>
                                <span>Analytics</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
