import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { BookAppointmentModal } from './AppointmentModals';
import { Phone, CalendarDays, CheckCircle2, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Search, MoreVertical, Plus, ArrowUpDown } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');

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

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const patientName = f.patient?.fullname?.toLowerCase() || '';
            const reason = f.reason?.toLowerCase() || '';
            if (!patientName.includes(query) && !reason.includes(query)) return false;
        }

        return true;
    });

    const getStatusCount = (statusType: string) => {
        return followUps.filter(f => {
            if (statusType === 'all') return true;
            if (statusType === 'Pending' && f.status === 'Pending') return true;
            if (statusType === 'Called' && f.status === 'Called') return true;
            if (statusType === 'Completed' && (f.status === 'Completed' || f.status === 'Appointment Booked')) return true;
            if (statusType === 'Cancelled' && f.status === 'Cancelled') return true;
            return false;
        }).length;
    };

    const statuses = [
        { id: 'all', label: 'All Follow-Ups', color: 'bg-blue-500' },
        { id: 'Pending', label: 'Pending', color: 'bg-orange-400' },
        { id: 'Called', label: 'Called', color: 'bg-blue-500' },
        { id: 'Completed', label: 'Completed', color: 'bg-emerald-500' },
        { id: 'Cancelled', label: 'Cancelled', color: 'bg-red-500' },
    ];

    return (
        <div className="flex flex-col h-full min-h-0 flex-1 relative w-full overflow-hidden p-4 sm:p-6 lg:p-8 animate-slide-up bg-slate-50/50">
            {/* Top Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xs font-bold text-brand-textSecondary tracking-wider uppercase mb-1">Follow-Ups</h2>
                    <h1 className="text-2xl font-bold text-brand-textPrimary">Follow-Ups Queue</h1>
                    <p className="text-sm text-brand-textSecondary mt-1">Manage and track patient return visits. Stay on top of every follow-up.</p>
                </div>
                <button 
                    onClick={() => toast.success('Add Follow-Up feature coming soon!')}
                    className="flex items-center gap-2 bg-white text-brand-primary border border-brand-primary/30 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-brand-primary/5 transition-colors"
                >
                    <Plus size={16} /> Add Follow-Up
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
                {/* Sidebar Filters */}
                <div className="hidden md:flex w-56 xl:w-64 flex-shrink-0 flex-col gap-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm p-4 lg:p-5 rounded-2xl shadow-sm border border-brand-border h-full">
                    
                    {/* Filters Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-brand-textPrimary">
                            <Filter size={16} className="text-brand-primary" />
                            <h3 className="font-bold text-base">Filters</h3>
                        </div>
                        <button 
                            onClick={() => {
                                setSelectedStatus('all');
                                setViewDate(null);
                                setSearchQuery('');
                            }}
                            className="text-xs text-brand-primary hover:underline font-medium"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Status Section */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-brand-textPrimary mb-3">Status</label>
                        <div className="space-y-1.5">
                            {statuses.map(status => {
                                const isSelected = selectedStatus === status.id;
                                const count = getStatusCount(status.id);
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => setSelectedStatus(status.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isSelected ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-textPrimary hover:bg-slate-100/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                                            {status.label}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                            isSelected ? 'border-brand-primary/30 text-brand-primary bg-brand-primary/10' : 'border-slate-200 text-slate-500 bg-white shadow-xs'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range Section */}
                    <div>
                        <label className="block text-xs font-bold text-brand-textPrimary mb-3">Date Range</label>
                        <div className="bg-white rounded-xl border border-brand-border p-3 shadow-xs">
                            <div className="flex justify-between items-center mb-3 px-2 py-1.5 bg-slate-50 rounded-lg border border-brand-border/50 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon size={14} className="text-brand-textSecondary" />
                                    <span className="text-xs font-bold text-brand-textPrimary">
                                        {miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <ChevronRight size={14} className="text-brand-textSecondary rotate-90" />
                            </div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <button onClick={() => {
                                    const d = new Date(miniCalendarDate);
                                    d.setMonth(d.getMonth() - 1);
                                    setMiniCalendarDate(d);
                                }}><ChevronLeft size={14} className="text-brand-textSecondary hover:text-brand-primary" /></button>
                                <button onClick={() => {
                                    const d = new Date(miniCalendarDate);
                                    d.setMonth(d.getMonth() + 1);
                                    setMiniCalendarDate(d);
                                }}><ChevronRight size={14} className="text-brand-textSecondary hover:text-brand-primary" /></button>
                            </div>
                            <div className="grid grid-cols-7 text-center mb-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={`${d}-${i}`} className="text-[10px] text-brand-textSecondary font-bold">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
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
                                                className={`w-6 h-6 mx-auto rounded-full text-xs flex items-center justify-center transition-colors 
                                                    ${isSelected ? 'bg-brand-primary text-white shadow-md font-bold' :
                                                        isToday ? 'bg-brand-primary/10 text-brand-primary font-bold' :
                                                            'hover:bg-slate-100 text-brand-textPrimary'}`}
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
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden relative">
                    
                    {/* Top Bar inside main content */}
                    <div className="p-4 sm:p-5 border-b border-brand-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-brand-primary shadow-xs border border-blue-100">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-brand-textPrimary">
                                    {selectedStatus !== 'all' ? statuses.find(s => s.id === selectedStatus)?.label : viewDate ? viewDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'All Follow-Ups'}
                                </h2>
                                <p className="text-xs text-brand-textSecondary mt-0.5">A list of patients who are due or scheduled for follow-up.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search in results..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-brand-border rounded-full text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all w-full sm:w-64 bg-slate-50 shadow-xs"
                                />
                            </div>
                            <button className="p-2 border border-brand-border rounded-lg hover:bg-slate-50 text-brand-textSecondary transition-colors shadow-xs">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1 custom-scrollbar z-20 bg-white">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-white z-30">
                                <tr className="border-b border-brand-border">
                                    <th className="p-4 w-12 text-center bg-slate-50/50">
                                        <input type="checkbox" className="rounded border-brand-border text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="p-4 text-xs font-bold text-brand-textSecondary bg-slate-50/50">
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-brand-textPrimary transition-colors w-max">
                                            Date <ArrowUpDown size={12} className="text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-brand-textSecondary bg-slate-50/50">
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-brand-textPrimary transition-colors w-max">
                                            Patient <ArrowUpDown size={12} className="text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-brand-textSecondary bg-slate-50/50">Reason / Notes</th>
                                    <th className="p-4 text-xs font-bold text-brand-textSecondary bg-slate-50/50">
                                        <div className="flex items-center gap-1 cursor-pointer hover:text-brand-textPrimary transition-colors w-max">
                                            Status <ArrowUpDown size={12} className="text-slate-400" />
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-bold text-brand-textSecondary bg-slate-50/50">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-brand-textSecondary text-sm">
                                            Loading follow-ups...
                                        </td>
                                    </tr>
                                ) : filteredFollowUps.length > 0 ? (
                                    filteredFollowUps.map((f: any) => (
                                        <tr key={f.id} className="border-b border-brand-border hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-center">
                                                <input type="checkbox" className="rounded border-brand-border text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer" />
                                            </td>
                                            <td className="p-4 text-sm font-medium text-brand-textPrimary">
                                                {new Date(f.follow_up_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-brand-textPrimary">{f.patient?.fullname || 'Unknown'}</div>
                                                <div className="text-xs text-brand-textSecondary mt-0.5">{f.patient?.phone}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-brand-textSecondary italic line-clamp-2 max-w-xs">{f.reason || 'No reason provided'}</div>
                                                {f.doctor && <div className="text-[11px] text-brand-primary mt-1 font-medium">Req by: {f.doctor.name}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center w-max gap-1.5 ${
                                                    f.status === 'Completed' || f.status === 'Appointment Booked' ? 'text-emerald-700' :
                                                    f.status === 'Cancelled' ? 'text-rose-700' :
                                                    f.status === 'Called' ? 'text-blue-700' :
                                                    'text-orange-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        f.status === 'Completed' || f.status === 'Appointment Booked' ? 'bg-emerald-500' :
                                                        f.status === 'Cancelled' ? 'bg-rose-500' :
                                                        f.status === 'Called' ? 'bg-blue-500' :
                                                        'bg-orange-500'
                                                    }`}></span>
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
                                        <td colSpan={6} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center relative">
                                                {/* Decorative background blob matching screenshot */}
                                                <div className="absolute w-64 h-48 bg-[#eef6ff] rounded-[40px] rotate-12 -z-10"></div>
                                                
                                                <div className="relative w-28 h-28 mb-6 mt-4">
                                                    {/* Floating leaves/details */}
                                                    <div className="absolute -right-4 -bottom-2 z-0 text-slate-400">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 21a9 9 0 0 1-5.6-2 9 9 0 0 1-1.6-11.4c2-2.5 5.5-3.6 8.7-2.6 3 1 5.5 3.5 6.5 6.5A9 9 0 0 1 12 21Z"></path>
                                                            <path d="M12 12c-2 0-3.5 1.5-3.5 3.5S10 19 12 19s3.5-1.5 3.5-3.5"></path>
                                                        </svg>
                                                    </div>
                                                    
                                                    {/* Calendar icon matching screenshot */}
                                                    <div className="relative w-full h-full bg-white border-2 border-brand-border shadow-sm rounded-2xl z-10 flex flex-col overflow-hidden">
                                                        <div className="h-6 bg-brand-primary border-b border-brand-border"></div>
                                                        <div className="absolute top-2 left-6 w-2 h-4 bg-white border-2 border-slate-300 rounded-full z-20"></div>
                                                        <div className="absolute top-2 right-6 w-2 h-4 bg-white border-2 border-slate-300 rounded-full z-20"></div>
                                                        
                                                        <div className="flex-1 p-3 flex flex-col gap-2">
                                                            <div className="flex gap-2"><div className="h-2 w-6 bg-slate-200 rounded"></div><div className="h-2 w-6 bg-slate-200 rounded"></div></div>
                                                            <div className="flex gap-2"><div className="h-2 w-6 bg-slate-200 rounded"></div><div className="h-2 w-6 bg-brand-primary rounded"></div></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <h3 className="text-lg font-bold text-slate-800 mb-2">No follow-ups found</h3>
                                                <p className="text-sm text-slate-500 mb-6">There are no follow-ups for the selected filters.</p>
                                                
                                                <button 
                                                    onClick={() => {
                                                        setSelectedStatus('all');
                                                        setViewDate(null);
                                                        setSearchQuery('');
                                                    }}
                                                    className="px-6 py-2 border border-blue-200 text-brand-primary bg-white rounded-full text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    Clear filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Watermark at bottom right corner */}
                    <div className="absolute bottom-6 right-8 pointer-events-none opacity-30 z-10 flex flex-col items-end" style={{ fontFamily: 'cursive' }}>
                        <div className="text-3xl text-slate-400/80 -rotate-12 mb-2 font-bold tracking-wider">Better Care</div>
                        <div className="text-3xl text-slate-400/80 -rotate-12 ml-8 font-bold tracking-wider relative">
                            Every Day
                            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-slate-400/80 rounded-full transform -skew-x-12"></div>
                        </div>
                    </div>
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
