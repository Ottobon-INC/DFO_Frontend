import React from 'react';
import { ObstetricSummary, PastPregnancy } from '../../../types';
import { Baby, Plus, Trash2 } from 'lucide-react';

interface ObstetricHistorySectionProps {
    summary: ObstetricSummary;
    pastPregnancies: PastPregnancy[];
    onChangeSummary: (summary: ObstetricSummary) => void;
    onChangePregnancies: (pregnancies: PastPregnancy[]) => void;
}

export const ObstetricHistorySection: React.FC<ObstetricHistorySectionProps> = ({
    summary,
    pastPregnancies = [],
    onChangeSummary,
    onChangePregnancies
}) => {
    const handleSummaryChange = (field: keyof ObstetricSummary, val: number) => {
        onChangeSummary({
            ...summary,
            [field]: Math.max(0, val)
        });
    };

    const handleAddPregnancy = () => {
        const newPreg: PastPregnancy = {
            id: 'preg_' + Date.now(),
            pregnancyNumber: pastPregnancies.length + 1,
            year: '',
            outcome: 'Full Term',
            modeOfDelivery: 'Normal Vaginal',
            babySex: 'Female',
            birthWeightKg: '',
            pregnancyComplications: ''
        };
        onChangePregnancies([...pastPregnancies, newPreg]);
    };

    const handleRemovePregnancy = (id: string) => {
        const updated = pastPregnancies.filter(p => p.id !== id);
        onChangePregnancies(updated);
    };

    const handleUpdatePregnancy = (id: string, field: keyof PastPregnancy, value: any) => {
        const updated = pastPregnancies.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        });
        onChangePregnancies(updated);
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Baby className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Obstetric History (GTPAL)</h3>
                        <p className="text-xs text-gray-500">Summary score (Gravida, Para, Abortions, Living) and past pregnancy log</p>
                    </div>
                </div>
            </div>

            {/* GTPAL Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                <div className="text-center">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Gravida (G)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Total Pregnancies</span>
                    <input
                        type="number"
                        min={0}
                        value={summary.gravida ?? 0}
                        onChange={(e) => handleSummaryChange('gravida', parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="text-center">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Para (P)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Viable Births</span>
                    <input
                        type="number"
                        min={0}
                        value={summary.para ?? 0}
                        onChange={(e) => handleSummaryChange('para', parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="text-center">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Abortions (A)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Loss &lt;20 Wks</span>
                    <input
                        type="number"
                        min={0}
                        value={summary.abortions ?? 0}
                        onChange={(e) => handleSummaryChange('abortions', parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="text-center">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Living (L)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Living Children</span>
                    <input
                        type="number"
                        min={0}
                        value={summary.living ?? 0}
                        onChange={(e) => handleSummaryChange('living', parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="text-center col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Ectopic (E)</label>
                    <span className="text-[10px] text-gray-400 block mb-1">Ectopic Pregnancies</span>
                    <input
                        type="number"
                        min={0}
                        value={summary.ectopic ?? 0}
                        onChange={(e) => handleSummaryChange('ectopic', parseInt(e.target.value) || 0)}
                        className="w-full text-center py-1.5 text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Repeatable Past Pregnancies List */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-800">Past Pregnancy Records ({pastPregnancies.length})</h4>
                    <button
                        type="button"
                        onClick={handleAddPregnancy}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Pregnancy Record
                    </button>
                </div>

                {pastPregnancies.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-xs text-gray-500">
                        No previous pregnancy records added yet. Click "Add Pregnancy Record" to record past obstetric details.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pastPregnancies.map((preg, idx) => (
                            <div key={preg.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/30 space-y-3 relative">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <span className="font-semibold text-xs text-blue-700">
                                        Pregnancy #{idx + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePregnancy(preg.id)}
                                        className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                                        title="Delete record"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Year</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 2021"
                                            value={preg.year || ''}
                                            onChange={(e) => handleUpdatePregnancy(preg.id, 'year', e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Outcome</label>
                                        <select
                                            value={preg.outcome || 'Full Term'}
                                            onChange={(e) => handleUpdatePregnancy(preg.id, 'outcome', e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="Full Term">Full Term</option>
                                            <option value="Preterm">Preterm</option>
                                            <option value="Abortion">Abortion</option>
                                            <option value="Ectopic">Ectopic</option>
                                            <option value="Stillbirth">Stillbirth</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Mode of Delivery</label>
                                        <select
                                            value={preg.modeOfDelivery || 'Normal Vaginal'}
                                            onChange={(e) => handleUpdatePregnancy(preg.id, 'modeOfDelivery', e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="Normal Vaginal">Normal Vaginal</option>
                                            <option value="Instrumental">Instrumental</option>
                                            <option value="C-Section">C-Section</option>
                                            <option value="N/A">N/A</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Baby Sex & Weight (kg)</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={preg.babySex || 'Female'}
                                                onChange={(e) => handleUpdatePregnancy(preg.id, 'babySex', e.target.value)}
                                                className="w-1/2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                                <option value="Other">Other</option>
                                                <option value="N/A">N/A</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="3.2 kg"
                                                value={preg.birthWeightKg || ''}
                                                onChange={(e) => handleUpdatePregnancy(preg.id, 'birthWeightKg', e.target.value)}
                                                className="w-1/2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Pregnancy & Maternal Complications</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Preeclampsia, Gestational Diabetes, PPH..."
                                        value={preg.pregnancyComplications || ''}
                                        onChange={(e) => handleUpdatePregnancy(preg.id, 'pregnancyComplications', e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
