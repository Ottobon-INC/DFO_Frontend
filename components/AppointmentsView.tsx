import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Phone,
    CheckCircle2, Clock, UserPlus, Clock4, Users, MoreHorizontal, X,
    MapPin, Mail, Stethoscope, Activity, Syringe, ClipboardList,
    UserCheck, Repeat, CalendarCheck, Edit3, Trash2, ChevronDown,
    Filter, DoorOpen
} from 'lucide-react';
import { Doctor, Appointment, Patient, UserRole } from '../types';
import { getRoleTier } from '../constants/roles.constants';
import { BookAppointmentModal, AppointmentActionCard } from './AppointmentModals';
import { RescheduleModal } from './Modals';
import { PatientProfile } from './PatientProfile';
import { Pagination } from './Pagination';
import { api } from '../services/api';
import toast from 'react-hot-toast';

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

// ─── Appointment Type → Color / Icon mapping ───────────────────────────────
const APPT_TYPE_MAP: Record<string, { bg: string; border: string; text: string; dot: string; icon: React.FC<any> }> = {
    'op consultation': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500', icon: Stethoscope },
    'consultation': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500', icon: Stethoscope },
    'follow-up': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500', icon: Repeat },
    'follow up': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500', icon: Repeat },
    'procedure': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-600', icon: Activity },
    'review': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500', icon: ClipboardList },
    'new patient': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', icon: UserCheck },
    'vaccination': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500', icon: Syringe },
    'ivf': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500', icon: Activity },
    'scan': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500', icon: Activity },
    'surgery': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', dot: 'bg-red-500', icon: Activity },
};

const getTypeStyle = (type: string) => {
    const key = (type || '').toLowerCase().trim();
    for (const [k, v] of Object.entries(APPT_TYPE_MAP)) {
        if (key.includes(k)) return v;
    }
    return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500', icon: CalendarIcon };
};

