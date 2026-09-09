import React, { useState } from 'react';
import { Save, CheckCircle2, FileText, Stethoscope, Clock, Pill, Calendar, AlertCircle } from 'lucide-react';
import { GynecCaseSheetData, Patient } from '../../types';
import { ChiefComplaintSection } from './ChiefComplaintSection';
import { MenstrualHistorySection } from './MenstrualHistorySection';
import { ObstetricHistorySection } from './ObstetricHistorySection';
import { CurrentPregnancySection } from './CurrentPregnancySection';
import { GynecologicalHistorySection } from './GynecologicalHistorySection';
import { SexualContraceptiveSection } from './SexualContraceptiveSection';
import { PelvicExaminationSection } from './PelvicExaminationSection';
import toast from 'react-hot-toast';

interface GynecCaseSheetProps {
    patient: Patient;
    onSave?: (data: GynecCaseSheetData) => void;
    onCompleteConsultation?: () => void;
}

export const GynecCaseSheet: React.FC<GynecCaseSheetProps> = ({ patient, onSave, onCompleteConsultation }) => {

    const [formState, setFormState] = useState<GynecCaseSheetData>({
        patientId: patient.id,
        chiefComplaint: {
            mainComplaint: 'Irregular periods',
            duration: '2 months',
            severity: 'Moderate'
        },
        menstrualHistory: {
            ageAtMenarche: 13,
            cycleRegularity: 'Irregular',
            cycleLengthDays: 35,
            bleedingDurationDays: 6,
            flowIntensity: 'Heavy',
            hasClots: true,
            menstrualPain: true,
            painSeverity: 'Moderate',
            menopauseStatus: 'Premenopausal'
        },
        obstetricHistory: {
            summary: { gravida: 1, para: 1, abortions: 0, living: 1, ectopic: 0 },
            pastPregnancies: [
                {
                    id: 'preg_1',
                    pregnancyNumber: 1,
                    year: '2022',
                    outcome: 'Full Term',
                    modeOfDelivery: 'Normal Vaginal',
                    babySex: 'Female',
                    birthWeightKg: '3.1 kg'
                }
            ]
        },
        currentPregnancy: {
            pregnancyStatus: 'Not Pregnant'
        },
        gynecologicalHistory: {
            conditions: {
                pcos: true
            },
            surgeries: {}
        },
        sexualContraceptiveHistory: {
            sexuallyActive: true,
            currentContraceptiveMethod: 'Barrier (Condoms)'
        },
        examination: {
            general: {
                generalCondition: 'Fair, conscious and oriented',
                pallor: false,
                icterus: false,
                edema: false
            },
            abdominal: {
                tenderness: false,
                abdominalMass: false,
                distension: false
            },
            pelvic: {
                examinationPerformed: false,
                consentObtained: false,
                chaperonePresent: false
            }
        },
        assessment: {
            primaryDiagnosis: 'Polycystic Ovarian Syndrome (PCOS)',
            diagnosisCode: 'E28.2',
            isNewDiagnosis: true,
            clinicalAssessmentNotes: 'Patient presents with irregular menstrual cycle (35-40 days) and menorrhagia. Known case of PCOS.'
        },
        treatmentPlan: {
            treatmentName: 'Hormonal regulation & lifestyle modification',
            description: 'Start low-dose oral contraceptive pills for 3 cycles and schedule pelvic ultrasound.',
            status: 'Planned'
        },
        advice: {
            medicationInstructions: 'Take 1 tablet daily at bedtime for 21 days starting from Day 5 of menstrual cycle.',
            lifestyleAdvice: '30 mins daily aerobic exercise, low glycemic index diet.',
            warningSigns: 'Severe abdominal pain, excessive heavy bleeding (>5 pads/day), sudden dizziness.'
        },
        followUp: {
            followUpRequired: true,
            followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            followUpReason: 'Review response to treatment & pelvic ultrasound reports'
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Visibility Logic based on Chief Complaint & Pregnancy Status
    const complaint = formState.chiefComplaint.mainComplaint;
    const pregStatus = formState.currentPregnancy.pregnancyStatus;

    const showMenstrualHistory = complaint.toLowerCase().includes('period') ||
        complaint.toLowerCase().includes('bleeding') ||
        complaint.toLowerCase().includes('pcos') ||
        complaint.toLowerCase().includes('menopause') ||
        complaint.toLowerCase().includes('check-up') ||
        complaint.toLowerCase().includes('other');

    const showCurrentPregnancy = pregStatus !== 'Not Pregnant' ||
        complaint.toLowerCase().includes('pregnancy') ||
        complaint.toLowerCase().includes('infertility');

    const handleSaveDraft = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            if (onSave) onSave(formState);
            toast.success('Gynecology consultation draft saved successfully!');
        }, 500);
    };

    const handleCompleteConsultation = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            if (onSave) onSave(formState);
            if (onCompleteConsultation) onCompleteConsultation();
            toast.success('Gynecology consultation completed!');
        }, 600);
    };

    return (
        <div className="space-y-6 pb-4">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wide">
                            Gynecology Specialty Module
                        </span>
                        <span className="text-xs text-pink-100 font-medium">UHID: {patient.uhid}</span>
                    </div>
                    <h2 className="text-xl font-bold mt-1">{patient.fullname} - Clinical Case Sheet</h2>
                    <p className="text-xs text-pink-100 mt-0.5">
                        Age: {patient.age || 'N/A'} • Gender: Female • Phone: {patient.phone}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-semibold transition-all border border-white/20"
                    >
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        type="button"
                        onClick={handleCompleteConsultation}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-pink-700 hover:bg-pink-50 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                        <CheckCircle2 className="w-4 h-4 text-pink-600" />
                        Complete Consultation
                    </button>
                </div>
            </div>

            {/* Dynamic Trigger Summary Nav Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-pink-50/60 p-2.5 rounded-xl border border-pink-100 text-xs">
                <span className="font-semibold text-gray-700 px-2">Active Clinical Sections:</span>
                <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                    ✓ Chief Complaint
                </span>
                {showMenstrualHistory && (
                    <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                        ✓ Menstrual History
                    </span>
                )}
                <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                    ✓ Obstetric History (GPAL)
                </span>
                {showCurrentPregnancy && (
                    <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                        ✓ Current Pregnancy Tracker
                    </span>
                )}
                <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                    ✓ Gynecological History
                </span>
                <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                    ✓ Sexual & Contraceptive
                </span>
                <span className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 rounded-lg font-medium shadow-2xs">
                    ✓ Pelvic Exam
                </span>
            </div>

            {/* 1. Chief Complaint Section */}
            <ChiefComplaintSection
                data={formState.chiefComplaint}
                onChange={(updated) => setFormState({ ...formState, chiefComplaint: updated })}
            />

            {/* 2. Menstrual History Section (Conditional) */}
            {showMenstrualHistory && (
                <MenstrualHistorySection
                    data={formState.menstrualHistory}
                    onChange={(updated) => setFormState({ ...formState, menstrualHistory: updated })}
                />
            )}

            {/* 3. Obstetric History (GPAL) */}
            <ObstetricHistorySection
                summary={formState.obstetricHistory.summary}
                pastPregnancies={formState.obstetricHistory.pastPregnancies}
                onSummaryChange={(updated) => setFormState({
                    ...formState,
                    obstetricHistory: { ...formState.obstetricHistory, summary: updated }
                })}
                onPastPregnanciesChange={(updated) => setFormState({
                    ...formState,
                    obstetricHistory: { ...formState.obstetricHistory, pastPregnancies: updated }
                })}
            />

            {/* 4. Current Pregnancy Tracker (Conditional) */}
            {showCurrentPregnancy && (
                <CurrentPregnancySection
                    data={formState.currentPregnancy}
                    onChange={(updated) => setFormState({ ...formState, currentPregnancy: updated })}
                />
            )}

            {/* 5. Gynecological History & Surgeries */}
            <GynecologicalHistorySection
                data={formState.gynecologicalHistory}
                onChange={(updated) => setFormState({ ...formState, gynecologicalHistory: updated })}
            />

            {/* 6. Sexual & Contraceptive History */}
            <SexualContraceptiveSection
                data={formState.sexualContraceptiveHistory}
                onChange={(updated) => setFormState({ ...formState, sexualContraceptiveHistory: updated })}
            />

            {/* 7. Pelvic Examination Section */}
            <PelvicExaminationSection
                data={formState.examination.pelvic}
                onChange={(updated) => setFormState({
                    ...formState,
                    examination: { ...formState.examination, pelvic: updated }
                })}
            />

            {/* 8. Assessment & Diagnosis */}
            <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Diagnosis & Clinical Assessment</h3>
                        <p className="text-xs text-gray-500">Record primary/secondary diagnosis and ICD classification codes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Diagnosis <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Polycystic Ovarian Syndrome (PCOS), Endometriosis..."
                            value={formState.assessment.primaryDiagnosis || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                assessment: { ...formState.assessment, primaryDiagnosis: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">ICD Code / Diagnosis Code</label>
                        <input
                            type="text"
                            placeholder="e.g. E28.2, N80.0"
                            value={formState.assessment.diagnosisCode || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                assessment: { ...formState.assessment, diagnosisCode: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Assessment Notes</label>
                    <textarea
                        rows={3}
                        placeholder="Detail clinical evaluation, differential diagnosis, and assessment findings..."
                        value={formState.assessment.clinicalAssessmentNotes || ''}
                        onChange={(e) => setFormState({
                            ...formState,
                            assessment: { ...formState.assessment, clinicalAssessmentNotes: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                </div>
            </div>

            {/* 9. Advice & Follow-Up */}
            <div className="bg-white p-5 rounded-xl border border-pink-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Patient Advice & Follow-Up Plan</h3>
                        <p className="text-xs text-gray-500">Specify lifestyle/medication advice, warning signs, and follow-up timeline</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Medication & Dietary Advice</label>
                        <textarea
                            rows={2}
                            placeholder="Dosage advice, dietary restrictions..."
                            value={formState.advice.medicationInstructions || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                advice: { ...formState.advice, medicationInstructions: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Red Flag / Warning Symptoms</label>
                        <textarea
                            rows={2}
                            placeholder="When to seek immediate emergency care..."
                            value={formState.advice.warningSigns || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                advice: { ...formState.advice, warningSigns: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formState.followUp.followUpRequired}
                            onChange={(e) => setFormState({
                                ...formState,
                                followUp: { ...formState.followUp, followUpRequired: e.target.checked }
                            })}
                            className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                        />
                        <span className="text-xs font-semibold text-gray-800">Follow-Up Required</span>
                    </label>

                    {formState.followUp.followUpRequired && (
                        <>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-600 mb-1">Follow-Up Date</label>
                                <input
                                    type="date"
                                    value={formState.followUp.followUpDate || ''}
                                    onChange={(e) => setFormState({
                                        ...formState,
                                        followUp: { ...formState.followUp, followUpDate: e.target.value }
                                    })}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-600 mb-1">Reason / Investigations to Bring</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bring pelvic ultrasound report"
                                    value={formState.followUp.followUpReason || ''}
                                    onChange={(e) => setFormState({
                                        ...formState,
                                        followUp: { ...formState.followUp, followUpReason: e.target.value }
                                    })}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3.5 flex items-center justify-end gap-3 z-20 shadow-lg mt-6 rounded-b-xl">
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-all border border-gray-300 flex items-center gap-1.5"
                >
                    <Save className="w-4 h-4 text-gray-600" />
                    Save Draft
                </button>
                <button
                    type="button"
                    onClick={handleCompleteConsultation}
                    disabled={isSaving}
                    className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    Complete Gynecology Consultation
                </button>
            </div>
        </div>
    );
};
