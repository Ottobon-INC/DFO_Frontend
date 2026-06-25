import { useEffect, useRef } from 'react';

export type RealtimeEventType = 'THREAD_ASSIGNED' | 'SLA_BREACH' | 'CLINICIAN_NOTIFICATION' | 'HEARTBEAT';

export interface RealtimeEvent {
    type: RealtimeEventType;
    payload: any;
    timestamp: string;
}

export function useRealtimeEvents(onEvent: (event: RealtimeEvent) => void) {
    const esRef = useRef<EventSource | null>(null);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        // Get JWT token for auth header workaround via URL param
        const getToken = (): string | null => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.token) return user.token;
                }
                return localStorage.getItem('token');
            } catch {
                return null;
            }
        };

        const token = getToken();
        if (!token) return;

        // EventSource doesn't support custom headers — pass token as query param
        const url = `/api/janmasethu/realtime/events?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url, { withCredentials: true });

        es.onopen = () => {
            console.log('[SSE] Connected to real-time event stream');
        };

        es.onmessage = (event) => {
            try {
                const data: RealtimeEvent = JSON.parse(event.data);
                if (data.type !== 'HEARTBEAT') {
                    onEventRef.current(data);
                }
            } catch (e) {
                // Ignore malformed events
            }
        };

        es.onerror = () => {
            console.warn('[SSE] Event stream error — will auto-reconnect');
        };

        esRef.current = es;

        return () => {
            es.close();
            esRef.current = null;
        };
    }, []);
}
