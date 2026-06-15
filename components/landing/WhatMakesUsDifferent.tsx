import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, BarChart3 } from 'lucide-react';

export const WhatMakesUsDifferent: React.FC = () => {
    return (
        <section className="py-24 bg-brand-bg relative">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        {
                            icon: <Activity size={32} />,
                            title: "Operational Clarity",
                            desc: "Centralize lead tracking, appointments, follow-ups, tasks, and clinical workflows.",
                            delay: 0
                        },
                        {
                            icon: <Heart size={32} />,
                            title: "Patient-Centered Care",
                            desc: "Smart alerts, treatment timelines, and compliance monitoring built for fertility.",
                            delay: 0.15
                        },
                        {
                            icon: <BarChart3 size={32} />,
                            title: "Business Intelligence",
                            desc: "Real-time insights to improve conversions, efficiency, and decision-making.",
                            delay: 0.3
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: item.delay }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="p-8 rounded-2xl bg-brand-surface border border-brand-border hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary mb-6 group-hover:bg-brand-primary group-hover:text-brand-bg transition-colors duration-300 shadow-sm">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-brand-textPrimary mb-4">{item.title}</h3>
                            <p className="text-brand-textSecondary leading-relaxed text-lg">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
