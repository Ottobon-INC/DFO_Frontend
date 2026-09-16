import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Phone, FileText } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const PatientFollowUps: React.FC<{ patientId: string }> = ({ patientId }) => {
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // New follow-up state
    const [isAdding, setIsAdding] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newReason, setNewReason] = useState('');

    const fetchFollowUps = async () => {
        setIsLoading(true);
        try {
            const res = await api.getFollowUps({ patient_id: patientId });
            if (res && res.success) {
                setFollowUps(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch follow-ups:', error);
            toast.error('Failed to load follow-ups');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, [patientId]);

    const handleAddFollowUp = async () => {
        if (!newDate) {
            toast.error("Please select a date");
            return;
        }

        try {
            await api.createFollowUp({
                patient_id: patientId,
                follow_up_date: newDate,
                reason: newReason
            });
            toast.success("Follow-up scheduled successfully");
            setIsAdding(false);
            setNewDate('');
            setNewReason('');
            fetchFollowUps();
        } catch (error) {
            toast.error("Failed to schedule follow-up");
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await api.updateFollowUp(id, { status: newStatus });
            toast.success("Status updated");
            fetchFollowUps();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Follow-Ups</h2>
                        <p className="text-xs text-slate-500">Track and schedule patient return visits</p>
                    </div>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus size={16} /> Schedule
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm animate-fade-in space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Schedule New Follow-up</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                            <input 
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reason (Optional)</label>
                            <input 
                                type="text"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                placeholder="Why are they returning?"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAddFollowUp}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
                        >
                            <Calendar size={16} /> Save Follow-up
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-slate-500 flex justify-center"><Calendar className="animate-spin" /></div>
            ) : followUps.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm">
                        <Calendar size={24} />
                    </div>
                    <h3 className="font-bold text-slate-700 mb-1">No Follow-ups</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">This patient has no scheduled follow-up visits.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {followUps.map((f: any) => (
                        <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    f.status === 'Completed' || f.status === 'Appointment Booked' ? 'bg-emerald-100 text-emerald-600' :
                                    f.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' :
                                    f.status === 'Called' ? 'bg-amber-100 text-amber-600' :
                                    'bg-sky-100 text-sky-600'
                                }`}>
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm">
                                            {new Date(f.follow_up_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            f.status === 'Completed' || f.status === 'Appointment Booked' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            f.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                            f.status === 'Called' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            'bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}>
                                            {f.status}
                                        </span>
                                    </div>
                                    {f.reason && <p className="text-sm text-slate-600 flex items-start gap-1"><FileText size={14} className="mt-0.5 opacity-50 shrink-0"/> {f.reason}</p>}
                                    {f.doctor && <p className="text-[11px] text-slate-500 mt-1">Recommended by: {f.doctor.name}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                                {f.status === 'Pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(f.id, 'Called')}
                                            className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors tooltip"
                                            title="Mark as Called"
                                        >
                                            <Phone size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(f.id, 'Appointment Booked')}
                                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors tooltip"
                                            title="Mark as Appointment Booked"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(f.id, 'Cancelled')}
                                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors tooltip"
                                            title="Cancel Follow-up"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
