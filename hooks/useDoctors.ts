import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const DEFAULT_DOCTORS = [
    { id: 'dr_sireesha', name: 'Dr. Sireesha', speciality: 'Gynecology & Obstetrics', department: 'OPD' },
    { id: 'dr_harshitha', name: 'Dr. Harshitha', speciality: 'Gynecology OPD', department: 'OPD' },
    { id: 'dr_ananya', name: 'Dr. Ananya', speciality: 'General & Gynec Consultation', department: 'OPD' },
    { id: 'dr_vyntage', name: 'Dr. Vyntage', speciality: 'Clinical Specialist', department: 'OPD' }
];

// Global cache to prevent multiple simultaneous fetches if components mount at the same time
let cachedDoctors: any[] | null = null;
let fetchPromise: Promise<any> | null = null;

export const useDoctors = () => {
    const [doctors, setDoctors] = useState<any[]>(cachedDoctors && cachedDoctors.length > 0 ? cachedDoctors : DEFAULT_DOCTORS);
    const [loading, setLoading] = useState<boolean>(!cachedDoctors);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cachedDoctors && cachedDoctors.length > 0) {
            setDoctors(cachedDoctors);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchDoctors = async () => {
            if (!fetchPromise) {
                fetchPromise = api.getDoctors();
            }

            try {
                const res = await fetchPromise;
                if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                    cachedDoctors = res.data;
                    if (isMounted) {
                        setDoctors(res.data);
                        setError(null);
                    }
                } else {
                    cachedDoctors = DEFAULT_DOCTORS;
                    if (isMounted) setDoctors(DEFAULT_DOCTORS);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || 'Failed to fetch doctors');
                cachedDoctors = DEFAULT_DOCTORS;
                if (isMounted) setDoctors(DEFAULT_DOCTORS);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDoctors();

        return () => {
            isMounted = false;
        };
    }, []);

    return { doctors: doctors.length > 0 ? doctors : DEFAULT_DOCTORS, loading, error };
};
