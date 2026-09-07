import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { 
  Calendar, Clock, User, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  Stethoscope, Sun, Sunrise, Sunset, Settings
} from 'lucide-react';
import { Doctor } from '../../types';
import { BookAppointmentModal } from '../AppointmentModals';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DoctorSchedulesViewProps {
    userRole: string;
    currentUser: any;
}

export const DoctorSchedulesView: React.FC<DoctorSchedulesViewProps> = ({ userRole, currentUser }) => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Week State (Current week offset in weeks: 0 = this week, 1 = next week, -1 = prev week)
    const [weekOffset, setWeekOffset] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Quick booking modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingSlot, setBookingSlot] = useState<{ date: string; time: string } | null>(null);

    const formatDoctorName = (name?: string) => {
        let raw = (name || '').trim();
        if (!raw || raw.toLowerCase() === 'unassigned') return 'Consultant';
        if (/^dr\.?\s+/i.test(raw)) {
            return raw.replace(/^dr\.?\s+/i, 'Dr. ');
        }
        return `Dr. ${raw}`;
    };

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

    const activeDoctor = useMemo(() => {
        return doctors.find(d => d.id === selectedDoctorId) || doctors[0];
    }, [doctors, selectedDoctorId]);

    // Group slots by date
    const slotsByDate = useMemo(() => {
        return slots.reduce((acc: Record<string, any[]>, slot: any) => {
            const date = slot.slot_date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(slot);
            return acc;
        }, {});
    }, [slots]);

    // Calculate 7 Days for the Selected Week (Monday to Sunday)
    const currentWeekDays = useMemo(() => {
        const today = new Date();
        // Get Monday of the current week adjusted by weekOffset
        const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
        const distanceToMonday = (dayOfWeek + 6) % 7; // days to subtract to get to Monday
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - distanceToMonday + (weekOffset * 7));

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const daySlots = slotsByDate[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            weekDays.push({
                dateStr,
                fullDate: d,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
                isToday,
                slotsCount: daySlots.length,
                bookedCount: daySlots.filter((s: any) => s.booked_count >= s.capacity).length
            });
        }
        return weekDays;
    }, [weekOffset, slotsByDate]);

    // Format week range label (e.g. "Aug 24 – Aug 30, 2026")
    const weekRangeLabel = useMemo(() => {
        if (currentWeekDays.length === 0) return '';
        const start = currentWeekDays[0].fullDate;
        const end = currentWeekDays[6].fullDate;
        
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} – ${endStr}`;
    }, [currentWeekDays]);

    // Auto-select the first day of the week if current selectedDate is outside this week
    useEffect(() => {
        const isCurrentDateInWeek = currentWeekDays.some(d => d.dateStr === selectedDate);
        if (!isCurrentDateInWeek && currentWeekDays.length > 0) {
            setSelectedDate(currentWeekDays[0].dateStr);
        }
    }, [currentWeekDays, selectedDate]);

    // Current Selected Day's Slots
    const currentDaySlots = useMemo(() => {
        return slotsByDate[selectedDate] || [];
    }, [slotsByDate, selectedDate]);

    // Time-of-Day Segments
    const morningSlots = useMemo(() => {
        return currentDaySlots.filter((s: any) => {
            const hour = parseInt(s.start_time.split(':')[0], 10);
            return hour < 12;
        });
    }, [currentDaySlots]);

    const afternoonSlots = useMemo(() => {
        return currentDaySlots.filter((s: any) => {
            const hour = parseInt(s.start_time.split(':')[0], 10);
            return hour >= 12 && hour < 16;
        });
    }, [currentDaySlots]);

    const eveningSlots = useMemo(() => {
        return currentDaySlots.filter((s: any) => {
            const hour = parseInt(s.start_time.split(':')[0], 10);
            return hour >= 16;
        });
    }, [currentDaySlots]);

    const handleSlotClick = (slot: any) => {
        const isFull = slot.booked_count >= slot.capacity;
        if (isFull) {
            toast.error("This slot is already fully booked");
            return;
        }
        setBookingSlot({
            date: selectedDate,
            time: slot.start_time.substring(0, 5)
        });
        setIsBookingModalOpen(true);
    };

    const handleBookingConfirm = async (formData: any) => {
        try {
            const payload = {
                appointment_date: formData.date,
                start_time: formData.time,
                doctor_id: selectedDoctorId,
                doctor_name_snapshot: activeDoctor?.name || 'Doctor',
                type: formData.speciality || 'Consultation',
                status: 'Scheduled',
                visit_reason: formData.visitReason || formData.speciality || 'Consultation',
                notes: formData.visitReason || '',
                patient_name_snapshot: formData.name,
                patient_phone_snapshot: formData.phone,
                patient_email_snapshot: formData.email,
                patient_age_snapshot: formData.age,
                sex_snapshot: formData.sex,
                source: 'Schedule View'
            };

            await api.createAppointment(payload);
            toast.success("Appointment booked successfully!");
            setIsBookingModalOpen(false);
            if (selectedDoctorId) fetchSlots(selectedDoctorId);
        } catch (err: any) {
            console.error("Booking error", err);
            toast.error(err?.message || "Failed to book slot");
        }
    };

    return (
        <div className="h-full flex flex-col space-y-5 animate-fadeIn">
            
            {/* Top Header */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 md:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                            <Calendar size={22} />
                        </div>

                        <div>
                            <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
                                Doctor Schedules
                            </h1>
                            <p className="text-xs text-brand-textSecondary mt-0.5">
                                Weekly consultation slots and shift availability
                            </p>
                        </div>
                    </div>

                    {(userRole === 'Admin' || userRole === 'Super Admin') && (
                        <button
                            onClick={() => navigate('/dashboard/settings/schedules')}
                            className="px-3.5 py-2 rounded-xl border border-brand-border hover:border-brand-primary/40 bg-brand-bg hover:bg-brand-surface text-brand-textPrimary text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
                        >
                            <Settings size={14} className="text-brand-primary" />
                            <span>Configure Shifts</span>
                        </button>
                    )}

                </div>

                {/* Doctor Selection Tabs */}
                {(userRole === 'Admin' || userRole === 'CRO' || userRole === 'Front Desk') && (
                    <div className="mt-4 pt-4 border-t border-brand-border/60 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                        <span className="text-xs font-semibold text-brand-textSecondary mr-2 flex-shrink-0 flex items-center gap-1">
                            <Stethoscope size={13} className="text-brand-primary" /> Consultant:
                        </span>
                        
                        {doctors.map(doc => {
                            const isSelected = (doc.id || doc.doctorId) === selectedDoctorId;
                            const formattedName = formatDoctorName(doc.name);

                            return (
                                <button
                                    key={doc.id || doc.doctorId}
                                    onClick={() => setSelectedDoctorId(doc.id || doc.doctorId)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 border ${
                                        isSelected
                                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                            : 'bg-brand-bg hover:bg-brand-surface border-brand-border text-brand-textPrimary hover:border-brand-primary/30'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-primary/60'}`}></span>
                                    <span>{formattedName}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Weekly Calendar Navigation */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-xs">
                
                {/* Week Selector Bar */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-1.5 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-surface text-brand-textPrimary transition-colors"
                            title="Previous Week"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <span className="text-xs font-bold text-brand-textPrimary px-2">
                            {weekRangeLabel}
                        </span>

                        <button
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="p-1.5 rounded-lg border border-brand-border bg-brand-bg hover:bg-brand-surface text-brand-textPrimary transition-colors"
                            title="Next Week"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {weekOffset !== 0 && (
                        <button
                            onClick={() => {
                                setWeekOffset(0);
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                            }}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-brand-bg border border-brand-border hover:border-brand-primary/40 text-brand-textPrimary transition-all"
                        >
                            This Week
                        </button>
                    )}
                </div>

                {/* 7 Days of the Week Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {currentWeekDays.map((day) => {
                        const isSelected = day.dateStr === selectedDate;

                        return (
                            <button
                                key={day.dateStr}
                                onClick={() => setSelectedDate(day.dateStr)}
                                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${
                                    isSelected
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                        : day.isToday
                                            ? 'bg-brand-primary/5 border-brand-primary/40 text-brand-textPrimary'
                                            : 'bg-brand-bg hover:bg-brand-surface border-brand-border text-brand-textPrimary'
                                }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isSelected ? 'text-white/80' : 'text-brand-textSecondary'
                                }`}>
                                    {day.dayName}
                                </span>
                                
                                <span className="text-base font-extrabold my-0.5">
                                    {day.dayNum}
                                </span>

                                <span className={`text-[10px] font-mono font-medium ${
                                    isSelected 
                                        ? 'text-white/90' 
                                        : day.slotsCount > 0 
                                            ? 'text-emerald-600 font-semibold' 
                                            : 'text-brand-textSecondary/50'
                                }`}>
                                    {day.slotsCount > 0 ? `${day.slotsCount} slots` : 'Off'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Daily Slots Content */}
            {loading ? (
                <div className="flex-1 flex justify-center items-center p-16 bg-brand-surface rounded-2xl border border-brand-border">
                    <div className="w-7 h-7 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                </div>
            ) : currentDaySlots.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-brand-surface rounded-2xl border border-brand-border border-dashed">
                    <Calendar size={28} className="text-brand-textSecondary/40 mb-2.5" />
                    <h3 className="text-sm font-bold text-brand-textPrimary mb-0.5">
                        No Schedule on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-brand-textSecondary max-w-sm">
                        {formatDoctorName(activeDoctor?.name)} has no active working shifts for this day.
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                    
                    {/* Morning Session */}
                    {morningSlots.length > 0 && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-brand-border/60">
                                <Sunrise size={15} className="text-amber-500" />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-textPrimary">
                                    Morning Session (09:00 AM - 12:00 PM)
                                </h3>
                                <span className="ml-auto text-[10px] font-bold text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border">
                                    {morningSlots.length} Slots
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                {morningSlots.map((slot: any) => {
                                    const isFull = slot.booked_count >= slot.capacity;

                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className={`p-3 rounded-xl border text-left transition-all active:scale-98 flex flex-col justify-between ${
                                                isFull
                                                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 cursor-not-allowed'
                                                    : 'bg-brand-bg hover:bg-brand-surface border-brand-border hover:border-brand-primary/50 text-brand-textPrimary cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs font-bold">
                                                    {slot.start_time.substring(0, 5)}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                                    isFull ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                    {isFull ? 'Booked' : 'Open'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-brand-textSecondary">{slot.duration_mins || 15}m</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Afternoon Session */}
                    {afternoonSlots.length > 0 && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-brand-border/60">
                                <Sun size={15} className="text-orange-500" />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-textPrimary">
                                    Afternoon Session (12:00 PM - 04:00 PM)
                                </h3>
                                <span className="ml-auto text-[10px] font-bold text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border">
                                    {afternoonSlots.length} Slots
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                {afternoonSlots.map((slot: any) => {
                                    const isFull = slot.booked_count >= slot.capacity;

                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className={`p-3 rounded-xl border text-left transition-all active:scale-98 flex flex-col justify-between ${
                                                isFull
                                                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 cursor-not-allowed'
                                                    : 'bg-brand-bg hover:bg-brand-surface border-brand-border hover:border-brand-primary/50 text-brand-textPrimary cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs font-bold">
                                                    {slot.start_time.substring(0, 5)}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                                    isFull ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                    {isFull ? 'Booked' : 'Open'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-brand-textSecondary">{slot.duration_mins || 15}m</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Evening Session */}
                    {eveningSlots.length > 0 && (
                        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-brand-border/60">
                                <Sunset size={15} className="text-purple-500" />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-textPrimary">
                                    Evening Session (04:00 PM - 07:00 PM)
                                </h3>
                                <span className="ml-auto text-[10px] font-bold text-brand-textSecondary bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border">
                                    {eveningSlots.length} Slots
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                {eveningSlots.map((slot: any) => {
                                    const isFull = slot.booked_count >= slot.capacity;

                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className={`p-3 rounded-xl border text-left transition-all active:scale-98 flex flex-col justify-between ${
                                                isFull
                                                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 cursor-not-allowed'
                                                    : 'bg-brand-bg hover:bg-brand-surface border-brand-border hover:border-brand-primary/50 text-brand-textPrimary cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs font-bold">
                                                    {slot.start_time.substring(0, 5)}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                                    isFull ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                    {isFull ? 'Booked' : 'Open'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-brand-textSecondary">{slot.duration_mins || 15}m</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Quick Booking Modal */}
            {isBookingModalOpen && (
                <BookAppointmentModal
                    isOpen={isBookingModalOpen}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setBookingSlot(null);
                    }}
                    onConfirm={handleBookingConfirm}
                    initialDate={bookingSlot?.date || selectedDate}
                    initialTime={bookingSlot?.time || ''}
                    doctors={doctors}
                />
            )}

        </div>
    );
};
