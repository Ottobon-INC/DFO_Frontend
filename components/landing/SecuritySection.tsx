import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Key, Shield, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { DecryptionReveal } from './DecryptionReveal';

export const SecuritySection: React.FC = () => {
    const [isDecryptionTriggered, setIsDecryptionTriggered] = useState(false);
    return (
        <section id="security" className="py-24 bg-mint-50 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Top Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <a href="#" className="inline-flex items-center text-mint-500 font-medium text-sm hover:text-mint-600 transition-colors mb-4">
                        Security & Compliance <ChevronRight size={16} className="ml-1" />
                    </a>
                    <h2 className="text-4xl md:text-5xl font-medium text-mint-900 mb-6 tracking-tight">
                        Security that <motion.span
                            className="whitespace-nowrap cursor-default inline-block"
                            onViewportEnter={() => setIsDecryptionTriggered(true)}
                            onViewportLeave={() => setIsDecryptionTriggered(false)}
                            viewport={{ once: false, amount: "some" }}
                        >
                            <DecryptionReveal
                                text="much needed"
                                trigger={isDecryptionTriggered}
                                initialMask="*"
                                duration={1200}
                            />
                            <span className="text-mint-900">.</span>
                        </motion.span>
                    </h2>
                    <p className="text-lg text-mint-600 leading-relaxed max-w-2xl font-medium">
                        Other clinical systems stop at compliance barriers and ask you to authenticate every time. Digital OP Desk lets staff work securely through SSO, without ever exposing sensitive PHI to external agents.
                    </p>
                </motion.div>

                {/* 3 Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-32">

                    {/* Card 1 - Invisible PHI */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="group flex flex-col gap-4"
                    >
                        <div className="relative rounded-[2rem] h-[320px] overflow-hidden bg-gradient-to-br from-mint-200 to-mint-400 flex flex-col items-center justify-center p-6">
                            {/* Mockup - Autofill */}
                            <div className="w-[110%] bg-mint-50/40 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col gap-2 translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                                <div className="bg-mint-50 rounded-xl h-12 flex items-center px-4 justify-between shadow-sm">
                                    <div className="flex gap-1 text-mint-600/50 text-2xl tracking-widest mt-2">******</div>
                                    <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white"><Key size={14} /></div>
                                </div>
                                <div className="bg-mint-50 rounded-xl p-4 shadow-sm">
                                    <div className="font-bold text-mint-900 text-sm">drclinic@gmail.com</div>
                                    <div className="text-[10px] text-mint-600">Staff Portal</div>
                                </div>
                                <div className="bg-mint-50/60 rounded-xl p-4 shadow-sm opacity-60">
                                    <div className="font-bold text-mint-900 text-sm">admin@hospital.com</div>
                                    <div className="text-[10px] text-mint-600">Admin Portal</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">PHI stays invisible to AI</strong> Patient data is processed locally within your secure perimeter, not exposed to the agent.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2 - Human Approval */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                        className="group flex flex-col gap-4"
                    >
                        <div className="relative rounded-[2rem] h-[320px] overflow-hidden bg-gradient-to-br from-mint-100 to-mint-300 flex items-center justify-center p-6">
                            {/* Mockup - Approval Modal */}
                            <div className="w-full bg-mint-50 rounded-2xl shadow-xl p-4 group-hover:-translate-y-2 transition-transform duration-500">
                                <div className="flex items-center gap-2 mb-4 border-b border-mint-100 pb-2">
                                    <div className="w-4 h-4 bg-mint-400 rounded text-white flex items-center justify-center text-[8px] font-bold">in</div>
                                    <span className="text-[10px] text-mint-600 font-medium">Messaging / Internal</span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-mint-200 flex-shrink-0 overflow-hidden"><img src="https://i.pravatar.cc/100?img=5" alt="avatar" /></div>
                                    <div>
                                        <div className="text-[11px] font-bold text-mint-900 flex items-center gap-1">Doctor<span className="bg-mint-200 text-mint-700 text-[8px] px-1 rounded">Staff</span></div>
                                        <div className="text-[10px] text-mint-700 leading-tight">Hey - happy to jump on a call to review the patient chart.</div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 mb-3">
                                    <div className="text-[10px] font-bold text-mint-900 mb-1">Draft reply ready:</div>
                                    <div className="text-[10px] text-mint-600 leading-tight">She's available from next Monday 8AM and Thursday 3:30 PM. How would you like to proceed?</div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-mint-50 border border-mint-200 shadow-sm text-[9px] font-bold text-mint-700 py-1.5 rounded-md hover:bg-white">Monday 8AM</button>
                                    <button className="flex-1 bg-mint-50 border border-mint-200 shadow-sm text-[9px] font-bold text-mint-700 py-1.5 rounded-md hover:bg-white">Thursday 3:30PM</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">Human approval at the edge</strong> Sensitive actions like prescriptions, referrals, and messages always wait for your confirmation.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 3 - Audit Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="group flex flex-col gap-4"
                    >
                        <div className="relative rounded-[2rem] h-[320px] overflow-hidden bg-gradient-to-br from-champagne/30 to-mint-200 flex items-center justify-center p-6">
                            {/* Mockup - Audit Log Table */}
                            <div className="w-[120%] bg-mint-50/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                                <div className="flex justify-between items-center px-4 py-2 bg-white/50 border-b border-mint-100 text-[9px] font-bold text-mint-600/70">
                                    <span>System</span>
                                    <span>Datetime</span>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-mint-900 rounded text-white flex items-center justify-center"><Shield size={8} /></div> <span className="text-[10px] font-bold text-mint-700">ehr.hospital.com</span></div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] text-mint-600/70">26-05-09 12:14</span>
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50 bg-red-50/30">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded text-white flex items-center justify-center"><FileText size={8} /></div> <span className="text-[10px] font-bold text-mint-700">billing.portal.com</span></div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] text-mint-600/70">26-05-09 12:19</span>
                                            <XCircle size={12} className="text-red-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-mint-400 rounded text-white flex items-center justify-center"><Shield size={8} /></div> <span className="text-[10px] font-bold text-mint-700">pacs.imaging.com</span></div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] text-mint-600/70">26-05-10 15:49</span>
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-2.5">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-900 rounded text-white flex items-center justify-center"><Shield size={8} /></div> <span className="text-[10px] font-bold text-mint-700">admin.system.com</span></div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] text-mint-600/70">26-05-11 09:01</span>
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] text-mint-700 font-medium leading-relaxed">
                                <strong className="text-mint-900">A record of every access</strong> Every credential use is logged, so you know exactly what the agent touched and when.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Split Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row border-t border-mint-100 pt-16"
                >
                    {/* Left Text */}
                    <div className="md:w-1/2 pr-8 lg:pr-16 flex flex-col justify-center mb-10 md:mb-0">
                        <h3 className="text-2xl md:text-3xl font-bold text-mint-900 mb-2">
                            Digital OP Desk Security Core
                        </h3>
                        <h4 className="text-xl md:text-2xl text-mint-600/70 font-medium mb-8">
                            The first clinical OS built for HIPAA compliance.
                        </h4>

                        <div className="mb-12">
                            <button className="px-4 py-1.5 rounded-full border border-mint-200 text-xs font-bold text-mint-700 hover:bg-white transition-colors">
                                Learn more
                            </button>
                        </div>

                        <div className="flex flex-col gap-8">
                            <div>
                                <h5 className="font-bold text-mint-900 text-sm mb-1">Enterprise-grade encryption</h5>
                                <p className="text-xs text-mint-600 font-medium leading-relaxed">
                                    Your data is fully encrypted locally and protected by secure enclaves to ensure zero-trust compliance.
                                </p>
                            </div>
                            <div>
                                <h5 className="font-bold text-mint-900 text-sm mb-1">Scoped access and audit log</h5>
                                <p className="text-xs text-mint-600 font-medium leading-relaxed">
                                    Give the agent access only to what each task needs. See what it used, when, and why in real-time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual Box */}
                    <div className="md:w-1/2">
                        <div className="bg-mint-900 rounded-3xl h-[400px] w-full flex items-center justify-center p-8 relative overflow-hidden">
                            {/* Subtle background glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-mint-500/20 blur-[80px] rounded-full"></div>

                            {/* Floating UI Elements */}
                            <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
                                {/* Password Field */}
                                <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 flex justify-center shadow-2xl">
                                    <div className="flex gap-2 text-mint-600/70">
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-mint-600"></div>
                                    </div>
                                </div>

                                {/* Accounts Box */}
                                <div className="bg-slate-600/40 backdrop-blur-xl border border-slate-600/50 rounded-[2rem] p-3 shadow-2xl flex flex-col gap-3 relative">
                                    <div className="bg-mint-600/20 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-mint-50 rounded-full flex items-center justify-center font-bold text-lg">
                                            <span className="text-blue-500">G</span>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="h-2.5 w-24 bg-slate-400/50 rounded-full"></div>
                                            <div className="h-2 w-32 bg-mint-600/30 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-mint-600/10 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-mint-50 rounded-full flex items-center justify-center font-bold text-lg">
                                            <span className="text-red-500">M</span>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="h-2.5 w-20 bg-slate-400/30 rounded-full"></div>
                                            <div className="h-2 w-28 bg-mint-600/20 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Mouse Cursor Mockup */}
                                    <div className="absolute right-4 top-1/2 flex items-end gap-1 translate-y-2 drop-shadow-xl animate-bounce">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="black" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="m13 13 6 6" /></svg>
                                        <div className="bg-mint-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full rounded-tl-sm shadow-lg">Digital OP Desk</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};
