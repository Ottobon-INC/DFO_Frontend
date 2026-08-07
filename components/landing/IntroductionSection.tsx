import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MessageCircle, Mail, FileText, Calendar, Video, Database, Activity, Stethoscope, User, Heart, CreditCard, LayoutDashboard, Share2, Shield, Folder, Globe, Cloud, Phone, Settings, Monitor, BookOpen, Inbox, Bell, Link } from 'lucide-react';

export const IntroductionSection: React.FC = () => {
    // Helper to generate placeholder icons matching the colors in the image
    const iconGrid = [
        [
            { bg: '#0077B5', icon: <Globe className="text-white" size={32} /> },
            { bg: '#117ACA', icon: <CreditCard className="text-white" size={32} /> },
            { bg: '#E01E5A', icon: <MessageCircle className="text-white" size={32} /> },
            { bg: '#5865F2', icon: <Video className="text-white" size={32} /> },
            { bg: '#FF9900', icon: <Folder className="text-white" size={32} /> },
            { bg: '#000000', icon: <Shield className="text-white" size={32} /> },
            { bg: '#FFFFFF', icon: <FileText className="text-slate-800" size={32} /> },
            { bg: '#000000', icon: <Database className="text-white" size={32} /> }
        ],
        [
            { bg: '#1DA1F2', icon: <Share2 className="text-white" size={32} /> },
            { bg: '#EA4335', icon: <Mail className="text-white" size={32} /> },
            { bg: '#000000', icon: <LayoutDashboard className="text-white" size={32} /> },
            { bg: '#25D366', icon: <Phone className="text-white" size={32} /> },
            { bg: '#4285F4', icon: <Cloud className="text-white" size={32} /> },
            { bg: '#0F9D58', icon: <Activity className="text-white" size={32} /> },
            { bg: '#F4B400', icon: <Calendar className="text-white" size={32} /> },
            { bg: '#333333', icon: <Settings className="text-white" size={32} /> }
        ],
        [
            { bg: '#25D366', icon: <MessageCircle className="text-white" size={32} /> },
            { bg: '#EBEBEB', icon: <BookOpen className="text-slate-600" size={32} /> },
            { bg: '#EA4335', icon: <Heart className="text-white" size={32} /> },
            { bg: '#FF0000', icon: <Monitor className="text-white" size={32} /> },
            { bg: '#EAEAEA', icon: <Inbox className="text-slate-600" size={32} /> },
            { bg: '#00C4CC', icon: <Link className="text-white" size={32} /> },
            { bg: '#9933CC', icon: <Bell className="text-white" size={32} /> },
            { bg: '#00A1F1', icon: <User className="text-white" size={32} /> }
        ],
    ];

    return (
        <section className="bg-mint-50 pt-32 pb-32 overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                {/* Top Part: 2 Column Layout */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row gap-8 md:gap-24 mb-40"
                >
                    <div className="md:w-1/3">
                        <a href="#" className="inline-flex items-center text-mint-500 font-medium text-sm hover:text-mint-600 transition-colors">
                            Introducing Digital OP Desk <ChevronRight size={16} className="ml-1" />
                        </a>
                    </div>
                    <div className="md:w-2/3">
                        <p className="text-xl md:text-[22px] text-mint-700 leading-relaxed mb-8">
                            <strong className="text-mint-900 font-medium">Today's hospital systems are fragmented.</strong> They force your staff to switch between EHRs, spreadsheets, and messaging apps, losing time and causing errors. They stop every time the work gets real, and they still lack the basics: speed and usability.
                        </p>
                        <p className="text-xl md:text-[22px] text-mint-700 leading-relaxed">
                            <strong className="text-mint-900 font-medium">Digital OP Desk is a unified clinical OS rebuilt for care teams.</strong> It works across your entire patient journey and handles complex work other tools can't: smart scheduling, automated follow-ups, real-time alerts, and everything in between.
                        </p>
                    </div>
                </motion.div>

                {/* Bottom Part: 3D Grid & Description */}
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <a href="#" className="inline-flex items-center text-mint-500 font-medium text-sm hover:text-mint-600 transition-colors mb-6">
                            Unlimited capability <ChevronRight size={16} className="ml-1" />
                        </a>
                        <h2 className="text-4xl md:text-5xl font-medium text-mint-900 mb-16 tracking-tight">
                            Anything you do in a clinic,<br />
                            Digital OP Desk can do for you.
                        </h2>
                    </motion.div>

                    {/* 3D Perspective Grid container */}
                    <div className="relative w-full h-[350px] mb-16 flex justify-center perspective-[1200px]">
                        <motion.div 
                            initial={{ opacity: 0, rotateX: 60, scale: 0.8 }}
                            whileInView={{ opacity: 1, rotateX: 45, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex flex-col gap-6"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {iconGrid.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex gap-6 justify-center">
                                    {row.map((item, colIndex) => (
                                        <div 
                                            key={colIndex} 
                                            className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] shadow-xl flex items-center justify-center border border-black/5 transition-transform hover:-translate-y-2"
                                            style={{ backgroundColor: item.bg }}
                                        >
                                            {item.icon}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </motion.div>

                        {/* Fade overlay at the bottom to blend into mint-50 background */}
                        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-mint-50 via-mint-50/80 to-transparent z-10 pointer-events-none"></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="max-w-3xl mx-auto"
                    >
                        <p className="text-lg md:text-[20px] text-mint-700 leading-relaxed font-medium">
                            Unlike other hospital systems that rely on clunky integrations, Digital OP Desk connects with your tools and accounts directly, just like you do. That means you can automate any workflow in your mind anytime you need. The only limit is your imagination.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