// ─── Consultation Type Legend items ────────────────────────────────────────
const CONSULT_LEGEND = [
    { label: 'OP Consultation', dot: 'bg-purple-500' },
    { label: 'Follow-up', dot: 'bg-pink-500' },
    { label: 'Procedure', dot: 'bg-amber-600' },
    { label: 'Review', dot: 'bg-yellow-500' },
    { label: 'New Patient', dot: 'bg-emerald-500' },
    { label: 'Vaccination', dot: 'bg-orange-500' },
];

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ userRole }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [viewDate, setViewDate] = useState(new Date());
    const [miniCalendarDate, setMiniCalendarDate] = useState(new Date()); // Independent state for mini calendar browsing
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
    const [selectedRoom, setSelectedRoom] = useState<string>('all');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentsCurrentPage, setAppointmentsCurrentPage] = useState(1);
    const [appointmentsTotalPages, setAppointmentsTotalPages] = useState(1);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [rightPanelTab, setRightPanelTab] = useState<'details' | 'history' | 'notes'>('details');

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
                            type: resolvedType || 'Visit',
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
    const [expandedSlot, setExpandedSlot] = useState<{ date: Date, hour: number, appointments: Appointment[] } | null>(null);
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
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);

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
        // Appointment booking window:
        // 8:30 AM → 11:00 PM
        // 11:00 PM → 8:30 AM is unavailable

        const slots: number[] = [];

        // 9 AM through 10 PM
        for (let hour = 9; hour <= 22; hour++) {
            slots.push(hour);
        }

        return slots;
    }, []);


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
                        type: type || 'Visit',
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
                visit_reason: (formData as any).visitReason || formData.speciality || 'Consultation',
                notes: (formData as any).visitReason || '',

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
                type: formData.speciality || 'Visit',
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

    // Derived states for Right Sidebar (Day Summary)
    const appointmentsToday = appointments.filter(a => {
        if (!a.date) return false;
        const [y, m, d] = a.date.split('T')[0].split('-').map(Number);
        return y === viewDate.getFullYear() && m === viewDate.getMonth() + 1 && d === viewDate.getDate();
    });

    const totalToday = appointmentsToday.length;
    const completedToday = appointmentsToday.filter(a => a.status === 'Completed' || a.status === 'Checked-In').length;
    const upcomingToday = appointmentsToday.filter(a => a.status === 'Scheduled' || a.status === 'Pending' || a.status === 'Upcoming').length;
    const cancelledToday = appointmentsToday.filter(a => a.status === 'Canceled').length;
    const noShowToday = appointmentsToday.filter(a => a.status === 'No Show').length;

    // Next Appointment
    const now = new Date();
    const futureAppointments = appointmentsToday.filter(a => {
        if (!a.time || a.status === 'Completed' || a.status === 'Canceled' || a.status === 'Checked-In') return false;
        let aptHour = 0;
        let aptMin = 0;
        const t = a.time || '00:00';
        if (t.includes(' ')) {
            const parts = t.split(' ');
            const timePart = parts[0];
            const meridian = parts[1];
            aptHour = parseInt(timePart.split(':')[0]);
            aptMin = parseInt(timePart.split(':')[1] || '0');
            const isPM = meridian === 'PM';
            if (isPM && aptHour < 12) aptHour += 12;
            if (!isPM && aptHour === 12) aptHour = 0;
        } else {
            const parts = t.split(':');
            aptHour = parseInt(parts[0]);
            aptMin = parseInt(parts[1] || '0');
        }
        const aptDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), aptHour, aptMin);
        if (viewDate.toDateString() !== now.toDateString()) {
            return true;
        }
        return aptDate > now;
    }).sort((a, b) => {
        let aHour = 0, aMin = 0, bHour = 0, bMin = 0;
        const parseTime = (t, out) => {
            if (t.includes(' ')) {
                const parts = t.split(' ');
                const meridian = parts[1];
                out.h = parseInt(parts[0].split(':')[0]);
                out.m = parseInt(parts[0].split(':')[1] || '0');
                if (meridian === 'PM' && out.h < 12) out.h += 12;
                if (meridian === 'AM' && out.h === 12) out.h = 0;
            } else {
                const parts = t.split(':');
                out.h = parseInt(parts[0]);
                out.m = parseInt(parts[1] || '0');
            }
        };
        const objA = { h: 0, m: 0 }, objB = { h: 0, m: 0 };
        parseTime(a.time, objA); parseTime(b.time, objB);
        return (objA.h * 60 + objA.m) - (objB.h * 60 + objB.m);
    });

    const nextAppointment = (viewDate.toDateString() === now.toDateString() && futureAppointments.length > 0) ? futureAppointments[0] : null;
    let nextAptInMin = 0;
    if (nextAppointment) {
        let aptHour = 0;
        let aptMin = 0;
        const t = nextAppointment.time || '00:00';
        if (t.includes(' ')) {
            const parts = t.split(' ');
            const meridian = parts[1];
            aptHour = parseInt(parts[0].split(':')[0]);
            aptMin = parseInt(parts[0].split(':')[1] || '0');
            if (meridian === 'PM' && aptHour < 12) aptHour += 12;
            if (meridian === 'AM' && aptHour === 12) aptHour = 0;
        } else {
            const parts = t.split(':');
            aptHour = parseInt(parts[0]);
            aptMin = parseInt(parts[1] || '0');
        }
        const aptDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), aptHour, aptMin);
        nextAptInMin = Math.round((aptDate.getTime() - now.getTime()) / 60000);
    }

    // ─── Derived data for sidebar filters ─────────────────────────────────────
    const doctorAppointmentCounts = React.useMemo(() => {
        const map: Record<string, number> = {};
        appointments.forEach(a => {
            const key = a.doctorId || a.doctorName || '';
            if (key) map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [appointments]);

    // Collect unique rooms from resourceId
    const rooms = React.useMemo(() => {
        const set = new Set<string>();
        appointments.forEach(a => { if (a.resourceId) set.add(a.resourceId); });
        return Array.from(set).sort();
    }, [appointments]);

    const roomAppointmentCounts = React.useMemo(() => {
        const map: Record<string, number> = {};
        appointments.forEach(a => {
            if (a.resourceId) map[a.resourceId] = (map[a.resourceId] || 0) + 1;
        });
        return map;
    }, [appointments]);

    // ─── Format helpers ─────────────────────────────────────────────────────────
    const formatTime12 = (t: string) => {
        if (!t) return '';
        if (t.includes('AM') || t.includes('PM')) return t;
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
    };

    const getEndTime = (startTime: string) => {
        if (!startTime) return '';
        let h = 0, m = 0;
        if (startTime.includes('AM') || startTime.includes('PM')) {
            const parts = startTime.split(' ');
            const meridian = parts[1];
            [h, m] = parts[0].split(':').map(Number);
            if (meridian === 'PM' && h < 12) h += 12;
            if (meridian === 'AM' && h === 12) h = 0;
        } else {
            [h, m] = startTime.split(':').map(Number);
        }
        m += 30;
        if (m >= 60) { h += 1; m -= 60; }
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    // Initials helper
    const getInitials = (name: string) => {
        const parts = (name || '').trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (parts[0]?.[0] || '?').toUpperCase();
    };

    const AVATAR_COLORS = [
        'bg-purple-100 text-purple-700',
        'bg-pink-100 text-pink-700',
        'bg-blue-100 text-blue-700',
        'bg-emerald-100 text-emerald-700',
        'bg-orange-100 text-orange-700',
        'bg-cyan-100 text-cyan-700',
        'bg-indigo-100 text-indigo-700',
        'bg-rose-100 text-rose-700',
    ];
    const avatarColor = (name: string) => AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];

    // Day view: filter appointments for selected date + active filters
    const dayAppointments = React.useMemo(() => {
        return appointments.filter(a => {
            if (!a.date) return false;
            const [y, m, d] = a.date.split('T')[0].split('-').map(Number);
            const matchesDate = y === viewDate.getFullYear() && m === viewDate.getMonth() + 1 && d === viewDate.getDate();
            const matchesDoctor = selectedDoctor === 'all' || a.doctorId === selectedDoctor || a.doctorName === doctors.find(doc => doc.id === selectedDoctor)?.name;
            const matchesRoom = selectedRoom === 'all' || a.resourceId === selectedRoom;
            return matchesDate && matchesDoctor && matchesRoom;
        }).sort((a, b) => {
            const toMin = (t: string) => {
                if (!t) return 0;
                let h = 0, m = 0;
                if (t.includes('AM') || t.includes('PM')) {
                    const parts = t.split(' ');
                    [h, m] = parts[0].split(':').map(Number);
                    if (parts[1] === 'PM' && h < 12) h += 12;
                    if (parts[1] === 'AM' && h === 12) h = 0;
                } else {
                    [h, m] = t.split(':').map(Number);
                }
                return h * 60 + m;
            };
            return toMin(a.time) - toMin(b.time);
        });
    }, [appointments, viewDate, selectedDoctor, selectedRoom, doctors]);

    return (
        <div className="flex flex-1 h-full w-full bg-[#f4f6fb] overflow-hidden" style={{ minHeight: 0 }}>
            {/* ══════════════════════════════════════════════════════════════
                COLUMN A — Left Sidebar
            ══════════════════════════════════════════════════════════════ */}
            <aside className="w-[290px] flex-shrink-0 flex flex-col gap-4 p-4 bg-white border-r border-slate-200" style={{ minHeight: 0 }}>

                {/* Mini Calendar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-800">
                            {miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-0.5">
                            <button onClick={() => { const d = new Date(miniCalendarDate); d.setMonth(d.getMonth() - 1); setMiniCalendarDate(d); }}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => { const d = new Date(miniCalendarDate); d.setMonth(d.getMonth() + 1); setMiniCalendarDate(d); }}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={`${d}-${i}`} className="text-[10px] text-slate-400 font-semibold py-0.5">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {(() => {
                            const start = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth(), 1);
                            const startDay = start.getDay();
                            const daysInMonth = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() + 1, 0).getDate();
                            const days: React.ReactNode[] = [];
                            for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`} />);
                            for (let i = 1; i <= daysInMonth; i++) {
                                const cur = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth(), i);
                                const isSelected = cur.toDateString() === viewDate.toDateString();
                                const isToday = cur.toDateString() === new Date().toDateString();
                                days.push(
                                    <button key={i} onClick={() => { setViewDate(cur); setViewMode('day'); }}
                                        className={`w-7 h-7 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition-all
                                            ${isSelected ? 'bg-brand-primary text-white shadow-md scale-110' :
                                                isToday ? 'bg-blue-100 text-brand-primary font-bold' :
                                                    'hover:bg-slate-100 text-slate-600'}`}>
                                        {i}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>

                {/* Doctors Filter */}
                {getRoleTier(userRole) >= 2 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Doctors</h4>
                        <div className="space-y-1">
                            {/* All Doctors row */}
                            <button
                                onClick={() => setSelectedDoctor('all')}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDoctor === 'all'
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'hover:bg-slate-50 text-slate-600'
                                    }`}>
                                <span>All Doctors</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedDoctor === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{appointments.length}</span>
                            </button>
                            {/* Per-doctor rows */}
                            {doctors.map((doc, idx) => {
                                const count = doctorAppointmentCounts[doc.id] || doctorAppointmentCounts[doc.name] || 0;
                                const isActive = selectedDoctor === doc.id;
                                const initials = getInitials(doc.name);
                                const colors = ['bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700', 'bg-cyan-100 text-cyan-700'];
                                const chipColor = colors[idx % colors.length];
                                return (
                                    <button key={doc.id} onClick={() => setSelectedDoctor(isActive ? 'all' : doc.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all ${isActive ? 'bg-blue-50 text-brand-primary' : 'hover:bg-slate-50 text-slate-700'
                                            }`}>
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${chipColor}`}>
                                            {initials}
                                        </span>
                                        <span className="flex-1 text-left text-xs font-semibold truncate">{doc.name}</span>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rooms Filter */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rooms</h4>
                    <div className="space-y-1">
                        <button onClick={() => setSelectedRoom('all')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${selectedRoom === 'all'
                                ? 'bg-brand-primary text-white shadow-sm'
                                : 'hover:bg-slate-50 text-slate-600'
                                }`}>
                            <span>All Rooms</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedRoom === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>{appointments.length}</span>
                        </button>
                        {rooms.length === 0 && (
                            <p className="text-xs text-slate-400 px-3 py-2 italic">No rooms assigned yet</p>
                        )}
                        {rooms.map(room => {
                            const count = roomAppointmentCounts[room] || 0;
                            const isActive = selectedRoom === room;
                            return (
                                <button key={room} onClick={() => setSelectedRoom(isActive ? 'all' : room)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${isActive ? 'bg-blue-50 text-brand-primary font-semibold' : 'hover:bg-slate-50 text-slate-600'
                                        }`}>
                                    <DoorOpen size={13} className="shrink-0" />
                                    <span className="flex-1 text-left text-xs font-medium truncate">{room}</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Consultation Type Legend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Consultation Types</h4>
                    <div className="space-y-2">
                        {CONSULT_LEGEND.map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dot}`} />
                                <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Watermark */}
                <div className="mt-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 text-center">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CalendarIcon size={18} className="text-brand-primary" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 leading-snug mb-3">
                        Better care starts with<br />organized days.
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-medium">System Online v1.0.0</span>
                    </div>
                </div>

            </aside>

            {/* ══════════════════════════════════════════════════════════════
                COLUMN B — Center Schedule
            ══════════════════════════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Top Controls Bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 gap-4 shrink-0">
                    {/* Left: Today + Nav + Date */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setViewDate(new Date()); setMiniCalendarDate(new Date()); }}
                            className="px-3 py-1.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors">
                            Today
                        </button>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button onClick={handlePrev} className="px-2 py-1.5 hover:bg-slate-50 text-slate-500 border-r border-slate-200 transition-colors"><ChevronLeft size={15} /></button>
                            <button onClick={handleNext} className="px-2 py-1.5 hover:bg-slate-50 text-slate-500 transition-colors"><ChevronRight size={15} /></button>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
                            {viewMode === 'day' && viewDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            {viewMode === 'week' && (() => {
                                const start = new Date(viewDate);
                                start.setDate(viewDate.getDate() - viewDate.getDay());
                                const end = new Date(start);
                                end.setDate(start.getDate() + 6);
                                return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                            })()}
                            {viewMode === 'month' && viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            <ChevronDown size={13} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Right: Day/Week/Month + Filter + Book */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                            {(['day', 'week', 'month'] as const).map(m => (
                                <button key={m} onClick={() => setViewMode(m)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all capitalize ${viewMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}>{m}</button>
                            ))}
                        </div>
                        <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                            <Filter size={15} />
                        </button>
                        <button
                            onClick={() => { setBookModalData({ date: new Date(), time: 9 }); setIsBookModalOpen(true); }}
                            className="flex items-center gap-1.5 bg-brand-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-brand-primaryDark transition-colors">
                            <Plus size={14} strokeWidth={3} /> Book Appointment
                        </button>
                    </div>
                </div>

                {/* Schedule / Calendar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* ── DAY VIEW ──────────────────────────────────────── */}
                    {viewMode === 'day' && (
                        <div className="p-4 flex flex-col gap-3">
                            {/* Time grid */}
                            {timeSlots.map(hour => {
                                const slotApts = dayAppointments.filter(a => {
                                    const t = a.time || '00:00';
                                    let h = 0;
                                    if (t.includes('AM') || t.includes('PM')) {
                                        const parts = t.split(' ');
                                        h = parseInt(parts[0].split(':')[0]);
                                        if (parts[1] === 'PM' && h < 12) h += 12;
                                        if (parts[1] === 'AM' && h === 12) h = 0;
                                    } else {
                                        h = parseInt(t.split(':')[0]);
                                    }
                                    return h === hour;
                                });

                                const isLunch = hour === 13;

                                return (
                                    <div key={hour} className="flex gap-3 min-h-[72px]">
                                        {/* Time label */}
                                        <div className="w-16 flex-shrink-0 pt-1 text-right">
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                            </span>
                                        </div>

                                        {/* Slot area */}
                                        <div className="flex-1 border-t border-slate-200 pt-1 relative">
                                            {isLunch && slotApts.length === 0 ? (
                                                <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs text-slate-400 font-semibold flex items-center gap-2">
                                                    <Clock size={13} /> Lunch Break (1:00 PM – 2:00 PM)
                                                </div>
                                            ) : slotApts.length === 0 ? (
                                                <div
                                                    onClick={() => handleSlotClick(viewDate, hour)}
                                                    className="h-14 rounded-xl border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-blue-50/40 transition-all group">
                                                    <span className="text-[11px] text-slate-300 group-hover:text-brand-primary font-medium flex items-center gap-1">
                                                        <Plus size={12} /> Add appointment
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    {slotApts.map(apt => {
                                                        const ts = getTypeStyle(apt.type);
                                                        const TypeIcon = ts.icon;
                                                        const isSelected = selectedAppointment?.id === apt.id;
                                                        return (
                                                            <div
                                                                key={apt.id}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setRightPanelTab('details'); }}
                                                                className={`rounded-xl border ${ts.bg} ${ts.border} px-4 py-3 cursor-pointer hover:shadow-md transition-all relative group/card ${isSelected ? 'ring-2 ring-brand-primary ring-offset-1 shadow-md' : ''
                                                                    }`}>
                                                                <div className="flex items-start justify-between gap-2">
                                                                    {/* Left: icon + type + time */}
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ts.bg} border ${ts.border}`}>
                                                                            <TypeIcon size={16} className={ts.text} />
                                                                        </div>
                                                                        <div>
                                                                            <p className={`text-xs font-bold uppercase tracking-wider ${ts.text} mb-0.5`}>{apt.type}</p>
                                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                                {formatTime12(apt.time)} – {getEndTime(apt.time)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {/* Right: doctor + three-dot */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${avatarColor(apt.doctorName)}`}>
                                                                            {getInitials(apt.doctorName)}
                                                                        </span>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleAppointmentClick(e, apt); }}
                                                                            className="p-1 hover:bg-black/5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                            <MoreHorizontal size={14} className="text-slate-500" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {/* Bottom: patient + room */}
                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                                                                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                                                        <UserCheck size={11} className="shrink-0" />
                                                                        {apt.patientName}
                                                                    </div>
                                                                    {apt.resourceId && (
                                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                            <DoorOpen size={10} />
                                                                            {apt.resourceId}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Add more for this slot */}
                                                    <button
                                                        onClick={() => handleSlotClick(viewDate, hour)}
                                                        className="text-[11px] text-brand-primary font-semibold flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors w-fit">
                                                        <Plus size={12} /> Add
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* + Add Appointment footer */}
                            <button
                                onClick={() => { setBookModalData({ date: viewDate, time: 9 }); setIsBookModalOpen(true); }}
                                className="flex items-center gap-2 mx-auto mt-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold shadow hover:bg-brand-primaryDark transition-colors">
                                <Plus size={16} strokeWidth={3} /> Add Appointment
                            </button>
                        </div>
                    )}

                    {/* ── WEEK VIEW ─────────────────────────────────────── */}
                    {viewMode === 'week' && (
                        <div className="flex flex-col relative bg-white">
                            {/* Days Header */}
                            <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 z-20 bg-white/95 backdrop-blur-sm">
                                <div className="p-3 border-r border-slate-200 bg-white" />
                                {weekDays.map((day, i) => {
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    const isSelected = day.toDateString() === viewDate.toDateString();
                                    return (
                                        <div key={i} onClick={() => { setViewDate(day); setViewMode('day'); }}
                                            className={`p-2 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                                                }`}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                            <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all ${isToday ? 'bg-brand-primary text-white shadow-sm' :
                                                isSelected ? 'bg-blue-100 text-brand-primary' :
                                                    'text-slate-700'
                                                }`}>{day.getDate()}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time Grid */}
                            {timeSlots.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-slate-100 min-h-[80px] relative">
                                    <div className="p-2 text-[11px] font-bold text-slate-400 text-center border-r border-slate-100 bg-white flex items-start justify-center pt-3">
                                        {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                    </div>
                                    {weekDays.map((day, i) => {
                                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                        const slotApts = appointments.filter(a => {
                                            if (!a.date) return false;
                                            const aDateStr = a.date.split('T')[0];
                                            let h = 0;
                                            const t = a.time || '00:00';
                                            if (t.includes('AM') || t.includes('PM')) {
                                                const parts = t.split(' ');
                                                h = parseInt(parts[0].split(':')[0]);
                                                if (parts[1] === 'PM' && h < 12) h += 12;
                                                if (parts[1] === 'AM' && h === 12) h = 0;
                                            } else {
                                                h = parseInt(t.split(':')[0]);
                                            }
                                            const matchesDoctor = selectedDoctor === 'all' || a.doctorId === selectedDoctor || a.doctorName === doctors.find(d => d.id === selectedDoctor)?.name;
                                            const matchesRoom = selectedRoom === 'all' || a.resourceId === selectedRoom;
                                            return aDateStr === dateStr && h === hour && matchesDoctor && matchesRoom;
                                        });
                                        return (
                                            <div key={i} onClick={() => handleSlotClick(day, hour)}
                                                className="border-r border-slate-100 p-1 hover:bg-blue-50/20 transition-colors cursor-pointer group relative">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                    <Plus className="text-slate-300" size={20} />
                                                </div>
                                                {slotApts.map(apt => {
                                                    const ts = getTypeStyle(apt.type);
                                                    return (
                                                        <div key={apt.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setRightPanelTab('details'); }}
                                                            className={`p-1.5 rounded-lg border border-l-[3px] text-[10px] shadow-sm mb-1 truncate z-10 relative hover:shadow-md hover:scale-[1.02] transition-all ${ts.bg} ${ts.border} ${ts.text}`}
                                                            title={`${apt.time} – ${apt.type} – ${apt.patientName}`}>
                                                            <div className="font-bold text-[10px] text-slate-800 truncate">{apt.patientName}</div>
                                                            <div className="text-[9px] opacity-70 uppercase font-bold">{apt.type}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── MONTH VIEW ────────────────────────────────────── */}
                    {viewMode === 'month' && (
                        <div className="p-8 text-center text-slate-500 font-bold">
                            Month view — switch to Day or Week for detailed scheduling.
                        </div>
                    )}

                </div>{/* end scroll area */}
            </main>

            {/* ══════════════════════════════════════════════════════════════
                COLUMN C — Right Patient Detail Panel
            ══════════════════════════════════════════════════════════════ */}
            <aside className={`flex-shrink-0 flex flex-col bg-white border-l border-slate-200 overflow-y-auto transition-all duration-300 ${selectedAppointment ? 'w-[290px]' : 'w-0 overflow-hidden'
                }`}>
                {selectedAppointment && (() => {
                    const apt = selectedAppointment;
                    const ts = getTypeStyle(apt.type);
                    const initials = getInitials(apt.patientName);
                    const ac = avatarColor(apt.patientName);

                    return (
                        <div className="flex flex-col h-full">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
                                <h3 className="text-sm font-bold text-slate-800">Patient Details</h3>
                                <button onClick={() => setSelectedAppointment(null)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Patient Header */}
                            <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ac}`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm leading-tight">{apt.patientName}</p>
                                            {apt.patientId && (
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">#{apt.patientId.slice(0, 8).toUpperCase()}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                {(apt as any).sex && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">{(apt as any).sex}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleAppointmentClick(e, apt)}
                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                        <MoreHorizontal size={15} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex bg-slate-100 rounded-lg p-0.5">
                                    {(['details', 'history', 'notes'] as const).map(tab => (
                                        <button key={tab} onClick={() => setRightPanelTab(tab)}
                                            className={`flex-1 py-1 text-[11px] font-bold rounded-md capitalize transition-all ${rightPanelTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                                }`}>{tab}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 px-4 py-3 flex flex-col gap-3">

                                {rightPanelTab === 'details' && (
                                    <>
                                        {/* Contact info */}
                                        {apt.phone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Phone size={12} className="text-emerald-500 shrink-0" />
                                                <span>{apt.phone}</span>
                                            </div>
                                        )}
                                        {apt.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Mail size={12} className="text-blue-400 shrink-0" />
                                                <span>{apt.email}</span>
                                            </div>
                                        )}
                                        {apt.address && (
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <MapPin size={12} className="text-rose-400 shrink-0" />
                                                <span>{apt.address}</span>
                                            </div>
                                        )}

                                        {/* Upcoming Appointment Card */}
                                        <div className={`rounded-xl border ${ts.bg} ${ts.border} p-3`}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${ts.text}`}>{apt.type}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{formatTime12(apt.time)} – {getEndTime(apt.time)}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 mb-0.5">{apt.date ? new Date(apt.date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}</p>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                                <UserCheck size={10} />
                                                <span>{apt.doctorName}</span>
                                                {apt.resourceId && <>
                                                    <span>·</span>
                                                    <DoorOpen size={10} />
                                                    <span>{apt.resourceId}</span>
                                                </>}
                                            </div>
                                        </div>

                                        {/* Reason for Visit */}
                                        {(apt as any).visit_reason && (
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason for Visit</p>
                                                <p className="text-xs text-slate-600 leading-relaxed">{(apt as any).visit_reason}</p>
                                            </div>
                                        )}

                                        {/* Patient Notes placeholder */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient Notes</p>
                                            <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                                        </div>
                                    </>
                                )}

                                {rightPanelTab === 'history' && (
                                    <div className="text-center py-8">
                                        <ClipboardList size={28} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">No visit history available.</p>
                                    </div>
                                )}

                                {rightPanelTab === 'notes' && (
                                    <div className="text-center py-8">
                                        <Edit3 size={28} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">No notes added yet.</p>
                                    </div>
                                )}

                            </div>{/* end tab content */}

                            {/* Action Buttons */}
                            <div className="px-4 py-3 border-t border-slate-100 flex flex-col gap-2 shrink-0">
                                <button
                                    onClick={handleRescheduleInit}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold shadow hover:bg-brand-primaryDark transition-colors">
                                    <CalendarCheck size={13} /> Reschedule
                                </button>
                                <button
                                    onClick={(e) => { handleAppointmentClick(e, apt); }}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
                                    <Edit3 size={13} /> Edit Appointment
                                </button>
                                <button
                                    onClick={handleCheckIn}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
                                    <CheckCircle2 size={13} className="text-emerald-500" /> Mark as Completed
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors">
                                    <Trash2 size={13} /> Cancel Appointment
                                </button>
                            </div>

                        </div>
                    );
                })()}
            </aside>

            {/* ══════════════════════════════════════════════════════════════
                MODALS (unchanged functionality)
            ══════════════════════════════════════════════════════════════ */}
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
            {viewingPatientProfile && (
                <PatientProfile
                    patient={DEFAULT_PATIENT_PROFILE}
                    onClose={() => setViewingPatientProfile(null)}
                />
            )}
            {expandedSlot && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setExpandedSlot(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">
                                    {expandedSlot.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </h3>
                                <p className="text-sm text-brand-primary font-bold">
                                    {expandedSlot.hour > 12 ? `${expandedSlot.hour - 12} PM` : expandedSlot.hour === 12 ? '12 PM' : `${expandedSlot.hour} AM`}
                                </p>
                            </div>
                            <button onClick={() => setExpandedSlot(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
                            {expandedSlot.appointments.map(apt => {
                                const doctor = doctors.find(d => d.name === apt.doctorName) || doctors.find(d => d.id === apt.doctorId);
                                const colorClass = doctor?.color || 'bg-slate-50 text-slate-600 border-slate-200';
                                return (
                                    <div key={apt.id}
                                        onClick={(e) => { setExpandedSlot(null); handleAppointmentClick(e, apt); }}
                                        className={`p-3 rounded-xl border border-l-4 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${colorClass} ${apt.status === 'Canceled' ? 'opacity-50' : ''
                                            }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-slate-800 truncate">{apt.patientName}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold uppercase tracking-wider">{apt.type}</span>
                                            <span className="text-[11px] opacity-80 font-medium text-slate-500">{doctor?.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AppointmentsView;
