import React from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Check, FileText } from 'lucide-react';

export const OSLayers: React.FC = () => {
    return (
        <section id="platform" className="py-24 bg-mint-50 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Card 1 - Operations (Signing In) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="group flex flex-col gap-6"
                    >
                        {/* Image Block */}
                        <div className="relative rounded-[2rem] h-[400px] overflow-hidden bg-gradient-to-br from-mint-200 via-mint-100 to-white flex flex-col items-center pt-10 px-6">

                            
                            {/* UI Mockup - Sign in Form */}
                            <div className="w-full max-w-[280px] bg-mint-50 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden flex-1 translate-y-12 group-hover:translate-y-8 transition-transform duration-500">
                                <div className="bg-[#6B21A8] h-12 flex items-center justify-center text-white font-bold text-sm tracking-wide">
                                    Digital OP Desk OS
                                </div>
                                <div className="p-6">
                                    <h4 className="font-bold text-mint-900 mb-4">Sign in to Hospital EHR</h4>
                                    <div className="text-[10px] text-mint-600 mb-1">Email</div>
                                    <div className="h-8 border border-mint-200 rounded-md mb-4 bg-white relative flex items-center">
                                        {/* Cursor arrow mockup */}
                                        <div className="absolute right-2 -bottom-3 z-10 text-mint-900">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                                        </div>
                                    </div>
                                    <div className="h-8 bg-[#6B21A8] rounded-md flex items-center justify-center text-white text-xs font-medium mb-4">
                                        Continue
                                    </div>
                                    <div className="text-[8px] text-mint-600/70 text-center">
                                        By clicking "Continue" you agree to User Terms of Service.
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Text below */}
                        <div>
                            <p className="text-mint-700 font-medium">
                                <strong className="text-mint-900">Operations</strong> Digital OP Desk signs in and works across your scheduling, EHR, and internal tools.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2 - Communications (Messaging) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="group flex flex-col gap-6"
                    >
                        {/* Image Block */}
                        <div className="relative rounded-[2rem] h-[400px] overflow-hidden bg-gradient-to-br from-mint-300 via-mint-100 to-mint-50 flex flex-col items-center pt-10 px-6">
                            {/* Pill */}
                            <div className="bg-mint-50/90 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-sm text-mint-900 font-semibold text-sm mb-6 self-start z-10 max-w-[80%]">
                                Schedule a follow-up with Dr. Smith's patients
                            </div>
                            
                            {/* UI Mockup - Messaging App */}
                            <div className="w-[120%] bg-mint-50 rounded-t-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden flex-1 translate-y-12 group-hover:translate-y-8 transition-transform duration-500 flex flex-col">
                                <div className="p-3 border-b border-mint-100 flex items-center gap-2">
                                    <span className="font-bold text-mint-900 text-sm">Messaging</span>
                                    <div className="flex-1 bg-white border border-mint-200 rounded-md px-2 py-1 flex items-center gap-1 text-mint-600/70">
                                        <Search size={10} />
                                        <span className="text-[10px]">Search messages</span>
                                    </div>
                                </div>
                                <div className="flex px-3 py-2 gap-2 text-[10px] font-medium border-b border-slate-50">
                                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full">Focused</span>
                                    <span className="border border-mint-200 text-mint-700 px-2 py-0.5 rounded-full">Patients</span>
                                    <span className="border border-mint-200 text-mint-700 px-2 py-0.5 rounded-full">Staff</span>
                                </div>
                                <div className="flex-1 p-3 flex flex-col gap-3">
                                    {/* Chat item 1 */}
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="avatar"/></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="text-xs font-bold text-mint-900">Sarah Chen</span>
                                                <span className="text-[9px] text-mint-600/70">June 9</span>
                                            </div>
                                            <div className="text-[10px] text-mint-600 leading-tight">Thanks for the update! Happy to connect during...</div>
                                        </div>
                                    </div>
                                    {/* Chat item 2 */}
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden"><img src="https://i.pravatar.cc/100?img=11" alt="avatar"/></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="text-xs font-bold text-mint-900">Marcus Williams</span>
                                                <span className="text-[9px] text-mint-600/70">June 8</span>
                                            </div>
                                            <div className="text-[10px] text-mint-600 leading-tight">Hey Jun, definitely down to grab coffee at...</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating reply mockup */}
                                <div className="absolute right-4 bottom-8 bg-slate-100 rounded-lg p-2 shadow-md max-w-[60%]">
                                    <div className="text-[10px] text-mint-700 font-medium">Sounds great! Grab a time in here: cal...</div>
                                </div>
                            </div>
                        </div>
                        {/* Text below */}
                        <div>
                            <p className="text-mint-700 font-medium">
                                <strong className="text-mint-900">Communications</strong> Digital OP Desk handles comments, replies, and follow-ups for you.
                            </p>
                        </div>
                    </motion.div>


                </div>
            </div>
        </section>
    );
};
