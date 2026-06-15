import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, GitBranch, Users } from 'lucide-react';

export const FertilitySpecific: React.FC = () => {
    const items = [
        {
            icon: <Activity size={32} />,
            title: "Phase-based Care",
            description: "Track patients through stimulation, retrieval, and transfer phases with precision."
        },
        {
            icon: <Heart size={32} />,
            title: "Emotional Support",
            description: "Integrated tools to monitor and support patient emotional well-being throughout the journey."
        },
        {
            icon: <GitBranch size={32} />,
            title: "Sensitive Pathways",
            description: "Automated follow-ups tailored to specific outcomes, ensuring no patient is left behind."
        },
        {
            icon: <Users size={32} />,
            title: "Multi-role Alignment",
            description: "Seamless communication between doctors, nurses, embryologists, and admin staff."
        }
    ];

    return (
        <section className="py-32 bg-brand-bg relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-brand-bg z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-bold text-brand-textPrimary mb-16 tracking-tight"
                >
                    Designed Specifically for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                        Fertility Workflows
                    </span>
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group p-8 rounded-3xl bg-brand-surface border border-brand-border hover:border-brand-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-primary/10 flex flex-col items-center text-center"
                        >
                            <div className="mb-6 p-4 rounded-2xl bg-brand-bg border border-brand-border text-brand-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-brand-textPrimary mb-3">
                                {item.title}
                            </h3>
                            <p className="text-brand-textSecondary text-sm leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
