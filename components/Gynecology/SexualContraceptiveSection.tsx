import React from 'react';
import { Heart } from 'lucide-react';
import { SexualContraceptiveHistory } from '../../types';

interface SexualContraceptiveSectionProps {
    data: SexualContraceptiveHistory;
    onChange: (updated: SexualContraceptiveHistory) => void;
}

const CONTRACEPTIVE_METHODS = [
    'None',
    'Barrier (Condoms)',
    'Oral Contraceptive Pills (OCPs)',
    'Intrauterine Device (IUD / Cu-T)',
    'Injectable (Depo-Provera)',
    'Subdermal Implant',
    'Emergency Contraceptive Pills',
    'Surgical Sterilization (Tubectomy / Vasectomy)',
    'Natural / Rhythm Method'
];

export const SexualContraceptiveSection: React.FC<SexualContraceptiveSectionProps> = ({ data, onChange }) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                    <Heart className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Sexual & Contraceptive History</h3>
                    <p className="text-xs text-gray-500">Collect sensitive clinical health indicators and family planning status</p>
                </div>
            </div>

            {/* Sexual Health Markers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!data.sexuallyActive}
                        onChange={(e) => onChange({ ...data, sexuallyActive: e.target.checked })}
                        className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="font-medium">Sexually Active</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!data.painDuringIntercourse}
                        onChange={(e) => onChange({ ...data, painDuringIntercourse: e.target.checked })}
                        className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="font-medium">Dyspareunia (Pain)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!data.counselingRequired}
                        onChange={(e) => onChange({ ...data, counselingRequired: e.target.checked })}
                        className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="font-medium">Contraception Counseling Needed</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!data.planningPregnancy}
                        onChange={(e) => onChange({ ...data, planningPregnancy: e.target.checked })}
                        className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="font-medium">Currently Planning Pregnancy</span>
                </label>
            </div>

            {/* Contraception Methods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Current Contraceptive Method</label>
                    <select
                        value={data.currentContraceptiveMethod || 'None'}
                        onChange={(e) => onChange({ ...data, currentContraceptiveMethod: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    >
                        {CONTRACEPTIVE_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Previous Contraceptive Method</label>
                    <select
                        value={data.previousContraceptiveMethod || 'None'}
                        onChange={(e) => onChange({ ...data, previousContraceptiveMethod: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    >
                        {CONTRACEPTIVE_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Usage Duration</label>
                    <input
                        type="text"
                        placeholder="e.g. 6 months, 3 years"
                        value={data.useDuration || ''}
                        onChange={(e) => onChange({ ...data, useDuration: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
            </div>

            {/* Discontinuation & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Discontinuation (If applicable)</label>
                    <input
                        type="text"
                        placeholder="e.g. Side effects, planning conception, expired IUD..."
                        value={data.reasonForDiscontinuation || ''}
                        onChange={(e) => onChange({ ...data, reasonForDiscontinuation: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Other Sexual Health Notes</label>
                    <input
                        type="text"
                        placeholder="e.g. STI treatment history, partner concerns..."
                        value={data.otherSexualHealthConcerns || ''}
                        onChange={(e) => onChange({ ...data, otherSexualHealthConcerns: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
            </div>
        </div>
    );
};
