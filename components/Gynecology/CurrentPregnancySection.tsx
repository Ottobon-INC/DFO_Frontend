import React, { useEffect } from 'react';
import { Activity, Calendar, AlertTriangle } from 'lucide-react';
import { CurrentPregnancyDetails } from '../../types';

interface CurrentPregnancySectionProps {
    data: CurrentPregnancyDetails;
    onChange: (updated: CurrentPregnancyDetails) => void;
}

export const CurrentPregnancySection: React.FC<CurrentPregnancySectionProps> = ({ data, onChange }) => {

    // Auto calculate EDD and Gestational Age when LMP changes
    const handleLmpChange = (newLmp: string) => {
        if (!newLmp) {
            onChange({
                ...data,
                lmpDate: newLmp,
                eddDate: undefined,
                gestationalAgeWeeks: undefined,
                gestationalAgeDays: undefined
            });
            return;
        }

        const lmp = new Date(newLmp);
        if (isNaN(lmp.getTime())) return;

        // Naegele's rule: EDD = LMP + 280 days
        const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
        const eddFormatted = edd.toISOString().split('T')[0];

        // Gestational age calculation
        const today = new Date();
        const diffMs = today.getTime() - lmp.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        const weeks = Math.max(0, Math.floor(diffDays / 7));
        const days = Math.max(0, diffDays % 7);

        onChange({
            ...data,
            lmpDate: newLmp,
            eddDate: eddFormatted,
            gestationalAgeWeeks: weeks,
            gestationalAgeDays: days
        });
    };

    const PREGNANCY_SYMPTOMS = [
        'Nausea / Morning Sickness',
        'Vomiting',
        'Fatigue',
        'Breast tenderness',
        'Urinary frequency',
        'Abdominal cramping',
        'Spotting / Bleeding'
    ];

    const handleSymptomToggle = (symptom: string) => {
        const currentList = data.currentSymptoms || [];
        const updated = currentList.includes(symptom)
            ? currentList.filter(s => s !== symptom)
            : [...currentList, symptom];
        onChange({ ...data, currentSymptoms: updated });
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Current Pregnancy Status & Tracking</h3>
                        <p className="text-xs text-gray-500">Monitor current pregnancy status, auto-calculated EDD, and gestational age</p>
                    </div>
                </div>
            </div>

            {/* Status Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Not Pregnant', 'Suspected', 'Confirmed'] as const).map((status) => {
                    const active = data.pregnancyStatus === status;
                    return (
                        <button
                            key={status}
                            type="button"
                            onClick={() => onChange({ ...data, pregnancyStatus: status })}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                active
                                    ? 'border-pink-600 bg-pink-600 text-white shadow-sm scale-102'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-pink-50 hover:text-pink-700'
                            }`}
                        >
                            {status}
                        </button>
                    );
                })}
            </div>

            {data.pregnancyStatus !== 'Not Pregnant' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
                        {/* LMP */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">LMP Date</label>
                            <input
                                type="date"
                                value={data.lmpDate || ''}
                                onChange={(e) => handleLmpChange(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-pink-500"
                            />
                        </div>

                        {/* EDD (Auto calculated) */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                EDD (Estimated Due Date) <span className="text-pink-600 text-[10px] font-normal">(Auto)</span>
                            </label>
                            <input
                                type="date"
                                value={data.eddDate || ''}
                                onChange={(e) => onChange({ ...data, eddDate: e.target.value })}
                                className="w-full px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-pink-900 focus:ring-2 focus:ring-pink-500"
                            />
                        </div>

                        {/* Gestational Age */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Gestational Age</label>
                            <div className="px-3 py-2 text-xs font-semibold border border-pink-200 rounded-lg bg-white text-pink-700 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-pink-500" />
                                {data.gestationalAgeWeeks !== undefined
                                    ? `${data.gestationalAgeWeeks} Weeks, ${data.gestationalAgeDays || 0} Days`
                                    : 'Select LMP to compute'}
                            </div>
                        </div>
                    </div>

                    {/* Symptoms Grid */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Current Symptoms</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {PREGNANCY_SYMPTOMS.map((symptom) => {
                                const checked = (data.currentSymptoms || []).includes(symptom);
                                return (
                                    <label
                                        key={symptom}
                                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                                            checked ? 'border-pink-400 bg-pink-50 text-pink-900' : 'border-gray-100 bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleSymptomToggle(symptom)}
                                            className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
                                        />
                                        <span>{symptom}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Warning Flags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50/50 text-xs text-rose-900 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!data.vaginalBleeding}
                                onChange={(e) => onChange({ ...data, vaginalBleeding: e.target.checked })}
                                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                            />
                            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span className="font-semibold">Active Vaginal Bleeding</span>
                        </label>

                        <label className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-amber-900 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!data.abdominalPelvicPain}
                                onChange={(e) => onChange({ ...data, abdominalPelvicPain: e.target.checked })}
                                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                            />
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className="font-semibold">Abdominal / Pelvic Pain</span>
                        </label>
                    </div>

                    {/* Pregnancy Complications */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Complications / Clinical Risk Factors</label>
                        <textarea
                            rows={2}
                            placeholder="Detail any existing complications (e.g., subchorionic hematoma, hyperemesis, high risk)..."
                            value={data.pregnancyComplications || ''}
                            onChange={(e) => onChange({ ...data, pregnancyComplications: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
