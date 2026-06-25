import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRealtimeEvents, RealtimeEvent } from '../hooks/useRealtimeEvents';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    threadId?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAllRead: () => void;
    markRead: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    markAllRead: () => {},
    markRead: () => {},
    clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

function eventToNotification(event: RealtimeEvent): Notification | null {
    const id = `notif-${Date.now()}-${Math.random()}`;
    switch (event.type) {
        case 'THREAD_ASSIGNED':
            return {
                id,
                type: event.type,
                title: '📋 Thread Assigned',
                message: `A new thread has been assigned to you${event.payload?.patient_name ? ` — ${event.payload.patient_name}` : ''}.`,
                timestamp: event.timestamp,
                read: false,
                threadId: event.payload?.threadId,
            };
        case 'SLA_BREACH':
            return {
                id,
                type: event.type,
                title: '⏰ SLA Breach',
                message: `Thread SLA expired (${event.payload?.risk?.toUpperCase() || 'HIGH'} risk)${event.payload?.threadId ? ` — Thread ${event.payload.threadId.substring(0, 8)}` : ''}.`,
                timestamp: event.timestamp,
                read: false,
                threadId: event.payload?.threadId,
            };
        case 'CLINICIAN_NOTIFICATION':
            return {
                id,
                type: event.type,
                title: '🔔 Alert',
                message: event.payload?.message || 'New notification from system.',
                timestamp: event.timestamp,
                read: false,
                threadId: event.payload?.threadId,
            };
        default:
            return null;
    }
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const handleEvent = useCallback((event: RealtimeEvent) => {
        const notif = eventToNotification(event);
        if (!notif) return;

        setNotifications(prev => [notif, ...prev].slice(0, 50)); // Keep last 50

        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification(notif.title, { body: notif.message, icon: '/favicon.ico' });
        }
    }, []);

    useRealtimeEvents(handleEvent);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = useCallback(() =>
        setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);

    const markRead = useCallback((id: string) =>
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

    const clearAll = useCallback(() => setNotifications([]), []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};
