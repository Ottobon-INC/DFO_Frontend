import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { TimelineItem } from './TimelineItem';
import { AppointmentCard } from './cards/AppointmentCard';
import { PrescriptionCard } from './cards/PrescriptionCard';
import { LabCard } from './cards/LabCard';

interface TimelineContainerProps {
    patientId: string;
}

const EVENT_TYPES = [
    { id: 'APPOINTMENT', label: 'Appointments' },
    { id: 'CONSULTATION', label: 'Consultations' },
    { id: 'PRESCRIPTION', label: 'Prescriptions' },
    { id: 'INVESTIGATION', label: 'Lab Reports' }
];

const LIMIT = 20;

export const TimelineContainer: React.FC<TimelineContainerProps> = ({ patientId }) => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    // Reset page and events when filters change
    useEffect(() => {
        setPage(1);
        setEvents([]);
        setHasMore(true);
    }, [selectedTypes]);

    useEffect(() => {
        let ignore = false;
        const fetchTimeline = async () => {
            try {
                if (page === 1) setLoading(true);
                else setLoadingMore(true);
                setError(null);

                const response = await api.getPatientTimeline(patientId, page, LIMIT, selectedTypes);
                if (ignore) return;
                
                const data = response?.data || (Array.isArray(response) ? response : []);
                const fetchedEvents = Array.isArray(data) ? data : [];
                
                setEvents(prev => page === 1 ? fetchedEvents : [...prev, ...fetchedEvents]);
                setHasMore(fetchedEvents.length === LIMIT);
            } catch (err) {
                if (!ignore) {
                    console.error('Failed to fetch timeline', err);
                    setError('Failed to load timeline data. Please try again.');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        };
        fetchTimeline();
        
        return () => {
            ignore = true;
        };
    }, [patientId, page, selectedTypes]);

    const toggleType = (typeId: string) => {
        setSelectedTypes(prev =>
            prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
        );
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-brand-surface border border-brand-border rounded-xl">
                <p className="text-red-500 font-semibold mb-2">{error}</p>
                <button 
                    onClick={() => setPage(1)} 
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-brand-surface">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 p-4 border-b border-brand-border bg-brand-bg/20">
                {EVENT_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all border ${selectedTypes.includes(type.id)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-brand-surface text-brand-textSecondary border-brand-border hover:border-brand-primary/50 hover:text-brand-primary'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Timeline Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                {loading && page === 1 ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center p-12 border border-dashed border-brand-border rounded-2xl bg-brand-bg/50">
                        <p className="text-brand-textSecondary text-sm font-semibold">No timeline events found</p>
                        <p className="text-xs text-brand-textSecondary/70 mt-1">Try adjusting the filters above.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-brand-border/50 ml-4 sm:ml-[108px] pl-6 sm:pl-8 space-y-8 pb-10">
                        {events.map((event, index) => {
                            const isLast = index === events.length - 1;
                            return (
                                <div key={`${event.id}-${index}`} ref={isLast ? lastElementRef : null}>
                                    <TimelineItem date={event.created_at || event.date || event.appointment_date || event.timestamp} type={event.event_type}>
                                        {event.event_type === 'APPOINTMENT' || event.event_type === 'CONSULTATION' ? (
                                            <AppointmentCard event={event} />
                                        ) : event.event_type === 'PRESCRIPTION' ? (
                                            <PrescriptionCard event={event} />
                                        ) : event.event_type === 'INVESTIGATION' ? (
                                            <LabCard event={event} />
                                        ) : (
                                            <div className="text-xs text-brand-textSecondary bg-brand-bg p-4 rounded-xl border border-brand-border">
                                                Unsupported event type: {event.event_type}
                                            </div>
                                        )}
                                    </TimelineItem>
                                </div>
                            );
                        })}
                        {loadingMore && (
                            <div className="flex justify-center pt-4">
                                <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
