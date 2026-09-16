import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Calendar, Phone, Mail, FileText, Activity,
    Clock, CreditCard, Plus, Pill, Stethoscope,
    MessageSquare, Download, Upload, User, AlertCircle, CheckCircle2, Trash2, Eye, RefreshCw, ChevronRight, ArrowLeft,
    Heart, Thermometer, Scale, Sparkles, ExternalLink, Loader2
} from 'lucide-react';
import { Patient, Appointment, FinancialRecord, PatientDocument, UserRole } from '../types';
import { api } from '../services/api';
import { BookAppointmentModal } from './AppointmentModals';
import { TimelineContainer } from './timeline/TimelineContainer';
import { HealthMetricsEntryModal } from './HealthMetricsEntryModal';
import { DynamicTrendChart, ClinicalAlertsWidget, ConditionsWidget, TreatmentsWidget, VitalsHistoryWidget } from './PatientWidgets';
import { useRealtimeVitals } from '../hooks/useRealtimeVitals';
import { DigitalPrescriptionModal, PrescriptionData } from './DigitalPrescriptionModal';
import { UnifiedConsultationPad } from './UnifiedConsultationPad';
import toast from 'react-hot-toast';
import AbhaIntegrationWidget from './AbhaIntegrationWidget';
import { IvfCaseSheetSuite } from './specialties/ivf/IvfCaseSheetSuite';
import { PatientFollowUps } from './PatientFollowUps';


interface PatientProfileProps {
    patient: Patient;
    onClose: () => void;
    userRole?: string;
    onCompleteConsultation?: () => void;
    onPatientUpdate?: () => void;
    initialTab?: string;
}

// MOCK_APPOINTMENTS removed
const MOCK_APPOINTMENTS: Appointment[] = [];
// MOCK_DOCUMENTS removed
const MOCK_DOCUMENTS: PatientDocument[] = [];

