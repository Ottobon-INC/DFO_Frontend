import { Patient, Thread, Appointment, Consultation, Document, Lead } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P1',
    name: 'Sarah Johnson',
    phone: '+1 234 567 8901',
    age: 28,
    journeyStage: '2nd Trimester',
    riskLevel: 'RED',
    lastVisit: '2026-03-15',
    nextAppointment: '2026-04-10',
    assignedDoctor: 'Dr. Smith',
    vitals: { bp: '145/95', weight: '72kg', heartRate: '88bpm', temp: '98.6F' }
  },
  {
    id: 'P2',
    name: 'Emily Davis',
    phone: '+1 234 567 8902',
    age: 32,
    journeyStage: '3rd Trimester',
    riskLevel: 'YELLOW',
    lastVisit: '2026-03-20',
    nextAppointment: '2026-04-12',
    assignedDoctor: 'Dr. Miller',
    vitals: { bp: '120/80', weight: '78kg', heartRate: '72bpm', temp: '98.4F' }
  },
  {
    id: 'P3',
    name: 'Maria Garcia',
    phone: '+1 234 567 8903',
    age: 25,
    journeyStage: '1st Trimester',
    riskLevel: 'GREEN',
    lastVisit: '2026-03-25',
    nextAppointment: '2026-04-15',
    assignedDoctor: 'Dr. Smith',
    vitals: { bp: '110/70', weight: '65kg', heartRate: '68bpm', temp: '98.2F' }
  }
];

export const MOCK_THREADS: Thread[] = [
  {
    id: 'T1',
    patientId: 'P1',
    patientName: 'Sarah Johnson',
    riskLevel: 'RED',
    lastMessage: 'I am feeling a bit dizzy today.',
    lastMessageTime: '10:45 AM',
    status: 'OPEN',
    slaDeadline: '2026-04-07T17:30:00Z',
    isAiSuppressed: false
  },
  {
    id: 'T2',
    patientId: 'P2',
    patientName: 'Emily Davis',
    riskLevel: 'YELLOW',
    lastMessage: 'When is my next scan scheduled?',
    lastMessageTime: '09:15 AM',
    status: 'OPEN',
    slaDeadline: '2026-04-07T18:00:00Z',
    isAiSuppressed: true
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'A1',
    patientId: 'P1',
    patientName: 'Sarah Johnson',
    doctorName: 'Dr. Smith',
    type: 'Ultrasound',
    status: 'UPCOMING',
    startTime: '2026-04-10T10:00:00Z',
    endTime: '2026-04-10T11:00:00Z'
  }
];
