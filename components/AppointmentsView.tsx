import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Plus, List, Calendar as CalendarIcon, Upload, Download } from 'lucide-react';
import { Doctor, Appointment, Patient, UserRole } from '../types';
import { getRoleTier } from '../constants/roles.constants';
import { BookAppointmentModal, AppointmentActionCard } from './AppointmentModals';
import { RescheduleModal } from './Modals';
import { PatientProfile } from './PatientProfile';
import { Pagination } from './Pagination';
import { api } from '../services/api';

const DEFAULT_PATIENT_PROFILE: Patient = {
    id: '',
    uhid: '',
    fullname: 'Unknown Patient',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
    status: 'Active'
};

// Dynamic Doctor Colors Mapping Helper
const DOCTOR_COLORS = [
    'bg-brand-primary/20 text-brand-primary border-brand-primary/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'bg-rose-500/20 text-rose-300 border-rose-500/30'
];

const getDoctorColor = (index: number) => {
    return DOCTOR_COLORS[index % DOCTOR_COLORS.length];
};

interface AppointmentsViewProps {
    userRole?: UserRole;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ userRole }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [viewDate, setViewDate] = useState(new Date());
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date()); // Independent state for mini calendar browsing
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentsCurrentPage, setAppointmentsCurrentPage] = useState(1);
    const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(1);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const results = await Promise.allSettled([
                    api.getAppointments(),
                    api.getPatients(),
                    api.getLeads(),
                    api.getDoctors(),
                    api.getDoctorQueue().catch(() => ({ data: [] }))
                ]);

                const apptsResult = results[0];
                const patientsResult = results[1];
                const leadsResult = results[2];
                const doctorsResult = results[3];
                const queueResult = results[4];
                
                let queueData: any[] = [];
                if (queueResult && queueResult.status === 'fulfilled') {
                    queueData = queueResult.value?.data || queueResult.value || [];
                }

                let dbDoctors: Doctor[] = [];
                if (doctorsResult.status === 'fulfilled' && doctorsResult.value?.data) {
                    dbDoctors = doctorsResult.value.data.map((d: any, idx: number) => ({
                        id: d.id,
                        name: d.name,
                        speciality: 'Consultant',
                        location: 'Medcy Hospital',
                        category: 'Hospital',
                        color: getDoctorColor(idx)
                    }));
                }
                setDoctors(dbDoctors);

                let mapped: Appointment[] = [];

                if (apptsResult.status === 'fulfilled') {
                    const items = Array.isArray(apptsResult.value?.data) ? apptsResult.value.data : (apptsResult.value?.data?.items ?? []);

                    // Create lookup maps
                    let patientItems: any[] = [];
                    if (patientsResult.status === 'fulfilled') {
                        const val = patientsResult.value;
                        if (Array.isArray(val)) {
                            patientItems = val;
                        } else if (val?.data && Array.isArray(val.data)) {
                            patientItems = val.data;
                        } else if (val?.data?.items && Array.isArray(val.data.items)) {
                            patientItems = val.data.items;
                        } else if (val?.items && Array.isArray(val.items)) {
                            patientItems = val.items;
                        }
                    }

                    const patientMap = new Map();
                    if (Array.isArray(patientItems)) {
                        patientItems.forEach((p: any) => patientMap.set(p.id, p.name));
                    }
                    setPatients(patientItems);

                    const leadItems = leadsResult.status === 'fulfilled' ? (leadsResult.value?.data?.items ?? []) : [];
                    const leadMap = new Map();
                    if (Array.isArray(leadItems)) {
                        leadItems.forEach((l: any) => leadMap.set(l.id, l.name));
                    }

                    mapped = Array.isArray(items) ? items.map((item: any) => {
                        // Fix: Check item.name as well, as some backends return it directly
                        let resolvedName = item.patient_name_snapshot || item.patient_name || item.patientName || item.name;

                        if (!resolvedName || resolvedName === 'Unknown') {
                            if (item.patient_id || item.patientId) {
                                resolvedName = patientMap.get(item.patient_id || item.patientId);
                            }
                        }
                        // Secondary Fallback: Check Lead Map
                        if (!resolvedName || resolvedName === 'Unknown') {
                            resolvedName = leadMap.get(item.lead_id) || leadMap.get(item.patient_id);
                        }

                        const docId = item.doctor_id || item.doctorId;
                        // Robust Doctor Name Resolution (Synced with Dashboard)
                        // NOW INCLUDING doctor_name_snapshot which we send to backend now
                        let resolvedDocName = item.doctor_name_snapshot || item.doctor_name || item.doctorName || item.consultant;

                        const matchedDoctor = dbDoctors.find(d => d.id === docId);

                        // Find matching queue thread for Handoff / Reason
                        const matchedQueue = queueData.find(q => 
                            (q.patient_name && resolvedName && q.patient_name.toLowerCase() === resolvedName.toLowerCase()) || 
                            (q.patient_id && item.patient_id && q.patient_id === item.patient_id)
                        );
                        const visit_reason = matchedQueue ? (matchedQueue.summary || matchedQueue.last_message) : (item.visit_reason || item.notes || '');

                        if (!resolvedDocName || resolvedDocName === 'Unknown') {
                            resolvedDocName = matchedDoctor?.name || 'Unknown';
                        }

                        // Final fallback loop for IDs like 'dr1', 'dr2' if name is still missing
                        if ((!resolvedDocName || resolvedDocName === 'Unknown') && docId) {
                            const found = dbDoctors.find(d => d.id === docId);
                            if (found) resolvedDocName = found.name;
                        }

                        // Fix Type/Speciality Fallback
                        // If backend returns generic 'Consultation', try to use Doctor's speciality for better UI
                        let resolvedType = item.type;
                        if ((!resolvedType || resolvedType === 'Consultation') && matchedDoctor) {
                            resolvedType = matchedDoctor.speciality;
                        }

                        return {
                            id: item.id || item.appointmentId,
                            patientName: resolvedName || 'Unknown',
                            patientId: item.patient_id || item.patientId || null,
                            doctorName: resolvedDocName || 'Unknown',
                            doctorId: docId,
                            time: item.start_time || item.slotTime || item.time,
                            date: item.appointment_date ? item.appointment_date.split('T')[0] : (item.date ? item.date.split('T')[0] : 'N/A'),
                            type: resolvedType || 'Consultation',
                            status: item.status,
                            visit_reason: visit_reason,
                            queueStatus: item.queue_status || item.queueStatus,
                            resourceId: item.resource_id || item.resourceId
                        };
                    }) : [];
                } else {
                    console.warn("Failed to fetch appointments (API Error)");
                    mapped = [];
                }
                setAppointments(mapped);
            } catch (error) {
                console.error("Critical error in fetchAppointments:", error);
                setAppointments([]);
            }
        };

        fetchAppointments();
        
        // Polling every 15 seconds for real-time queue updates
        const intervalId = setInterval(() => {
            fetchAppointments();
        }, 15000);
        
        return () => clearInterval(intervalId);
    }, []);


    // Modal States
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [bookModalData, setBookModalData] = useState<{
        date: Date;
        time: number;
        leadId?: string; // Add lead ID to state type
        initialData?: {
            name: string;
            phone: string;
            age?: string;
            sex?: string;
            email?: string;
        }
    }>({ date: new Date(), time: 9 });

    const location = useLocation();

    const filteredAppointmentsList = appointments.filter(apt => {
        if (!apt.date) return false;
        
        // Ensure aptDate is parsed consistently. 
        // If date is "2026-08-17", new Date("2026-08-17") creates UTC midnight, which might shift to 08-16 local time.
        // We'll extract YYYY-MM-DD directly and compare.
        const dStr = apt.date.split('T')[0];
        const [y, m, d] = dStr.split('-').map(Number);
        
        if (viewMode === 'day') {
            return y === viewDate.getFullYear() && 
                   m === viewDate.getMonth() + 1 && 
                   d === viewDate.getDate();
        } else if (viewMode === 'week') {
            const start = new Date(viewDate);
            start.setDate(viewDate.getDate() - viewDate.getDay());
            start.setHours(0,0,0,0);
            
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23,59,59,999);
            
            // Create a local date object from the parsed string for accurate comparison
            const aptLocal = new Date(y, m - 1, d);
            return aptLocal >= start && aptLocal <= end;
        } else if (viewMode === 'month') {
            return m === viewDate.getMonth() + 1 && 
                   y === viewDate.getFullYear();
        }
        return true;
    });

    useEffect(() => {
        if (location.state && (location.state as any).leadToAppointment) {
            const lead = (location.state as any).leadToAppointment;
            setBookModalData({
                date: new Date(),
                time: 9,
                leadId: lead.id, // Store lead ID
                initialData: {
                    name: lead.name,
                    phone: lead.phone,
                    age: lead.age,
                    sex: lead.gender, // Map 'gender' to 'sex'
                    email: lead.email
                }
            });
            setIsBookModalOpen(true);

            // Clean up state immediately to prevent re-opening on refresh
            // We use history.replaceState to modify the current history entry without navigation
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isActionCardOpen, setIsActionCardOpen] = useState(false);

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

    const [viewingPatientProfile, setViewingPatientProfile] = useState<string | null>(null);

    // --- Helpers ---
    const timeSlots = React.useMemo(() => {
        let minHour = 9;
        let maxHour = 17; // 5 PM default ending

        if (appointments && appointments.length > 0) {
            appointments.forEach(appt => {
                if (appt.time) {
                    const hour = parseInt(appt.time.split(':')[0], 10);
                    if (!isNaN(hour)) {
                        if (hour < minHour) minHour = hour;
                        if (hour > maxHour) maxHour = hour;
                    }
                }
            });
        }

        // Add 1 to maxHour to ensure the last appointment fits inside the grid fully
        const totalHours = (maxHour + 1) - minHour + 1; 
        return Array.from({ length: totalHours }, (_, i) => i + minHour);
    }, [appointments]);


    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay()); // Start on Sunday
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };

    const weekDays = getWeekDays(viewDate);

    // --- Handlers ---
    // --- Export Appointments to CSV ---
    const handleExportCSV = () => {
        if (appointments.length === 0) {
            alert('No appointments to export.');
            return;
        }

        const headers = [
            'Patient Name', 'Doctor Name', 'Date', 'Time', 'Type', 'Status', 'Visit Reason'
        ];

        const csvRows = [
            headers.join(','),
            ...appointments.map(a => [
                `"${a.patientName || ''}"`,
                `"${a.doctorName || ''}"`,
                `"${a.date || ''}"`,
                `"${a.time || ''}"`,
                `"${a.type || ''}"`,
                `"${a.status || ''}"`,
                `"${a.resourceId || ''}"`
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `JanmaSethu_Appointments_${dateStr}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Import Appointments from CSV ---
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const rows = text.split('\n').map(row => row.split(','));
            const startIndex = rows[0][0] && (rows[0][0].toLowerCase().includes('patient') || rows[0][0].toLowerCase().includes('name')) ? 1 : 0;

            let successCount = 0;
            let errorCount = 0;

            for (let i = startIndex; i < rows.length; i++) {
                const cols = rows[i].map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length < 2 || !cols[0]) continue; // Skip empty rows

                const [patientName, doctorName, date, time, type, status, visitReason] = cols;

                try {
                    const matchedPatient = patients.find(p => p.name?.toLowerCase() === patientName.toLowerCase());
                    const matchedDoc = doctors.find(d => d.name?.toLowerCase() === doctorName.toLowerCase());

                    const payload: any = {
                        appointment_date: date || new Date().toISOString().split('T')[0],
                        start_time: time || '09:00',
                        doctor_id: matchedDoc ? matchedDoc.id : undefined,
                        doctor_name_snapshot: doctorName || undefined,
                        type: type || 'Consultation',
                        status: status || 'Scheduled',
                        visit_reason: visitReason || 'Consultation',
                        patient_name_snapshot: patientName,
                    };

                    if (matchedPatient) {
                        payload.patient_id = matchedPatient.id;
                        payload.patient_phone_snapshot = matchedPatient.mobile || matchedPatient.phone;
                    } else {
                        payload.name = patientName;
                        payload.phone = '9999999999'; // default phone for auto-created leads
                    }

                    console.log('Importing appointment:', patientName, payload);
                    await api.createAppointment(payload);
                    successCount++;
                } catch (err) {
                    console.error('Failed to import appointment:', patientName, err);
                    errorCount++;
                }
            }

            alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
            if (successCount > 0) {
                window.location.reload();
            }
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
        };
        reader.readAsText(file);
    };
    const handlePrev = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') newDate.setDate(viewDate.getDate() - 1);
        if (viewMode === 'week') newDate.setDate(viewDate.getDate() - 7);
        if (viewMode === 'month') newDate.setMonth(viewDate.getMonth() - 1);
        setViewDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(viewDate);
        if (viewMode === 'day') newDate.setDate(viewDate.getDate() + 1);
        if (viewMode === 'week') newDate.setDate(viewDate.getDate() + 7);
        if (viewMode === 'month') newDate.setMonth(viewDate.getMonth() + 1);
        setViewDate(newDate);
    };

    const handleSlotClick = (date: Date, time: number) => {
        setBookModalData({ date, time });
        setIsBookModalOpen(true);
    };

    const handleBookConfirm = async (formData: any) => {
        try {
            // formData provided by BookAppointmentModal
            // Structure: { name, phone, date, time, consultant, ... }

            const selectedDoc = doctors.find(d => d.name === formData.consultant);

            // Robust doctor handling: Send ID if available, PLUS name as snapshot (required by backend now)
            // If ID is not a UUID (like 'dr1'), backend treats it as string ID.
            const doctorId = selectedDoc?.id || formData.doctorId || 'dr_sireesha';
            const doctorName = selectedDoc?.name || formData.consultant || doctors.find(d => d.id === doctorId)?.name || 'Dr. B. Sireesha Rani';

            // Safe Enum Mapping for Appointment Type
            // Valid Backend Enums: Consultation, Follow-up, Procedure, Emergency, Scan, Surgery, IVF, Camp, Other
            const rawType = formData.speciality || 'Consultation';
            let safeType = 'Consultation';
            const validTypes = ['Consultation', 'Follow-up', 'Procedure', 'Emergency', 'Scan', 'Surgery', 'IVF', 'Camp'];

            // Map common frontend terms to backend ENUM
            if (validTypes.includes(rawType)) safeType = rawType;
            else if (rawType.includes('IVF')) safeType = 'IVF';
            else if (rawType.includes('Scan') || rawType.includes('Ultrasound')) safeType = 'Scan';
            else if (rawType.includes('IUI')) safeType = 'Procedure';
            else safeType = 'Consultation';

            const payload: any = {
                appointment_date: formData.date,
                start_time: formData.time,
                doctor_id: doctorId,
                doctor_name_snapshot: doctorName, // Explicitly send name for storage
                type: safeType,
                status: 'Scheduled',
                visit_reason: formData.speciality || 'Consultation', // Keep original detail here

                // Referral Details
                referral_doctor: formData.referralDoctor,
                referral_doctor_phone: formData.referralDoctorMobile,

                // Patient Snapshots (Required for appointments without PATIENT_ID)
                patient_name_snapshot: formData.name,
                patient_phone_snapshot: formData.phone,
                patient_email_snapshot: formData.email,
                patient_age_snapshot: formData.age,
                sex_snapshot: formData.sex, // Frontend 'sex' -> Backend 'sex_snapshot'
                patient_marital_status_snapshot: formData.maritalStatus,
                patient_address_snapshot: formData.address || formData.street, // Map address
                source: formData.source || 'Walk-In'
            };

            // Backend Logic: 
            // - If patient_id is present, link it.
            // - If lead_id is present (from "Existing" tab or passed prop), link it. 
            // - If NEITHER, send name/phone fields at root level -> Backend creates/links Lead automatically.

            if (formData.patientId) {
                payload.patient_id = formData.patientId;
            } else if (bookModalData.leadId) {
                payload.lead_id = bookModalData.leadId;
                // Still send snapshots for the appointment record itself (good practice)
                payload.name = formData.name;
                payload.phone = formData.phone;
            } else {
                // New Patient / Lead flow (Manual Entry)
                // 1. Send root-level fields for backend to create the Lead on the fly
                payload.name = formData.name;
                payload.phone = formData.phone;
                payload.gender = formData.sex;
                payload.email = formData.email; // Backend might ignore for lead, but keep for snapshot logic if any

                // 2. OPTIONAL: Explicitly try to create lead first IF we want it to exist independently immediately
                // However, user prompt says backend does this if we send name+phone.
                // Keeping strict separation: Only create Lead explicitly if we want to ensure 'date_added' is accurate or handle errors early.
                // For now, let's purely rely on the appointment payload to do the heavy lifting, 
                // BUT if we want the lead to show in "Leads Pipeline" immediately without appointment side-effect delay:
                try {
                    // STRICT Payload: Name, Phone, Status, Date_Added, Source.
                    const strictLeadPayload = {
                        name: formData.name,
                        phone: formData.phone,
                        status: 'New Inquiry',
                        source: formData.source || 'Walk-In', // Ensure Source is passed
                        date_added: new Date().toISOString()
                    };

                    // We fire-and-forget this to ensure lead exists in pipeline view
                    await api.createLead(strictLeadPayload).catch(err => {
                        // Ignore duplicates (409) silently as that's good - lead exists.
                        if (err?.status !== 409) console.warn("Lead pre-creation warning:", err);
                    });
                } catch (e) {
                    // Ignore
                }
            }

            let createdAppointmentId = `apt-${Date.now()}`;
            const response = await api.createAppointment(payload);
            if (response && (response.id || (response.data && response.data.id))) {
                createdAppointmentId = response.id || response.data.id;
            }

            const newApt: Appointment = {
                id: createdAppointmentId,
                patientName: formData.name,
                doctorName: doctorName,
                doctorId: doctorId,
                time: formData.time,
                date: formData.date,
                type: formData.speciality || 'Consultation',
                status: 'Scheduled',
            };
            setAppointments(prev => [...prev, newApt]);
        } catch (e: any) {
            console.error("Failed to create appointment:", e);
            alert(e?.message || e?.error || "Failed to book appointment. Please check details.");
        }
    };

    const handleAppointmentClick = (e: React.MouseEvent, apt: Appointment) => {
        e.stopPropagation();
        setSelectedAppointment(apt);
        setIsActionCardOpen(true);
    };

    const handleCheckIn = async () => {
        if (selectedAppointment) {
            try {
                let pinMsg = "";
                // If the appointment doesn't have a linked patient profile yet (e.g. from WhatsApp lead)
                if (!selectedAppointment.patientId) {
                    const result = await api.checkinAndConvert(selectedAppointment.id);
                    const pin = result.data?.pin || result.pin || 'Unknown';
                    pinMsg = `\n\nPatient Profile Created!\nPlease provide this Registration PIN to the patient:\n\nPIN: ${pin}`;
                } else {
                    const status = 'Checked-In';
                    await api.updateAppointmentStatus(selectedAppointment.id, { status });
                }

                const status = 'Checked-In';
                // Update Local State List
                setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status, patientId: a.patientId || 'new-patient' } : a));

                // Update Selected Appointment State
                setSelectedAppointment(prev => prev ? ({ ...prev, status, patientId: prev.patientId || 'new-patient' }) : null);

                setIsActionCardOpen(false);
                
                if (pinMsg) {
                    alert(`Check-in complete.${pinMsg}\n\nPlease proceed to update the rest of their information in their profile.`);
                }
            } catch (error: any) {
                console.error("Check-in failed", error);
                alert(error?.message || error?.error || "Failed to check in. Please try again.");
            }
        }
    };

    const handleRescheduleInit = () => {
        setAppointmentToReschedule(selectedAppointment);
        setIsActionCardOpen(false);
        setIsRescheduleModalOpen(true);
    };

    const handleRescheduleConfirm = async (newDate: Date | string, newTime: string) => {
        if (appointmentToReschedule) {
            try {
                // Ensure valid date string for ISO conversion if input is string
                const safeDate = typeof newDate === 'string' ? new Date(newDate) : newDate;
                const formattedDate = safeDate.toISOString().split('T')[0];

                await api.updateAppointment(appointmentToReschedule.id, {
                    appointment_date: formattedDate,
                    appointment_time: newTime.split(' ')[0], // New backend requirement
                    doctor_id: appointmentToReschedule.doctorId,
                    notes: 'Rescheduled'
                } as any);

                setAppointments(prev => prev.map(a => a.id === appointmentToReschedule.id ? {
                    ...a,
                    date: formattedDate,
                    time: newTime,
                    status: 'Scheduled'
                } : a));

                // Close reschedule modal
                setIsRescheduleModalOpen(false);
                setAppointmentToReschedule(null);
            } catch (error: any) {
                console.error("Reschedule failed", error);
                alert(error?.message || error?.error || "Failed to reschedule.");
            }
        }
    };

    const handleCancel = async () => {
        if (selectedAppointment) {
            if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

            try {
                await api.updateAppointmentStatus(selectedAppointment.id, { status: 'Canceled', cancellation_reason: 'Patient Request' });

                // Update Lists
                setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'Canceled' } : a));
                setSelectedAppointment(prev => prev ? ({ ...prev, status: 'Canceled' }) : null);

                setIsActionCardOpen(false);
            } catch (error) {
                console.error("Cancel failed", error);
                alert("Failed to cancel appointment.");
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-90px)] gap-3 md:gap-4 relative w-full overflow-hidden">
            {/* Sidebar Filters - Hidden on mobile, narrower on tablet */}
            <div className="hidden md:flex w-48 lg:w-56 xl:w-64 flex-shrink-0 flex-col gap-4 lg:gap-6 overflow-y-auto custom-scrollbar">
                {getRoleTier(userRole) >= 2 && ( // Hide filters sidebar for Doctors (Tier 1)
                    <div className="bg-brand-surface p-3 lg:p-4 xl:p-6 rounded-xl lg:rounded-2xl shadow-sm border border-brand-border">
                        <div className="flex items-center space-x-2 mb-3 lg:mb-4 xl:mb-6 text-brand-textPrimary">
                            <Filter size={16} className="text-brand-primary" />
                            <h3 className="font-bold text-sm lg:text-base">Filters</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3">Doctors & Staff</label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedDoctor('all')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDoctor === 'all' ? 'bg-brand-primary/20 text-brand-primary font-bold' : 'text-brand-textSecondary hover:bg-brand-bg'
                                            }`}
                                    >
                                        All Staff
                                    </button>
                                    {doctors.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDoctor(doc.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${selectedDoctor === doc.id ? 'bg-brand-bg text-brand-textPrimary font-bold' : 'text-brand-textSecondary hover:bg-brand-bg'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full mr-2 ${doc.color.split(' ')[0].replace('/20', '')}`}></span>
                                            {doc.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                <div className="bg-brand-surface p-4 rounded-2xl shadow-sm border border-brand-border flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-brand-textPrimary text-sm">Mini Calendar</h4>
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
                                    const isSelected = currentDate.toDateString() === viewDate.toDateString();
                                    const isToday = currentDate.toDateString() === new Date().toDateString();

                                    days.push(
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setViewDate(currentDate);
                                                // Optional: Sync mini calendar to selected date if desired, but keeping it independent allows browsing
                                            }}
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

            {/* Right Side Content Container (Scrollable vertically) */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1 pb-4">
                {/* Main Calendar Area */}
                <div className="flex flex-col bg-brand-surface rounded-xl sm:rounded-2xl shadow-sm border border-brand-border min-h-[600px] flex-shrink-0">
                {/* Header */}
                <div className="p-2 sm:p-3 lg:p-4 border-b border-brand-border bg-brand-bg/50">
                    {/* Navigation & Controls - Single Row */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Left: Month Navigation */}
                        <div className="flex items-center space-x-0.5">
                            <button onClick={handlePrev} className="p-1 hover:bg-brand-bg hover:shadow-sm rounded-lg text-brand-textSecondary transition-all"><ChevronLeft size={14} /></button>
                            <h2 className="text-xs sm:text-sm lg:text-base font-bold text-brand-textPrimary min-w-[80px] sm:min-w-[120px] text-center whitespace-nowrap">
                                <span className="hidden sm:inline">
                                    {viewMode === 'month' && viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    {viewMode === 'day' && viewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    {viewMode === 'week' && (
                                        (() => {
                                            const start = new Date(viewDate);
                                            start.setDate(viewDate.getDate() - viewDate.getDay());
                                            const end = new Date(start);
                                            end.setDate(start.getDate() + 6);
                                            const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                            return `${startStr} - ${endStr}`;
                                        })()
                                    )}
                                </span>
                                <span className="sm:hidden">
                                    {viewMode === 'month' && viewDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    {viewMode === 'day' && viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {viewMode === 'week' && 'This Week'}
                                </span>
                            </h2>
                            <button onClick={handleNext} className="p-1 hover:bg-brand-bg hover:shadow-sm rounded-lg text-brand-textSecondary transition-all"><ChevronRight size={14} /></button>
                        </div>

                        {/* Right: View Toggle + Book Button */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="flex bg-brand-bg p-0.5 rounded-md sm:rounded-lg border border-brand-border">
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all ${viewMode === 'day' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-textSecondary'}`}
                                >
                                    Day
                                </button>
                                <button
                                    onClick={() => setViewMode('week')}
                                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all ${viewMode === 'week' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-textSecondary'}`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setViewMode('month')}
                                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all ${viewMode === 'month' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-textSecondary'}`}
                                >
                                    Month
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv"
                                className="hidden"
                            />
                            <button
                                onClick={handleExportCSV}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-brand-surface border border-brand-border hover:bg-brand-bg text-brand-textSecondary font-bold rounded-lg sm:rounded-xl flex items-center text-[9px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
                                title="Export to CSV"
                            >
                                <Download size={12} className="sm:mr-1" /> <span className="hidden sm:inline">Export</span>
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-brand-surface border border-brand-border hover:bg-brand-bg text-brand-textSecondary font-bold rounded-lg sm:rounded-xl flex items-center text-[9px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
                                title="Import from CSV"
                            >
                                <Upload size={12} className="sm:mr-1" /> <span className="hidden sm:inline">Import</span>
                            </button>
                            <button
                                onClick={() => { setBookModalData({ date: new Date(), time: 9 }); setIsBookModalOpen(true); }}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-lg sm:rounded-xl shadow-md shadow-brand-primary/20 flex items-center text-[9px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={12} className="mr-0.5 sm:mr-1" /><span className="hidden sm:inline">Book</span><span className="sm:hidden">+</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col bg-brand-surface overflow-hidden">

                    {/* --- MONTH VIEW --- */}
                    {viewMode === 'month' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-brand-surface relative overflow-y-auto custom-scrollbar">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-brand-border bg-brand-bg sticky top-0 z-10 shadow-sm">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                                    <div key={`${d}-${idx}`} className="p-1.5 sm:p-2 lg:p-3 text-center border-r border-brand-border text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase">
                                        <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                                        <span className="sm:hidden">{d}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Month Grid */}
                            <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-brand-bg/10">
                                {(() => {
                                    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                                    const startDay = start.getDay();
                                    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                                    const days = [];

                                    // Empty slots for previous month
                                    for (let i = 0; i < startDay; i++) {
                                        days.push(<div key={`empty-${i}`} className="border-b border-r border-brand-border bg-brand-bg/30 min-h-[60px] sm:min-h-[80px] lg:min-h-[100px]" />);
                                    }

                                    // Days
                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
                                        // Fix: Use local date string comparison to avoid UTC shifts
                                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                        const dayAppointments = appointments.filter(a => {
                                            const matchesDate = a.date === dateStr;
                                            const matchesDoctor = selectedDoctor === 'all' || a.doctorId === selectedDoctor || a.doctorName === doctors.find(d => d.id === selectedDoctor)?.name;
                                            return matchesDate && matchesDoctor;
                                        });
                                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                                        days.push(
                                            <div
                                                key={i}
                                                onClick={() => { setViewDate(currentDate); setViewMode('day'); }}
                                                className={`border-b border-r border-brand-border p-1 sm:p-1.5 lg:p-2 min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] hover:bg-brand-bg transition-colors cursor-pointer group relative ${isToday ? 'bg-brand-primary/5' : 'bg-brand-surface'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1 lg:mb-2">
                                                    <span className={`text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-primary text-white shadow-md' : 'text-brand-textPrimary'}`}>
                                                        {i}
                                                    </span>
                                                    {dayAppointments.length > 0 && (
                                                        <span className="text-[10px] font-bold text-brand-textSecondary bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">
                                                            {dayAppointments.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayAppointments.slice(0, 3).map(apt => {
                                                        const doctor = doctors.find(d => d.name === apt.doctorName);
                                                        const colorClass = doctor?.color || 'bg-brand-surface text-brand-textSecondary border-brand-border';
                                                        return (
                                                            <div key={apt.id} className={`text-[10px] truncate px-1.5 py-1 rounded border-l-2 ${colorClass} ${apt.status === 'Canceled' ? 'opacity-50 line-through grayscale' : ''}`}>
                                                                {apt.time.split(' ')[0]} {apt.patientName}
                                                            </div>
                                                        );
                                                    })}
                                                    {dayAppointments.length > 3 && (
                                                        <div className="text-[10px] text-brand-textSecondary font-bold pl-1">
                                                            + {dayAppointments.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Add Button on Hover */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setBookModalData({ date: currentDate, time: 9 }); setIsBookModalOpen(true); }}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-brand-primary text-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* --- WEEK & DAY VIEW --- */}
                    {(viewMode === 'week' || viewMode === 'day') && (
                        <div className="flex-1 flex flex-col min-h-0 bg-brand-surface relative overflow-y-auto custom-scrollbar">
                            {/* Days Header */}
                            <div className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-2'} border-b border-brand-border bg-brand-bg sticky top-0 z-10 shadow-sm`}>
                                <div className="p-4 text-xs font-bold text-brand-textSecondary uppercase text-center border-r border-brand-border flex items-center justify-center">
                                    Time
                                </div>
                                {(viewMode === 'week' ? weekDays : [viewDate]).map((day, i) => (
                                    <div key={i} className={`p-3 text-center border-r border-brand-border ${day.toDateString() === new Date().toDateString() ? 'bg-brand-primary/10' : ''}`}>
                                        <p className="text-[10px] font-bold text-brand-textSecondary uppercase mb-1">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${day.toDateString() === new Date().toDateString() ? 'bg-brand-primary text-brand-bg shadow-md shadow-brand-primary/20' : 'text-brand-textPrimary'
                                            }`}>
                                            {day.getDate()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time Slots Grid */}
                            <div className="flex-1 relative">
                                {timeSlots.map(hour => (
                                    <div key={hour} className={`grid ${viewMode === 'week' ? 'grid-cols-8' : 'grid-cols-2'} border-b border-brand-border min-h-[120px]`}>
                                        {/* Time Label */}
                                        <div className="p-4 text-xs font-bold text-brand-textSecondary text-center border-r border-brand-border bg-brand-bg/30 flex flex-col justify-center">
                                            <span>{hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}</span>
                                        </div>

                                        {/* Day Columns */}
                                        {(viewMode === 'week' ? weekDays : [viewDate]).map((day, i) => {
                                            // Fix: Use local date string comparison to avoid UTC shifts
                                            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

                                            // Find appointments for this slot
                                            const slotAppointments = appointments.filter(a => {
                                                if (!a.date) return false;
                                                const aDateStr = a.date.split('T')[0];

                                                // Handle Time Parsing (supports "09:00", "09:00:00", "9:00 AM", "16:00:00")
                                                let aptHour = 0;
                                                let isPM = false;

                                                const t = a.time || '00:00';

                                                if (t.includes(' ')) {
                                                    // "9:00 AM" format
                                                    const parts = t.split(' ');
                                                    const timePart = parts[0];
                                                    const meridian = parts[1];
                                                    aptHour = parseInt(timePart.split(':')[0]);
                                                    isPM = meridian === 'PM';
                                                    if (isPM && aptHour < 12) aptHour += 12;
                                                    if (!isPM && aptHour === 12) aptHour = 0;
                                                } else {
                                                    // "16:00:00" or "16:00" format
                                                    const parts = t.split(':');
                                                    aptHour = parseInt(parts[0]);
                                                }

                                                const matchesDate = aDateStr === dateStr && aptHour === hour;
                                                const matchesDoctor = selectedDoctor === 'all' || a.doctorId === selectedDoctor || a.doctorName === doctors.find(d => d.id === selectedDoctor)?.name;

                                                return matchesDate && matchesDoctor;
                                            });

                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSlotClick(day, hour)}
                                                    className="border-r border-brand-border p-1 relative group hover:bg-brand-bg/50 transition-colors cursor-pointer"
                                                >
                                                    {/* Hover "Add" Indicator */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                        <Plus className="text-brand-primary/50" size={24} />
                                                    </div>

                                                    {/* Render Appointments */}
                                                    {slotAppointments.map(apt => {
                                                        const doctor = doctors.find(d => d.name === apt.doctorName) || doctors.find(d => d.id === apt.doctorId);
                                                        const colorClass = doctor?.color || 'bg-brand-surface text-brand-textSecondary border-brand-border';

                                                        return (
                                                            <div
                                                                key={apt.id}
                                                                onClick={(e) => handleAppointmentClick(e, apt)}
                                                                className={`
                                                                    mb-1 p-2 rounded-lg border-l-4 text-xs shadow-sm hover:shadow-md transition-all cursor-pointer relative z-10
                                                                    ${colorClass} ${apt.status === 'Canceled' ? 'opacity-50 grayscale' : ''}
                                                                `}
                                                            >
                                                                <p className="font-bold truncate">{apt.patientName}</p>
                                                                <p className="opacity-80 truncate text-[10px]">{apt.type}</p>
                                                                {apt.status === 'Canceled' && (
                                                                    <p className="text-red-500 font-bold text-[10px]">Canceled</p>
                                                                )}
                                                                {apt.status === 'Arrived' && (
                                                                    <span className="absolute top-1 right-1 w-2 h-2 bg-brand-success rounded-full"></span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* List View Below Calendar */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-brand-border bg-brand-bg/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-brand-textPrimary">Consultations & Appointments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-surface border-b border-brand-border">
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Time</th>
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Patient</th>
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Date</th>
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Consultation Type</th>
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Handoff / Reason</th>
                                <th className="p-3 text-xs font-bold text-brand-textSecondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointmentsList.length > 0 ? filteredAppointmentsList.slice((appointmentsCurrentPage - 1) * 10, appointmentsCurrentPage * 10).map((apt) => (
                                <tr key={apt.id} className="border-b border-brand-border hover:bg-brand-bg/50 transition-colors">
                                    <td className="p-3 text-sm font-medium text-brand-textPrimary">{apt.time}</td>
                                    <td className="p-3">
                                        <div className="text-sm font-bold text-brand-textPrimary">{apt.patientName}</div>
                                        <div className="text-xs text-brand-textSecondary">{apt.doctorName}</div>
                                    </td>
                                    <td className="p-3 text-sm text-brand-textSecondary">
                                        {apt.date}
                                    </td>
                                    <td className="p-3 text-sm text-brand-textSecondary">{apt.type}</td>
                                    <td className="p-3 text-sm text-brand-textSecondary italic line-clamp-2" title={(apt as any).visit_reason || (apt as any).notes || 'N/A'}>
                                        {(apt as any).visit_reason || (apt as any).notes || 'N/A'}
                                    </td>
                                    <td className="p-3">
                                        <span className={"px-2 py-1 rounded text-xs font-bold " + (apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : apt.status === 'Checked-In' ? 'bg-green-100 text-green-700' : apt.status === 'In-Consultation' ? 'bg-purple-100 text-purple-700' : apt.status === 'Completed' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700')}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-brand-textSecondary text-sm">
                                        No appointments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    <Pagination 
                        currentPage={appointmentsCurrentPage}
                        totalPages={Math.ceil(filteredAppointmentsList.length / 10) || 1}
                        onPageChange={setAppointmentsCurrentPage}
                        className="p-4 border-t border-brand-border"
                    />
                </div>
            </div>

            </div>

            {/* Modals */}
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

            {isActionCardOpen && selectedAppointment && (
                <AppointmentActionCard
                    isOpen={isActionCardOpen}
                    onClose={() => setIsActionCardOpen(false)}
                    appointment={selectedAppointment}
                    onReschedule={handleRescheduleInit}
                    onCancel={handleCancel}
                    onCheckIn={handleCheckIn}
                    doctors={doctors}
                />
            )}

            {appointmentToReschedule && (
                <RescheduleModal
                    isOpen={isRescheduleModalOpen}
                    onClose={() => setIsRescheduleModalOpen(false)}
                    patientName={appointmentToReschedule.patientName}
                    onConfirm={handleRescheduleConfirm}
                />
            )}

            {/* Patient Profile Overlay */}
            {viewingPatientProfile && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={() => setViewingPatientProfile(null)}></div>
                    <div className="w-[85%] max-w-6xl h-full bg-brand-bg shadow-2xl animate-slide-in-right relative overflow-hidden flex flex-col border-l border-brand-border">
                        <div className="absolute top-4 right-4 z-50">
                            <button onClick={() => setViewingPatientProfile(null)} className="bg-brand-surface p-2 rounded-full hover:bg-brand-error/20 text-brand-textSecondary hover:text-brand-error transition-colors shadow-sm border border-brand-border">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <PatientProfile
                            patient={DEFAULT_PATIENT_PROFILE}
                            onClose={() => setViewingPatientProfile(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
