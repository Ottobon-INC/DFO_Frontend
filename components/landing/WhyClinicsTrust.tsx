import React from 'react';
import { motion } from 'framer-motion';

export const WhyClinicsTrust: React.FC = () => {
    return (
        <section className="py-32 bg-slate-50">
            <div className="container mx-auto px-6 text-center max-w-7xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-20 tracking-tight"
                >
                    Why Hospitals Trust Us
                </motion.h2>

                <div className="relative max-w-4xl mx-auto h-[400px] md:h-[300px] flex flex-col items-center justify-center">
                    {/* Top */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        className="absolute top-0 px-8 py-5 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 font-bold text-slate-700 w-56 z-10"
                    >
                        Reliable
                    </motion.div>

                    {/* Middle Row */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-80">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="px-8 py-5 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 font-bold text-slate-700 w-56"
                        >
                            Accurate
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="px-8 py-5 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 font-bold text-slate-700 w-56"
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
                        className="absolute top-1/2 -translate-y-1/2 px-10 py-6 bg-gradient-to-tr from-sky-100 to-blue-50 rounded-2xl shadow-2xl shadow-sky-200/40 border border-sky-100 font-bold text-sky-700 text-lg w-56 z-20"
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
                        className="absolute bottom-0 px-8 py-5 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 font-bold text-slate-700 w-56 z-10"
                    >
                        Patient-First
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