export const PatientProfile: React.FC<PatientProfileProps> = ({ patient: initialPatient, onClose, userRole, onCompleteConsultation, onPatientUpdate, initialTab = 'overview' }) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);
    const [isConsultationComplete, setIsConsultationComplete] = useState(false);
    const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
    const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isAssigningDoctor, setIsAssigningDoctor] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [isSavingDoctor, setIsSavingDoctor] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
    
    // Vitals Modal & History State
    const [showVitalsHistory, setShowVitalsHistory] = useState(false);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [vitalType, setVitalType] = useState('Blood Pressure');
    const [vitalValue, setVitalValue] = useState('');
    const [vitalUnit, setVitalUnit] = useState('mmHg');
    const [savingVitals, setSavingVitals] = useState(false);

    const handleSaveVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingVitals(true);
        try {
            await api.addPatientVitals(patient.id, {
            vitals: [{
                vital_type: vitalType,
                value: vitalValue,
                unit: vitalUnit,
                recorded_at: new Date().toISOString()
            }]
        });
            setIsVitalsModalOpen(false);
            setVitalValue('');
            fetchDashboardMetrics();
        } catch (err) {
            console.error("Failed to save vitals", err);
            toast.error("Failed to save vitals");
        } finally {
            setSavingVitals(false);
        }
    };
    const [isDigitalPrescriptionModalOpen, setIsDigitalPrescriptionModalOpen] = useState(false);
    const [consultationNote, setConsultationNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [historyNotes, setHistoryNotes] = useState<any[]>([]);

    // Dashboard Data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

    // PIN Reset State
    const [newPinInput, setNewPinInput] = useState('');
    const [isResettingPin, setIsResettingPin] = useState(false);
    const [resetPinSuccess, setResetPinSuccess] = useState<string | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docTypeToUpload, setDocTypeToUpload] = useState('prescription');
    const [previewDoc, setPreviewDoc] = useState<any>(null);
    
    // Metrics Entry
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

    const fetchPatientDocuments = async () => {
        try {
            // Fetch manually uploaded docs
            const response = await api.getPatientDocuments(patient.id);
            const manualDocs = response?.data || (Array.isArray(response) ? response : []);
            
            // Fetch system-generated docs (prescriptions, summaries)
            let generatedDocs = [];
            try {
                const genResponse = await api.getGeneratedDocuments(patient.id);
                if (Array.isArray(genResponse)) {
                    generatedDocs = genResponse.map(d => ({
                        id: d.id,
                        patientId: patient.id,
                        type: d.type === 'prescription' ? 'Prescription' : d.type,
                        name: d.file_name,
                        url: d.signed_url, 
                        uploadDate: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Just now',
                        status: d.generation_status || 'published',
                        generation_status: d.generation_status
                    }));
                }
            } catch (err) {
                console.warn("Could not fetch generated docs", err);
            }

            const combined = [...(Array.isArray(manualDocs) ? manualDocs : []), ...generatedDocs];
            
            // Deduplicate by ID, merging properties intelligently
            const uniqueDocsMap = new Map();
            combined.forEach(rawDoc => {
                const docId = rawDoc.id;
                if (!docId) return;
                const existing = uniqueDocsMap.get(docId);
                const merged = {
                    ...existing,
                    ...rawDoc,
                    status: rawDoc.status || existing?.status || rawDoc.generation_status || 'published',
                    uploadDate: rawDoc.uploadDate || existing?.uploadDate || (rawDoc.created_at ? new Date(rawDoc.created_at).toLocaleDateString() : 'Just now'),
                    url: rawDoc.url || existing?.url || null,
                    type: rawDoc.type || existing?.type || 'Prescription'
                };
                uniqueDocsMap.set(docId, merged);
            });
            const deduplicatedDocs = Array.from(uniqueDocsMap.values());
            
            setPatientDocuments(deduplicatedDocs);

            // Auto-poll if any document is still generating/pending
            const hasPending = deduplicatedDocs.some(d => d.status === 'pending' || d.generation_status === 'pending');
            if (hasPending) {
                setTimeout(() => {
                    fetchPatientDocuments();
                }, 3000);
            }
        } catch (e) {
            console.warn("Failed to fetch documents", e);
        }
    };

    const fetchDashboardMetrics = async () => {
        setIsLoadingDashboard(true);
        try {
            const res = await api.getPatientDashboardData(patient.id);
            if (res?.data) {
                setDashboardData(res.data);
            }
        } catch (e) {
            console.warn("Failed to fetch dashboard metrics", e);
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchDashboardMetrics();
        }
    }, [activeTab, patient.id]);

    // Live Supabase Sync for Vitals
    const handleVitalUpdate = React.useCallback((newVital: any) => {
        setDashboardData((prev: any) => {
            if (!prev) return prev;
            
            // Check if vital already exists (update vs insert)
            const exists = prev.vitals?.find((v: any) => v.id === newVital.id);
            let updatedVitals;
            if (exists) {
                updatedVitals = prev.vitals.map((v: any) => v.id === newVital.id ? newVital : v);
            } else {
                updatedVitals = [newVital, ...(prev.vitals || [])];
                // Optional: sort by created_at desc just in case
                updatedVitals.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }

            // Cap at 50 records to prevent memory leak
            updatedVitals = updatedVitals.slice(0, 50);

            return {
                ...prev,
                vitals: updatedVitals
            };
        });
    }, []);

    const { isConnected } = useRealtimeVitals(patient.id, handleVitalUpdate, fetchDashboardMetrics);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
            if (file.size > MAX_FILE_SIZE) {
                toast('File size exceeds the 25MB limit. Please upload a smaller file.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setUploadingDoc(true);

            try {
                // 1. Get Ticket
                const ticketRes = await api.getDocumentUploadTicket(file.name, file.size, docTypeToUpload);
                const { uploadUrl, path } = ticketRes.data;

                // 2. Upload to S3
                const s3Response = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream'
                    }
                });

                if (!s3Response.ok) throw new Error('S3 upload failed');

                // 3. Register Document Metadata
                await api.registerDocument({
                    patient_id: patient.id,
                    name: file.name,
                    file_path: path,
                    file_size: file.size,
                    mime_type: file.type || 'application/octet-stream',
                    document_type: docTypeToUpload
                });

                toast("Document uploaded securely!");
                fetchPatientDocuments();
            } catch (err) {
                console.error("Upload failed", err);
                toast.error("Failed to upload document securely.");
            } finally {
                setUploadingDoc(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const fetchPatientAppointments = async () => {
        try {
            let items: any[] = [];

            // Fetch doctors if not loaded yet
            let doctorsList = doctors;
            if (doctorsList.length === 0) {
                try {
                    const docRes = await api.getDoctors();
                    doctorsList = docRes?.data || [];
                    setDoctors(doctorsList);
                } catch (e) {
                    console.warn("Failed to fetch doctors list", e);
                }
            }

            // 1. Try Specific Endpoint
            try {
                const response = await api.getPatientAppointments(patient.id);
                if (Array.isArray(response)) items = response;
                else if (response?.data && Array.isArray(response.data)) items = response.data;
                else if (response?.items && Array.isArray(response.items)) items = response.items;
                else if (response?.data?.items && Array.isArray(response.data.items)) items = response.data.items;
                else if (response?.appointments && Array.isArray(response.appointments)) items = response.appointments;
            } catch (e) {
                console.warn("Specific appointment fetch failed, trying fallback", e);
            }

            // 2. Fallback: If empty, try global list and filter client-side
            if (!items || items.length === 0) {
                try {
                    const globalRes = await api.getAppointments();
                    const globalItems = globalRes?.data?.items || (Array.isArray(globalRes) ? globalRes : []);
                    if (Array.isArray(globalItems)) {
                        items = globalItems.filter((a: any) =>
                            a.patient_id === patient.id ||
                            a.patientId === patient.id ||
                            (a.patient_name && a.patient_name.toLowerCase() === patient.name.toLowerCase())
                        );
                    }
                } catch (e) {
                    console.warn("Global appointment fetch failed", e);
                }
            }

            if (Array.isArray(items)) {
                const mapped = items.map((item: any) => {
                    const dId = item.doctor_id || item.doctorId;
                    let dName = item.doctor_name || item.doctorName;

                    if (!dName || dName === 'Unknown') {
                        const found = doctorsList.find(d => d.id === dId);
                        if (found) dName = found.name;
                    }

                    return {
                        id: item.id,
                        patientName: item.patient_name || item.patientName || patient.name,
                        doctorName: dName || 'Unknown',
                        doctorId: dId,
                        time: item.start_time || item.time || item.appointment_time,
                        date: item.appointment_date || item.date,
                        type: item.type || item.visit_reason || 'Consultation',
                        status: item.status,
                        resourceId: item.resource_id
                    };
                });
                // Sort by date descending
                mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setPatientAppointments(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch patient appointments", error);
        }
    };

    const fetchClinicalNotes = async () => {
        try {
            const res = await api.getClinicalNotes(patient.id);
            if (Array.isArray(res)) setHistoryNotes(res);
            else if (res?.data && Array.isArray(res.data)) setHistoryNotes(res.data);
            else if (res?.items) setHistoryNotes(res.items);
            else setHistoryNotes([]);
        } catch (e) {
            console.warn("Failed to fetch clinical notes", e);
        }
    };

    const fetchPatientDetails = async () => {
        try {
            const res = await api.getPatientById(patient.id);
            if (res && res.id) {
                setPatient(prev => ({ ...prev, ...res }));
            }
        } catch (e) {
            console.warn("Failed to fetch fresh patient details", e);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.getDoctors();
            const docs = res?.data || (Array.isArray(res) ? res : []);
            setDoctors(docs);
            return docs;
        } catch (e) {
            console.warn("Failed to fetch doctors list", e);
            return [];
        }
    };

    const handleAssignDoctor = async (doctorIdToAssign: string) => {
        if (!doctorIdToAssign) {
            toast.error("Please select a doctor to assign.");
            return;
        }
        try {
            setIsSavingDoctor(true);
            await api.updatePatient(patient.id, { assigned_doctor_id: doctorIdToAssign });
            const assigned = doctors.find(d => d.id === doctorIdToAssign);
            const docDisplayName = assigned ? (assigned.name || [assigned.first_name, assigned.last_name].filter(Boolean).join(' ')) : 'Doctor';
            setPatient(prev => ({
                ...prev,
                assignedDoctorId: doctorIdToAssign,
                assigned_doctor_id: doctorIdToAssign,
                assignedDoctorName: docDisplayName
            }));
            toast.success(`Assigned to Dr. ${docDisplayName.replace(/^Dr\.?\s*/i, '')}`);
            setIsAssigningDoctor(false);
            if (onPatientUpdate) onPatientUpdate();
        } catch (err) {
            console.error("Failed to assign doctor", err);
            toast.error("Failed to assign primary doctor.");
        } finally {
            setIsSavingDoctor(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
        fetchPatientDetails();
        fetchPatientAppointments();
        fetchPatientDocuments();
        fetchClinicalNotes();
    }, [patient.id]);

    const handleBookAppointment = async (formData: any) => {
        try {
            const selectedDoc = doctors.find(d => d.name === formData.consultant);
            const doctorId = selectedDoc ? selectedDoc.id : null;
            const doctorName = formData.consultant || '';

            // Determine if this is today (walk-in) or future
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isWalkIn = formData.date === todayStr;

            if (isWalkIn && doctorId) {
                // WALK-IN: Use QMS endpoint for immediate token
                const currentTime = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');
                const qmsRes = await api.qmsWalkIn({
                    doctor_id: doctorId,
                    date: todayStr,
                    time: formData.time || currentTime,
                    mobile: patient.phone || patient.mobile || '',
                    name: patient.name || patient.fullname || '',
                    patient_id: patient.id,
                    doctor_name_snapshot: doctorName,
                    type: 'Consultation',
                    visit_reason: formData.visitReason || formData.notes || 'Consultation'
                });

                const newApptId = qmsRes?.appointment_id || qmsRes?.data?.appointment_id || `apt-${Date.now()}`;
                const token = qmsRes?.token_number || qmsRes?.data?.token_number;

                const newApt: Appointment = {
                    id: newApptId,
                    patientName: patient.name,
                    doctorName: doctorName,
                    doctorId: doctorId,
                    time: formData.time || currentTime,
                    date: todayStr,
                    type: 'Consultation',
                    status: 'Checked-In'
                };
                setPatientAppointments(prev => [newApt, ...prev]);

                if (token) {
                    toast.success(`Walk-in registered! Token: ${token}`);
                } else {
                    toast.success('Walk-in registered and checked in!');
                }
            } else {
                // FUTURE BOOKING: Use appointments endpoint
                const payload = {
                    patient_id: patient.id,
                    doctor_id: doctorId,
                    doctor_name_snapshot: doctorName,
                    appointment_date: formData.date,
                    start_time: formData.time,
                    type: 'Consultation',
                    status: 'Scheduled',
                    visit_reason: formData.visitReason || formData.notes || 'Consultation'
                };
                const response = await api.createAppointment(payload);
                let newId = `temp-${Date.now()}`;
                if (response && (response.id || (response.data && response.data.id))) {
                    newId = response.id || response.data.id;
                }

                const newApt: Appointment = {
                    id: newId,
                    patientName: patient.name,
                    doctorName: doctorName,
                    doctorId: doctorId,
                    time: formData.time,
                    date: formData.date,
                    type: 'Consultation',
                    status: 'Scheduled'
                };
                setPatientAppointments(prev => [newApt, ...prev]);
                toast.success('Appointment booked successfully!');
            }

            setIsBookingModalOpen(false);
            setTimeout(fetchPatientAppointments, 1000);

        } catch (error: any) {
            console.error("Failed to book appointment", error);
            toast.error(error?.message || error?.error || "Failed to book appointment.");
        }
    };

    const handleSaveDemographics = async () => {
        try {
            // Collect data from inputs using getElementById (simple for now)
            const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;

            const payload = {
                name: getVal('edit-name'),
                relation: getVal('edit-relation'),
                dob: getVal('edit-dob'),
                gender: getVal('edit-gender'),
                // Backend likely expects snake_case for these fields
                blood_group: getVal('edit-bloodGroup'),
                marital_status: getVal('edit-maritalStatus'),
                referral_doctor: getVal('edit-referralDoctor'),
                                registration_date: getVal('edit-registrationDate'),
                uhid: getVal('edit-uhid'),
                aadhar: getVal('edit-aadhar'),

                // Keeping camelCase just in case the backend uses specific DTOs
                maritalStatus: getVal('edit-maritalStatus'),
                referralDoctor: getVal('edit-referralDoctor'),
                                registrationDate: getVal('edit-registrationDate'),
            };

            await api.updatePatient(patient.id, payload);
            toast.success('Patient details updated successfully!');
            setIsEditing(false);
            if (onPatientUpdate) {
                onPatientUpdate();
            }
            onClose(); // Close to refresh external view, or we could refetch here
        } catch (error) {
            console.error("Failed to update patient", error);
            toast.error("Failed to update patient details.");
        }
    };

    const handleComplete = () => {
        setIsConsultationComplete(true);
    };

    const handleCloseAfterComplete = () => {
        if (onCompleteConsultation) onCompleteConsultation();
        else onClose();
    };

    const handleResetPin = async () => {
        setIsResettingPin(true);
        try {
            const res = await api.resetPatientPin(patient.id, newPinInput || undefined);
            setResetPinSuccess(res.newPin);
            setNewPinInput('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to reset PIN');
        } finally {
            setIsResettingPin(false);
        }
    };

    // Determine tabs based on role
    const isClinical = userRole === UserRole.DOCTOR || userRole === UserRole.NURSE || userRole === 'Receptionist' || userRole === UserRole.ADMIN;

    const tabs = [
        { id: 'overview', label: 'Overview', shortLabel: 'Info' },
        { id: 'ivf', label: 'IVF Case Sheet', shortLabel: 'IVF' },
        { id: 'timeline', label: 'Timeline', shortLabel: 'Timeline' },
        { id: 'consultation', label: 'Consultation Notes', shortLabel: 'Notes' },
        { id: 'appointments', label: 'Appointments', shortLabel: 'Appts' },
        { id: 'followups', label: 'Follow-Ups', shortLabel: 'Follow-Ups' },
        { id: 'documents', label: 'Documents', shortLabel: 'Docs' },
    ];

    return createPortal(
        <div className="fixed inset-0 bg-brand-bg/90 z-50 flex flex-col animate-fade-in">
            <div className="w-full h-full bg-brand-surface shadow-none flex flex-col border-0 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-white shadow-2xs gap-4">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs flex-shrink-0"
                            title="Return to Patient List"
                        >
                            <ArrowLeft size={14} className="text-slate-600" /> <span>Back to Patients</span>
                        </button>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{patient.name}</h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs text-slate-500 mt-1">
                                <span className="flex items-center font-medium text-slate-700"><Phone size={12} className="mr-1 text-slate-400 flex-shrink-0" /> {patient.mobile}</span>
                                {patient.email && <span className="hidden md:flex items-center font-medium text-slate-700"><Mail size={12} className="mr-1 text-slate-400 flex-shrink-0" /> {patient.email}</span>}
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-mono font-bold text-slate-700 border border-slate-200">ID: {patient.id.slice(0, 8)}</span>
                                {patient.gender && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-xs">{patient.gender}</span>}
                                {patient.age && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-xs">{patient.age} Yrs</span>}
                                {patient.bloodGroup && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-bold">{patient.bloodGroup}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                            onClick={() => setIsBookingModalOpen(true)}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 shadow-2xs text-xs flex items-center gap-1.5"
                        >
                            <Calendar size={14} className="text-sky-600" /> <span className="hidden sm:inline">Book Appointment</span>
                        </button>
                        <button
                            onClick={() => setIsMetricsModalOpen(true)}
                            className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl transition-all border border-sky-200 shadow-2xs text-xs flex items-center gap-1.5"
                        >
                            <Activity size={14} className="text-sky-600" /> <span className="hidden sm:inline">Update Metrics</span>
                        </button>
                        {onCompleteConsultation && !isConsultationComplete && (
                            <button
                                onClick={handleComplete}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center transition-all active:scale-95 text-xs gap-1.5"
                            >
                                <CheckCircle2 size={14} /> Done
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-colors ml-1" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-6 border-b border-brand-border flex overflow-x-auto custom-scrollbar bg-brand-surface gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${activeTab === tab.id
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary hover:border-slate-300'
                                }`}
                        >
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'ivf' ? (
                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                        <IvfCaseSheetSuite
                            patientId={patient.id}
                            patientName={patient.name}
                            patientAge={patient.age?.toString() || ''}
                            patientGender={patient.gender || ''}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto overscroll-contain transform-gpu p-4 sm:p-6 lg:p-8 bg-brand-bg/30 custom-scrollbar">

                    {isConsultationComplete ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-brand-textPrimary">Consultation Completed!</h2>
                            <p className="text-brand-textSecondary text-lg max-w-md text-center">
                                You have successfully completed the consultation for <span className="font-bold text-brand-textPrimary">{patient.name}</span>.
                            </p>
                            <div className="flex space-x-4 mt-8">
                                <button
                                    onClick={() => setIsConsultationComplete(false)}
                                    className="px-6 py-3 bg-brand-surface border border-brand-border text-brand-textPrimary font-bold rounded-xl hover:bg-brand-bg transition-colors"
                                >
                                    Back to Profile
                                </button>
                                <button
                                    onClick={handleCloseAfterComplete}
                                    className="px-8 py-3 bg-brand-primary text-brand-bg font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all active:scale-95"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>

                            {activeTab === 'timeline' && (
                                <TimelineContainer patientId={patient.id} />
                            )}

                            {activeTab === 'followups' && (
                                <PatientFollowUps patientId={patient.id} />
                            )}

                            {activeTab === 'overview' && (
                                (() => {
                                    const getLatest = (typeKey: string) => {
                                        if (!dashboardData?.vitals || !Array.isArray(dashboardData.vitals)) return null;
                                        return dashboardData.vitals.find((v: any) => {
                                            const t = (v.vital_type || v.vital_name || v.type || '').toLowerCase();
                                            if (typeKey === 'bp') return t.includes('blood') || t.includes('bp');
                                            if (typeKey === 'hr') return t.includes('heart') || t.includes('pulse') || t.includes('hr');
                                            if (typeKey === 'temp') return t.includes('temp');
                                            if (typeKey === 'weight') return t.includes('weight') || t.includes('wt');
                                            return false;
                                        });
                                    };

                                    const latestBp = getLatest('bp');
                                    const latestHr = getLatest('hr');
                                    const latestTemp = getLatest('temp');
                                    const latestWeight = getLatest('weight');

                                    const bpDisplay = latestBp ? `${latestBp.vital_value || latestBp.value} ${latestBp.unit || 'mmHg'}` : '110/80 mmHg';
                                    const hrDisplay = latestHr ? `${latestHr.vital_value || latestHr.value} ${latestHr.unit || 'bpm'}` : '87 bpm';
                                    const tempDisplay = latestTemp ? `${latestTemp.vital_value || latestTemp.value} ${latestTemp.unit || '°F'}` : '99 °F';
                                    const weightDisplay = latestWeight ? `${latestWeight.vital_value || latestWeight.value} ${latestWeight.unit || 'kg'}` : '70 kg';

                                    return (
                                        <div className="max-w-[1600px] mx-auto w-full space-y-6">
                                            {/* 1. TOP TELEMETRY RIBBON: Physiological Vitals & Real-Time Telemetry */}
                                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                                                            <Activity size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Physiological Vitals & Telemetry</h3>
                                                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                                    {isConnected ? 'Live Telemetry' : 'Static Record'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500">Continuous observation of physiological baseline parameters</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        <button
                                                            onClick={fetchDashboardMetrics}
                                                            disabled={isLoadingDashboard}
                                                            className="p-2 text-slate-500 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-xl transition-colors border border-slate-200/70"
                                                            title="Refresh telemetry"
                                                        >
                                                            <RefreshCw size={15} className={isLoadingDashboard ? "animate-spin" : ""} />
                                                        </button>
                                                        <button
                                                            onClick={() => setShowVitalsHistory(prev => !prev)}
                                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
                                                                showVitalsHistory 
                                                                    ? 'bg-sky-50 text-sky-700 border-sky-200' 
                                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <Clock size={14} />
                                                            <span>{showVitalsHistory ? 'Hide History' : 'View History'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setIsMetricsModalOpen(true)}
                                                            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                                                        >
                                                            <Plus size={14} /> <span>Record Vitals</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 4 Telemetry Metric Cards */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                                    {/* BP */}
                                                    <div className="bg-gradient-to-br from-rose-50/30 to-white p-4 rounded-xl border border-rose-100/80 hover:border-rose-200 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blood Pressure</span>
                                                            <div className="w-6 h-6 rounded-lg bg-rose-100/70 flex items-center justify-center text-rose-600">
                                                                <Heart size={13} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-baseline gap-1.5">
                                                            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{latestBp ? (latestBp.vital_value || latestBp.value) : '110/80'}</span>
                                                            <span className="text-xs font-medium text-slate-500">{latestBp?.unit || 'mmHg'}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-500 font-medium">Systolic / Diastolic</span>
                                                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${latestBp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
                                                                {latestBp ? 'Recorded' : 'Baseline'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Heart Rate */}
                                                    <div className="bg-gradient-to-br from-emerald-50/30 to-white p-4 rounded-xl border border-emerald-100/80 hover:border-emerald-200 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Heart Rate</span>
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-600">
                                                                <Activity size={13} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-baseline gap-1.5">
                                                            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{latestHr ? (latestHr.vital_value || latestHr.value) : '87'}</span>
                                                            <span className="text-xs font-medium text-slate-500">{latestHr?.unit || 'bpm'}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-500 font-medium">Resting Pulse</span>
                                                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${latestHr ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
                                                                {latestHr ? 'Recorded' : 'Baseline'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Temperature */}
                                                    <div className="bg-gradient-to-br from-amber-50/30 to-white p-4 rounded-xl border border-amber-100/80 hover:border-amber-200 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Temperature</span>
                                                            <div className="w-6 h-6 rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-600">
                                                                <Thermometer size={13} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-baseline gap-1.5">
                                                            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{latestTemp ? (latestTemp.vital_value || latestTemp.value) : '99'}</span>
                                                            <span className="text-xs font-medium text-slate-500">{latestTemp?.unit || '°F'}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-500 font-medium">Body Temperature</span>
                                                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${latestTemp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
                                                                {latestTemp ? 'Recorded' : 'Baseline'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Weight */}
                                                    <div className="bg-gradient-to-br from-sky-50/30 to-white p-4 rounded-xl border border-sky-100/80 hover:border-sky-200 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weight</span>
                                                            <div className="w-6 h-6 rounded-lg bg-sky-100/70 flex items-center justify-center text-sky-600">
                                                                <Scale size={13} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-baseline gap-1.5">
                                                            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{latestWeight ? (latestWeight.vital_value || latestWeight.value) : '70'}</span>
                                                            <span className="text-xs font-medium text-slate-500">{latestWeight?.unit || 'kg'}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-500 font-medium">Standard Scale</span>
                                                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${latestWeight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
                                                                {latestWeight ? 'Recorded' : 'Baseline'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expandable Vitals History Flowsheet */}
                                                {showVitalsHistory && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                                                        <VitalsHistoryWidget vitals={dashboardData?.vitals} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. MAIN 2-COLUMN BALANCED WORKSPACE */}
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                                {/* LEFT COLUMN: Demographics & Context */}
                                                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                                                    {/* Demographics Card */}
                                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                                                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                                                                    <User size={16} />
                                                                </div>
                                                                <h3 className="font-bold text-slate-900 text-sm">Patient Demographics</h3>
                                                            </div>
                                                            {!isEditing ? (
                                                                <button
                                                                    onClick={() => setIsEditing(true)}
                                                                    className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors border border-sky-100"
                                                                >
                                                                    Edit Details
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setIsEditing(false)}
                                                                        className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSaveDemographics}
                                                                        className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-lg transition-colors shadow-xs"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="grid grid-cols-1 gap-y-4 animate-fade-in">
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                                                                    <input name="name" defaultValue={patient.name} id="edit-name" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Relation</label>
                                                                    <input name="relation" defaultValue={patient.relation} id="edit-relation" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Date of Birth</label>
                                                                    <input type="date" name="dob" defaultValue={patient.dob} id="edit-dob" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Gender</label>
                                                                    <select name="gender" defaultValue={patient.gender} id="edit-gender" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                                                                        <option value="Female">Female</option>
                                                                        <option value="Male">Male</option>
                                                                        <option value="Other">Other</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Blood Group</label>
                                                                    <input name="bloodGroup" defaultValue={patient.bloodGroup} id="edit-bloodGroup" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Address (House, Street, Area)</label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <input name="house" defaultValue={patient.house} id="edit-house" placeholder="House/Apt" className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                        <input name="street" defaultValue={patient.street} id="edit-street" placeholder="Street" className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                        <input name="area" defaultValue={patient.area} id="edit-area" placeholder="Area" className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        <input name="city" defaultValue={patient.city} id="edit-city" placeholder="City" className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                        <input name="state" defaultValue={patient.state} id="edit-state" placeholder="State" className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Mobile</label>
                                                                    <input name="mobile" defaultValue={patient.mobile} id="edit-mobile" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email</label>
                                                                    <input name="email" defaultValue={patient.email} id="edit-email" className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* CLEAN TYPOGRAPHY KEY-VALUE PAIRS (NO GREY BOXES) */
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Legal Name</dt>
                                                                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{patient.name || '-'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Relation</dt>
                                                                        <dd className="text-sm font-semibold text-slate-700 mt-0.5">{patient.relation || 'N/A'}</dd>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</dt>
                                                                        <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                                                                            {patient.dob || 'Not Provided'} {patient.age ? `(${patient.age} Yrs)` : ''}
                                                                        </dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</dt>
                                                                        <dd className="mt-0.5">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                                                                                {patient.gender || 'Female'}
                                                                            </span>
                                                                        </dd>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blood Group</dt>
                                                                        <dd className="mt-0.5">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                                                                {patient.bloodGroup || 'N/A'}
                                                                            </span>
                                                                        </dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marital Status</dt>
                                                                        <dd className="text-sm font-semibold text-slate-800 mt-0.5">{patient.maritalStatus || 'Married'}</dd>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</dt>
                                                                    <dd className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">
                                                                        {[
                                                                            patient.house,
                                                                            patient.street,
                                                                            patient.area,
                                                                            patient.city,
                                                                            patient.state,
                                                                            patient.postalCode
                                                                        ].filter(Boolean).join(', ') || 'No address on file'}
                                                                    </dd>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="mt-6 pt-5 border-t border-slate-100">
                                                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Registration & Referral</h4>
                                                            {isEditing ? (
                                                                <div className="grid grid-cols-1 gap-3.5 animate-fade-in">
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">UHID</label>
                                                                        <input name="uhid" defaultValue={patient.uhid} id="edit-uhid" className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Aadhar ID</label>
                                                                        <input name="aadhar" defaultValue={patient.aadhar} id="edit-aadhar" className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Marital Status</label>
                                                                        <select name="maritalStatus" defaultValue={patient.maritalStatus} id="edit-maritalStatus" className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500">
                                                                            <option value="Single">Single</option>
                                                                            <option value="Married">Married</option>
                                                                            <option value="Divorced">Divorced</option>
                                                                            <option value="Widowed">Widowed</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Referral Doctor</label>
                                                                        <input name="referralDoctor" defaultValue={patient.referralDoctor} id="edit-referralDoctor" className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Registration Date</label>
                                                                        <input type="date" name="registrationDate" defaultValue={patient.registrationDate} id="edit-registrationDate" className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-2 gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UHID</dt>
                                                                        <dd className="font-mono text-xs font-bold text-slate-900 mt-0.5">{patient.uhid || 'JAN-2026-038'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aadhar ID</dt>
                                                                        <dd className="text-xs font-semibold text-slate-700 mt-0.5">{patient.aadhar || '-'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Referral Doctor</dt>
                                                                        <dd className="text-xs font-semibold text-slate-700 mt-0.5">{patient.referralDoctor || '-'}</dd>
                                                                    </div>
                                                                    <div>
                                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Date</dt>
                                                                        <dd className="text-xs font-semibold text-slate-700 mt-0.5">{patient.registrationDate || '-'}</dd>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <AbhaIntegrationWidget patient={patient} onUpdate={fetchPatientDetails} />

                                                    {/* Care Team / Primary Doctor */}
                                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                    <Stethoscope size={16} />
                                                                </div>
                                                                <h3 className="font-bold text-slate-900 text-sm">Assigned Primary Doctor</h3>
                                                            </div>
                                                            {!isAssigningDoctor && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentId = patient.assignedDoctorId || (patient as any).assigned_doctor_id || (doctors[0]?.id || doctors[0]?.user_id || '');
                                                                        setSelectedDoctorId(currentId);
                                                                        setIsAssigningDoctor(true);
                                                                    }}
                                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                                                                >
                                                                    <Plus size={13} />
                                                                    {patient.assignedDoctorId || (patient as any).assigned_doctor_id ? 'Change' : 'Assign'}
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3">
                                                            {isAssigningDoctor ? (
                                                                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-3 animate-fade-in">
                                                                    <div>
                                                                        <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-950 block mb-1.5">
                                                                            Select Doctor for this Clinic
                                                                        </label>
                                                                        <select
                                                                            value={selectedDoctorId}
                                                                            onChange={e => setSelectedDoctorId(e.target.value)}
                                                                            className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                                        >
                                                                            <option value="">-- Select a Doctor --</option>
                                                                            {doctors.map((doc: any) => {
                                                                                const docId = doc.id || doc.user_id;
                                                                                const docTitle = (doc.name || [doc.first_name, doc.last_name].filter(Boolean).join(' ') || doc.email || 'Doctor').replace(/^Dr\.?\s*/i, '');
                                                                                return (
                                                                                    <option key={docId} value={docId}>
                                                                                        Dr. {docTitle} {doc.specialization ? `• ${doc.specialization}` : ''}
                                                                                    </option>
                                                                                );
                                                                            })}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center justify-end gap-2 pt-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsAssigningDoctor(false)}
                                                                            disabled={isSavingDoctor}
                                                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAssignDoctor(selectedDoctorId)}
                                                                            disabled={isSavingDoctor || !selectedDoctorId}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-all"
                                                                        >
                                                                            {isSavingDoctor ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                                            {isSavingDoctor ? 'Saving...' : 'Save Assignment'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (() => {
                                                                // 1. Match directly assigned doctor
                                                                const assignedDocId = patient.assignedDoctorId || (patient as any).assigned_doctor_id;
                                                                let assignedDoc = doctors.find(d => d.id === assignedDocId || d.user_id === assignedDocId);

                                                                // 2. Check if patient has an appointment with a doctor
                                                                const apptWithDoc = patientAppointments.find(a => a.doctorId || (a as any).doctor_id || (a as any).doctor_name_snapshot);
                                                                if (!assignedDoc && apptWithDoc) {
                                                                    const apptDocId = apptWithDoc.doctorId || (apptWithDoc as any).doctor_id;
                                                                    const found = doctors.find(d => d.id === apptDocId || d.user_id === apptDocId);
                                                                    if (found) assignedDoc = found;
                                                                    else if ((apptWithDoc as any).doctor_name_snapshot && (apptWithDoc as any).doctor_name_snapshot.toLowerCase() !== 'unknown') {
                                                                        assignedDoc = {
                                                                            name: (apptWithDoc as any).doctor_name_snapshot,
                                                                            specialization: 'Attending Consultant'
                                                                        };
                                                                    }
                                                                }

                                                                // 3. Fallback to assignedDoctorName
                                                                const rawDocName = assignedDoc ? (assignedDoc.name || [assignedDoc.first_name, assignedDoc.last_name].filter(Boolean).join(' ') || assignedDoc.email) : ((patient as any).assignedDoctorName || (patient as any).assigned_doctor || null);
                                                                const isUnknown = !rawDocName || rawDocName === '-' || rawDocName.toLowerCase().includes('unknown');
                                                                const hasValidDoc = !isUnknown && rawDocName.trim().length > 0;
                                                                const docName = hasValidDoc ? rawDocName.trim() : null;
                                                                const docSpeciality = assignedDoc ? (assignedDoc.specialization || assignedDoc.role || 'Primary Consultant') : 'Primary Consultant';
                                                                const docInitials = docName ? docName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'CT';

                                                                return docName ? (
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-3 min-w-0">
                                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs flex-shrink-0">
                                                                                {docInitials}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-sm font-bold text-slate-900 truncate">Dr. {docName.replace(/^Dr\.?\s*/i, '')}</p>
                                                                                <p className="text-xs text-slate-500 truncate">{Array.isArray(docSpeciality) ? docSpeciality.join(', ') : docSpeciality}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                                                                        <p className="text-xs text-slate-500 font-medium">No primary doctor assigned yet</p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedDoctorId(doctors[0]?.id || doctors[0]?.user_id || '');
                                                                                setIsAssigningDoctor(true);
                                                                            }}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                                                                        >
                                                                            <Plus size={13} /> Select & Assign Doctor
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Record Management / Admin Actions */}
                                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                                                            Record Administration
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button
                                                                onClick={() => setIsResetPinModalOpen(true)}
                                                                className="py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
                                                            >
                                                                Reset PIN
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm('Are you sure you want to archive this patient record?')) {
                                                                        try {
                                                                            await api.updatePatient(patient.id, { status: 'Archived' });
                                                                            toast.success('Patient record archived successfully.');
                                                                            if (onPatientUpdate) onPatientUpdate();
                                                                            onClose();
                                                                        } catch (error: any) {
                                                                            console.error('Failed to archive patient:', error);
                                                                            toast.error(error?.message || 'Failed to archive patient.');
                                                                        }
                                                                    }
                                                                }}
                                                                className="py-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors shadow-2xs"
                                                            >
                                                                Archive Record
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN: IVF Case Sheet Spotlight + Trend Chart + Alerts/Conditions + Treatments + Clinical Notes */}
                                                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                                                    {/* 1. IVF Case Sheet Spotlight Card */}
                                                    <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
                                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                                                            <div className="space-y-2">
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                                                                    <Sparkles size={13} className="text-amber-300" />
                                                                    <span>Specialty Clinical Module</span>
                                                                </div>
                                                                <h3 className="text-xl font-black tracking-tight text-white">IVF Specialty Clinical Case Sheet</h3>
                                                                <p className="text-sky-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                                                                    Comprehensive 8-stage reproductive cycle documentation: stimulation charts, OPU/embryo tracking, cryopreservation records, and all-in-one printable dossier.
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-sky-200">
                                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">Stimulation & Monitoring</span>
                                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">OPU & Embryology</span>
                                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">Embryo Transfer</span>
                                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">Cryopreservation</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setActiveTab('ivf')}
                                                                className="px-5 py-3 bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 flex-shrink-0 group active:scale-95 cursor-pointer"
                                                            >
                                                                <span>Launch IVF Case Sheet</span>
                                                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* 2. Physiological Trend Chart */}
                                                    <DynamicTrendChart vitals={dashboardData?.vitals || []} />

                                                    {/* 3. Clinical Alerts & Active Conditions Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <ClinicalAlertsWidget alerts={dashboardData?.allergies} />
                                                        <ConditionsWidget conditions={dashboardData?.medicalHistory} />
                                                    </div>

                                                    {/* 4. Ongoing Treatments & Medications */}
                                                    <TreatmentsWidget treatments={dashboardData?.ongoingTreatments} />

                                                    {/* 5. Recent Consultation Notes Summary Teaser (Fills bottom space elegantly) */}
                                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                                                        <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <h3 className="font-bold text-slate-900 text-sm">Recent Clinical Consultation Notes</h3>
                                                            </div>
                                                            <button
                                                                onClick={() => setActiveTab('consultation')}
                                                                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-sky-100"
                                                            >
                                                                <span>Open Consultation Notes</span> <ChevronRight size={13} />
                                                            </button>
                                                        </div>
                                                        {consultationNote ? (
                                                            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs text-slate-800 line-clamp-3 leading-relaxed font-normal">
                                                                {consultationNote}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-slate-700">No consultation note recorded for this visit session</p>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">Record clinical observations, diagnoses, or generate formal prescriptions</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setActiveTab('consultation')}
                                                                    className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-colors border border-sky-200 flex-shrink-0"
                                                                >
                                                                    + Write Consultation Note
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}

                            {activeTab === 'consultation' && (
                                <UnifiedConsultationPad
                                    patientId={patient.id}
                                    userRole={userRole}
                                    existingNote={consultationNote}
                                    historyNotes={historyNotes}
                                    onSaveComplete={() => {
                                        // Refresh notes list
                                        api.getClinicalNotes(patient.id).then((res: any) => {
                                            setHistoryNotes(res?.data || []);
                                        }).catch(() => {});
                                        // Auto-refresh documents list after a short delay 
                                        // (PDF generation is async, give it a few seconds)
                                        fetchPatientDocuments();
                                        setTimeout(() => fetchPatientDocuments(), 3000);
                                        setTimeout(() => fetchPatientDocuments(), 8000);
                                    }}
                                    onConsultationComplete={onCompleteConsultation}
                                />
                            )}







                            {activeTab === 'appointments' && (
                                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-brand-textPrimary flex items-center">
                                            <Calendar size={18} className="mr-2 text-brand-primary" /> Appointment History
                                        </h3>
                                        <button
                                            onClick={() => setIsBookingModalOpen(true)}
                                            className="px-4 py-2 bg-brand-primary text-brand-bg text-xs font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center shadow-sm"
                                        >
                                            <Plus size={14} className="mr-1" /> Book New
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {patientAppointments.map((appt) => (
                                            <div key={appt.id} className="flex items-center justify-between p-4 border border-brand-border rounded-xl hover:bg-brand-bg transition-colors">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${appt.status === 'Scheduled' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-brand-bg border-brand-border text-brand-textSecondary'}`}>
                                                        <span className="text-xs font-bold uppercase">{new Date(appt.date!).toLocaleString('default', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold">{new Date(appt.date!).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-brand-textPrimary">{appt.type}</p>
                                                        <p className="text-xs text-brand-textSecondary flex items-center mt-1">
                                                            <Clock size={12} className="mr-1" /> {appt.time} • {appt.doctorName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${appt.status === 'Scheduled' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' :
                                                        appt.status === 'Canceled' ? 'bg-red-50 text-red-500 border border-red-100' :
                                                            'bg-brand-success/10 text-brand-success border border-brand-success/20'
                                                        }`}>
                                                        {appt.status}
                                                    </span>
                                                    {appt.status === 'Scheduled' && (
                                                        <button className="text-brand-textSecondary hover:text-brand-error transition-colors">
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}



                            {activeTab === 'documents' && (
                                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-brand-textPrimary flex items-center">
                                            <FileText size={18} className="mr-2 text-brand-primary" /> Patient Documents
                                        </h3>
                                        <div className="flex items-center space-x-3">
                                            <select
                                                value={docTypeToUpload}
                                                onChange={(e) => setDocTypeToUpload(e.target.value)}
                                                className="text-sm border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary"
                                                disabled={uploadingDoc}
                                            >
                                                <option value="prescription">Prescription</option>
                                                <option value="lab-report">Lab Report</option>
                                                <option value="scan-imaging">Scan/Imaging</option>
                                                <option value="clinical-note">Clinical Note</option>
                                                <option value="consent-form">Consent Form</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                hidden
                                                onChange={handleFileSelect}
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingDoc}
                                                className="px-4 py-2 bg-brand-primary text-brand-bg text-xs font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center shadow-sm disabled:opacity-50"
                                            >
                                                <Upload size={14} className="mr-1" /> {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6 mt-4">
                                        {patientDocuments.length === 0 && (
                                            <div className="col-span-2 text-center py-8 text-brand-textSecondary text-sm">
                                                No documents uploaded yet.
                                            </div>
                                        )}
                                        {(() => {
                                            const groupedDocuments = patientDocuments.reduce((acc, doc) => {
                                                const type = doc.type || 'Other';
                                                if (!acc[type]) acc[type] = [];
                                                acc[type].push(doc);
                                                return acc;
                                            }, {} as Record<string, any[]>);

                                            return Object.entries(groupedDocuments).map(([type, docs]: [string, any[]]) => (
                                                <div key={type} className="mb-6">
                                                    <h4 className="text-sm font-bold text-brand-textPrimary mb-3 uppercase tracking-wider flex items-center gap-2">
                                                        {type.toLowerCase().includes('prescription') ? <Pill size={16} className="text-brand-primary" /> : 
                                                         type.toLowerCase().includes('report') ? <FileText size={16} className="text-brand-primary" /> :
                                                         <FileText size={16} className="text-brand-textSecondary" />}
                                                        {type}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {docs.map((doc: any) => (
                                                            <div key={doc.id} className="p-4 border border-brand-border rounded-xl hover:bg-brand-bg transition-colors flex items-center justify-between group">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-bold text-brand-textPrimary truncate max-w-[150px]">{doc.name}</p>
                                                                            {(doc.status === 'pending' || doc.generation_status === 'pending') && (
                                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full animate-pulse">
                                                                                    <Loader2 size={10} className="animate-spin" />
                                                                                    Generating...
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-brand-textSecondary">{doc.uploadDate}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={async () => {
                                                                            const isPending = doc.status === 'pending' || doc.generation_status === 'pending';
                                                                            if (isPending) {
                                                                                toast('Document is still being generated. Please give it a few moments...');
                                                                                fetchPatientDocuments();
                                                                                return;
                                                                            }

                                                                            let url = doc.url;
                                                                            try {
                                                                                const res = await api.getSecureAssetUrl(doc.id);
                                                                                if (res.success && res.data?.url) {
                                                                                    url = res.data.url;
                                                                                } else if ((res as any)?.pending) {
                                                                                    toast('Document is being prepared in storage. Please wait a moment...');
                                                                                    setTimeout(fetchPatientDocuments, 2500);
                                                                                    return;
                                                                                }
                                                                            } catch (e) {}

                                                                            if (url && url !== '#') {
                                                                                setPreviewDoc({...doc, url});
                                                                            } else {
                                                                                toast('Preview not available. Document may still be generating.');
                                                                                setTimeout(fetchPatientDocuments, 2000);
                                                                            }
                                                                        }}
                                                                        className="p-2 text-brand-textSecondary hover:text-brand-primary transition-colors"
                                                                        title="Preview Document"
                                                                    >
                                                                        <Eye size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            const isPending = doc.status === 'pending' || doc.generation_status === 'pending';
                                                                            if (isPending) {
                                                                                toast('Document is still being generated. Please give it a few moments...');
                                                                                fetchPatientDocuments();
                                                                                return;
                                                                            }

                                                                            let url = doc.url;
                                                                            try {
                                                                                const res = await api.getSecureAssetUrl(doc.id);
                                                                                if (res.success && res.data?.url) {
                                                                                    url = res.data.url;
                                                                                } else if ((res as any)?.pending) {
                                                                                    toast('Document is being prepared in storage. Please wait a moment...');
                                                                                    setTimeout(fetchPatientDocuments, 2500);
                                                                                    return;
                                                                                }
                                                                            } catch (e) {}

                                                                            if (url && url !== '#') {
                                                                                window.open(url, '_blank');
                                                                            } else {
                                                                                toast('Download not available for this document.');
                                                                            }
                                                                        }}
                                                                        className="p-2 text-brand-textSecondary hover:text-brand-primary transition-colors"
                                                                        title="View/Download"
                                                                    >
                                                                        <Download size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            const reason = prompt('Please enter a reason for unlinking this document (e.g., "Assigned to wrong patient"):');
                                                                            if (reason === null) return; // User cancelled
                                                                            if (reason.trim() === '') {
                                                                                toast.error('A reason is required to unlink a document.');
                                                                                return;
                                                                            }
                                                                            
                                                                            if (confirm('Are you sure you want to remove this document from the patient? It will be sent back to Pending Files.')) {
                                                                                try {
                                                                                    await api.unlinkDocument(doc.id, reason);
                                                                                    toast.success('Document unlinked successfully.');
                                                                                    fetchPatientDocuments(); // refresh list
                                                                                } catch (err: any) {
                                                                                    toast.error(err.message || 'Failed to unlink document.');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-2 text-brand-textSecondary hover:text-brand-warning transition-colors"
                                                                        title="Remove from Patient (Unlink)"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm('WARNING: Are you sure you want to permanently delete this document? This cannot be undone.')) {
                                                                                try {
                                                                                    await api.deleteDocument(doc.id);
                                                                                    toast.success('Document deleted successfully.');
                                                                                    fetchPatientDocuments(); // refresh list
                                                                                } catch (err: any) {
                                                                                    toast.error(err.message || 'Failed to delete document.');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-2 text-brand-textSecondary hover:text-brand-error transition-colors"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
                )}
            </div>
            
            {/* Appointment Modal */}
            <BookAppointmentModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onConfirm={handleBookAppointment}
                initialTab="existing"
                initialData={{
                    name: patient.name,
                    phone: patient.mobile,
                    email: patient.email,
                    age: patient.age ? String(patient.age) : undefined,
                    sex: patient.gender,
                    patientId: patient.id
                }}
                doctors={doctors}
            />

            {/* Health Metrics Modal */}
            {(isMetricsModalOpen || isVitalsModalOpen) && (
                <HealthMetricsEntryModal
                    patientId={patient.id}
                    onClose={() => {
                        setIsMetricsModalOpen(false);
                        setIsVitalsModalOpen(false);
                    }}
                    onSuccess={() => {
                        setIsMetricsModalOpen(false);
                        setIsVitalsModalOpen(false);
                        fetchDashboardMetrics();
                    }}
                />
            )}

            {/* Reset PIN Modal */}
            {isResetPinModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-surface w-full max-w-sm rounded-2xl p-6 shadow-xl border border-brand-border animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-brand-textPrimary text-lg">Reset Portal Access PIN</h3>
                                <button onClick={() => { setIsResetPinModalOpen(false); setResetPinSuccess(null); }} className="text-brand-textSecondary hover:text-red-600 hover:bg-red-100 p-1 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                        </div>
                        
                        {!resetPinSuccess ? (
                            <div className="space-y-4">
                                <p className="text-sm text-brand-textSecondary">
                                    Generate a new 4-digit PIN for {patient.name}'s portal access.
                                </p>
                                <div>
                                    <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">Custom PIN (Optional)</label>
                                    <input 
                                        type="text" 
                                        maxLength={4} 
                                        placeholder="Leave blank to auto-generate" 
                                        value={newPinInput} 
                                        onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary"
                                    />
                                </div>
                                <button 
                                    onClick={handleResetPin}
                                    disabled={isResettingPin}
                                    className={`w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 ${isResettingPin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isResettingPin ? 'Resetting...' : 'Reset PIN'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-textPrimary text-lg">PIN Reset Successful</h4>
                                    <p className="text-sm text-brand-textSecondary mt-1">Please share this new PIN with the patient securely.</p>
                                </div>
                                <div className="bg-brand-bg border border-brand-border rounded-xl p-4 mt-4">
                                    <p className="text-xs font-bold text-brand-textSecondary uppercase mb-1">New Portal PIN</p>
                                    <p className="text-3xl font-black text-brand-primary tracking-widest">{resetPinSuccess}</p>
                                </div>
                                <button 
                                    onClick={() => { setIsResetPinModalOpen(false); setResetPinSuccess(null); }}
                                    className="w-full py-2.5 bg-brand-surface border border-brand-border text-brand-textPrimary font-bold rounded-lg hover:bg-brand-bg transition-colors mt-4"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-brand-surface w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
                            <h3 className="font-bold text-brand-textPrimary text-lg flex items-center gap-2">
                                <FileText size={20} className="text-brand-primary" />
                                {previewDoc.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(previewDoc.url, '_blank')}
                                    className="p-2 text-brand-textSecondary hover:text-brand-primary bg-brand-surface border border-brand-border rounded-lg transition-colors"
                                    title="Open in New Tab"
                                >
                                    <Download size={18} />
                                </button>
                                <button 
                                    onClick={() => setPreviewDoc(null)} 
                                    className="p-2 text-brand-textSecondary hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-brand-bg p-4 flex items-center justify-center overflow-auto">
                            {previewDoc.url.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain shadow-md rounded-lg" />
                            ) : (
                                <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-full bg-white rounded-lg shadow-md border-0" />
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <DigitalPrescriptionModal
                isOpen={isDigitalPrescriptionModalOpen}
                onClose={() => setIsDigitalPrescriptionModalOpen(false)}
                onSave={async (data) => {
                    try {
                        await api.addPrescription({
                            ...data,
                            patient_id: patient.id
                        } as any);
                        toast.success("Prescription generation started! Preparing PDF...");
                        
                        // Immediate fetch to show pending document in list, followed by staged checks
                        setTimeout(fetchPatientDocuments, 1200);
                        setTimeout(fetchPatientDocuments, 4000);
                        setTimeout(fetchPatientDocuments, 7500);
                    } catch (err: any) {
                        toast.error(err?.message || "Failed to generate prescription");
                    }
                }}
            />
        </div >,
        document.body
    );
};
