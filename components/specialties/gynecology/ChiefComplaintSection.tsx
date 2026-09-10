import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ChiefComplaintSectionProps {
    data: {
        mainComplaint: string;
        duration?: string;
        severity?: string;
        additionalComplaints?: string[];
        briefDescription?: string;
    };
    onChange: (updated: any) => void;
}

const COMMON_COMPLAINTS = [
    'Irregular periods',
    'Heavy menstrual bleeding',
    'Period pain (Dysmenorrhea)',
    'Pelvic pain',
    'Vaginal discharge',
    'Pregnancy-related consultation',
    'Infertility concern',
    'PCOS-related concern',
    'Menopause symptoms',
    'Contraception / Family planning',
    'Routine gynecological check-up',
    'Other'
];

const ASSOCIATED_SYMPTOMS = [
    'Severe Dysmenorrhea',
    'Nausea / Vomiting',
    'Lower Abdominal Cramping',
    'Pelvic Fullness / Pressure',
    'Acne / Facial Hair (Hirsutism)',
    'Weight Gain',
    'Intermenstrual Spotting',
    'Hot Flashes / Night Sweats',
    'Pain During Intercourse (Dyspareunia)',
    'Urinary Frequency',
    'Weakness / Fatigue'
];

export const ChiefComplaintSection: React.FC<ChiefComplaintSectionProps> = ({ data, onChange }) => {
    const handleComplaintClick = (complaint: string) => {
        onChange({
            ...data,
            mainComplaint: complaint
        });
    };

    const handleSymptomToggle = (symptom: string) => {
        const currentList = data.additionalComplaints || [];
        const isSelected = currentList.includes(symptom);
        const updatedList = isSelected
            ? currentList.filter(item => item !== symptom)
            : [...currentList, symptom];

        onChange({
            ...data,
            additionalComplaints: updatedList
        });
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Chief Complaint & Presenting Symptoms</h3>
                        <p className="text-xs text-gray-500">Select the primary reason for visit to dynamically adapt clinical forms</p>
                    </div>
                </div>
                {data.mainComplaint && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold text-xs rounded-full">
                        Primary: {data.mainComplaint}
                    </span>
                )}
            </div>

            {/* Main Complaint Pills */}
            <div>
                <label className="block text-xs font-bold text-gray-800 mb-2">
                    Main Complaint (Select Primary Reason) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {COMMON_COMPLAINTS.map((complaint) => {
                        const isPrimary = data.mainComplaint === complaint;
                        return (
                            <button
                                key={complaint}
                                type="button"
                                onClick={() => handleComplaintClick(complaint)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    isPrimary
                                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                                        : 'bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200'
                                }`}
                            >
                                {complaint}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Duration & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                        Duration <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 3 days, 2 months, 6 cycles"
                        value={data.duration || ''}
                        onChange={(e) => onChange({ ...data, duration: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Severity Grade</label>
                    <select
                        value={data.severity || 'Moderate'}
                        onChange={(e) => onChange({ ...data, severity: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                        <option value="Critical">Critical / Acute</option>
                    </select>
                </div>
            </div>

            {/* Associated Symptoms Tags */}
            <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                    Associated Symptoms & Clinical Features (Optional)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">Check any accompanying symptoms reported by the patient during this visit</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ASSOCIATED_SYMPTOMS.map((symptom) => {
                        const checked = (data.additionalComplaints || []).includes(symptom);
                        return (
                            <label
                                key={symptom}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                                    checked ? 'border-blue-400 bg-blue-50/70 text-blue-900 font-medium' : 'border-gray-100 bg-gray-50/60 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleSymptomToggle(symptom)}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                />
                                <span className="truncate">{symptom}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Brief Description */}
            <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Clinical Description / Notes</label>
                <textarea
                    rows={2}
                    placeholder="Provide any additional context regarding onset, progression, or aggravating factors..."
                    value={data.briefDescription || ''}
                    onChange={(e) => onChange({ ...data, briefDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};
