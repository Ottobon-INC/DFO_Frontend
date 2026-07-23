import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRealtimeVitals = (
    patientId: string, 
    onVitalUpdate: (newVital: any) => void,
    onReconnect?: () => void
) => {
    const [isConnected, setIsConnected] = useState(false);

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
                    onVitalUpdate(payload.new);
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
                    onVitalUpdate(payload.new);
                }
            )
            .on('system', { event: '*' }, (payload) => {
                console.log('System event:', payload);
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully connected to vitals channel');
                    setIsConnected(true);
                    
                    // If we previously dropped and are now reconnecting, trigger a background fetch
                    if (err) {
                        onReconnect?.();
                    }
                }
                
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.error('Lost connection to vitals channel:', status);
                    setIsConnected(false);
                }
            });

        // Memory Cleanup: Explicit unsubscribe to prevent connection leaks on unmount
        return () => {
            console.log(`Unsubscribing from vitals channel for patient ${patientId}`);
            supabase.removeChannel(channel);
        };
    }, [patientId, onVitalUpdate, onReconnect]);

    return { isConnected };
};
