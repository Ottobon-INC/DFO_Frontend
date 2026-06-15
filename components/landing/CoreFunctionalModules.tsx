import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export const CoreFunctionalModules: React.FC = () => {
    const modules = [
        { title: "Leads Pipeline Management", desc: "Track inquiries end-to-end with CRO workflows." },
        { title: "Appointment & Schedule Automation", desc: "Multi-doctor calendars, reminders, follow-ups." },
        { title: "Patient Record System", desc: "Everything in one place: history, treatment plans, phases, compliance." },
        { title: "Clinical Intelligence Engine", desc: "Alerts for labs, medication misses, high-risk patients, and follow-up risks." },
        { title: "Analytics & Performance Tracking", desc: "Conversion rates, drop-offs, financial trends, CRO efficiency." }
    ];

    return (
        <section className="py-24 bg-brand-bg border-y border-brand-border/50">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-center text-brand-textPrimary mb-16"
                >
                    Core Functional Modules
                </motion.h2>

                <div className="space-y-8">
                    {modules.map((module, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group flex items-start p-6 rounded-xl hover:bg-brand-surface hover:shadow-md transition-all duration-300 border border-transparent hover:border-brand-border cursor-default"
                        >
                            <div className="mt-1 mr-6 text-brand-secondary group-hover:text-brand-primary transition-colors">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-brand-textPrimary mb-2 relative inline-block">
                                    {module.title}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-primary transition-all duration-300 group-hover:w-full"></span>
                                </h3>
                                <p className="text-brand-textSecondary text-lg">
                                    {module.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
