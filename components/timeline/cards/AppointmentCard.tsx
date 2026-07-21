import React from 'react';
import { Calendar, User, Clock, CheckCircle } from 'lucide-react';

interface AppointmentCardProps {
    event: any;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ event }) => {
    // patient_timeline_view returns:
    // title: COALESCE(visit_reason, type)
    // description: (type || ' - ' || status) OR just status for consultations
    // For a consultation, description is the raw note

    const title = event.title || 'Appointment';
    const isConsultation = event.event_type === 'CONSULTATION';
    const description = event.description || '';
    
    // Attempt to extract status if it's formatted as "Type - Status"
    let statusLabel = 'Completed';
    let doctorName = 'Care Provider'; // Doctor name isn't directly exposed in the view right now, so we fall back

    if (!isConsultation && description.includes(' - ')) {
        const parts = description.split(' - ');
        statusLabel = parts[parts.length - 1];
    }

    return (
        <div className="bg-brand-surface rounded-xl border border-blue-500/20 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2 text-brand-textPrimary">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{title}</h4>
                        {!isConsultation && <p className="text-xs text-brand-textSecondary">{statusLabel}</p>}
                    </div>
                </div>
                {statusLabel.toLowerCase() === 'completed' && (
                    <span className="flex items-center text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-md">
                        <CheckCircle size={12} className="mr-1" /> Completed
                    </span>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-brand-border/50 flex flex-col space-y-2 text-xs text-brand-textSecondary">
                <div className="flex items-center font-bold">
                    <User size={12} className="mr-1.5 text-brand-primary" />
                    <span>{doctorName}</span>
                </div>
                {isConsultation && description && (
                    <div className="bg-brand-bg p-2 rounded-lg border border-brand-border/50 mt-2">
                        <p className="line-clamp-3 leading-relaxed">{description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
