import React, { useEffect } from 'react';
import { GynecIntakeData, GynecMainConcern } from '../../../types';
import { Calendar, AlertCircle, Heart, Shield, HelpCircle, Activity } from 'lucide-react';

interface GynecologyFrontDeskIntakeProps {
    value: GynecIntakeData;
    onChange: (updated: GynecIntakeData) => void;
}

const CONCERNS: { value: GynecMainConcern; label: string; desc: string; icon: any }[] = [
    { value: 'Menstrual Irregularity', label: 'Menstrual Irregularity', desc: 'Irregular cycles, heavy bleeding, severe pain', icon: Activity },
    { value: 'Pregnancy Consultation', label: 'Pregnancy / Antenatal Check', desc: 'Confirmed/suspected pregnancy, routine ANC visit', icon: Heart },
    { value: 'Pelvic Pain / Infection', label: 'Pelvic Pain / Infection', desc: 'Lower abdominal pain, vaginal discharge, pelvic discomfort', icon: AlertCircle },
    { value: 'Routine Gynecology Checkup', label: 'Routine Gynec Checkup', desc: 'Annual preventive screening, general consultation', icon: Calendar },
    { value: 'Contraceptive Counseling', label: 'Contraceptive / Family Planning', desc: 'Birth control guidance, family planning advice', icon: Shield },
    { value: 'Other', label: 'Other Gynec Concern', desc: 'General or unlisted gynecological complaint', icon: HelpCircle }
];

