import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRealtimeVitals = (
    patientId: string, 
    onVitalUpdate: (newVital: any) => void,
    onReconnect?: () => void
) => {
    const [isConnected, setIsConnected] = useState(false);

    const onVitalUpdateRef = useRef(onVitalUpdate);
    onVitalUpdateRef.current = onVitalUpdate;

    const onReconnectRef = useRef(onReconnect);
    onReconnectRef.current = onReconnect;

    useEffect(() => {
        if (!patientId) return;

        // Initialize the Supabase Realtime channel for this specific patient
        const channel = supabase
            .channel(`vitals-changes-${patientId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sakhi_clinic_patient_vitals',
                    filter: `patient_id=eq.${patientId}`
                },
                (payload) => {
                    console.log('Real-time vital insert received!', payload);
                    onVitalUpdateRef.current?.(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sakhi_clinic_patient_vitals',
                    filter: `patient_id=eq.${patientId}`
                },
                (payload) => {
                    console.log('Real-time vital update received!', payload);
                    onVitalUpdateRef.current?.(payload.new);
                }
            )
            .on('system', { event: '*' }, (payload) => {
                console.log('System event:', payload);
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully connected to vitals channel');
                    setIsConnected(true);
                    
                    if (err) {
                        onReconnectRef.current?.();
                    }
                }
                
                if (status === 'CHANNEL_ERROR') {
                    console.error('Realtime vitals channel error:', err || status);
                    setIsConnected(false);
                } else if (status === 'CLOSED') {
                    console.log('Vitals channel closed');
                    setIsConnected(false);
                }
            });

        // Memory Cleanup: Explicit unsubscribe to prevent connection leaks on unmount
        return () => {
            console.log(`Unsubscribing from vitals channel for patient ${patientId}`);
            supabase.removeChannel(channel);
        };
    }, [patientId]);

    return { isConnected };
};
