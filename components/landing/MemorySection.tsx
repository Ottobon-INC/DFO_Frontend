import React from 'react';
import { motion } from 'framer-motion';
import { Search, History, FileText, Calendar, Bell, Folder } from 'lucide-react';

export const MemorySection: React.FC = () => {
    return (
        <section className="py-32 bg-mint-50 overflow-hidden">
            <div className="container mx-auto px-6 max-w-5xl">
                {/* Text Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full mb-24 md:mb-32 text-center md:text-left"
                >
                    <h2 className="text-4xl md:text-[44px] font-medium text-mint-900 mb-6 tracking-tight leading-tight">
                        Context that knows what you're working on.
                    </h2>
                    <p className="text-lg md:text-[20px] text-mint-600 leading-relaxed font-medium">
                        Digital OP Desk knows which EHR records to pull for which patient. It turns your clinical history into intelligent context, so you don't have to repeat information every time. All data stays local and compliant. <a href="#" className="text-mint-500 underline decoration-mint-500/30 underline-offset-4 hover:decoration-mint-500 transition-colors">Learn more</a>
                    </p>
                </motion.div>

                {/* Visual Area */}
                <div className="relative w-full h-[500px] flex justify-center mt-10">
                    
                    {/* Left Chat Bubble */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="absolute left-0 md:left-[5%] top-[10%] bg-mint-100 rounded-3xl rounded-tr-sm p-5 shadow-sm max-w-[280px] z-20"
                    >
                        <p className="text-mint-900 font-medium text-sm leading-relaxed">
                            Find the lab results for the patient I saw yesterday and prep follow-up notes
                        </p>
                    </motion.div>

                    {/* Middle Mockup (Background) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="absolute left-1/2 -translate-x-1/2 md:left-[35%] md:-translate-x-0 top-0 w-80 h-[450px] bg-mint-50 border border-mint-100 rounded-3xl shadow-xl z-10 overflow-hidden flex flex-col"
                    >
                        {/* Browser header */}
                        <div className="h-12 border-b border-mint-100 flex items-center px-4 gap-4 text-mint-600/70">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-mint-200"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-mint-200"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-mint-200"></div>
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="bg-white px-4 py-1 rounded-md text-[10px] font-medium text-mint-600 flex items-center gap-2">
                                    <Search size={10} /> Search history
                                </div>
                            </div>
                        </div>
                        {/* History list */}
                        <div className="p-5 flex-1">
                            <div className="flex items-center gap-2 text-mint-900 text-sm font-bold mb-6">
                                <History size={16} /> History
                            </div>
                            <div className="flex items-center gap-2 text-mint-600/70 text-[10px] font-medium mb-4">
                                By date
                            </div>
                            
                            <div className="bg-white rounded-xl p-3 mb-4">
                                <div className="text-[10px] text-mint-600/70 mb-2">"John Doe"</div>
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-7 h-7 rounded-lg bg-mint-200 text-mint-700 flex items-center justify-center text-[10px] font-bold">JD</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-mint-700">John Doe - Profile</div>
                                            <div className="text-[9px] text-mint-600/70">ehr.hospital.com/patients...</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center opacity-80">
                                        <div className="w-7 h-7 rounded-lg bg-mint-200 text-mint-700 flex items-center justify-center text-[10px] font-bold">JD</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-mint-700">John Doe - Labs</div>
                                            <div className="text-[9px] text-mint-600/70">ehr.hospital.com/labs/...</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center opacity-60">
                                        <div className="w-7 h-7 rounded-lg bg-mint-200 text-mint-700 flex items-center justify-center text-[10px] font-bold">JD</div>
                                        <div>
                                            <div className="text-[11px] font-bold text-mint-700">John Doe - Notes</div>
                                            <div className="text-[9px] text-mint-600/70">ehr.hospital.com/notes...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right AI Thought Process Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="absolute right-0 md:right-[5%] top-[15%] w-full max-w-[420px] bg-mint-50 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-mint-100 p-8 z-30 flex flex-col gap-5"
                    >
                        <p className="text-[13px] text-mint-700 leading-relaxed font-medium">
                            It looks like the patient is John Doe.<br/>
                            He came in for a routine checkup and blood work. I'll use his EHR records to prepare a set of follow-up notes.
                        </p>

                        <div className="flex flex-col gap-3.5 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-mint-500 text-white flex items-center justify-center"><Search size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Opening EHR History</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border border-mint-200 text-mint-600/70 flex items-center justify-center"><FileText size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Downloading John's Lab Results</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border border-mint-200 text-mint-600/70 flex items-center justify-center"><History size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Checking previous visit notes</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-mint-400 text-white flex items-center justify-center"><Calendar size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Finding follow-up schedule from Calendar</span>
                            </div>
                        </div>

                        <p className="text-[13px] text-mint-900 font-semibold leading-relaxed mt-2">
                            I found an available slot on your calendar for tomorrow at 10 AM.<br/>
                            I'll set a reminder and add the prep documents.
                        </p>

                        <div className="flex flex-col gap-3.5 mt-1">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-mint-400 text-white flex items-center justify-center"><Bell size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Setting reminder at 9:30 AM tomorrow</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-mint-900 text-white flex items-center justify-center"><Folder size={10} /></div>
                                <span className="text-xs text-mint-600 font-medium">Saving prep documents to Patient File</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
