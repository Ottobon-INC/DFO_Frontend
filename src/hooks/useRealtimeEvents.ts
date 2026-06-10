import { useEffect, useState } from 'react';

export function useRealtimeEvents(userId: string, role: string) {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const baseUrl = 
          (import.meta.env && import.meta.env.VITE_API_URL) || 
          (process.env && process.env.NEXT_PUBLIC_API_URL) || 
          'http://localhost:3005';
        
        const url = `${baseUrl}/janmasethu/realtime/events?userId=${userId}&role=${role}`;
        const eventSource = new EventSource(url);
        
        eventSource.addEventListener('thread_updated', (e: any) => {
            const data = JSON.parse(e.data);
            // Redraw active queues or update chat status in global state
            setEvents((prev) => [data, ...prev]);
        });
        
        eventSource.addEventListener('message_received', (e: any) => {
            const data = JSON.parse(e.data);
            // Append incoming message to active chat transcript
            setEvents((prev) => [data, ...prev]);
        });
        
        eventSource.onerror = () => {
            console.error("SSE Connection failed. Re-connecting...");
        };
        
        return () => {
            eventSource.close();
        };
    }, [userId, role]);

    return events;
}
