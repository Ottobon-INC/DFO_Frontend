import React from 'react';
import { CurrentPregnancyDetails } from '../../../types';
import { Activity, AlertTriangle, Calendar } from 'lucide-react';

interface CurrentPregnancySectionProps {
    data: CurrentPregnancyDetails;
    onChange: (updated: CurrentPregnancyDetails) => void;
}

const PREGNANCY_SYMPTOMS = [
    'Morning Sickness / Nausea',
    'Hyperemesis Gravidarum',
    'Fatigue / Tiredness',
    'Breast Tenderness',
    'Frequent Urination',
    'Lower Backache',
    'Lower Abdominal Cramping',
    'Light Spotting',
    'Edema / Swelling',
    'Dizziness / Fainting'
];

export const CurrentPregnancySection: React.FC<CurrentPregnancySectionProps> = ({ data, onChange }) => {
    const calculateEddAndGa = (lmpStr: string) => {
        if (!lmpStr) return;
        const lmp = new Date(lmpStr);
        if (isNaN(lmp.getTime())) return;

        // EDD = LMP + 280 days
        const edd = new Date(lmp);
        edd.setDate(edd.getDate() + 280);
        const eddFormatted = edd.toISOString().split('T')[0];

        // GA = Today - LMP
        const today = new Date();
        const diffTime = today.getTime() - lmp.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.max(0, Math.floor(diffDays / 7));
        const days = Math.max(0, diffDays % 7);

        onChange({
            ...data,
            lmpDate: lmpStr,
            eddDate: eddFormatted,
            gestationalAgeWeeks: weeks,
            gestationalAgeDays: days
        });
    };

    const handleLmpChange = (lmpStr: string) => {
        calculateEddAndGa(lmpStr);
    };

    const handleSymptomToggle = (symptom: string) => {
        const current = data.currentSymptoms || [];
        const updated = current.includes(symptom)
            ? current.filter(s => s !== symptom)
            : [...current, symptom];
        onChange({ ...data, currentSymptoms: updated });
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
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
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm scale-102'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                        >
                            {status}
                        </button>
                    );
                })}
            </div>

            {data.pregnancyStatus !== 'Not Pregnant' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                        {/* LMP */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">LMP Date</label>
                            <input
                                type="date"
                                value={data.lmpDate || ''}
                                onChange={(e) => handleLmpChange(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* EDD (Auto calculated) */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                EDD (Estimated Due Date) <span className="text-blue-600 text-[10px] font-normal">(Auto)</span>
                            </label>
                            <input
                                type="date"
                                value={data.eddDate || ''}
                                onChange={(e) => onChange({ ...data, eddDate: e.target.value })}
                                className="w-full px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-blue-900 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Gestational Age */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Gestational Age</label>
                            <div className="px-3 py-2 text-xs font-semibold border border-blue-200 rounded-lg bg-white text-blue-700 flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-blue-500" />
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
                                            checked ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-gray-100 bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleSymptomToggle(symptom)}
                                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
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
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
