import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, HardDrive, Cloud, Lock, Shield, Check, ToggleRight, Settings, Cpu, Network, Database, Sparkles, Server, Folder } from 'lucide-react';

export const PrivacyControlSection: React.FC = () => {
    return (
        <section className="py-24 bg-mint-50 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <a href="#" className="inline-flex items-center text-mint-500 font-medium text-sm hover:text-mint-600 transition-colors mb-4">
                        Privacy and control <ChevronRight size={16} className="ml-1" />
                    </a>
                    <h2 className="text-4xl md:text-5xl font-medium text-mint-900 mb-6 tracking-tight">
                        Private enough to use real data.
                    </h2>
                    <p className="text-lg text-mint-600 leading-relaxed max-w-2xl mx-auto font-medium">
                        Digital OP Desk runs within your compliant environment, keeps patient data protected, and gates sensitive clinical actions for your review.
                    </p>
                </motion.div>

                {/* 4 Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Card 1 - Local by default */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <div className="bg-mint-50/80 rounded-[2rem] h-[300px] flex items-center justify-center p-6 relative overflow-hidden border border-mint-100">
                            {/* Mockup */}
                            <div className="w-full bg-mint-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-mint-100 p-2 relative z-10">
                                <div className="flex items-center gap-2 px-3 py-2 text-mint-600/50 text-[10px] font-medium border-b border-slate-50 mb-2">
                                    <span>+</span> <span>Ask AI a task, @ for context</span>
                                </div>
                                <div className="flex gap-2 px-2 mb-2">
                                    <div className="bg-mint-100 text-mint-700 text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1"><HardDrive size={10}/> Local <ChevronRight size={10}/></div>
                                    <div className="text-mint-600/70 text-[9px] font-bold px-2 py-1 flex items-center gap-1"><Shield size={10}/> Guard <ChevronRight size={10}/></div>
                                </div>
                                
                                {/* Dropdown menu */}
                                <div className="bg-mint-50 rounded-xl border border-mint-100 shadow-lg p-1">
                                    <div className="bg-mint-50 rounded-lg p-2.5 flex justify-between items-center mb-1">
                                        <div className="flex gap-3 items-center">
                                            <HardDrive size={14} className="text-mint-700"/>
                                            <div>
                                                <div className="text-[11px] font-bold text-mint-900">Local</div>
                                                <div className="text-[9px] text-mint-600">Runs on your computer</div>
                                            </div>
                                        </div>
                                        <Check size={14} className="text-mint-700"/>
                                    </div>
                                    <div className="rounded-lg p-2.5 flex items-center gap-3">
                                        <Cloud size={14} className="text-mint-600/70"/>
                                        <div>
                                            <div className="text-[11px] font-bold text-mint-600/70">Cloud</div>
                                            <div className="text-[9px] text-mint-600/70">Run tasks on Digital OP Desk cloud</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">Local by default</strong> Tasks, memory, and PHI stay within your environment. Nothing is shared with external AI providers.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2 - Encrypted */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="bg-mint-50/80 rounded-[2rem] h-[300px] flex items-center justify-center p-6 relative overflow-hidden border border-mint-100 perspective-1000">
                            {/* Mockup - Isometric Stack */}
                            <div className="relative w-40 h-40 transform rotate-x-60 -rotate-z-45 translate-y-4">
                                <div className="absolute inset-0 bg-mint-50/80 backdrop-blur-md rounded-2xl border border-mint-200 shadow-xl flex items-center justify-center transform translate-z-12">
                                    <Lock className="text-mint-600/50 w-8 h-8" />
                                </div>
                                <div className="absolute inset-0 bg-mint-200/50 rounded-2xl border border-mint-300 transform translate-z-6">
                                    {/* Abstract pattern */}
                                    <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_#94a3b8_2px,_transparent_2px)] bg-[size:8px_8px]"></div>
                                </div>
                                <div className="absolute inset-0 bg-mint-300/40 rounded-2xl border border-mint-400 transform translate-z-0 flex items-end p-2">
                                    <span className="text-[6px] font-bold text-mint-600">SECURE ENCLAVE</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">HIPAA Compliant Encryption</strong> Everything is secured with enterprise-grade encryption at rest and in transit.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 3 - Sandbox */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="bg-mint-50/80 rounded-[2rem] h-[300px] flex items-start justify-center pt-8 px-4 relative overflow-hidden border border-mint-100">
                            {/* Mockup - Settings Dropdown */}
                            <div className="w-full bg-mint-50 rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-mint-100 p-4">
                                <div className="text-[10px] font-bold text-mint-600/70 mb-2 uppercase">Permission</div>
                                <div className="flex flex-col gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-mint-600/70">
                                        <div className="w-3 h-3 rounded-full border border-mint-300"></div>
                                        <span className="text-[11px] font-medium">Read only</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-mint-900">
                                        <div className="w-3 h-3 rounded-full border-4 border-mint-400"></div>
                                        <ShieldCheck size={12} />
                                        <span className="text-[11px] font-bold">Guard</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-mint-600/70">
                                        <div className="w-3 h-3 rounded-full border border-mint-300"></div>
                                        <Shield size={12} />
                                        <span className="text-[11px] font-medium">Full access</span>
                                    </div>
                                </div>

                                <div className="text-[10px] font-bold text-mint-600/70 mb-2 uppercase">Folder Access</div>
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="flex justify-between items-center text-mint-900 bg-mint-50 px-2 py-1.5 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <Folder size={12} /> <span className="text-[11px] font-bold">Default workspace</span>
                                        </div>
                                        <Check size={12} />
                                    </div>
                                    <div className="flex items-center gap-2 text-mint-600/70 px-2">
                                        <Folder size={12} /> <span className="text-[11px] font-medium">Choose a folder</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-mint-100">
                                    <span className="text-[11px] font-medium text-mint-700">Final confirm</span>
                                    <ToggleRight size={18} className="text-mint-400" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">Sandbox with guardrails</strong> Digital OP Desk isolates system access and enforces role-based access control to protect clinical data.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 4 - Subscriptions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="bg-mint-50/80 rounded-[2rem] h-[300px] flex items-center justify-center p-6 relative overflow-hidden border border-mint-100">
                            {/* Mockup - Orbital Logos */}
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* Center Logo */}
                                <div className="w-16 h-16 bg-mint-900 rounded-full flex items-center justify-center shadow-lg z-20">
                                    <Sparkles className="text-white w-8 h-8" />
                                </div>
                                
                                {/* Orbiting Elements */}
                                <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-mint-50 rounded-full shadow-md flex items-center justify-center border border-mint-100 -rotate-[0deg]"><Cpu size={14} className="text-mint-700"/></div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-mint-50 rounded-full shadow-md flex items-center justify-center border border-mint-100 -rotate-[90deg]"><Database size={14} className="text-mint-700"/></div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-mint-50 rounded-full shadow-md flex items-center justify-center border border-mint-100 -rotate-[180deg]"><Network size={14} className="text-mint-700"/></div>
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-mint-50 rounded-full shadow-md flex items-center justify-center border border-mint-100 -rotate-[270deg]"><Server size={14} className="text-mint-700"/></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">Model Agnostic</strong> Use compliant healthcare models, open-source options, or securely bring your own API keys.
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
            
            {/* Custom CSS for isometric transforms */}
            <style dangerouslySetInnerHTML={{__html: `
                .perspective-1000 { perspective: 1000px; }
                .rotate-x-60 { transform: rotateX(60deg); }
                .-rotate-z-45 { transform: rotateZ(-45deg); }
                .translate-z-12 { transform: translateZ(48px); }
                .translate-z-6 { transform: translateZ(24px); }
                .translate-z-0 { transform: translateZ(0px); }
            `}} />
        </section>
    );
};
