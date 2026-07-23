import React from 'react';
import { Pill, User } from 'lucide-react';

interface PrescriptionCardProps {
    event: any;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ event }) => {
    // patient_timeline_view returns:
    // title: 'Prescription'
    // description: STRING_AGG(medication_name || ' (' || dosage || ')', ', ')
    const description = event.description || 'No medication details provided.';
    const drugs = description.split(',').map((d: string) => d.trim()).filter(Boolean);

    return (
        <div className="bg-brand-surface rounded-xl border border-emerald-500/20 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 text-brand-textPrimary">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Pill size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{event.title || 'Prescription Issued'}</h4>
                        <p className="text-xs text-brand-textSecondary">Care Provider</p>
                    </div>
                </div>
            </div>

            {drugs.length > 0 ? (
                <div className="space-y-2 mt-2">
                    {drugs.map((drugName: string, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs p-2 bg-brand-bg rounded-lg border border-brand-border/50">
                            <span className="font-bold text-brand-textPrimary">{drugName}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-brand-textSecondary mt-2 p-2 bg-brand-bg rounded-lg border border-brand-border/50">
                    {description}
                </div>
            )}
        </div>
    );
};
