import React from 'react';
import { PelvicExamination } from '../../../types';
import { Stethoscope, ShieldCheck, AlertCircle, Lock } from 'lucide-react';

interface PelvicExaminationSectionProps {
    data: PelvicExamination;
    onChange: (updated: PelvicExamination) => void;
}

export const PelvicExaminationSection: React.FC<PelvicExaminationSectionProps> = ({ data, onChange }) => {
    const isUnlocked = data.consentObtained && data.chaperonePresent;

    return (
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Pelvic & Physical Examination</h3>
                        <p className="text-xs text-gray-500">Requires mandatory patient consent and chaperone verification prior to examination</p>
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.examinationPerformed}
                        onChange={(e) => onChange({ ...data, examinationPerformed: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-gray-800">Pelvic Exam Performed</span>
                </label>
            </div>

            {data.examinationPerformed && (
                <div className="space-y-4 pt-1">
                    {/* Safety Verification Box */}
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Mandatory Patient Safety & Ethical Protocol Verification
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                data.consentObtained ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-medium' : 'border-amber-300 bg-white text-gray-700'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={data.consentObtained}
                                    onChange={(e) => onChange({ ...data, consentObtained: e.target.checked })}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span>1. Patient Consent Obtained <span className="text-rose-500">*</span></span>
                            </label>

                            <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                data.chaperonePresent ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-medium' : 'border-amber-300 bg-white text-gray-700'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={data.chaperonePresent}
                                    onChange={(e) => onChange({ ...data, chaperonePresent: e.target.checked })}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span>2. Chaperone Present <span className="text-rose-500">*</span></span>
                            </label>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Chaperone Name / Staff ID"
                                    value={data.chaperoneName || ''}
                                    onChange={(e) => onChange({ ...data, chaperoneName: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {!isUnlocked && (
                            <div className="flex items-center gap-2 text-[11px] text-amber-800 pt-1 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                Please confirm both Patient Consent and Chaperone presence to unlock the pelvic examination fields below.
                            </div>
                        )}
                    </div>

                    {/* Examination Fields (Locked if safety protocol not met) */}
                    <div className={`space-y-4 transition-all ${!isUnlocked ? 'opacity-50 pointer-events-none filter blur-[0.3px]' : ''}`}>
                        {!isUnlocked && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200">
                                <Lock className="w-4 h-4 text-gray-500" />
                                Pelvic Examination Inputs Locked (Safety Verification Pending)
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">External Genitalia Inspection</label>
                                <textarea
                                    rows={2}
                                    placeholder="Vulva, labia, perineum findings, lesions, discharge..."
                                    value={data.externalExamFindings || ''}
                                    onChange={(e) => onChange({ ...data, externalExamFindings: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Speculum / Vaginal Exam</label>
                                <textarea
                                    rows={2}
                                    placeholder="Vaginal walls, mucosa, cystocele, rectocele..."
                                    value={data.vaginalFindings || ''}
                                    onChange={(e) => onChange({ ...data, vaginalFindings: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Cervical Examination</label>
                                <textarea
                                    rows={2}
                                    placeholder="Cervical os (open/closed), erosion, polyp, motion tenderness..."
                                    value={data.cervicalFindings || ''}
                                    onChange={(e) => onChange({ ...data, cervicalFindings: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Discharge & Bleeding Details</label>
                                <textarea
                                    rows={2}
                                    placeholder="Character of discharge (white, curd-like, foul-smelling), active bleeding..."
                                    value={data.dischargeDetails || ''}
                                    onChange={(e) => onChange({ ...data, dischargeDetails: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Bimanual Exam - Tenderness & Fornices</label>
                                <input
                                    type="text"
                                    placeholder="Uterine size, tenderness, forniceal fullness..."
                                    value={data.tendernessDetails || ''}
                                    onChange={(e) => onChange({ ...data, tendernessDetails: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Adnexal / Pelvic Mass Findings</label>
                                <input
                                    type="text"
                                    placeholder="Adnexal mass size, mobility, side (right/left)..."
                                    value={data.massDetails || ''}
                                    onChange={(e) => onChange({ ...data, massDetails: e.target.value })}
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