export const GynecologyFrontDeskIntake: React.FC<GynecologyFrontDeskIntakeProps> = ({ value, onChange }) => {
    const mainConcern = value.mainConcern || 'Routine Gynecology Checkup';

    // Auto-calculate EDD when LMP changes during pregnancy consultation
    useEffect(() => {
        if (mainConcern === 'Pregnancy Consultation' && value.lmpDate) {
            try {
                const lmp = new Date(value.lmpDate);
                if (!isNaN(lmp.getTime())) {
                    // Naegele's rule: LMP + 1 year - 3 months + 7 days = LMP + 280 days
                    const edd = new Date(lmp);
                    edd.setDate(edd.getDate() + 280);
                    const eddStr = edd.toISOString().split('T')[0];
                    
                    // Estimate Gestational Age in weeks
                    const today = new Date();
                    const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 3600 * 24));
                    const weeks = diffDays > 0 ? Math.floor(diffDays / 7) : 0;

                    if (value.eddDate !== eddStr || value.gestationalAgeWeeks !== weeks) {
                        onChange({
                            ...value,
                            eddDate: eddStr,
                            gestationalAgeWeeks: weeks
                        });
                    }
                }
            } catch (e) {
                console.warn('LMP calculation error', e);
            }
        }
    }, [value.lmpDate, mainConcern]);

    const handleConcernChange = (concern: GynecMainConcern) => {
        onChange({
            ...value,
            mainConcern: concern
        });
    };

    return (
        <div className="bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-blue-100/80 space-y-4 animate-fade-in">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Gynecology Front Desk Intake</h4>
                        <p className="text-[11px] text-gray-500">Select main concern to show relevant reception intake fields</p>
                    </div>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    Front Desk Mode
                </span>
            </div>

            {/* Main Concern Selector Pills */}
            <div>
                <label className="block text-xs font-bold text-gray-800 mb-2">
                    Main Concern / Reason for Visit <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {CONCERNS.map((c) => {
                        const Icon = c.icon;
                        const isSelected = mainConcern === c.value;
                        return (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => handleConcernChange(c.value)}
                                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                    isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/30'
                                        : 'bg-white hover:bg-blue-50/60 border-gray-200 text-gray-700'
                                }`}
                            >
                                <Icon size={16} className={`mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>{c.label}</p>
                                    <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{c.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* DYNAMIC CONCERN-SPECIFIC INTAKE FIELDS */}

            {/* 1. Menstrual Irregularity Intake */}
            {mainConcern === 'Menstrual Irregularity' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Activity size={14} className="text-blue-600" />
                        Menstrual Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Last Menstrual Period (LMP Date)</label>
                            <input
                                type="date"
                                value={value.lmpDate || ''}
                                onChange={(e) => onChange({ ...value, lmpDate: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Cycle Regularity</label>
                            <select
                                value={value.cycleRegularity || 'Irregular'}
                                onChange={(e) => onChange({ ...value, cycleRegularity: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Irregular">Irregular Cycles</option>
                                <option value="Regular">Regular Cycles</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Bleeding Flow Intensity</label>
                            <select
                                value={value.flowIntensity || 'Heavy'}
                                onChange={(e) => onChange({ ...value, flowIntensity: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Heavy">Heavy Flow</option>
                                <option value="Moderate">Moderate Flow</option>
                                <option value="Light">Light Flow / Spotting</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={value.hasClots || false}
                                    onChange={(e) => onChange({ ...value, hasClots: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                Passage of Blood Clots
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Pregnancy Consultation Intake */}
            {mainConcern === 'Pregnancy Consultation' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Heart size={14} className="text-blue-600" />
                        Pregnancy & Antenatal Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                                LMP Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={value.lmpDate || ''}
                                onChange={(e) => onChange({ ...value, lmpDate: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Calculated EDD (Auto)</label>
                            <input
                                type="date"
                                readOnly
                                value={value.eddDate || ''}
                                className="w-full px-3 py-1.5 text-xs bg-blue-50/50 border border-blue-200 text-blue-900 font-bold rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Gestational Age (Weeks)</label>
                            <input
                                type="number"
                                min={0}
                                max={42}
                                value={value.gestationalAgeWeeks ?? ''}
                                onChange={(e) => onChange({ ...value, gestationalAgeWeeks: parseInt(e.target.value, 10) || 0 })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 12"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Gravida (G)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={value.gravida ?? 1}
                                    onChange={(e) => onChange({ ...value, gravida: parseInt(e.target.value, 10) || 1 })}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Para (P)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={value.para ?? 0}
                                    onChange={(e) => onChange({ ...value, para: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Pelvic Pain / Infection Intake */}
            {mainConcern === 'Pelvic Pain / Infection' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-blue-600" />
                        Pelvic Pain & Infection Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">LMP Date</label>
                            <input
                                type="date"
                                value={value.lmpDate || ''}
                                onChange={(e) => onChange({ ...value, lmpDate: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Pain Severity Grade</label>
                            <select
                                value={value.painSeverity || 'Moderate'}
                                onChange={(e) => onChange({ ...value, painSeverity: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Mild">Mild / Dull Ache</option>
                                <option value="Moderate">Moderate Cramping</option>
                                <option value="Severe">Severe / Acute Pain</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={value.abnormalDischarge || false}
                                    onChange={(e) => onChange({ ...value, abnormalDischarge: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                Abnormal Vaginal Discharge
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Routine Checkup Intake */}
            {mainConcern === 'Routine Gynecology Checkup' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-600" />
                        Routine Gynec Checkup Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">LMP Date</label>
                            <input
                                type="date"
                                value={value.lmpDate || ''}
                                onChange={(e) => onChange({ ...value, lmpDate: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Routine Reason Summary</label>
                            <input
                                type="text"
                                placeholder="e.g. Annual well-woman checkup"
                                value={value.additionalNotes || ''}
                                onChange={(e) => onChange({ ...value, additionalNotes: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Contraceptive Counseling Intake */}
            {mainConcern === 'Contraceptive Counseling' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Shield size={14} className="text-blue-600" />
                        Contraceptive & Family Planning Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Method Used</label>
                            <select
                                value={value.currentContraceptiveMethod || 'None'}
                                onChange={(e) => onChange({ ...value, currentContraceptiveMethod: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="None">None</option>
                                <option value="Oral Contraceptive Pills (OCPs)">Oral Contraceptive Pills (OCPs)</option>
                                <option value="Intrauterine Device (IUD / Cu-T)">Intrauterine Device (IUD / Cu-T)</option>
                                <option value="Condoms / Barrier">Condoms / Barrier</option>
                                <option value="Injectable (Depo-Provera)">Injectable (Depo-Provera)</option>
                                <option value="Emergency Contraceptive">Emergency Contraceptive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Family Planning Goal</label>
                            <select
                                value={value.pregnancyPlanningGoal || 'Contraception / Delay'}
                                onChange={(e) => onChange({ ...value, pregnancyPlanningGoal: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Contraception / Delay">Seeking Contraception / Delaying Pregnancy</option>
                                <option value="Active Conception">Planning Active Conception</option>
                                <option value="Not Applicable">Not Applicable</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Routine Checkup Intake */}
            {mainConcern === 'Routine Gynecology Checkup' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-600" />
                        Routine Gynec Checkup Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">LMP Date</label>
                            <input
                                type="date"
                                value={value.lmpDate || ''}
                                onChange={(e) => onChange({ ...value, lmpDate: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Routine Reason Summary</label>
                            <input
                                type="text"
                                placeholder="e.g. Annual well-woman checkup"
                                value={value.additionalNotes || ''}
                                onChange={(e) => onChange({ ...value, additionalNotes: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Contraceptive Counseling Intake */}
            {mainConcern === 'Contraceptive Counseling' && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 animate-scale-in">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Shield size={14} className="text-blue-600" />
                        Contraceptive & Family Planning Intake Questions
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Method Used</label>
                            <select
                                value={value.currentContraceptiveMethod || 'None'}
                                onChange={(e) => onChange({ ...value, currentContraceptiveMethod: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="None">None</option>
                                <option value="Oral Contraceptive Pills (OCPs)">Oral Contraceptive Pills (OCPs)</option>
                                <option value="Intrauterine Device (IUD / Cu-T)">Intrauterine Device (IUD / Cu-T)</option>
                                <option value="Condoms / Barrier">Condoms / Barrier</option>
                                <option value="Injectable (Depo-Provera)">Injectable (Depo-Provera)</option>
                                <option value="Emergency Contraceptive">Emergency Contraceptive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Family Planning Goal</label>
                            <select
                                value={value.pregnancyPlanningGoal || 'Contraception / Delay'}
                                onChange={(e) => onChange({ ...value, pregnancyPlanningGoal: e.target.value as any })}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="Contraception / Delay">Seeking Contraception / Delaying Pregnancy</option>
                                <option value="Active Conception">Planning Active Conception</option>
                                <option value="Not Applicable">Not Applicable</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Front Desk Reception Notes */}
            <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Additional Reception Notes (Optional)</label>
                <input
                    type="text"
                    placeholder="e.g. Patient requested female doctor, brought external ultrasound scan report..."
                    value={value.additionalNotes || ''}
                    onChange={(e) => onChange({ ...value, additionalNotes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
            </div>
        </div>
    );
};
