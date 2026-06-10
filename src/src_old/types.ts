export type Role = 'CRO' | 'DOCTOR' | 'NURSE';

export type RiskLevel = 'RED' | 'YELLOW' | 'GREEN';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  journeyStage: string;
  riskLevel: RiskLevel;
  lastVisit?: string;
  nextAppointment?: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  vitals: {
    bp: string;
    weight: string;
    heartRate: string;
    temp: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'USER' | 'AI' | 'HUMAN' | 'SYSTEM';
  content: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  patientId: string;
  patientName: string;
  riskLevel: RiskLevel;
  lastMessage: string;
  lastMessageTime: string;
  status: 'OPEN' | 'LOCKED' | 'RESOLVED';
  assignedTo?: string;
  slaDeadline: string;
  isAiSuppressed: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorName: string;
  type: string;
  status: 'UPCOMING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'CONFIRMED' | 'SCHEDULED';
  startTime: string;
  endTime: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  notes: string;
  diagnosis: string;
  prescriptionId?: string;
}

export interface Document {
  id: string;
  patientId: string;
  name: string;
  type: 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSENT' | 'OTHER';
  status: 'PENDING' | 'GENERATED' | 'UPLOADED';
  url: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'STALLED' | 'CONVERTED';
  createdAt: string;
}
