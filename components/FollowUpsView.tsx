import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { BookAppointmentModal } from './AppointmentModals';
import { Phone, CalendarDays, CheckCircle2, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Doctor } from '../types';

const getDoctorColor = (index: number) => {
    const colors = ['#005B9A', '#00A859', '#F08422', '#E74C3C', '#9B59B6'];
    return colors[index % colors.length];
};

export const FollowUpsView: React.FC = () => {
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [bookModalData, setBookModalData] = useState<any>({});

    // Filtering State
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [viewDate, setViewDate] = useState<Date | null>(null); // null means All Dates
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fRes, dRes, pRes] = await Promise.all([
                api.getFollowUps(),
                api.getDoctors(),
                api.getPatients()
            ]);
            
            if (fRes && fRes.success) setFollowUps(fRes.data);
            
            if (dRes && dRes.success) {
                const docStaff = dRes.data.map((d: any, idx: number) => ({
                    id: d.id,
                    name: d.name,
                    color: getDoctorColor(idx)
                }));
                setDoctors(docStaff);
            }
            if (pRes && pRes.success) setPatients(pRes.data);
            
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load follow-ups');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBookConfirm = async (formData: any) => {
        try {
            const selectedDoc = doctors.find(d => d.name === formData.consultant);
            const doctorId = selectedDoc?.id || formData.doctorId || 'dr_sireesha';
            const doctorName = selectedDoc?.name || formData.consultant || doctors.find(d => d.id === doctorId)?.name || 'Dr. B. Sireesha Rani';
            
            const rawType = formData.speciality || 'Consultation';
            let safeType = 'Consultation';
            const validTypes = ['Consultation', 'Follow-up', 'Procedure', 'Emergency', 'Scan', 'Surgery', 'IVF', 'Camp'];
            if (validTypes.includes(rawType)) safeType = rawType;
            else if (rawType.includes('IVF')) safeType = 'IVF';
            else if (rawType.includes('Scan') || rawType.includes('Ultrasound')) safeType = 'Scan';
            else if (rawType.includes('IUI')) safeType = 'Procedure';
            else safeType = 'Consultation';

            const payload: any = {
                appointment_date: formData.date,
                start_time: formData.time,
                doctor_id: doctorId,
                doctor_name_snapshot: doctorName,
                type: safeType,
                status: 'Scheduled',
                visit_reason: (formData as any).visitReason || formData.speciality || 'Consultation',
                notes: (formData as any).visitReason || '',
                referral_doctor: formData.referralDoctor,
                referral_doctor_phone: formData.referralDoctorMobile,
                patient_name_snapshot: formData.name,
                patient_phone_snapshot: formData.phone
            };

            if (formData.patientId) {
                payload.patient_id = formData.patientId;
            } else {
                payload.name = formData.name;
                payload.phone = formData.phone;
                payload.gender = formData.sex;
                payload.email = formData.email;
            }

            const res = await api.createAppointment(payload);
            if (res && res.success) {
                toast.success('Appointment booked successfully!');
                setIsBookModalOpen(false);
                
                if (bookModalData.followUpId) {
                    await api.updateFollowUp(bookModalData.followUpId, { status: 'Appointment Booked' });
                    fetchData();
                }
            } else {
                toast.error(res.message || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Failed to book appointment:', error);
            toast.error('An error occurred');
        }
    };

    // Filter Logic
    const filteredFollowUps = followUps.filter(f => {
        // Status Filter
        if (selectedStatus !== 'all') {
            if (selectedStatus === 'Pending' && f.status !== 'Pending') return false;
            if (selectedStatus === 'Called' && f.status !== 'Called') return false;
            if (selectedStatus === 'Completed' && (f.status !== 'Completed' && f.status !== 'Appointment Booked')) return false;
            if (selectedStatus === 'Cancelled' && f.status !== 'Cancelled') return false;
        }

        // Date Filter
        if (viewDate) {
            const fDate = new Date(f.follow_up_date).toDateString();
            if (fDate !== viewDate.toDateString()) return false;
        }

        return true;
    });

    const statuses = ['Pending', 'Called', 'Completed', 'Cancelled'];

    return (
        <div className="flex flex-col lg:flex-row h-full min-h-0 flex-1 gap-3 md:gap-4 relative w-full overflow-hidden p-3 sm:p-4 md:p-6 lg:p-8 animate-slide-up">
            {/* Sidebar Filters - Matches AppointmentsView */}
            <div className="hidden md:flex w-48 lg:w-56 xl:w-64 flex-shrink-0 flex-col gap-4 lg:gap-6 overflow-y-auto custom-scrollbar">
                
                {/* Filters Card */}
                <div className="bg-brand-surface p-3 lg:p-4 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border border-brand-border">
                    <div className="flex items-center space-x-2 mb-3 lg:mb-4 xl:mb-6 text-brand-textPrimary">
                        <Filter size={16} className="text-brand-primary" />
                        <h3 className="font-bold text-sm lg:text-base">Filters</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3">Status</label>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedStatus('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'all' ? 'bg-brand-primary/20 text-brand-primary font-bold' : 'text-brand-textSecondary hover:bg-brand-bg'}`}
                                >
                                    All Follow-Ups
                                </button>
                                {statuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === status ? 'bg-brand-bg text-brand-textPrimary font-bold' : 'text-brand-textSecondary hover:bg-brand-bg'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mini Calendar Card */}
                <div className="bg-brand-surface p-4 rounded-2xl shadow-sm border border-brand-border flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-brand-textPrimary text-sm">Filter by Date</h4>
                        {viewDate && (
                            <button 
                                onClick={() => setViewDate(null)}
                                className="text-xs text-brand-primary hover:underline flex items-center"
                            >
                                <X size={12} className="mr-1" /> Clear
                            </button>
                        )}
                    </div>
                    <div className="bg-brand-bg rounded-xl border border-brand-border p-3">
                        <div className="flex justify-between items-center mb-2">
                            <button onClick={() => {
                                const d = new Date(miniCalendarDate);
                                d.setMonth(d.getMonth() - 1);
                                setMiniCalendarDate(d);
                            }}><ChevronLeft size={16} /></button>
                            <span className="text-xs font-bold">{miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => {
                                const d = new Date(miniCalendarDate);
                                d.setMonth(d.getMonth() + 1);
                                setMiniCalendarDate(d);
                            }}><ChevronRight size={16} /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={`${d}-${i}`} className="text-[10px] text-brand-textSecondary font-bold">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {(() => {
                                const start = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth(), 1);
                                const startDay = start.getDay();
                                const daysInMonth = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() + 1, 0).getDate();
                                const days = [];
                                for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} />);
                                for (let i = 1; i <= daysInMonth; i++) {
                                    const currentDate = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth(), i);
                                    const isSelected = viewDate && currentDate.toDateString() === viewDate.toDateString();
                                    const isToday = currentDate.toDateString() === new Date().toDateString();

                                    days.push(
                                        <button
                                            key={i}
                                            onClick={() => setViewDate(currentDate)}
                                            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center transition-colors 
                                                ${isSelected ? 'bg-brand-primary text-white shadow-md' :
                                                    isToday ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/30' :
                                                        'hover:bg-brand-surface text-brand-textPrimary'}`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return days;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-brand-surface rounded-xl sm:rounded-2xl shadow-sm border border-brand-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-brand-border bg-brand-bg/50 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-brand-textPrimary flex items-center">
                            <CalendarIcon size={20} className="mr-2 text-brand-primary" />
                            {viewDate ? viewDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'All Follow-Ups'}
                        </h1>
                        <p className="text-xs text-brand-textSecondary mt-1">Manage and track patient return visits</p>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-brand-surface z-10 shadow-sm">
                            <tr className="border-b border-brand-border bg-brand-bg/50">
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Patient</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Reason / Notes</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-brand-textSecondary text-sm">
                                        Loading follow-ups...
                                    </td>
                                </tr>
                            ) : filteredFollowUps.length > 0 ? (
                                filteredFollowUps.map((f: any) => (
                                    <tr key={f.id} className="border-b border-brand-border hover:bg-brand-bg/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-brand-textPrimary">
                                            {new Date(f.follow_up_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-bold text-brand-textPrimary">{f.patient?.fullname || 'Unknown'}</div>
                                            <div className="text-xs text-brand-textSecondary mt-0.5">{f.patient?.phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-brand-textSecondary italic line-clamp-2">{f.reason || 'No reason provided'}</div>
                                            {f.doctor && <div className="text-[11px] text-brand-primary mt-1 font-medium">Req by: {f.doctor.name}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                f.status === 'Completed' || f.status === 'Appointment Booked' ? 'bg-emerald-100 text-emerald-700' :
                                                f.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                                                f.status === 'Called' ? 'bg-amber-100 text-amber-700' :
                                                'bg-sky-100 text-sky-700'
                                            }`}>
                                                {f.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {f.status !== 'Completed' && f.status !== 'Appointment Booked' && f.status !== 'Cancelled' && (
                                                <div className="flex items-center gap-2">
                                                    {f.status === 'Pending' && (
                                                        <button 
                                                            onClick={async () => {
                                                                await api.updateFollowUp(f.id, { status: 'Called' });
                                                                toast.success('Marked as Called');
                                                                fetchData();
                                                            }}
                                                            className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors border border-amber-200"
                                                            title="Log Call"
                                                        >
                                                            <Phone size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {/* The Book Appointment button is always visible as long as it's not completed/cancelled */}
                                                    <button 
                                                        onClick={() => {
                                                            setBookModalData({ 
                                                                date: new Date(f.follow_up_date), 
                                                                time: 9, 
                                                                initialData: { name: f.patient?.fullname, phone: f.patient?.phone, patientId: f.patient_id, visitReason: f.reason },
                                                                followUpId: f.id
                                                            });
                                                            setIsBookModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md transition-colors"
                                                        title="Book Appointment"
                                                    >
                                                        <CalendarDays size={16} />
                                                    </button>
                                                    
                                                    {/* Optional: Complete manually if they showed up without booking */}
                                                    {f.status === 'Called' && (
                                                        <button 
                                                            onClick={async () => {
                                                                await api.updateFollowUp(f.id, { status: 'Completed' });
                                                                toast.success('Marked as Completed');
                                                                fetchData();
                                                            }}
                                                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200"
                                                            title="Mark as Completed"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-brand-textSecondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-brand-bg/50 flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 text-brand-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">No follow-ups found</span>
                                            <span className="text-xs mt-1">Try adjusting your filters</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BookAppointmentModal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                onConfirm={handleBookConfirm}
                initialDate={bookModalData.date}
                initialTime={bookModalData.time}
                initialData={bookModalData.initialData}
                doctors={doctors}
                patients={patients}
            />
        </div>
    );
};
