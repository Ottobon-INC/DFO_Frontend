import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, Users, LayoutDashboard, CheckSquare, MessageSquare, Activity, Clock } from 'lucide-react';

interface HeroSectionProps {
    onLoginClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick }) => {
    const [activeTab, setActiveTab] = useState('Current Consultation');

    const getSidebarItemClass = (tabName: string, isTab: boolean = false) => {
        if (isTab) {
            return `flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                activeTab === tabName 
                    ? 'bg-slate-100 text-slate-800' 
                    : 'hover:bg-slate-50 text-slate-600'
            }`;
        }
        return `flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
            activeTab === tabName 
                ? 'bg-slate-100 text-slate-800' 
                : 'hover:bg-slate-50 text-slate-600'
        }`;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'OPD Queue':
                return (
                    <motion.div key="opd" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-slate-800">Today's Queue</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">3 Waiting</span>
                        </div>
                        {[
                            { name: 'Sarah Jenkins', time: '10:00 AM', status: 'Waiting', type: 'Follow-up' },
                            { name: 'Michael Chen', time: '10:15 AM', status: 'Vitals taken', type: 'New Patient' },
                            { name: 'Emma Watson', time: '10:45 AM', status: 'Checked in', type: 'Consultation' }
                        ].map((patient, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between hover:border-mint-300 transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-mint-100 flex items-center justify-center text-mint-700 font-medium">
                                        {patient.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800">{patient.name}</div>
                                        <div className="text-xs text-slate-500">{patient.type}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-700">{patient.time}</div>
                                    <div className="text-xs text-amber-600">{patient.status}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'Patient Records':
                return (
                    <motion.div key="records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto">
                        <div className="mb-6 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Search by name, ID, or phone number..." className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-mint-500 transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Users size={14} className="text-slate-500" /></div>
                                        <div>
                                            <div className="font-medium text-slate-800 text-sm">Patient Name {i}</div>
                                            <div className="text-[10px] text-slate-400">ID: PT-{1000 + i}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-[10px]">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Asthma</span>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">Hypertension</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'Appointments':
                return (
                    <motion.div key="appts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto text-center py-12">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">Schedule Overview</h3>
                        <p className="text-sm text-slate-500 mb-6">Manage your daily, weekly, and monthly appointments seamlessly.</p>
                        <button className="bg-mint-600 hover:bg-mint-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors">
                            Book New Appointment
                        </button>
                    </motion.div>
                );
            case 'Pending Reports':
                return (
                    <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-slate-800">Lab Results to Review</h3>
                        </div>
                        {[
                            { test: 'Complete Blood Count', patient: 'Alice Smith', urgency: 'Normal', date: 'Today, 8:00 AM' },
                            { test: 'Lipid Panel', patient: 'Bob Jones', urgency: 'Abnormal', date: 'Yesterday' }
                        ].map((report, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between hover:border-mint-300 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${report.urgency === 'Abnormal' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                    <div>
                                        <div className="font-medium text-slate-800 text-sm">{report.test}</div>
                                        <div className="text-xs text-slate-500">{report.patient}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400 mb-1">{report.date}</div>
                                    <button className="text-[10px] text-mint-600 font-medium hover:underline">Review Result</button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'Current Consultation':
            default:
                return (
                    <motion.div key="consult" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center bg-slate-100 rounded-full px-4 py-1.5 text-xs text-slate-600 font-medium mb-4">
                                Current Consultation
                            </div>
                            <p className="text-slate-600 text-sm">
                                First, let's review the patient's vitals and past medical history before the consultation begins.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <Search size={14} className="text-blue-500" />
                                    <span className="font-medium text-slate-600">Searched recent lab results and past prescriptions</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px]">JV</div>
                                        Patient Vitals | John Doe
                                    </div>
                                    <span className="text-xs text-slate-400">2m ago</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-amber-600 text-[10px]">Rx</div>
                                        Previous E-Prescription
                                    </div>
                                    <span className="text-xs text-slate-400">3w ago</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mt-6">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-emerald-500" />
                                    <span className="font-medium text-slate-600">Open Consultation Notes</span>
                                </div>
                            </div>
                            <div className="h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                                Digital Prescription UI
                            </div>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-20 overflow-hidden bg-sky-100 bg-[url('/new-hero-bg.png')] bg-cover bg-center bg-no-repeat">

            <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >


                    <h1 className="text-4xl md:text-[3.5rem] font-medium text-slate-900 mb-8 tracking-tight leading-[1.1]">
                        The most intelligent clinical OS,<br />
                        but it's simple to use.
                    </h1>

                    <div className="flex items-center justify-center mb-16">
                        <button
                            onClick={onLoginClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full font-medium text-sm shadow-md hover:bg-slate-800 transition-colors"
                        >
                            <Plus size={16} /> Access Portal
                        </button>
                    </div>
                </motion.div>

                {/* Central Mockup Window - Browser Style */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative mx-auto w-full max-w-[1000px] h-[600px] rounded-xl bg-white shadow-2xl overflow-hidden flex border border-slate-200"
                >
                    {/* Sidebar */}
                    <div className="w-[240px] bg-[#FDFDFD] border-r border-slate-100 flex flex-col h-full flex-shrink-0">
                        {/* Traffic Lights & User */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                    <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-medium">Work </span>
                                <span className="text-[10px] text-slate-400">▼</span>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="px-3 mb-4">
                            <div className="bg-slate-100/80 rounded-md py-1.5 px-2 flex items-center gap-2 text-slate-400">
                                <Search size={14} />
                                <span className="text-xs">Search</span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto px-2">
                            <div className="text-[10px] font-semibold text-slate-400 px-2 mb-2 uppercase tracking-wider">Favorites</div>
                            <div className="flex flex-col gap-0.5 mb-6">
                                <div className={getSidebarItemClass('OPD Queue')} onClick={() => setActiveTab('OPD Queue')}>
                                    <LayoutDashboard size={14} className="text-blue-500" />
                                    <span className="text-sm font-medium">OPD Queue</span>
                                </div>
                                <div className={getSidebarItemClass('Patient Records')} onClick={() => setActiveTab('Patient Records')}>
                                    <Users size={14} className="text-emerald-500" />
                                    <span className="text-sm font-medium">Patient Records</span>
                                </div>
                                <div className={getSidebarItemClass('Appointments')} onClick={() => setActiveTab('Appointments')}>
                                    <Calendar size={14} className="text-rose-500" />
                                    <span className="text-sm font-medium">Appointments</span>
                                </div>
                            </div>

                            <div className="text-[10px] font-semibold text-slate-400 px-2 mb-2 uppercase tracking-wider">Tabs</div>
                            <div className="flex flex-col gap-0.5">
                                <div className={getSidebarItemClass('Current Consultation', true)} onClick={() => setActiveTab('Current Consultation')}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-sky-500 rounded-sm flex items-center justify-center"><CheckSquare size={10} className="text-white" /></div>
                                        <span className="text-xs font-medium truncate w-32">Current Consultation</span>
                                    </div>
                                    {activeTab === 'Current Consultation' && <span className="text-[10px] text-slate-400">x</span>}
                                </div>
                                <div className={getSidebarItemClass('Pending Reports', true)} onClick={() => setActiveTab('Pending Reports')}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-indigo-500 rounded-sm flex items-center justify-center"><MessageSquare size={10} className="text-white" /></div>
                                        <span className="text-xs font-medium truncate w-32">Pending Reports</span>
                                    </div>
                                    {activeTab === 'Pending Reports' && <span className="text-[10px] text-slate-400">x</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white flex flex-col relative">
                        {/* Top Bar */}
                        <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-4">
                            <div className="flex gap-2 text-slate-400">
                                <span>{"<"}</span>
                                <span>{">"}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-1 text-xs text-slate-500 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-mint-500 rounded-full flex items-center justify-center text-[8px] text-white">D</span>
                                    app.digitalopdesk.com / consultation
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
                            <AnimatePresence mode="wait">
                                {renderContent()}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Input Area */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] max-w-lg bg-white rounded-full shadow-lg border border-slate-200 p-2 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Plus size={14} />
                            </div>
                            <input type="text" placeholder="Reply, @ for context" className="flex-1 bg-transparent outline-none text-sm px-2 text-slate-700" />
                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white">
                                <span className="text-[10px]">↑</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
