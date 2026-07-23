import React, { useState, useEffect } from 'react';
import { Save, Clock, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { api } from '../../services/api';

interface ScheduleRule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorScheduleSettings({ userRole, currentUser }: { userRole: string, currentUser: any }) {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [schedules, setSchedules] = useState<ScheduleRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [globalSlotDuration, setGlobalSlotDuration] = useState<number>(15);

    useEffect(() => {
        if (userRole === 'Admin' || userRole === 'CRO') {
            fetchDoctors();
        } else if (userRole === 'Doctor') {
            // Doctors can only edit their own schedule
            setSelectedDoctorId(currentUser?.id || '');
        }
    }, [userRole, currentUser]);

    useEffect(() => {
        if (selectedDoctorId) {
            fetchSchedules(selectedDoctorId);
        }
    }, [selectedDoctorId]);

    const fetchDoctors = async () => {
        try {
            const res = await api.getClinicUsers();
            if (res.success && res.data) {
                // Filter only doctors
                const docs = res.data.filter((u: any) => u.role === 'Doctor');
                setDoctors(docs);
                if (docs.length > 0 && !selectedDoctorId) {
                    setSelectedDoctorId(docs[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchSchedules = async (doctorId: string) => {
        setLoading(true);
        try {
            const res = await api.getSchedules(doctorId);
            if (res) {
                // Initialize state
                setSchedules(res);
                if (res.length > 0) {
                    setGlobalSlotDuration(res[0].slot_duration_minutes || 15);
                }
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = (dayIndex: number) => {
        const exists = schedules.some(s => s.day_of_week === dayIndex);
        if (exists) {
            setSchedules(schedules.filter(s => s.day_of_week !== dayIndex));
        } else {
            setSchedules([...schedules, {
                day_of_week: dayIndex,
                start_time: '09:00',
                end_time: '17:00',
                slot_duration_minutes: globalSlotDuration
            }]);
        }
    };

    const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
        setSchedules(schedules.map(s => {
            if (s.day_of_week === dayIndex) {
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const handleGlobalDurationChange = (duration: number) => {
        setGlobalSlotDuration(duration);
        setSchedules(schedules.map(s => ({ ...s, slot_duration_minutes: duration })));
    };

    const handleSave = async () => {
        if (!selectedDoctorId) return;
        setSaving(true);
        setSuccessMessage('');
        try {
            // Append seconds for backend TIME field
            const payload = schedules.map(s => ({
                ...s,
                start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
                end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
            }));
            
            await api.saveSchedules(selectedDoctorId, payload);
            setSuccessMessage('Schedules saved successfully! Slots have been auto-generated for the next 30 days.');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error("Failed to save schedules", error);
            alert("Failed to save schedules. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-brand-textPrimary flex items-center gap-2">
                    <Clock className="text-brand-primary" />
                    Working Hours Configuration
                </h2>
                <p className="text-brand-textSecondary mt-2">
                    Define the weekly schedule for doctors. The system will use these rules to automatically generate bookable slots for the next 30 days.
                </p>
            </div>

            {(userRole === 'Admin' || userRole === 'CRO') && (
                <div className="mb-8 p-4 bg-brand-surface border border-brand-border rounded-xl">
                    <label className="block text-sm font-semibold text-brand-textPrimary mb-2">Select Doctor to Configure</label>
                    <select 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full md:w-1/2 bg-brand-bg border border-brand-border rounded-lg px-4 py-2 outline-none focus:border-brand-primary text-brand-textPrimary"
                    >
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name || doc.email}</option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10 text-brand-textSecondary">Loading schedules...</div>
            ) : (
                <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-sm">
                    <div className="mb-6 pb-6 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-brand-textPrimary">Weekly Schedule</h3>
                            <p className="text-sm text-brand-textSecondary">Select the days and times the doctor is available.</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-brand-textPrimary">Slot Duration:</span>
                            <select 
                                value={globalSlotDuration}
                                onChange={(e) => handleGlobalDurationChange(Number(e.target.value))}
                                className="bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 outline-none focus:border-brand-primary text-sm text-brand-textPrimary"
                            >
                                <option value={10}>10 Minutes</option>
                                <option value={15}>15 Minutes</option>
                                <option value={20}>20 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={60}>60 Minutes</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {DAYS.map((dayName, index) => {
                            const schedule = schedules.find(s => s.day_of_week === index);
                            const isActive = !!schedule;

                            return (
                                <div key={dayName} className={`flex flex-col md:flex-row md:items-center p-4 rounded-lg border ${isActive ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-brand-border bg-brand-bg'} transition-colors`}>
                                    <div className="flex items-center w-full md:w-48 mb-3 md:mb-0">
                                        <label className="flex items-center cursor-pointer group">
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only" 
                                                    checked={isActive}
                                                    onChange={() => handleToggleDay(index)}
                                                />
                                                <div className={`block w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-brand-primary' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${isActive ? 'transform translate-x-5' : ''}`}></div>
                                            </div>
                                            <span className={`ml-3 font-medium ${isActive ? 'text-brand-textPrimary' : 'text-brand-textSecondary'}`}>
                                                {dayName}
                                            </span>
                                        </label>
                                    </div>

                                    {isActive ? (
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-brand-textSecondary mb-1">Start Time</span>
                                                <input 
                                                    type="time" 
                                                    value={schedule.start_time.substring(0, 5)} // Handle HH:mm:ss vs HH:mm
                                                    onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                                    className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 outline-none focus:border-brand-primary text-brand-textPrimary text-sm"
                                                />
                                            </div>
                                            <span className="text-brand-textSecondary mt-5">-</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-brand-textSecondary mb-1">End Time</span>
                                                <input 
                                                    type="time" 
                                                    value={schedule.end_time.substring(0, 5)}
                                                    onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                                    className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 outline-none focus:border-brand-primary text-brand-textPrimary text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 text-brand-textSecondary/50 text-sm italic">
                                            Unavailable
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {successMessage && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600">
                            <Check size={20} />
                            <p className="font-medium text-sm">{successMessage}</p>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving || !selectedDoctorId}
                            className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving & Generating Slots...' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
