import React from 'react';
import { FileText, ShieldAlert } from 'lucide-react';
import { GynecologicalHistory } from '../../types';

interface GynecologicalHistorySectionProps {
    data: GynecologicalHistory;
    onChange: (updated: GynecologicalHistory) => void;
}

export const GynecologicalHistorySection: React.FC<GynecologicalHistorySectionProps> = ({ data, onChange }) => {
    const handleConditionChange = (key: keyof GynecologicalHistory['conditions'], value: any) => {
        onChange({
            ...data,
            conditions: {
                ...data.conditions,
                [key]: value
            }
        });
    };

    const handleSurgeryChange = (key: keyof GynecologicalHistory['surgeries'], value: any) => {
        onChange({
            ...data,
            surgeries: {
                ...data.surgeries,
                [key]: value
            }
        });
    };

    const CONDITIONS_LIST: { key: keyof GynecologicalHistory['conditions']; label: string }[] = [
        { key: 'pcos', label: 'PCOS / PCOD' },
        { key: 'fibroids', label: 'Uterine Fibroids' },
        { key: 'endometriosis', label: 'Endometriosis / Adenomyosis' },
        { key: 'ovarianCyst', label: 'Ovarian Cyst' },
        { key: 'infertility', label: 'Infertility History' },
        { key: 'pid', label: 'Pelvic Inflammatory Disease (PID)' },
        { key: 'stiHistory', label: 'STI / Infection History' },
        { key: 'cervicalConditions', label: 'Cervical Conditions / Dysplasia' },
        { key: 'previousAbnormalScreening', label: 'Previous Abnormal Pap Smear / HPV Test' }
    ];

    const SURGERIES_LIST: { key: keyof GynecologicalHistory['surgeries']; label: string }[] = [
        { key: 'cSection', label: 'C-Section' },
        { key: 'dc', label: 'Dilation & Curettage (D&C)' },
        { key: 'hysteroscopy', label: 'Hysteroscopy' },
        { key: 'laparoscopy', label: 'Diagnostic / Operative Laparoscopy' },
        { key: 'myomectomy', label: 'Myomectomy' },
        { key: 'hysterectomy', label: 'Hysterectomy' }
    ];

    return (
        <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Gynecological History & Past Surgeries</h3>
                    <p className="text-xs text-gray-500">Record prior diagnoses, abnormal screening results, and surgical procedures</p>
                </div>
            </div>

            {/* Past Conditions */}
            <div>
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Known Gynecological Conditions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONDITIONS_LIST.map((item) => {
                        const checked = !!data.conditions[item.key];
                        return (
                            <label
                                key={item.key}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    checked ? 'border-pink-400 bg-pink-50 text-pink-900 font-medium' : 'border-gray-100 bg-gray-50/70 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => handleConditionChange(item.key, e.target.checked)}
                                    className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
                                />
                                <span className="truncate">{item.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Surgeries & Procedures */}
            <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Previous Gynecological Procedures / Surgeries</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SURGERIES_LIST.map((item) => {
                        const checked = !!data.surgeries[item.key];
                        return (
                            <label
                                key={item.key}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    checked ? 'border-purple-400 bg-purple-50 text-purple-900 font-medium' : 'border-gray-100 bg-gray-50/70 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => handleSurgeryChange(item.key, e.target.checked)}
                                    className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                                />
                                <span className="truncate">{item.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Other Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Other Gynecological Conditions</label>
                    <input
                        type="text"
                        placeholder="e.g. Vulvodynia, Vaginitis..."
                        value={data.conditions.other || ''}
                        onChange={(e) => handleConditionChange('other', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Other Past Surgeries</label>
                    <input
                        type="text"
                        placeholder="e.g. Ovarian cystectomy, Cervical LEEP..."
                        value={data.surgeries.other || ''}
                        onChange={(e) => handleSurgeryChange('other', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                </div>
            </div>
        </div>
    );
};
