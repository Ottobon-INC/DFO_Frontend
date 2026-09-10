export enum UserRole {
    ADMIN = 'Admin',
    DOCTOR = 'Doctor',
    NURSE = 'Nurse',
    FRONT_DESK = 'Front Desk',
    CRO = 'CRO'
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    clinic_id: string;
    is_super_admin: boolean;
    is_clinic_admin: boolean;
    token: string;
}

export type DashboardView = 'dashboard' | 'leads' | 'appointments' | 'patients' | 'analytics' | 'settings' | 'team' | 'rooms';

export interface Lead {
    id: string;
    name: string;
    age?: string;
    gender?: 'Male' | 'Female' | 'Other';
    phone: string;
    problem?: string;
    treatmentDoctor?: string; // At Camp
    treatmentSuggested?: string;
    source: string;
    inquiry: string;
    status: 'New Inquiry' | 'Contacted' | 'Stalling - Sent to CRO' | 'Converted - Active Patient' | 'Lost';
    dateAdded: string;
    email?: string;
    referralRequired?: 'Yes' | 'No';
    alternativePhoneNumber?: string;
    location?: string;
}

export interface Appointment {
    id: string;
    patientName: string;
    date: string; // YYYY-MM-DD
    time: string;
    dob?: string;
    sex?: 'Male' | 'Female' | 'Other';
    maritalStatus?: 'Single' | 'Married';
    address?: string;
    pin?: string;
    email?: string;
    phone?: string;
    consultant?: string; // Doctor Name
    speciality?: string;
    referralDoctor?: string;
    referralDoctorMobile?: string;

    // System Fields
    doctorId: string; // ID of the consultant
    doctorName: string; // Display name
    patientId?: string; // Links to Patient Profile
    type: string; // Consult, Scan, etc.
    status: 'Scheduled' | 'Arrived' | 'Checked-In' | 'Completed' | 'Canceled' | 'Expected';
    queueStatus?: 'BOOKED' | 'ARRIVED' | 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'SKIPPED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    resourceId?: string;
}

export interface Patient {
    id: string;
    uhid: string;
    fullname: string;
    age?: number;
    phone: string;
    location?: string;
    assignedDoctorId?: string;

    referralDoctor?: string;
    registrationDate: string;

    // Clinical Data (Simplified for now)
    lastVisit?: string;
    lastAppointmentDate?: string;
    nextAppointment?: string;
    status: 'Active' | 'Archived';
    emergencyContact?: {
        name: string;
        relation: string;
        phone: string;
    };
    abha?: {
        abha_number: string | null;
        abha_address: string | null;
        verification_status: string;
        is_active: boolean;
        verified_at: string | null;
    } | null;
}

export interface Doctor {
    id: string;
    name: string;
    speciality: string;
    color: string;
    location?: string;
    category?: 'IVF' | 'Hospital';
}

export interface DashboardProps {
    onLogout: () => void;
    userRole: UserRole;
}



