export enum UserRole {
    ADMIN = 'Admin',
    DOCTOR = 'Doctor',
    NURSE = 'Nurse',
    FRONT_DESK = 'Front Desk',
    CRO = 'CRO'
}

export type DashboardView = 'dashboard' | 'leads' | 'appointments' | 'patients' | 'analytics' | 'settings';

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
    husbandOrGuardianName?: string;
    husbandAge?: string;
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
    resourceId?: string;
}

export interface Patient {
    id: string;
    uhid: string;
    name: string;
    relation?: string; // S/D/H/W of
    maritalStatus?: 'Single' | 'Married';
    gender: 'Male' | 'Female' | 'Other';
    dob?: string;
    age?: string;
    aadhar?: string;
    bloodGroup?: string;
    treatmentStatus?: string;

    // Contact Info
    house?: string;
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    email?: string;
    mobile: string;
    assignedDoctorId?: string;

    referralDoctor?: string;
    hospitalAddress?: string;
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




