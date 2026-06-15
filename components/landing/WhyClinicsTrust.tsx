import React from 'react';
import { motion } from 'framer-motion';

export const WhyClinicsTrust: React.FC = () => {
    return (
        <section className="py-32 bg-slate-950">
            <div className="container mx-auto px-6 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-white mb-20"
                >
                    Why Clinics Choose Us
                </motion.h2>

                <div className="relative max-w-3xl mx-auto h-[300px] md:h-[250px] flex flex-col items-center justify-center">
                    {/* Top */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        className="absolute top-0 px-8 py-4 bg-white/5 rounded-2xl shadow-lg border border-white/10 font-bold text-slate-200 w-48 z-10 backdrop-blur-sm"
                    >
                        Reliable
                    </motion.div>

                    {/* Middle Row */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-center gap-48 md:gap-64">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="px-8 py-4 bg-white/5 rounded-2xl shadow-lg border border-white/10 font-bold text-slate-200 w-48 backdrop-blur-sm"
                        >
                            Accurate
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="px-8 py-4 bg-white/5 rounded-2xl shadow-lg border border-white/10 font-bold text-slate-200 w-48 backdrop-blur-sm"
                        >
                            Secure
                        </motion.div>
                    </div>

                    {/* Center */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.05 }}
                        className="absolute top-1/2 -translate-y-1/2 px-8 py-4 bg-indigo-600/20 rounded-2xl shadow-lg border border-indigo-500/30 font-bold text-indigo-300 w-48 z-20 backdrop-blur-md"
                    >
                        Faster
                    </motion.div>

                    {/* Bottom */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        className="absolute bottom-0 px-8 py-4 bg-white/5 rounded-2xl shadow-lg border border-white/10 font-bold text-slate-200 w-48 z-10 backdrop-blur-sm"
                    >
                        Patient-First
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
