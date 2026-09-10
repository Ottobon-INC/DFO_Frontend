import React from 'react';
import { MenstrualHistory } from '../../../types';
import { Calendar } from 'lucide-react';

interface MenstrualHistorySectionProps {
    data: MenstrualHistory;
    onChange: (updated: MenstrualHistory) => void;
}

export const MenstrualHistorySection: React.FC<MenstrualHistorySectionProps> = ({ data, onChange }) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Menstrual & Cycle History</h3>
                        <p className="text-xs text-gray-500">Record menarche, LMP, regularity, flow characteristics, and menopause markers</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Menarche Age */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Age at Menarche (Years)</label>
                    <input
                        type="number"
                        min={8}
                        max={20}
                        placeholder="e.g. 13"
                        value={data.ageAtMenarche || ''}
                        onChange={(e) => onChange({ ...data, ageAtMenarche: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* LMP Date */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Menstrual Period (LMP)</label>
                    <input
                        type="date"
                        value={data.lmpDate || ''}
                        onChange={(e) => onChange({ ...data, lmpDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Cycle Regularity */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cycle Regularity</label>
                    <select
                        value={data.cycleRegularity || 'Regular'}
                        onChange={(e) => onChange({ ...data, cycleRegularity: e.target.value as 'Regular' | 'Irregular' })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="Regular">Regular</option>
                        <option value="Irregular">Irregular</option>
                    </select>
                </div>

                {/* Cycle Length */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cycle Length (Days)</label>
                    <input
                        type="number"
                        min={15}
                        max={90}
                        placeholder="e.g. 28"
                        value={data.cycleLengthDays || ''}
                        onChange={(e) => onChange({ ...data, cycleLengthDays: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {/* Bleeding Duration */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Bleeding Duration (Days)</label>
                    <input
                        type="number"
                        min={1}
                        max={30}
                        placeholder="e.g. 5"
                        value={data.bleedingDurationDays || ''}
                        onChange={(e) => onChange({ ...data, bleedingDurationDays: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Flow Intensity */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Flow Intensity</label>
                    <select
                        value={data.flowIntensity || 'Moderate'}
                        onChange={(e) => onChange({ ...data, flowIntensity: e.target.value as 'Light' | 'Moderate' | 'Heavy' })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="Light">Light</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Heavy">Heavy</option>
                    </select>
                </div>

                {/* Pads per day */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pads / Tampons per Day</label>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        placeholder="e.g. 3"
                        value={data.padsPerDay || ''}
                        onChange={(e) => onChange({ ...data, padsPerDay: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Pain Severity */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dysmenorrhea (Pain Severity)</label>
                    <select
                        value={data.painSeverity || 'Mild'}
                        onChange={(e) => onChange({ ...data, painSeverity: e.target.value as 'Mild' | 'Moderate' | 'Severe', menstrualPain: true })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                    </select>
                </div>
            </div>

            {/* Checkboxes & Markers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={!!data.hasClots}
                        onChange={(e) => onChange({ ...data, hasClots: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium">Passage of Clots</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={!!data.intermenstrualBleeding}
                        onChange={(e) => onChange({ ...data, intermenstrualBleeding: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium">Intermenstrual Bleeding</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-xs text-gray-700 cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={!!data.postCoitalBleeding}
                        onChange={(e) => onChange({ ...data, postCoitalBleeding: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-medium">Post-Coital Bleeding</span>
                </label>
            </div>

            {/* Menopause Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Menopause Status</label>
                    <select
                        value={data.menopauseStatus || 'Premenopausal'}
                        onChange={(e) => onChange({ ...data, menopauseStatus: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="Premenopausal">Premenopausal</option>
                        <option value="Perimenopausal">Perimenopausal</option>
                        <option value="Postmenopausal">Postmenopausal</option>
                    </select>
                </div>
                {data.menopauseStatus === 'Postmenopausal' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Age at Menopause (Years)</label>
                        <input
                            type="number"
                            min={35}
                            max={65}
                            placeholder="e.g. 48"
                            value={data.ageAtMenopause || ''}
                            onChange={(e) => onChange({ ...data, ageAtMenopause: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
