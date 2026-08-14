import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Calendar, Phone, Mail, FileText, Activity,
    Clock, CreditCard, Plus, Pill, Stethoscope,
    MessageSquare, Download, Upload, User, AlertCircle, CheckCircle2, Trash2, Eye, RefreshCw
} from 'lucide-react';
import { Patient, Appointment, FinancialRecord, PatientDocument, UserRole } from '../types';
import { api } from '../services/api';
import { BookAppointmentModal } from './AppointmentModals';
import { TimelineContainer } from './timeline/TimelineContainer';
import { HealthMetricsEntryModal } from './HealthMetricsEntryModal';
import { DynamicTrendChart, ClinicalAlertsWidget, ConditionsWidget, TreatmentsWidget } from './PatientWidgets';
import { useRealtimeVitals } from '../hooks/useRealtimeVitals';
import { DigitalPrescriptionModal, PrescriptionData } from './DigitalPrescriptionModal';import toast from 'react-hot-toast';
import AbhaIntegrationWidget from './AbhaIntegrationWidget';


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
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
    
    // Vitals Modal State
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [vitalType, setVitalType] = useState('Blood Pressure');
    const [vitalValue, setVitalValue] = useState('');
    const [vitalUnit, setVitalUnit] = useState('mmHg');
    const [savingVitals, setSavingVitals] = useState(false);

    const handleSaveVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingVitals(true);
        try {
            await api.saveVitals({
                patientId: patient.id,
                vital_type: vitalType,
                vital_value: vitalValue,
                unit: vitalUnit
            } as any);
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
                        generation_status: d.generation_status
                    }));
                }
            } catch (err) {
                console.warn("Could not fetch generated docs", err);
            }

            const combined = [...(Array.isArray(manualDocs) ? manualDocs : []), ...generatedDocs];
            
            // Deduplicate by ID, preferring items with a url (from generatedDocs)
            const uniqueDocsMap = new Map();
            combined.forEach(doc => {
                if (!uniqueDocsMap.has(doc.id) || (doc.url && !uniqueDocsMap.get(doc.id).url)) {
                    uniqueDocsMap.set(doc.id, doc);
                }
            });
            const deduplicatedDocs = Array.from(uniqueDocsMap.values());
            
            setPatientDocuments(deduplicatedDocs);
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

    useEffect(() => {
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
        { id: 'timeline', label: 'Timeline', shortLabel: 'Timeline' },
        { id: 'consultation', label: 'Consultation Notes', shortLabel: 'Notes' },
        { id: 'appointments', label: 'Appointments', shortLabel: 'Appts' },
        { id: 'documents', label: 'Documents', shortLabel: 'Docs' },
    ];

    return createPortal(
        <div className="fixed inset-0 bg-brand-bg/80 z-50 flex justify-end animate-fade-in">
            <div className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl bg-brand-surface h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-brand-border overflow-hidden">

                {/* Header */}
                <div className="p-2 sm:p-3 lg:p-4 xl:p-6 border-b border-brand-border flex justify-between items-start bg-brand-bg/50 gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-5 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm sm:text-base lg:text-xl xl:text-2xl font-bold border-2 border-brand-surface shadow-sm flex-shrink-0">
                            {patient.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold text-brand-textPrimary truncate">{patient.name}</h2>
                                {activeTab === 'overview' && (
                                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        {isConnected ? 'Live' : 'Offline'}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 lg:gap-4 text-[10px] sm:text-xs lg:text-sm text-brand-textSecondary mt-0.5 sm:mt-1">
                                <span className="flex items-center"><Phone size={10} className="mr-0.5 sm:mr-1 flex-shrink-0" /> <span className="truncate max-w-[80px] sm:max-w-none">{patient.mobile}</span></span>
                                <span className="hidden md:flex items-center"><Mail size={10} className="mr-1 flex-shrink-0" /> {patient.email}</span>
                                <span className="hidden sm:inline px-1 sm:px-1.5 py-0.5 bg-brand-bg rounded text-[8px] sm:text-[10px] font-bold text-brand-textSecondary border border-brand-border">ID: {patient.id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {isClinical && (
                            <button
                                onClick={() => setIsMetricsModalOpen(true)}
                                className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white font-bold rounded-lg transition-all active:scale-95 text-[10px] sm:text-xs lg:text-sm mr-1 sm:mr-2"
                            >
                                <span className="flex items-center"><Activity size={14} className="mr-0.5 sm:mr-1" /> Update Metrics</span>
                            </button>
                        )}
                        {onCompleteConsultation && !isConsultationComplete && (
                            <button
                                onClick={handleComplete}
                                className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md shadow-green-600/20 flex items-center transition-all active:scale-95 text-[10px] sm:text-xs lg:text-sm"
                            >
                                <CheckCircle2 size={14} className="mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Done</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 sm:p-1.5 lg:p-2 hover:bg-red-100 rounded-full text-brand-textSecondary hover:text-red-600 transition-colors">
                            <X size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-1 sm:px-2 lg:px-4 xl:px-6 border-b border-brand-border flex overflow-x-auto custom-scrollbar bg-brand-surface">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 lg:px-4 text-[10px] sm:text-xs lg:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'
                                }`}
                        >
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain transform-gpu p-3 sm:p-4 md:p-6 lg:p-8 bg-brand-bg/30 custom-scrollbar">

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

                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* COLUMN 1: Demographics & Context */}
                                    <div className="space-y-6 lg:col-span-1">
                                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-brand-textPrimary flex items-center">
                                                    <User size={18} className="mr-2 text-brand-primary" /> Demographics
                                                </h3>
                                                {!isEditing ? (
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="text-xs font-bold text-brand-primary hover:bg-brand-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setIsEditing(false)}
                                                            className="text-xs font-bold text-brand-textSecondary hover:bg-brand-bg px-3 py-1.5 rounded-lg transition-colors border border-brand-border"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSaveDemographics}
                                                            className="text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="grid grid-cols-1 gap-y-4 animate-fade-in">
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Full Name</label>
                                                        <input name="name" defaultValue={patient.name} id="edit-name" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Relation</label>
                                                        <input name="relation" defaultValue={patient.relation} id="edit-relation" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Date of Birth</label>
                                                        <input type="date" name="dob" defaultValue={patient.dob} id="edit-dob" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Gender</label>
                                                        <select name="gender" defaultValue={patient.gender} id="edit-gender" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary">
                                                            <option value="Female">Female</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Blood Group</label>
                                                        <input name="bloodGroup" defaultValue={patient.bloodGroup} id="edit-bloodGroup" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                                        <div className="col-span-2">
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Address (House, Street, Area)</label>
                                                            <div className="flex space-x-2">
                                                                <input name="house" defaultValue={patient.house} id="edit-house" placeholder="House/Apt" className="w-1/3 text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                                <input name="street" defaultValue={patient.street} id="edit-street" placeholder="Street" className="w-1/3 text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                                <input name="area" defaultValue={patient.area} id="edit-area" placeholder="Area" className="w-1/3 text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <input name="city" defaultValue={patient.city} id="edit-city" placeholder="City" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary mb-2" />
                                                        </div>
                                                        <div>
                                                            <input name="state" defaultValue={patient.state} id="edit-state" placeholder="State" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary mb-2" />
                                                        </div>
                                                    </div>
                                                    {/* Contact Info Editing */}
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Mobile</label>
                                                        <input name="mobile" defaultValue={patient.mobile} id="edit-mobile" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Email</label>
                                                        <input name="email" defaultValue={patient.email} id="edit-email" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4 gap-y-6">
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Full Name</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.name}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Relation</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.relation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Date of Birth</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.dob || 'Not Provided'} ({patient.age ? `${patient.age} Yrs` : '-'})</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Gender</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.gender || 'Female'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Blood Group</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.bloodGroup || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Address</label>
                                                        <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">
                                                            {[
                                                                patient.house,
                                                                patient.street,
                                                                patient.area,
                                                                patient.city,
                                                                patient.state,
                                                                patient.postalCode
                                                            ].filter(Boolean).join(', ') || 'No address on file'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-8 pt-6 border-t border-brand-border">
                                                <h4 className="text-sm font-bold text-brand-textPrimary mb-4">Registration & Referral</h4>
                                                {isEditing ? (
                                                    <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">UHID</label>
                                                            <input name="uhid" defaultValue={patient.uhid} id="edit-uhid" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Aadhar ID</label>
                                                            <input name="aadhar" defaultValue={patient.aadhar} id="edit-aadhar" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Marital Status</label>
                                                            <select name="maritalStatus" defaultValue={patient.maritalStatus} id="edit-maritalStatus" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary">
                                                                <option value="Single">Single</option>
                                                                <option value="Married">Married</option>
                                                                <option value="Divorced">Divorced</option>
                                                                <option value="Widowed">Widowed</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Referral Doctor</label>
                                                            <input name="referralDoctor" defaultValue={patient.referralDoctor} id="edit-referralDoctor" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Registration Date</label>
                                                            <input type="date" name="registrationDate" defaultValue={patient.registrationDate} id="edit-registrationDate" className="w-full text-sm font-bold text-brand-textPrimary border border-brand-border rounded px-2 py-1 outline-none focus:border-brand-primary" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4 gap-y-6">
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">UHID</label>
                                                            <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.uhid || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Aadhar ID</label>
                                                            <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.aadhar || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Marital Status</label>
                                                            <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.maritalStatus || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Referral Doctor</label>
                                                            <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.referralDoctor || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-brand-textSecondary font-bold uppercase block mb-1">Registration Date</label>
                                                            <p className="text-sm font-bold text-brand-textPrimary bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-fit">{patient.registrationDate || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <AbhaIntegrationWidget patient={patient} onUpdate={fetchPatientDetails} />

                                            {/* Assigned Staff */}
                                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                            <h3 className="font-bold text-brand-textPrimary mb-6 flex items-center">
                                                <Stethoscope size={18} className="mr-2 text-brand-primary" /> Care Team
                                            </h3>
                                            <div className="space-y-4">
                                                {(() => {
                                                    const assignedDoc = doctors.find(d => d.id === patient.assignedDoctorId || d.id === (patient as any).assigned_doctor_id);
                                                    const docName = assignedDoc ? (assignedDoc.name || `${assignedDoc.first_name || ''} ${assignedDoc.last_name || ''}`.trim()) : (patient.referralDoctor || (patient as any).assignedDoctorName || null);
                                                    const docSpeciality = assignedDoc ? (assignedDoc.specialization || assignedDoc.role || 'Consultant') : (patient.referralDoctor ? 'Referral Specialist' : 'Consultant');
                                                    const docInitials = docName ? docName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'CT';

                                                    return docName ? (
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                                                                {docInitials}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-brand-textPrimary">{docName}</p>
                                                                <p className="text-xs text-brand-textSecondary">{Array.isArray(docSpeciality) ? docSpeciality.join(', ') : docSpeciality}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-brand-textSecondary italic">No care team assigned yet</p>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMN 2: Vitals & Conditions */}
                                    <div className="space-y-6 lg:col-span-1">
                                        <div className="flex justify-between items-center bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
                                            <h3 className="font-bold text-brand-textPrimary flex items-center">
                                                <Activity size={18} className="mr-2 text-brand-primary" /> Health Metrics
                                            </h3>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={fetchDashboardMetrics}
                                                    disabled={isLoadingDashboard}
                                                    className="p-1.5 text-brand-textSecondary hover:text-brand-primary bg-brand-bg hover:bg-brand-primary/10 rounded transition-colors disabled:opacity-50"
                                                    title="Refresh Metrics"
                                                >
                                                    <RefreshCw size={16} className={isLoadingDashboard ? "animate-spin" : ""} />
                                                </button>
                                                <button 
                                                    onClick={() => setIsVitalsModalOpen(true)}
                                                    className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded hover:bg-brand-secondary transition-colors shadow-sm"
                                                >
                                                    Record Vitals
                                                </button>
                                            </div>
                                        </div>
                                        <DynamicTrendChart vitals={dashboardData?.vitals} />
                                        <ConditionsWidget conditions={dashboardData?.medicalHistory} />
                                    </div>

                                    {/* COLUMN 3: Allergies & Treatments */}
                                    <div className="space-y-6 lg:col-span-1">
                                        <ClinicalAlertsWidget alerts={dashboardData?.allergies} />
                                        <TreatmentsWidget treatments={dashboardData?.ongoingTreatments} />
                                        
                                        {/* Admin Actions / Danger Zone */}
                                        <div className="bg-brand-error/5 p-6 rounded-2xl border border-brand-error/20">
                                            <h3 className="font-bold text-brand-error mb-2 flex items-center">
                                                <AlertCircle size={18} className="mr-2" /> Administrative Actions
                                            </h3>
                                            <p className="text-sm text-brand-error/80 mb-4">
                                                Archiving a patient record will move it to the inactive registry. This action should only be performed when a patient has officially dropped out or completed their journey.
                                            </p>
                                            <div className="flex flex-col space-y-2 mt-4">
                                                <button
                                                    onClick={() => setIsResetPinModalOpen(true)}
                                                    className="w-full py-2 bg-brand-surface border border-brand-primary/30 text-brand-primary text-sm font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors shadow-sm"
                                                >
                                                    Reset Portal Access PIN
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
                                                    className="w-full py-2 bg-brand-surface border border-brand-error/30 text-brand-error text-sm font-bold rounded-lg hover:bg-brand-error hover:text-brand-bg transition-colors shadow-sm"
                                                >
                                                    Archive Patient Record
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'consultation' && (
                                <div className="space-y-6">
                                    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-brand-textPrimary flex items-center">
                                                <FileText size={18} className="mr-2 text-brand-primary" /> Clinical Note
                                            </h3>
                                            {isClinical && (
                                                <button 
                                                    onClick={() => setIsDigitalPrescriptionModalOpen(true)}
                                                    className="px-4 py-2 bg-brand-primary text-brand-bg text-xs font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center shadow-sm"
                                                >
                                                    <Pill size={14} className="mr-1" /> Prescription Generator
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <textarea
                                                value={consultationNote}
                                                onChange={(e) => setConsultationNote(e.target.value)}
                                                readOnly={!isClinical}
                                                className={`w-full p-4 bg-brand-bg border border-brand-border rounded-xl text-base text-brand-textPrimary outline-none focus:border-brand-primary transition-all h-64 resize-none leading-relaxed ${!isClinical ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="Type your clinical consultation notes here..."
                                            />
                                        </div>
                                        {isClinical && (
                                            <div className="mt-6 flex justify-end">
                                                <button
                                                    onClick={async () => {
                                                        setIsSavingNote(true);
                                                        try {
                                                            await api.saveClinicalNote(patient.id, consultationNote);
                                                            toast.success("Note saved successfully!");
                                                        } catch (e) {
                                                            console.error(e);
                                                            toast.error("Failed to save note. Please check your connection.");
                                                        } finally {
                                                            setIsSavingNote(false);
                                                        }
                                                    }}
                                                    disabled={isSavingNote}
                                                    className={`px-6 py-2 bg-brand-surface border border-brand-border text-brand-textPrimary font-bold rounded-xl shadow-lg shadow-brand-bg/20 hover:bg-brand-bg transition-all active:scale-95 ${isSavingNote ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isSavingNote ? 'Saving...' : 'Save Clinical Note'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                                        <h3 className="font-bold text-brand-textPrimary mb-4">Past Consultation History</h3>
                                        <div className="space-y-4">
                                            {historyNotes.length > 0 ? (
                                                historyNotes.map((note: any, idx: number) => (
                                                    <div key={note.id || idx} className="p-4 border border-brand-border rounded-xl bg-brand-bg/50">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-sm font-bold text-brand-textPrimary">{note.doctor_name || 'Doctor'}</p>
                                                            <span className="text-xs text-brand-textSecondary">{note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Unknown Date'}</span>
                                                        </div>
                                                        <p className="text-sm text-brand-textSecondary line-clamp-3 whitespace-pre-line">{note.note || note.content}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 border border-brand-border rounded-xl bg-brand-bg/50 text-center">
                                                    <p className="text-sm text-brand-textSecondary">No past clinical notes found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                                                        <p className="text-sm font-bold text-brand-textPrimary truncate max-w-[150px]">{doc.name}</p>
                                                                        <p className="text-xs text-brand-textSecondary">{doc.uploadDate}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={async () => {
                                                                            let url = doc.url;
                                                                            if (!url && doc.id) {
                                                                                try {
                                                                                    const res = await api.getSecureAssetUrl(doc.id);
                                                                                    if (res.success && res.data?.url) url = res.data.url;
                                                                                } catch (e) {}
                                                                            }
                                                                            if (url && url !== '#') {
                                                                                setPreviewDoc({...doc, url});
                                                                            } else {
                                                                                toast('Preview not available for this document.');
                                                                            }
                                                                        }}
                                                                        className="p-2 text-brand-textSecondary hover:text-brand-primary transition-colors"
                                                                        title="Preview Document"
                                                                    >
                                                                        <Eye size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            let url = doc.url;
                                                                            if (!url && doc.id) {
                                                                                try {
                                                                                    const res = await api.getSecureAssetUrl(doc.id);
                                                                                    if (res.success && res.data?.url) url = res.data.url;
                                                                                } catch (e) {}
                                                                            }
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
            </div >
            
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
            {isMetricsModalOpen && (
                <HealthMetricsEntryModal
                    patientId={patient.id}
                    onClose={() => setIsMetricsModalOpen(false)}
                    onSuccess={() => {
                        setIsMetricsModalOpen(false);
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
                    await api.addPrescription({
                        ...data,
                        patient_id: patient.id
                    } as any);
                    toast.success("Prescription generated successfully! It will appear in the documents list shortly.");
                    
                    // The backend generates this asynchronously via BullMQ, so we poll for it
                    setTimeout(fetchPatientDocuments, 2000);
                    setTimeout(fetchPatientDocuments, 5000);
                }}
            />
        </div >,
        document.body
    );
};
