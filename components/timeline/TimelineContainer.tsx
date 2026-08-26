import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { EncounterCard, EncounterGroup } from './cards/EncounterCard';
import { Filter, Calendar, FileText, Pill, Stethoscope, Clock, Activity } from 'lucide-react';
import { formatLocalDate, formatLocalTime } from '../../utils/dateFormatter';

interface TimelineContainerProps {
    patientId: string;
}

const EVENT_TYPES = [
    { id: 'CONSULTATION', label: 'Consultations', icon: Stethoscope },
    { id: 'PRESCRIPTION', label: 'Prescriptions', icon: Pill },
    { id: 'INVESTIGATION', label: 'Lab & Documents', icon: FileText },
    { id: 'APPOINTMENT', label: 'Visits', icon: Calendar }
];

const LIMIT = 50;

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

    const fetchTimeline = async (isInitial = false) => {
        try {
            if (isInitial || page === 1) setLoading(true);
            else setLoadingMore(true);
            setError(null);

            const response = await api.getPatientTimeline(patientId, page, LIMIT, selectedTypes);
            const data = response?.data || (Array.isArray(response) ? response : []);
            const fetchedEvents = Array.isArray(data) ? data : [];
            
            setEvents(prev => page === 1 ? fetchedEvents : [...prev, ...fetchedEvents]);
            setHasMore(fetchedEvents.length === LIMIT);
        } catch (err) {
            console.error('Failed to fetch timeline', err);
            setError('Failed to load patient timeline events.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, [patientId, page, selectedTypes]);

    const toggleType = (typeId: string) => {
        setSelectedTypes(prev =>
            prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
        );
    };

    // Group events chronologically by Consultation / Visit Date Encounter
    const encounterGroups = useMemo(() => {
        const map = new Map<string, EncounterGroup>();

        for (const event of events) {
            const eventDateStr = event.event_date || event.created_at || event.date || event.appointment_date || event.timestamp;
            const d = eventDateStr ? new Date(eventDateStr) : new Date();
            const dateKey = isNaN(d.getTime()) ? 'unknown-date' : d.toISOString().slice(0, 10);
            const formattedDate = formatLocalDate(eventDateStr);

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    dateKey,
                    formattedDate,
                    latestTimestamp: eventDateStr || new Date().toISOString(),
                    consultations: [],
                    appointments: [],
                    prescriptions: [],
                    investigations: [],
                    treatments: [],
                    otherEvents: []
                });
            }

            const group = map.get(dateKey)!;
            const type = String(event.event_type || '').toUpperCase();

            if (type === 'CONSULTATION') {
                group.consultations.push(event);
            } else if (type === 'APPOINTMENT') {
                group.appointments.push(event);
            } else if (type === 'PRESCRIPTION') {
                group.prescriptions.push(event);
            } else if (type === 'INVESTIGATION' || type === 'DOCUMENT') {
                group.investigations.push(event);
            } else if (type === 'TREATMENT') {
                group.treatments.push(event);
            } else {
                group.otherEvents.push(event);
            }
        }

        return Array.from(map.values());
    }, [events]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-brand-border rounded-lg shadow-2xs">
                <p className="text-rose-600 text-xs font-bold mb-2">{error}</p>
                <button 
                    onClick={() => { setPage(1); fetchTimeline(true); }} 
                    className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-md hover:bg-brand-primaryDark transition-colors shadow-xs"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-brand-border shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-brand-border bg-slate-50/80">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                        <Filter size={12} /> Filter by type:
                    </span>
                    {EVENT_TYPES.map(type => {
                        const Icon = type.icon;
                        const isSelected = selectedTypes.includes(type.id);
                        return (
                            <button
                                key={type.id}
                                onClick={() => toggleType(type.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all border ${
                                    isSelected
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary'
                                }`}
                            >
                                <Icon size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                <span>{type.label}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedTypes.length > 0 && (
                    <button
                        onClick={() => setSelectedTypes([])}
                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
                    >
                        Show All
                    </button>
                )}
            </div>

            {/* Vertical Line Timeline Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
                {loading && page === 1 ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : encounterGroups.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-lg bg-white">
                        <Stethoscope size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-700 text-xs font-bold">No clinical records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Visits, clinical notes, prescriptions, and lab records will appear chronologically here.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Continuous Vertical Rail connecting all nodes */}
                        <div className="hidden sm:block absolute left-[127px] top-3 bottom-4 w-0.5 bg-slate-200" />
                        <div className="sm:hidden absolute left-[15px] top-3 bottom-4 w-0.5 bg-slate-200" />

                        <div className="space-y-6 relative">
                            {encounterGroups.map((encounter, index) => {
                                const isLast = index === encounterGroups.length - 1;

                                const hasConsultation = encounter.consultations.length > 0;
                                const hasPrescriptions = encounter.prescriptions.length > 0;
                                const hasDocuments = encounter.investigations.length > 0;

                                let NodeIcon = Stethoscope;
                                let nodeColor = 'border-blue-500 text-blue-600 bg-blue-50';

                                if (hasConsultation) {
                                    NodeIcon = Stethoscope;
                                    nodeColor = 'border-blue-500 text-blue-600 bg-blue-50';
                                } else if (hasPrescriptions) {
                                    NodeIcon = Pill;
                                    nodeColor = 'border-emerald-500 text-emerald-600 bg-emerald-50';
                                } else if (hasDocuments) {
                                    NodeIcon = FileText;
                                    nodeColor = 'border-violet-500 text-violet-600 bg-violet-50';
                                } else {
                                    NodeIcon = Calendar;
                                    nodeColor = 'border-sky-500 text-sky-600 bg-sky-50';
                                }

                                return (
                                    <div 
                                        key={encounter.dateKey} 
                                        ref={isLast ? lastElementRef : null}
                                        className="relative flex items-start gap-3 sm:gap-5 group"
                                    >
                                        {/* Left Column: Dedicated Date Column (Desktop) */}
                                        <div className="hidden sm:block w-28 flex-shrink-0 text-right pt-0.5">
                                            <span className="text-xs font-bold text-slate-900 block tracking-tight">
                                                {encounter.formattedDate}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                                {formatLocalTime(encounter.latestTimestamp)}
                                            </span>
                                        </div>

                                        {/* Center Node on the Vertical Rail */}
                                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                                            <div className={`w-7 h-7 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${nodeColor}`}>
                                                <NodeIcon size={13} />
                                            </div>
                                        </div>

                                        {/* Right Column: Unified Encounter Content Card */}
                                        <div className="flex-1 min-w-0">
                                            {/* Mobile Date Header */}
                                            <div className="sm:hidden mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                                <span className="font-bold text-slate-900">{encounter.formattedDate}</span>
                                                <span>•</span>
                                                <span>{formatLocalTime(encounter.latestTimestamp)}</span>
                                            </div>

                                            <EncounterCard encounter={encounter} patientId={patientId} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
