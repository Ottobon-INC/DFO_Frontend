import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, FileText, BarChart } from 'lucide-react';

const features = [
    {
        title: 'Leads Pipeline',
        description: 'Track inquiries from first call to conversion.',
        icon: Users,
    },
    {
        title: 'Smart Appointments',
        description: 'Automated reminders, multi-doctor scheduling, follow-up tracking.',
        icon: Calendar,
    },
    {
        title: 'Patient Management',
        description: 'All clinical notes, results, timelines, and treatment phases in one place.',
        icon: FileText,
    },
    {
        title: 'Clinic Intelligence',
        description: 'Conversion rate, drop-off reasons, CRO efficiency, financial snapshots.',
        icon: BarChart,
    },
];

export const CoreFeatures: React.FC = () => {
    return (
        <section className="py-24 bg-brand-bg">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-brand-textPrimary"
                    >
                        Everything Your Team Needs, <br /> In One OS
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: index * 0.15 }}
                            whileHover={{ x: 3, scale: 1.02 }}
                            className="p-8 rounded-2xl bg-brand-surface border border-brand-border hover:shadow-lg transition-all duration-300"
                        >
                            <div className="w-12 h-12 bg-brand-bg rounded-lg flex items-center justify-center mb-6 text-brand-primary shadow-sm border border-brand-border">
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-textPrimary mb-3">{feature.title}</h3>
                            <p className="text-brand-textSecondary leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
