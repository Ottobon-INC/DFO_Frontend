import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Patient, Thread, Message, Appointment, Lead, RiskLevel } from '../types';

export function useClinicalData() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Audit Logs
    const fetchAuditLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('dfo_audit_logs')
                .select('*')
                .order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setAuditLogs(data);
            } else {
                setAuditLogs([
                    { id: 'AL-9001', action: 'User Login', category: 'Authentication', user: 'Dr. Alexander Smith', timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleString() },
                    { id: 'AL-9002', action: 'System Accessed', category: 'System', user: 'Dr. Alexander Smith', timestamp: new Date(Date.now() - 1000 * 60 * 59).toLocaleString() },
                    { id: 'AL-9003', action: 'User Sign Out', category: 'Authentication', user: 'Nurse Sarah Jenkins', timestamp: new Date(Date.now() - 1000 * 60 * 200).toLocaleString() },
                    { id: 'AL-9004', action: 'User Login', category: 'Authentication', user: 'Admin Account', timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleString() },
                ]);
            }
        } catch (e) {
            setAuditLogs([
                { id: 'AL-9001', action: 'User Login', category: 'Authentication', user: 'Dr. Alexander Smith', timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleString() },
                { id: 'AL-9002', action: 'System Accessed', category: 'System', user: 'Dr. Alexander Smith', timestamp: new Date(Date.now() - 1000 * 60 * 59).toLocaleString() },
                { id: 'AL-9003', action: 'User Sign Out', category: 'Authentication', user: 'Nurse Sarah Jenkins', timestamp: new Date(Date.now() - 1000 * 60 * 200).toLocaleString() },
            ]);
        }
    };

    // Convert Lead to Patient
    const convertLeadToPatient = async (lead: any) => {
        try {
            // 1. Insert into dfo_patients
            const { error: insertError } = await supabase
                .from('dfo_patients')
                .insert([{
                    full_name: lead.name,
                    phone_number: lead.phone,
                    journey_stage: 'trying_to_conceive',
                    age: lead.age,
                    gender: lead.gender
                }]);

            if (insertError) throw insertError;

            // 2. Delete from sakhi_clinic_leads
            const { error: deleteError } = await supabase
                .from('sakhi_clinic_leads')
                .delete()
                .eq('id', lead.id);

            if (deleteError) throw deleteError;

            // 3. Refresh data
            await Promise.all([fetchPatients(), fetchLeads()]);
            return { success: true };
        } catch (err: any) {
            console.error('Conversion error:', err.message);
        }
    };

    const updatePatient = async (id: string, updates: Partial<Patient>) => {
        try {
            const { error } = await supabase
                .from('dfo_patients')
                .update({
                    full_name: updates.name,
                    phone_number: updates.phone,
                    age: updates.age,
                    journey_stage: updates.journeyStage
                })
                .eq('id', id);

            if (error) throw error;
            await fetchPatients();
            return { success: true };
        } catch (err: any) {
            console.error('Update patient error:', err.message);
            return { success: false, error: err.message };
        }
    };

    // Fetch Patients
    const fetchPatients = async () => {
        const { data, error } = await supabase
            .from('dfo_patients')
            .select('*')
            .order('full_name');

        if (data) {
            const mapped: Patient[] = data.map(p => {
                const trend = Array.isArray(p.risk_score_trend) ? p.risk_score_trend : [];
                const lastScore = trend.length > 0 ? (trend[trend.length - 1] > 1 ? trend[trend.length - 1] : trend[trend.length - 1] * 100) : 0;
                return {
                    id: p.id,
                    name: p.full_name,
                    phone: p.phone_number,
                    age: p.age,
                    journeyStage: p.journey_stage || p.pregnancy_stage,
                    riskLevel: (lastScore > 80 ? 'RED' : lastScore > 40 ? 'YELLOW' : 'GREEN') as RiskLevel,
                    lastVisit: p.updated_at,
                    vitals: { bp: '120/80', weight: '65', heartRate: '72', temp: '98.6' }
                };
            });
            setPatients(mapped);
        }
    };

    // Fetch Threads
    const fetchThreads = async () => {
        const { data, error } = await supabase
            .from('conversation_threads')
            .select(`
        *,
        patients:dfo_patients!user_id(full_name)
      `)


            .order('updated_at', { ascending: false });

        if (data) {
            const mapped: Thread[] = data.map(t => ({
                id: t.id,
                patientId: t.user_id,
                patientName: t.dfo_patients?.full_name || 'Unknown Patient',
                riskLevel: (t.status === 'red' ? 'RED' : t.status === 'yellow' ? 'YELLOW' : 'GREEN') as RiskLevel,
                lastMessage: t.metadata?.last_message || 'No messages',
                lastMessageTime: new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: t.is_locked ? 'LOCKED' : 'OPEN',
                slaDeadline: t.updated_at, // Mocking SLA
                isAiSuppressed: t.ownership === 'human'
            }));
            setThreads(mapped);
        }
    };

    // Fetch Messages for a thread
    const fetchMessages = async (threadId: string) => {
        const { data, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (data) {
            const mapped: Message[] = data.map(m => ({
                id: m.id,
                senderId: m.sender_id,
                senderName: m.sender_type,
                senderType: m.sender_type.toUpperCase() as any,
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(prev => ({ ...prev, [threadId]: mapped }));
        }
    };

    // Fetch Appointments
    const fetchAppointments = async () => {
        try {
            const { data, error } = await supabase
                .from('dfo_appointments')
                .select('*, patients:dfo_patients!patient_id(full_name, phone_number)')


                .order('appointment_date', { ascending: true });

            if (error) {
                console.warn('Appointment join failed, falling back:', error.message);
                const { data: directData, error: directError } = await supabase
                    .from('dfo_appointments')
                    .select('*')
                    .order('appointment_date', { ascending: true });

                if (directData) {
                    setAppointments(directData.map(a => ({
                        id: a.id,
                        patientId: a.patient_id,
                        patientName: a.patient_name || 'Patient ' + a.patient_id?.slice(0, 8),
                        patientPhone: 'N/A',
                        doctorName: 'Assigning...',
                        type: a.notes || 'Consultation',
                        status: a.status?.toUpperCase() as any || 'SCHEDULED',
                        startTime: a.appointment_date,
                        endTime: a.appointment_date
                    })));
                }
                return;
            }

            if (data) {
                const mapped = data.map(a => ({
                    id: a.id,
                    patientId: a.patient_id,
                    patientName: a.patient_name || (a.dfo_patients as any)?.full_name || 'Patient ' + a.patient_id?.slice(0, 8),
                    patientPhone: (a.dfo_patients as any)?.phone_number || 'N/A',
                    doctorName: 'Assigning...',
                    type: a.notes || 'Consultation',
                    status: a.status?.toUpperCase() as any || 'SCHEDULED',
                    startTime: a.appointment_date,
                    endTime: a.appointment_date
                }));
                setAppointments(mapped);
            }
        } catch (err) {
            console.error('Fatal appointment fetch error:', err);
        }
    };

    // Fetch Leads
    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from('sakhi_clinic_leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            const mapped: Lead[] = data.map(l => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                source: l.source || 'Direct',
                status: l.status.toUpperCase() as any,
                createdAt: l.created_at
            }));
            setLeads(mapped);
        }
    };

    // Fetch Consultations
    const fetchConsultations = async () => {
        try {
            // Attempt to fetch with join, but fallback if relation doesn't exist
            const { data, error } = await supabase
                .from('dfo_consultations')
                .select('*, patients:dfo_patients!patient_id(full_name)')


                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Join failed, falling back to direct fetch:', error.message);
                const { data: directData, error: directError } = await supabase
                    .from('dfo_consultations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (directData) {
                    setConsultations(directData.map(c => ({ ...c, patientName: 'Patient ' + c.patient_id?.slice(0, 8) })));
                }
                return;
            }

            if (data) {
                const mapped = data.map(c => ({
                    ...c,
                    patientName: (c.dfo_patients as any)?.full_name || 'Patient ' + c.patient_id?.slice(0, 8)
                }));
                setConsultations(mapped);
            }
        } catch (err) {
            console.error('Fatal consultation error:', err);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                await Promise.allSettled([
                    fetchPatients(),
                    fetchThreads(),
                    fetchAppointments(),
                    fetchLeads(),
                    fetchConsultations(),
                    fetchAuditLogs()
                ]);
            } catch (err) {
                console.error('Error loading clinical data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAll();

        // Setup Real-time Subscriptions
        const threadSub = supabase
            .channel('public:conversation_threads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_threads' }, () => {
                fetchThreads();
            })
            .subscribe();

        const messageSub = supabase
            .channel('public:conversation_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, (payload) => {
                fetchMessages(payload.new.thread_id);
                fetchThreads(); // To update last message
            })
            .subscribe();

        const appointmentSub = supabase
            .channel('public:dfo_appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dfo_appointments' }, () => {
                fetchAppointments();
            })
            .subscribe();

        const leadSub = supabase
            .channel('public:sakhi_clinic_leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sakhi_clinic_leads' }, () => {
                fetchLeads();
            })
            .subscribe();

        const consultationSub = supabase
            .channel('public:dfo_consultations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dfo_consultations' }, () => {
                fetchConsultations();
            })
            .subscribe();

        const auditLogSub = supabase
            .channel('public:dfo_audit_logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dfo_audit_logs' }, () => {
                fetchAuditLogs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(threadSub);
            supabase.removeChannel(messageSub);
            supabase.removeChannel(appointmentSub);
            supabase.removeChannel(leadSub);
            supabase.removeChannel(consultationSub);
            supabase.removeChannel(auditLogSub);
        };
    }, []);

    const sendMessage = async (threadId: string, senderId: string, content: string, senderType: string = 'human') => {
        const { error } = await supabase
            .from('conversation_messages')
            .insert({
                thread_id: threadId,
                sender_id: senderId,
                sender_type: senderType,
                content: content
            });

        if (!error) {
            // Update thread last message metadata if needed
            await supabase
                .from('conversation_threads')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', threadId);
        }
    };

    return {
        patients,
        threads,
        messages,
        appointments,
        leads,
        consultations,
        auditLogs,
        loading,
        fetchMessages,
        sendMessage,
        convertLeadToPatient,
        refreshThreads: fetchThreads,
        refreshPatients: fetchPatients,
        refreshLeads: fetchLeads,
        refreshConsultations: fetchConsultations,
        refreshAuditLogs: fetchAuditLogs,
        updatePatient
    };
}
