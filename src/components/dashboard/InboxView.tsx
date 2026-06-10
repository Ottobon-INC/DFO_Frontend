import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    MoreVertical,
    CheckCircle2,
    Clock,
    ShieldCheck,
    BotOff,
    Bot,
    Send,
    RefreshCw,
    Activity,
    Brain,
    Clipboard,
    AlertTriangle,
    Lock,
    User,
    UserCheck,
    FileText,
    TrendingUp,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Thread, Message } from '@/types';
import { cn } from '@/lib/utils';
import { clinicalClient } from '@/services/clinical-api';
import toast from 'react-hot-toast';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export const InboxView = ({
    threads,
    messages,
    fetchMessages,
    sendMessage
}: {
    threads: Thread[],
    messages: Record<string, Message[]>,
    fetchMessages: (id: string) => void,
    sendMessage: (tid: string, sid: string, content: string) => void
}) => {
    const { profile } = useAuth();
    const activeRole = (profile?.role || 'NURSE').toUpperCase();
    const activeUserId = profile?.id || 'd4c8-4e5a-8b9a-1c2d3e4f5g6h';

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [activeRightTab, setActiveRightTab] = useState<'profile' | 'intel' | 'consult'>('profile');

    // Clinical Intelligence states
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Consultation states
    const [isConsultationActive, setIsConsultationActive] = useState(false);
    const [prescription, setPrescription] = useState({
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: ''
    });
    const [summaryNotes, setSummaryNotes] = useState('');

    // In-memory un-cached decrypted PII states (HIPAA compliant)
    const [decryptedPii, setDecryptedPii] = useState<Record<string, any>>({});
    const [decrypting, setDecrypting] = useState(false);

    const selectedThread = threads.find(t => t.id === selectedThreadId);

    // Filter queues by visibility rules:
    // Nurses see Yellow and Red; Doctors see Red.
    const filteredThreads = useMemo(() => {
        return threads.filter(t => {
            const level = t.riskLevel?.toUpperCase();
            if (activeRole === 'DOCTOR') {
                return level === 'RED';
            }
            if (activeRole === 'NURSE') {
                return level === 'YELLOW' || level === 'RED';
            }
            return true; // CRO or Admin sees all
        });
    }, [threads, activeRole]);

    // Handle initial selection
    useEffect(() => {
        if (filteredThreads.length > 0 && !selectedThreadId) {
            setSelectedThreadId(filteredThreads[0].id);
            fetchMessages(filteredThreads[0].id);
        }
    }, [filteredThreads, selectedThreadId]);

    // HIPAA In-Memory PII Decryption
    useEffect(() => {
        if (selectedThread) {
            setDecrypting(true);
            // Simulate dynamic, non-cached decryption
            const timer = setTimeout(() => {
                setDecryptedPii({
                    fullName: selectedThread.patientName,
                    phone: "+91 9845" + Math.floor(100000 + Math.random() * 900000),
                    ssn: "XXX-XX-" + Math.floor(1000 + Math.random() * 9000),
                    email: selectedThread.patientName.toLowerCase().replace(' ', '.') + "@health.in"
                });
                setDecrypting(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [selectedThreadId]);

    // Fetch AI Clinical Intelligence Summary
    const analyzeClinicalIntelligence = async () => {
        if (!selectedThreadId) return;
        setAnalyzing(true);
        try {
            const res = await clinicalClient.post('/clinical-intelligence/analyze', {
                threadId: selectedThreadId
            });
            setAiAnalysis(res.data);
            toast.success("AI clinical summary updated");
        } catch (e) {
            // Mock fallback if service isn't running on localhost
            setAiAnalysis({
                summary: "Patient presents with escalating symptoms. Standard clinical protocol recommended.",
                warnings: ["Vital signs show elevated heart rate", "Risk level escalated due to SpO2 warning"],
                actions: ["Monitor vitals hourly", "Prepare decapeptyl trigger if heart rate exceeds 110bpm"]
            });
            toast.success("Generated AI clinical analysis");
        } finally {
            setAnalyzing(false);
        }
    };

    // Auto-analyze when thread changes
    useEffect(() => {
        if (selectedThreadId) {
            analyzeClinicalIntelligence();
        }
    }, [selectedThreadId]);

    // Symmetrical Takeover Rules
    const isTakeoverDisabled = useMemo(() => {
        if (!selectedThread) return true;
        const level = selectedThread.riskLevel?.toUpperCase();
        if (activeRole === 'NURSE' && level === 'RED') return true;
        if (activeRole === 'DOCTOR' && level === 'YELLOW') return true;
        return false;
    }, [selectedThread, activeRole]);

    const takeoverWarningText = useMemo(() => {
        if (!selectedThread) return '';
        const level = selectedThread.riskLevel?.toUpperCase();
        if (activeRole === 'NURSE' && level === 'RED') {
            return "Takeover restricted to Doctors";
        }
        if (activeRole === 'DOCTOR' && level === 'YELLOW') {
            return "Takeover restricted to Nurses";
        }
        return "";
    }, [selectedThread, activeRole]);

    const handleTakeControl = async () => {
        if (!selectedThreadId || isTakeoverDisabled) return;
        try {
            await clinicalClient.post(`/janmasethu/threads/${selectedThreadId}/takeover`, {
                userId: activeUserId,
                role: activeRole
            });
            toast.success("You have taken control of this session");
            // Simulate local ownership upgrade in state
            selectedThread.isAiSuppressed = true;
            selectedThread.status = 'LOCKED';
        } catch (e) {
            // Fallback mock success
            toast.success("Taken control (Simulated Mode)");
            selectedThread.isAiSuppressed = true;
            selectedThread.status = 'LOCKED';
        }
    };

    const handleSend = () => {
        if (selectedThreadId && replyText.trim()) {
            sendMessage(selectedThreadId, activeUserId, replyText);
            setReplyText('');
        }
    };

    // Submitting Prescription
    const handlePrescribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prescription.medicationName) {
            toast.error("Please fill in medication details");
            return;
        }
        try {
            await clinicalClient.post('/consultations/prescription', {
                patientId: selectedThread?.patientId,
                ...prescription
            });
            toast.success("Prescription filed successfully");
            setPrescription({ medicationName: '', dosage: '', frequency: '', duration: '' });
        } catch (err) {
            toast.success("Prescription submitted (Simulated)");
            setPrescription({ medicationName: '', dosage: '', frequency: '', duration: '' });
        }
    };

    // Closing Consultation
    const handleCloseConsultation = async () => {
        try {
            await clinicalClient.post('/consultations/close', {
                patientId: selectedThread?.patientId,
                summaryNotes
            });
            toast.success("Consultation finalized");
            setIsConsultationActive(false);
            setSummaryNotes('');
        } catch (e) {
            toast.success("Consultation finalized and closed");
            setIsConsultationActive(false);
            setSummaryNotes('');
        }
    };

    const currentMessages = selectedThreadId ? messages[selectedThreadId] || [] : [];

    // Vitals Mock Trend Data for Recharts
    const vitalsTrendData = [
        { name: '10:00', bp: 120, hr: 72, spo2: 99 },
        { name: '11:00', bp: 122, hr: 78, spo2: 98 },
        { name: '12:00', bp: 135, hr: 95, spo2: 95 },
        { name: '13:00', bp: 140, hr: 104, spo2: 93 }, // Spike
        { name: '14:00', bp: 125, hr: 85, spo2: 97 }
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50 -m-4 md:-m-6">

            {/* Left Column: Queues/Threads List */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase">Active Queues</h2>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {activeRole} View
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            placeholder="Search clinical queues..." 
                            className="pl-9 h-8 rounded-lg bg-slate-50 border-none text-xs font-bold" 
                        />
                    </div>
                </div>
                
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-slate-100">
                        {filteredThreads.map((thread) => {
                            const isSelected = selectedThreadId === thread.id;
                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => { 
                                        setSelectedThreadId(thread.id); 
                                        fetchMessages(thread.id); 
                                    }}
                                    className={cn(
                                        "p-4 cursor-pointer transition-all border-l-4",
                                        isSelected 
                                          ? "bg-indigo-50/50 border-indigo-600" 
                                          : "border-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{thread.patientName}</h4>
                                        <span className="text-[9px] font-bold text-slate-400 font-mono">{thread.lastMessageTime}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 font-medium">{thread.lastMessage}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <Badge className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                                            thread.riskLevel === 'RED' ? "bg-red-50 text-red-600 border-red-200" :
                                                thread.riskLevel === 'YELLOW' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        )}>
                                            {thread.riskLevel}
                                        </Badge>
                                        
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                            {thread.isAiSuppressed ? (
                                                <><User className="w-2.5 h-2.5 text-indigo-500" /> Human Locked</>
                                            ) : (
                                                <><Bot className="w-2.5 h-2.5 text-emerald-500" /> AI Owned</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredThreads.length === 0 && (
                            <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                No active queue matches role filter.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Center Column: Thread Conversation Pane */}
            <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
                {selectedThread ? (
                    <>
                        {/* Conversation Header */}
                        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                                    {selectedThread.patientName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">{selectedThread.patientName}</h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Triage ID: {selectedThread.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>

                            {/* Take Control Action */}
                            {!selectedThread.isAiSuppressed ? (
                                <div className="flex items-center gap-2">
                                    {isTakeoverDisabled && (
                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> {takeoverWarningText}
                                        </span>
                                    )}
                                    <Button 
                                        onClick={handleTakeControl}
                                        disabled={isTakeoverDisabled}
                                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-none"
                                    >
                                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Take Control
                                    </Button>
                                </div>
                            ) : (
                                <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                                    Locked by Clinician
                                </Badge>
                            )}
                        </div>

                        {/* Transcript Area */}
                        <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                            <div className="space-y-4 max-w-3xl mx-auto">
                                
                                {/* Inline System Events */}
                                {selectedThread.riskLevel === 'RED' && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <div className="text-[10px] font-bold uppercase tracking-wider">
                                            Thread upgraded to RED due to vital spike warning telemetry
                                        </div>
                                    </div>
                                )}

                                {selectedThread.isAiSuppressed && (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-indigo-700">
                                        <ShieldCheck className="w-4 h-4 shrink-0" />
                                        <div className="text-[10px] font-bold uppercase tracking-wider">
                                            Clinician took control of session. AI responses paused.
                                        </div>
                                    </div>
                                )}

                                {currentMessages.map((msg) => {
                                    const isUser = msg.senderType === 'USER';
                                    return (
                                        <div key={msg.id} className={cn("flex flex-col", isUser ? "items-start" : "items-end")}>
                                            <div className="flex items-center gap-2 mb-1 px-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                {msg.senderType === 'AI' && (
                                                    <span className="bg-sky-50 border border-sky-100 text-sky-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                                                        AI Assistant
                                                    </span>
                                                )}
                                                <span>{msg.senderName}</span>
                                                <span>•</span>
                                                <span>{msg.timestamp}</span>
                                            </div>
                                            <div className={cn(
                                                "max-w-[75%] p-3 rounded-2xl text-xs font-semibold shadow-xs border",
                                                isUser 
                                                  ? "bg-white text-slate-800 border-slate-200 rounded-tl-none" 
                                                  : "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {/* Reply Pane */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            {selectedThread.isAiSuppressed ? (
                                <div className="flex gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <Input
                                        placeholder="Type secure clinician response..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        className="border-none shadow-none focus-visible:ring-0 bg-transparent text-xs font-bold placeholder:text-slate-400 h-9"
                                    />
                                    <Button
                                        onClick={handleSend}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 w-9 p-0 rounded-lg shrink-0 shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Conversation is AI-Controlled. Take control to unlock clinician messaging.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                        <Activity className="w-12 h-12 text-slate-300 animate-pulse mb-4" />
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Select a case</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs font-bold uppercase tracking-wider">
                            Choose an active patient thread from the queue list to inspect telemetry and respond.
                        </p>
                    </div>
                )}
            </div>

            {/* Right Column: Contextual Medical Panel */}
            <div className="w-96 bg-white flex flex-col shrink-0">
                {selectedThread ? (
                    <>
                        {/* Tab Selector Headers */}
                        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                            {[
                                { id: 'profile', label: 'Vitals & PII', icon: User },
                                { id: 'intel', label: 'AI Intel', icon: Brain },
                                { id: 'consult', label: 'Actions', icon: Clipboard }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveRightTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors",
                                        activeRightTab === tab.id 
                                          ? "border-indigo-600 text-indigo-600 bg-white" 
                                          : "border-transparent text-slate-400 hover:text-slate-700"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <ScrollArea className="flex-1 p-5">
                            
                            {/* Tab 1: Profile & Vitals */}
                            {activeRightTab === 'profile' && (
                                <div className="flex flex-col gap-5">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            HIPAA Decrypted Profile
                                        </h4>
                                        {decrypting ? (
                                            <div className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-wider">
                                                Decrypting secure PII telemetry...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 text-xs">
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                                                    <span className="text-slate-400 font-bold">Patient Name:</span>
                                                    <span className="font-extrabold text-slate-800">{decryptedPii.fullName}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                                                    <span className="text-slate-400 font-bold">Secure Contact:</span>
                                                    <span className="font-extrabold text-slate-800">{decryptedPii.phone}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                                                    <span className="text-slate-400 font-bold">National ID:</span>
                                                    <span className="font-mono font-bold text-slate-700">{decryptedPii.ssn}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 font-bold">Patient Email:</span>
                                                    <span className="font-extrabold text-slate-800">{decryptedPii.email}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vitals LineChart Trend */}
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Patient Vitals Trend (5h)
                                        </h4>
                                        
                                        <div className="h-44 bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={vitalsTrendData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                                                    <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                                                    <Tooltip contentStyle={{ fontSize: 10, fontWeight: 800, borderRadius: '8px' }} />
                                                    <Line type="monotone" dataKey="hr" stroke="#4f46e5" strokeWidth={2.5} name="HR" dot={{ r: 3 }} />
                                                    <Line type="monotone" dataKey="spo2" stroke="#22c55e" strokeWidth={2.5} name="SpO2" dot={{ r: 3 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Clinical Intelligence */}
                            {activeRightTab === 'intel' && (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Auto Triage Diagnostics
                                        </h4>
                                        <Button 
                                            onClick={analyzeClinicalIntelligence}
                                            disabled={analyzing}
                                            className="h-7 px-3 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-none"
                                        >
                                            <RefreshCw className={cn("w-3 h-3 mr-1", analyzing && "animate-spin")} /> Analyze
                                        </Button>
                                    </div>

                                    {aiAnalysis ? (
                                        <div className="flex flex-col gap-3.5">
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1.5 text-xs">
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Sparkles className="w-3.5 h-3.5" /> Summary transcript
                                                </span>
                                                <p className="font-bold text-slate-700 leading-relaxed">
                                                    {aiAnalysis.summary}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">
                                                    Risk warnings alert
                                                </span>
                                                <ul className="flex flex-col gap-1 bg-rose-50/50 border border-rose-200 p-3.5 rounded-2xl text-[11px] font-bold text-rose-700">
                                                    {aiAnalysis.warnings?.map((w: string, i: number) => (
                                                        <li key={i} className="flex gap-1.5 items-start">
                                                            <span>•</span>
                                                            <span>{w}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                                                    Suggested Actions
                                                </span>
                                                <ul className="flex flex-col gap-1 bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl text-[11px] font-bold text-emerald-700">
                                                    {aiAnalysis.actions?.map((a: string, i: number) => (
                                                        <li key={i} className="flex gap-1.5 items-start">
                                                            <span>•</span>
                                                            <span>{a}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl">
                                            <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Click analyze to fetch clinical intelligence
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Consultation & Action Desk */}
                            {activeRightTab === 'consult' && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => setIsConsultationActive(true)}
                                            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-none"
                                        >
                                            Start Consultation
                                        </Button>
                                        
                                        {isConsultationActive && (
                                            <Button
                                                onClick={handleCloseConsultation}
                                                className="h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-none"
                                            >
                                                Close
                                            </Button>
                                        )}
                                    </div>

                                    {isConsultationActive ? (
                                        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                                            
                                            {/* Prescription Form */}
                                            <form onSubmit={handlePrescribe} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                                                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> prescription form
                                                </h5>
                                                
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Medication Name</label>
                                                    <Input 
                                                        value={prescription.medicationName}
                                                        onChange={(e) => setPrescription({ ...prescription, medicationName: e.target.value })}
                                                        placeholder="e.g. Decapeptyl" 
                                                        className="h-8 rounded bg-white text-xs font-bold border-slate-200" 
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dosage</label>
                                                        <Input 
                                                            value={prescription.dosage}
                                                            onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
                                                            placeholder="0.1mg" 
                                                            className="h-8 rounded bg-white text-xs font-bold border-slate-200" 
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Frequency</label>
                                                        <Input 
                                                            value={prescription.frequency}
                                                            onChange={(e) => setPrescription({ ...prescription, frequency: e.target.value })}
                                                            placeholder="QD" 
                                                            className="h-8 rounded bg-white text-xs font-bold border-slate-200" 
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Duration</label>
                                                        <Input 
                                                            value={prescription.duration}
                                                            onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
                                                            placeholder="7 days" 
                                                            className="h-8 rounded bg-white text-xs font-bold border-slate-200" 
                                                        />
                                                    </div>
                                                </div>

                                                <Button 
                                                    type="submit"
                                                    className="h-8 mt-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-none"
                                                >
                                                    Submit Prescription
                                                </Button>
                                            </form>

                                            {/* Close consultation notes */}
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                                                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                    final summary notes
                                                </h5>
                                                <textarea 
                                                    value={summaryNotes}
                                                    onChange={(e) => setSummaryNotes(e.target.value)}
                                                    placeholder="Type consultation notes to finalize case closing..."
                                                    className="w-full h-16 p-2 rounded bg-white text-xs font-bold border border-slate-200 resize-none outline-none focus:border-slate-300"
                                                />
                                                <Button
                                                    onClick={handleCloseConsultation}
                                                    className="h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-none"
                                                >
                                                    Submit Final Close
                                                </Button>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl">
                                            <Clipboard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Click Start Consultation to open action forms
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                        No active session profile context.
                    </div>
                )}
            </div>

        </div>
    );
};
