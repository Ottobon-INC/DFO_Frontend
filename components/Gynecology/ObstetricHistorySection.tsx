import React from 'react';
import { User, Plus, Trash2 } from 'lucide-react';
import { ObstetricSummary, PastPregnancy } from '../../types';

interface ObstetricHistorySectionProps {
    summary: ObstetricSummary;
    pastPregnancies: PastPregnancy[];
    onSummaryChange: (updated: ObstetricSummary) => void;
    onPastPregnanciesChange: (updated: PastPregnancy[]) => void;
}

export const ObstetricHistorySection: React.FC<ObstetricHistorySectionProps> = ({
    summary,
    pastPregnancies,
    onSummaryChange,
    onPastPregnanciesChange
}) => {

    const handleAddPregnancy = () => {
        const nextNum = pastPregnancies.length + 1;
        const newRecord: PastPregnancy = {
            id: `preg_${Date.now()}`,
            pregnancyNumber: nextNum,
            year: new Date().getFullYear().toString(),
            outcome: 'Full Term',
            modeOfDelivery: 'Normal Vaginal',
            babySex: 'Female'
        };
        onPastPregnanciesChange([...pastPregnancies, newRecord]);
        onSummaryChange({
            ...summary,
            gravida: (summary.gravida || 0) + 1,
            para: (summary.para || 0) + 1,
            living: (summary.living || 0) + 1
        });
    };

    const handleRemovePregnancy = (id: string) => {
        const updated = pastPregnancies.filter(p => p.id !== id);
        onPastPregnanciesChange(updated);
    };

    const handleUpdatePregnancy = (id: string, key: keyof PastPregnancy, value: any) => {
        const updated = pastPregnancies.map(p => {
            if (p.id === id) {
                return { ...p, [key]: value };
            }
            return p;
        });
        onPastPregnanciesChange(updated);
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Obstetric History (GPAL)</h3>
                        <p className="text-xs text-gray-500">Summary of pregnancies, outcomes, and repeatable delivery records</p>
                    </div>
                </div>
            </div>

            {/* GPAL Summary Scorecard */}
            <div className="grid grid-cols-5 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-center">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Gravida (G)</label>
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={summary.gravida ?? 0}
                        onChange={(e) => onSummaryChange({ ...summary, gravida: parseInt(e.target.value) || 0 })}
                        className="w-16 mx-auto mt-1 px-2 py-1 text-center font-bold text-base border border-pink-200 rounded-lg text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Para (P)</label>
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={summary.para ?? 0}
                        onChange={(e) => onSummaryChange({ ...summary, para: parseInt(e.target.value) || 0 })}
                        className="w-16 mx-auto mt-1 px-2 py-1 text-center font-bold text-base border border-pink-200 rounded-lg text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Abortions (A)</label>
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={summary.abortions ?? 0}
                        onChange={(e) => onSummaryChange({ ...summary, abortions: parseInt(e.target.value) || 0 })}
                        className="w-16 mx-auto mt-1 px-2 py-1 text-center font-bold text-base border border-pink-200 rounded-lg text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Living (L)</label>
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={summary.living ?? 0}
                        onChange={(e) => onSummaryChange({ ...summary, living: parseInt(e.target.value) || 0 })}
                        className="w-16 mx-auto mt-1 px-2 py-1 text-center font-bold text-base border border-pink-200 rounded-lg text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Ectopic (E)</label>
                    <input
                        type="number"
                        min={0}
                        max={10}
                        value={summary.ectopic ?? 0}
                        onChange={(e) => onSummaryChange({ ...summary, ectopic: parseInt(e.target.value) || 0 })}
                        className="w-16 mx-auto mt-1 px-2 py-1 text-center font-bold text-base border border-pink-200 rounded-lg text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
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
                                    <span className="font-semibold text-xs text-pink-700">
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
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Outcome</label>
                                        <select
                                            value={preg.outcome || 'Full Term'}
                                            onChange={(e) => handleUpdatePregnancy(preg.id, 'outcome', e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
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
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
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
                                                className="w-1/2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
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
                                                className="w-1/2 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
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
                                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-pink-500"
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
