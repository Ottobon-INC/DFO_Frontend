import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, CheckCircle, AlertCircle, User, BrainCircuit, X } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const TriageConsole: React.FC = () => {
  const [yellowQueue, setYellowQueue] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadContext, setThreadContext] = useState<any>(null);
  const [takingControl, setTakingControl] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTriage = async () => {
    const userStr = localStorage.getItem('user');
    const loggedInUser = userStr ? JSON.parse(userStr) : null;
    const loggedInNurseId = loggedInUser?.id || loggedInUser?.userId || 'nurse_divya';

    try {
      setLoading(true);
      const res = await api.getNurseQueue();
      const allQueue = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const myQueue = allQueue.filter((item: any) => item.assigned_user_id === loggedInNurseId);
      setYellowQueue(myQueue);
    } catch (err) {
      console.error("Failed to fetch nurse queue", err);
      toast.error('Failed to load triage queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadContext = async (id: string) => {
    try {
      const res = await api.getThreadContext(id);
      const ctx = res.data || res;
      setThreadContext(ctx);
      if (ctx.structured_memory?.summary && ctx.structured_memory.summary !== 'No summary available yet.') {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch thread context", err);
      setThreadContext(null);
    }
  };

  const handleTakeControl = async (id: string) => {
    setTakingControl(true);
    try {
      await api.takeControl(id);
      toast.success("Successfully assigned this thread to yourself!");
      fetchTriage();
      setSelectedThreadId(null);
      setThreadContext(null);
    } catch (err) {
      console.error("Failed to take control", err);
      toast.error("Failed to assign conversation.");
    } finally {
      setTakingControl(false);
    }
  };

  useEffect(() => {
    fetchTriage();
    const interval = setInterval(fetchTriage, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <MessageSquare className="text-brand-primary" /> AI Triage Console
          </h2>
          <p className="text-sm text-brand-textSecondary mt-0.5">Review AI chat handoffs and take control</p>
        </div>
        <button onClick={fetchTriage} className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg/50 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex gap-6">
        {/* Triage Thread List */}
        <div className="w-1/3 min-w-[300px] flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-border bg-brand-bg/20 flex justify-between items-center">
             <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest">Yellow Queue</h3>
             <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-2 py-1 rounded-md">{yellowQueue.length} Active</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {yellowQueue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-brand-primary/50 mb-2" size={32} />
                <p className="text-sm font-bold text-brand-textPrimary mt-4">Queue is clear</p>
                <p className="text-xs text-brand-textSecondary mt-1">No AI chats require nurse intervention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {yellowQueue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedThreadId(item.id);
                      fetchThreadContext(item.id);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedThreadId === item.id 
                        ? 'bg-brand-bg border-brand-primary shadow-sm' 
                        : 'bg-brand-surface border-brand-border hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-brand-textPrimary">{item.patient_name || 'Unknown Patient'}</span>
                      <span className="text-[10px] text-brand-textSecondary">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <span className="inline-block px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md text-[10px] font-bold">
                      Priority: Yellow (Nurse review)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Triage Thread View */}
        <div className="flex-1 flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          {!selectedThreadId ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-brand-textSecondary bg-brand-bg/30">
              <AlertCircle size={64} className="text-brand-textSecondary opacity-30 mb-4 stroke-[1]" />
              <p className="font-bold text-lg text-brand-textPrimary">No Chat Selected</p>
              <p className="text-sm mt-2 max-w-sm">Select a patient query from the queue list to review the AI chat history and self-assign the triage case.</p>
            </div>
          ) : !threadContext ? (
            <div className="flex-grow flex items-center justify-center bg-brand-bg/30">
              <div className="animate-spin text-brand-primary"><RefreshCw size={32} /></div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-brand-border bg-brand-surface flex justify-between items-center shadow-sm z-10">
                <div>
                  <h4 className="font-bold text-lg text-brand-textPrimary flex items-center gap-2">
                    <User className="text-brand-primary" /> {threadContext.thread?.patient_name}
                  </h4>
                  <p className="text-sm text-brand-textSecondary mt-1">Reviewing AI Interaction</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSummaryModal(true)}
                    className="bg-brand-bg border border-brand-border hover:border-brand-primary text-brand-textPrimary text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <BrainCircuit size={14} className="text-brand-primary" /> AI Summary
                  </button>
                  <button
                    onClick={() => handleTakeControl(selectedThreadId)}
                    disabled={takingControl}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <AlertCircle size={16} /> Assign to Myself
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-bg/30 custom-scrollbar">
                {threadContext.messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'HUMAN' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender_type === 'HUMAN' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-brand-surface text-brand-textPrimary border border-brand-border rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h3 className="font-bold text-sm text-brand-primary flex items-center gap-2">
                <BrainCircuit size={16} /> AI Clinical Handoff Summary
              </h3>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm prose-invert max-w-none text-brand-textPrimary">
                {threadContext?.structured_memory?.summary?.split('\n').map((line: string, i: number) => {
                  if (line.trim().startsWith('-')) {
                    return <li key={i} className="ml-4 mb-2 text-sm">{line.substring(1).trim()}</li>;
                  }
                  if (line.trim().startsWith('#')) {
                    return <h4 key={i} className="font-bold text-brand-primary mt-4 mb-2">{line.replace(/#/g, '').trim()}</h4>;
                  }
                  return <p key={i} className="mb-3 text-sm leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
            <div className="p-4 border-t border-brand-border bg-brand-bg/30 flex justify-end">
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2.5 text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
