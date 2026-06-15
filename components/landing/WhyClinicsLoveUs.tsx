import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Heart, TrendingUp } from 'lucide-react';

const cards = [
    {
        title: 'Operate With Precision',
        description: 'Centralized schedule, streamlined workflows, fast task resolution.',
        icon: Clock,
    },
    {
        title: 'Support Patients Better',
        description: 'Real-time alerts, follow-up tracking, medication compliance support.',
        icon: Heart,
    },
    {
        title: 'Grow Predictably',
        description: 'Pipeline intelligence and CRO workflows built for fertility.',
        icon: TrendingUp,
    },
];

export const WhyClinicsLoveUs: React.FC = () => {
    return (
        <section className="py-24 bg-brand-bg relative overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.h2
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-5xl font-bold text-brand-textPrimary mb-16 text-center md:text-left"
                >
                    Why Clinics Choose JanmaSethu
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                            className="bg-brand-surface p-8 rounded-2xl border border-brand-border group cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-brand-bg rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-brand-border">
                                <card.icon className="text-brand-primary w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-textPrimary mb-4">{card.title}</h3>
                            <p className="text-brand-textSecondary text-lg leading-relaxed">
                                {card.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
