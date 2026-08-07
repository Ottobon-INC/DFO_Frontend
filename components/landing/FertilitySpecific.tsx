import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, GitBranch, Users } from 'lucide-react';

export const FertilitySpecific: React.FC = () => {
    const items = [
        {
            icon: <Activity size={32} />,
            title: "Patient Lifecycle Tracking",
            description: "Track patients seamlessly from initial intake through treatment phases and discharge."
        },
        {
            icon: <Heart size={32} />,
            title: "Comprehensive Care",
            description: "Integrated tools to monitor and support overall patient well-being throughout their journey."
        },
        {
            icon: <GitBranch size={32} />,
            title: "Smart Care Pathways",
            description: "Automated follow-ups tailored to specific treatment plans, ensuring no patient is left behind."
        },
        {
            icon: <Users size={32} />,
            title: "Multi-role Alignment",
            description: "Seamless communication between doctors, nurses, specialists, and admin staff."
        }
    ];

    return (
        <section className="py-32 bg-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mint-100/50 rounded-full blur-[100px] -z-10"></div>

            <div className="container mx-auto px-6 relative z-10 text-center max-w-7xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-medium text-mint-900 mb-16 tracking-tight"
                >
                    Designed Specifically for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint-500 to-mint-700">
                        Hospital Workflows
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
                            className="group h-full w-full bg-gradient-to-br from-mint-300 to-mint-600 rounded-[20px] transition-all duration-300 hover:shadow-[0_0_30px_1px_rgba(52,211,153,0.4)] cursor-pointer p-[1px]"
                        >
                            <div className="w-full h-full bg-white rounded-[19px] transition-all duration-200 group-hover:scale-[0.98] group-hover:rounded-[20px] flex flex-col items-center text-center p-8">
                                <div className="mb-6 p-4 rounded-2xl bg-mint-50 text-mint-600 group-hover:scale-110 group-hover:bg-mint-100 transition-all duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-mint-900 mb-3 tracking-tight">
                                    {item.title}
                                </h3>
                                <p className="text-mint-700/80 text-sm leading-relaxed font-medium">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
