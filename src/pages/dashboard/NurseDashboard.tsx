import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Thread, Message } from '../../lib/types';
import { ThreadList } from '../../components/dashboard/ThreadList';
import { ChatWindow } from '../../components/dashboard/ChatWindow';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ThreadInfoPanel } from '../../components/dashboard/ThreadInfoPanel';
import { 
  HeartPulse, 
  Activity, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Timer, 
  ShieldAlert,
  ArrowUpRight 
} from 'lucide-react';
import { sendClinicalMessage } from '../../lib/dfoService';
import { Button } from '../../components/ui/button';

export function NurseDashboard() {
  const { profile } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    assigned: 0,
    active: 0,
    escalated: 0,
    responseTime: '12m'
  });

  const activeThread = threads.find(t => t.id === activeThreadId);

  // Fetch initial threads (Yellow or explicitly assigned to this nurse)
  useEffect(() => {
    if (!profile) return;
    
    const fetchThreads = async () => {
      const { data } = await supabase
        .from('conversation_threads')
        .select('*')
        .or(`status.eq.yellow,assigned_user_id.eq.${profile.id}`)
        .order('updated_at', { ascending: false });
        
      if (data) {
        setThreads(data as Thread[]);
        // Calculate KPIs
        const assigned = data.filter(t => t.assigned_user_id === profile.id).length;
        const active = data.filter(t => t.ownership !== 'closed').length;
        setStats(prev => ({ ...prev, assigned, active }));
      }
    };
    
    fetchThreads();

    // Realtime Sync
    const threadSub = supabase.channel('nurse-threads-prod-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_threads' }, payload => {
        const newThread = payload.new as Thread;
        if (newThread.status === 'yellow' || newThread.status === 'green' || newThread.assigned_user_id === profile.id) {
          setThreads(current => {
            const exists = current.find(t => t.id === newThread.id);
            if (exists) return current.map(t => t.id === newThread.id ? newThread : t);
            return [newThread, ...current];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(threadSub); };
  }, [profile]);

  // Messages fetch
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data as Message[]);
    };
    
    fetchMessages();
  }, [activeThreadId]);

  const handleEscalate = async () => {
    if (!activeThreadId) return;
    // Escalate means changing status to Red and unassigning or assigning to doctor role
    try {
      await supabase
        .from('conversation_threads')
        .update({ status: 'red', assigned_role: 'Doctor', assigned_user_id: null })
        .eq('id', activeThreadId);
      
      setActiveThreadId(null);
      alert("Case escalated to Attending Doctor successfully.");
    } catch (err) {
      console.error("Escalation failed:", err);
    }
  };

  return (
    <DashboardLayout 
      activeMenu="inbox"
      rightPanel={activeThread ? <ThreadInfoPanel thread={activeThread} /> : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
          <Activity className="w-12 h-12 mb-4 text-sky-400" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-loose text-slate-500">
            Select a care thread to view <br /> Clinical Intelligence
          </p>
        </div>
      )}
    >
      <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-hidden bg-slate-50/10">
        {/* TOP HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Nurse Care Station</h1>
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-[0.25em] flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
               Continuous Care Support Active
            </p>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Assigned Patients', value: stats.assigned, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Active Conversations', value: stats.active, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Escalated Cases', value: stats.escalated, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Response Time', value: stats.responseTime, icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className={`p-3.5 ${kpi.bg} ${kpi.color} rounded-2xl`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-xl font-black text-slate-900">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex overflow-hidden rounded-xl border border-slate-200/60 shadow-premium bg-white min-h-0">
          {/* THREADS COLUMN (Yellow/Green) */}
          <div className="w-85 flex-shrink-0 flex flex-col border-r border-slate-50 bg-white">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  Primary Care Queue
                </span>
             </div>
             <div className="flex-1 overflow-hidden">
                <ThreadList 
                   threads={threads} 
                   selectedThreadId={activeThreadId}
                   onSelectThread={setActiveThreadId}
                />
             </div>
          </div>

          {/* CHAT ZONE */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
             {activeThread ? (
               <>
                 <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                             <HeartPulse className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patient Triage</p>
                             <h2 className="text-sm font-black text-slate-900 uppercase">{(activeThread.metadata as any)?.patient_name || activeThread.id.slice(0,8)}</h2>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button 
                         onClick={handleEscalate}
                         className="bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white px-6 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group"
                       >
                         <ShieldAlert className="w-4 h-4 mr-2" />
                         Escalate to Doctor
                         <ArrowUpRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                       </Button>
                    </div>
                 </div>
                 <div className="flex-1 min-h-0">
                    <ChatWindow 
                      thread={activeThread}
                      messages={messages}
                      currentRole="Nurse"
                      onSendMessage={(msg) => sendClinicalMessage(activeThread.id, 'Nurse', profile!.id, msg)}
                    />
                 </div>
               </>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/20 text-slate-400 p-12">
                  <div className="w-32 h-32 bg-white rounded-xl shadow-premium flex items-center justify-center mb-10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-sky-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                    <HeartPulse className="w-16 h-16 text-sky-100 group-hover:text-sky-400 transition-colors duration-500" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Triage Readiness</h2>
                  <p className="text-sm font-bold text-slate-400/80 max-w-sm text-center leading-relaxed tracking-wide">
                    Select a yellow-status thread to start providing clinical support. Your responses guide the maternal journey.
                  </p>
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
