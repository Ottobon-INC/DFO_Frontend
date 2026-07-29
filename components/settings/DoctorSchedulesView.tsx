import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorSchedulesViewProps {
    userRole: string;
    currentUser: any;
}

export const DoctorSchedulesView: React.FC<DoctorSchedulesViewProps> = ({ userRole, currentUser }) => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.getDoctors();
                if (res.success && res.data) {
                    setDoctors(res.data);
                    if (res.data.length > 0 && !selectedDoctorId) {
                        setSelectedDoctorId(res.data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch doctors", error);
            }
        };

        if (userRole === 'Doctor') {
            setSelectedDoctorId(currentUser?.id || '');
        } else {
            fetchDoctors();
        }
    }, [userRole, currentUser]);

    useEffect(() => {
        if (selectedDoctorId) {
            fetchSlots(selectedDoctorId);
        }
    }, [selectedDoctorId]);

    const fetchSlots = async (doctorId: string) => {
        setLoading(true);
        try {
            const res = await api.getDoctorSlots(doctorId);
            if (res.success && res.data) {
                setSlots(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch slots", error);
        } finally {
            setLoading(false);
        }
    };

    // Group slots by date
    const slotsByDate = slots.reduce((acc: any, slot: any) => {
        if (!acc[slot.slot_date]) {
            acc[slot.slot_date] = [];
        }
        acc[slot.slot_date].push(slot);
        return acc;
    }, {});

    const sortedDates = Object.keys(slotsByDate).sort();

    return (
        <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-brand-textPrimary flex items-center gap-2">
                    <Calendar className="text-brand-primary" />
                    Doctor Schedules
                </h2>
                <p className="text-brand-textSecondary mt-2">
                    View the actual generated schedule slots for doctors over the next 30 days.
                </p>
            </div>

            {(userRole === 'Admin' || userRole === 'CRO' || userRole === 'Front Desk') && (
                <div className="mb-8 p-4 bg-brand-bg border border-brand-border rounded-xl">
                    <label className="block text-sm font-semibold text-brand-textPrimary mb-2 flex items-center gap-2">
                        <User size={16} className="text-brand-primary" />
                        Select Doctor to View Schedule
                    </label>
                    <select 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full md:w-1/2 bg-brand-surface border border-brand-border rounded-lg px-4 py-2 outline-none focus:border-brand-primary text-brand-textPrimary shadow-sm"
                    >
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name || doc.email}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-brand-textSecondary bg-brand-bg rounded-xl border border-brand-border border-dashed p-10">
                    <Calendar size={48} className="text-brand-border mb-4" />
                    <p className="font-semibold text-lg">No Schedule Generated</p>
                    <p className="text-sm mt-1 text-center max-w-md">This doctor does not have any active slots generated for the upcoming days. An admin needs to configure their Working Hours.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {sortedDates.map(date => {
                        const dateObj = new Date(date);
                        const isToday = date === new Date().toISOString().split('T')[0];
                        
                        return (
                            <div key={date} className={`p-5 rounded-xl border ${isToday ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-brand-border bg-brand-bg'} shadow-sm`}>
                                <div className="flex items-center gap-3 mb-4 border-b border-brand-border/50 pb-3">
                                    <div className={`p-2 rounded-lg ${isToday ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-textSecondary shadow-sm'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-textPrimary text-lg">
                                            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </h3>
                                        {isToday && <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">Today</span>}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                    {slotsByDate[date].map((slot: any) => {
                                        const isFull = slot.booked_count >= slot.capacity;
                                        return (
                                            <div 
                                                key={slot.id} 
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-transform hover:scale-105
                                                    ${isFull 
                                                        ? 'bg-red-50 border-red-200 text-red-700' 
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                                            >
                                                <Clock size={14} />
                                                {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                {isFull ? <XCircle size={14} className="ml-1 opacity-70" /> : <CheckCircle size={14} className="ml-1 opacity-70" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
