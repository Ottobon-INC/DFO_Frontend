import React from 'react';
import { Calendar, Stethoscope, CheckCircle, Clock } from 'lucide-react';

interface AppointmentCardProps {
    event: any;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ event }) => {
    const title = event.title || 'Clinical Consultation';
    const isConsultation = event.event_type === 'CONSULTATION';
    const description = event.description || '';
    
    let statusLabel = 'Completed';
    let doctorName = event.doctor_name || event.provider_name || 'Assigned Consultant';

    if (!isConsultation && description.includes(' - ')) {
        const parts = description.split(' - ');
        statusLabel = parts[parts.length - 1];
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-sky-50 text-brand-primary flex items-center justify-center border border-sky-100 flex-shrink-0">
                        {isConsultation ? <Stethoscope size={13} /> : <Calendar size={13} />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{title}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Stethoscope size={10} className="text-slate-400" />
                            <span>{doctorName}</span>
                        </p>
                    </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                    statusLabel.toLowerCase() === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                    {statusLabel}
                </span>
            </div>

            {isConsultation && description && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200/80">
                        {description}
                    </p>
                </div>
            )}
        </div>
    );
};
