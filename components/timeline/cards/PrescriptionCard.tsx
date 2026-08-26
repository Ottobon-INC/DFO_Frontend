import React from 'react';
import { Pill, Stethoscope } from 'lucide-react';

interface PrescriptionCardProps {
    event: any;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ event }) => {
    const description = event.description || 'No medication details provided.';
    const rawTitle = event.title || 'Prescription Issued';
    
    // Parse medications list
    const drugs = description.split(',').map((d: string) => d.trim()).filter(Boolean);

    return (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 flex-shrink-0">
                        <Pill size={13} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                            {rawTitle.endsWith('.pdf') ? 'Prescription Order' : rawTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Stethoscope size={10} className="text-slate-400" />
                            <span>{event.doctor_name || 'Prescribing Clinician'}</span>
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                    Rx Active
                </span>
            </div>

            {drugs.length > 0 ? (
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    {drugs.map((drugName: string, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200/70">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>{drugName}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                Prescribed
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200/70">
                    {description}
                </div>
            )}
        </div>
    );
};
