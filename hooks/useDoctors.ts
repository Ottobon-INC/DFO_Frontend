import { useState, useEffect } from 'react';
import { api } from '../services/api';

// Global cache to prevent multiple simultaneous fetches if components mount at the same time
let cachedDoctors: any[] | null = null;
let fetchPromise: Promise<any> | null = null;

export const useDoctors = () => {
    const [doctors, setDoctors] = useState<any[]>(cachedDoctors || []);
    const [loading, setLoading] = useState<boolean>(!cachedDoctors);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cachedDoctors) {
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
                if (res && res.success) {
                    cachedDoctors = res.data;
                    if (isMounted) {
                        setDoctors(res.data);
                        setError(null);
                    }
                } else {
                    if (isMounted) setDoctors([]);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || 'Failed to fetch doctors');
                // Reset cache on failure so it can retry next time
                cachedDoctors = null;
                fetchPromise = null;
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDoctors();

        return () => {
            isMounted = false;
        };
    }, []);

    return { doctors, loading, error };
};