export interface FinancialRecord {
    id: string;
    patientId: string;
    type: 'Invoice' | 'Payment';
    amount: number;
    date: string;
    description: string;
    status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PatientDocument {
    id: string;
    patientId: string;
    name: string;
    type: string;
    uploadDate: string;
    url: string;
}

export interface TriageDocument {
    id: string;
    name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    status: string;
    created_at: string;
    uploader?: { name: string };
    previewUrl?: string;
}

// --- Room Allocation ---
export interface RoomCategory {
    id: string;
    name: string;
    description?: string;
    daily_rate: number;
    is_active: boolean;
}

export interface Room {
    id: string;
    category_id: string;
    room_number: string;
    floor?: string;
    capacity: number;
    is_active: boolean;
    room_categories?: {
        name: string;
        daily_rate: number;
    };
}

export interface Bed {
    id: string;
    room_id: string;
    bed_identifier: string;
    status: 'available' | 'occupied' | 'maintenance' | 'reserved';
    is_active: boolean;
    rooms?: {
        room_number: string;
        clinic_id: string;
        room_categories?: {
            id: string;
            name: string;
            daily_rate: number;
        };
    };
}

export interface Admission {
    id: string;
    patient_id: string;
    admitting_doctor_id?: string;
    admission_date: string;
    discharge_date?: string;
    status: 'admitted' | 'discharged' | 'cancelled';
    diagnosis?: string;
    notes?: string;
    patient?: {
        name: string;
        mobile: string;
    };
    bed_assignments?: Array<{
        id: string;
        bed_id: string;
        daily_rate_snapshot: number;
        assigned_at: string;
        is_current: boolean;
        beds?: {
            bed_identifier: string;
            room_id: string;
            rooms?: {
                room_number: string;
                room_categories?: {
                    name: string;
                };
            };
        };
    }>;
}
export interface SuperAdminAnalytics {
    total_clinics: number;
    total_patients: number;
    total_files: number;
}

export interface Clinic {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    users_count?: number;
}

// --- Gynecology Specialty Data Structures ---
export type GynecMainConcern =
    | 'Menstrual Irregularity'
    | 'Pregnancy Consultation'
    | 'Pelvic Pain / Infection'
    | 'Routine Gynecology Checkup'
    | 'Contraceptive Counseling'
    | 'Other';

export interface GynecIntakeData {
    mainConcern: GynecMainConcern;
    lmpDate?: string;
    eddDate?: string;
    gestationalAgeWeeks?: number;
    gravida?: number;
    para?: number;
    cycleRegularity?: 'Regular' | 'Irregular';
    flowIntensity?: 'Light' | 'Moderate' | 'Heavy';
    hasClots?: boolean;
    painSeverity?: 'Mild' | 'Moderate' | 'Severe';
    abnormalDischarge?: boolean;
    currentContraceptiveMethod?: string;
    pregnancyPlanningGoal?: 'Active Conception' | 'Contraception / Delay' | 'Not Applicable';
    additionalNotes?: string;
}

export interface ObstetricSummary {
    gravida: number; // G
    para: number;    // P
    abortions: number; // A
    living: number;  // L
    ectopic?: number;
}

export interface PastPregnancy {
    id: string;
    pregnancyNumber: number;
    year?: string;
    gestationalAge?: string;
    outcome?: 'Full Term' | 'Preterm' | 'Abortion' | 'Ectopic' | 'Stillbirth';
    modeOfDelivery?: 'Normal Vaginal' | 'Instrumental' | 'C-Section' | 'N/A';
    babySex?: 'Male' | 'Female' | 'Other' | 'N/A';
    birthWeightKg?: string;
    pregnancyComplications?: string;
    maternalComplications?: string;
    neonatalComplications?: string;
}

export interface MenstrualHistory {
    ageAtMenarche?: number;
    lmpDate?: string;
    cycleRegularity?: 'Regular' | 'Irregular';
    cycleLengthDays?: number;
    bleedingDurationDays?: number;
    flowIntensity?: 'Light' | 'Moderate' | 'Heavy';
    padsPerDay?: number;
    hasClots?: boolean;
    menstrualPain?: boolean;
    painSeverity?: 'Mild' | 'Moderate' | 'Severe';
    intermenstrualBleeding?: boolean;
    postCoitalBleeding?: boolean;
    menopauseStatus?: 'Premenopausal' | 'Perimenopausal' | 'Postmenopausal';
    ageAtMenopause?: number;
}

export interface CurrentPregnancyDetails {
    pregnancyStatus: 'Not Pregnant' | 'Suspected' | 'Confirmed';
    lmpDate?: string;
    eddDate?: string;
    gestationalAgeWeeks?: number;
    gestationalAgeDays?: number;
    currentSymptoms?: string[];
    vaginalBleeding?: boolean;
    abdominalPelvicPain?: boolean;
    pregnancyComplications?: string;
}

export interface GynecologicalHistory {
    conditions: {
        pcos?: boolean;
        fibroids?: boolean;
        endometriosis?: boolean;
        ovarianCyst?: boolean;
        infertility?: boolean;
        pid?: boolean;
        stiHistory?: boolean;
        cervicalConditions?: boolean;
        previousAbnormalScreening?: boolean;
        other?: string;
    };
    surgeries: {
        cSection?: boolean;
        dc?: boolean;
        hysteroscopy?: boolean;
        laparoscopy?: boolean;
        myomectomy?: boolean;
        hysterectomy?: boolean;
        other?: string;
    };
}

export interface SexualContraceptiveHistory {
    sexuallyActive?: boolean;
    painDuringIntercourse?: boolean;
    stiHistory?: boolean;
    otherSexualHealthConcerns?: string;
    currentContraceptiveMethod?: string;
    previousContraceptiveMethod?: string;
    useDuration?: string;
    reasonForDiscontinuation?: string;
    counselingRequired?: boolean;
    planningPregnancy?: boolean;
}

export interface PelvicExamination {
    examinationPerformed: boolean;
    consentObtained: boolean;
    chaperonePresent: boolean;
    chaperoneName?: string;
    externalExamFindings?: string;
    vaginalFindings?: string;
    cervicalFindings?: string;
    dischargeDetails?: string;
    bleedingDetails?: string;
    tendernessDetails?: string;
    massDetails?: string;
    otherFindings?: string;
}

export interface GynecCaseSheetData {
    patientId: string;
    appointmentId?: string;
    clinicId?: string;
    intake?: GynecIntakeData;
    chiefComplaint: {
        mainComplaint: string;
        duration?: string;
        severity?: string;
        additionalComplaints?: string[];
        briefDescription?: string;
    };
    menstrualHistory: MenstrualHistory;
    obstetricHistory: {
        summary: ObstetricSummary;
        pastPregnancies: PastPregnancy[];
    };
    currentPregnancy: CurrentPregnancyDetails;
    gynecologicalHistory: GynecologicalHistory;
    sexualContraceptiveHistory: SexualContraceptiveHistory;
    examination: {
        general: {
            generalCondition?: string;
            pallor?: boolean;
            icterus?: boolean;
            edema?: boolean;
            bmi?: number;
            otherFindings?: string;
        };
        abdominal: {
            tenderness?: boolean;
            abdominalMass?: boolean;
            distension?: boolean;
            otherFindings?: string;
        };
        pelvic: PelvicExamination;
    };
    assessment: {
        primaryDiagnosis: string;
        diagnosisCode?: string;
        isNewDiagnosis?: boolean;
        secondaryDiagnosis?: string;
        clinicalAssessmentNotes?: string;
    };
    treatmentPlan?: {
        treatmentName?: string;
        description?: string;
        status?: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
        procedureDate?: string;
        additionalInstructions?: string;
    };
    advice: {
        medicationInstructions?: string;
        lifestyleAdvice?: string;
        dietAdvice?: string;
        warningSigns?: string;
        procedureInstructions?: string;
        pregnancyAdvice?: string;
        otherInstructions?: string;
    };
    followUp: {
        followUpRequired: boolean;
        followUpDate?: string;
        followUpReason?: string;
        investigationsToBring?: string;
        referralRequired?: boolean;
        referralDoctorHospital?: string;
    };
}

