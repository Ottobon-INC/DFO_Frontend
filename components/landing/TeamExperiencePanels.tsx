import React from 'react';
import { motion } from 'framer-motion';

export const TeamExperiencePanels: React.FC = () => {
    const panels = [
        {
            role: "CRO/Admin Experience",
            items: ["Pipeline automation", "Drop-off detection", "Intervention queues"],
            delay: 0
        },
        {
            role: "Doctor Experience",
            items: ["Command board", "Real-time alerts", "Caseload phase insights"],
            delay: 0.2
        },
        {
            role: "Front Desk Experience",
            items: ["Instant lead entry", "Smart scheduling", "Appointment flow"],
            delay: 0.4
        }
    ];

    return (
        <section className="py-24 bg-slate-950">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {panels.map((panel, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: panel.delay }}
                            whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.15)' }}
                            className="bg-white/5 p-8 rounded-3xl shadow-lg border border-white/10 flex flex-col h-full transition-all duration-300 backdrop-blur-sm"
                        >
                            <h3 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-white/10">
                                {panel.role}
                            </h3>
                            <ul className="space-y-4 flex-1">
                                {panel.items.map((item, i) => (
                                    <li key={i} className="text-lg text-slate-300 font-medium flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
