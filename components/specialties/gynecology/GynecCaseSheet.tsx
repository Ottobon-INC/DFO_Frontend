import React, { useState, useEffect } from 'react';
import { Patient, GynecCaseSheetData } from '../../../types';
import { getGynecRecord, saveGynecRecord } from '../../../services/mockGynecStore';
import { ChiefComplaintSection } from './ChiefComplaintSection';
import { CurrentPregnancySection } from './CurrentPregnancySection';
import { MenstrualHistorySection } from './MenstrualHistorySection';
import { ObstetricHistorySection } from './ObstetricHistorySection';
import { GynecologicalHistorySection } from './GynecologicalHistorySection';
import { SexualContraceptiveSection } from './SexualContraceptiveSection';
import { PelvicExaminationSection } from './PelvicExaminationSection';
import { DigitalPrescriptionModal, PrescriptionData } from '../../DigitalPrescriptionModal';
import { Activity, Calendar, FileText, CheckCircle2, Save, Sparkles, Pill, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface GynecCaseSheetProps {
    patient: Patient;
    appointmentId?: string;
    onCompleteConsultation?: () => void;
}

export const GynecCaseSheet: React.FC<GynecCaseSheetProps> = ({
    patient,
    appointmentId,
    onCompleteConsultation
}) => {
    const [formState, setFormState] = useState<GynecCaseSheetData>(() =>
        getGynecRecord(patient.id, appointmentId)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

    useEffect(() => {
        const loaded = getGynecRecord(patient.id, appointmentId);
        setFormState(loaded);
    }, [patient.id, appointmentId]);

    const handleSaveDraft = () => {
        setIsSaving(true);
        try {
            saveGynecRecord(patient.id, appointmentId, formState);
            toast.success('Gynecology Case Sheet saved as draft!');
        } catch (e) {
            console.error('Failed to save gynec draft', e);
            toast.error('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCompleteConsultation = () => {
        setIsSaving(true);
        try {
            saveGynecRecord(patient.id, appointmentId, formState);
            toast.success('Gynecology Consultation completed successfully!');
            if (onCompleteConsultation) {
                onCompleteConsultation();
            }
        } catch (e) {
            console.error('Failed to complete consultation', e);
            toast.error('Error completing consultation');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrescriptionSave = (pData: PrescriptionData) => {
        toast.success(`Digital prescription generated for ${pData.medications.length} medication(s)`);
        setIsPrescriptionModalOpen(false);
    };

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-brand-primary via-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-100">
                            Gynecology OPD Consultation
                        </span>
                        {formState.intake?.mainConcern && (
                            <span className="px-2.5 py-0.5 bg-yellow-300 text-gray-900 font-extrabold rounded-full text-[11px]">
                                Intake: {formState.intake.mainConcern}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-black mt-1 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-blue-200 fill-blue-200" />
                        Gynecological Clinical Case Sheet
                    </h2>
                    <p className="text-xs text-blue-100 mt-0.5">
                        Patient: <strong className="text-white">{patient.name}</strong> | ID: {patient.uhid || patient.id}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsPrescriptionModalOpen(true)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                    >
                        <Pill size={15} />
                        Prescribe Rx
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <Save size={15} />
                        Save Draft
                    </button>
                </div>
            </div>

            {/* Front Desk Intake Summary Card (If Present) */}
            {formState.intake && (
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={14} className="text-blue-600" />
                            Reception / Front Desk Intake Data
                        </span>
                        <span className="text-[10px] text-blue-700 font-semibold">Prefilled into Clinical Record</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                            <span className="text-gray-500 text-[11px] block">Main Concern:</span>
                            <span className="font-bold text-gray-900">{formState.intake.mainConcern}</span>
                        </div>
                        {formState.intake.lmpDate && (
                            <div>
                                <span className="text-gray-500 text-[11px] block">LMP Date:</span>
                                <span className="font-bold text-gray-900">{formState.intake.lmpDate}</span>
                            </div>
                        )}
                        {formState.intake.eddDate && (
                            <div>
                                <span className="text-gray-500 text-[11px] block">Calculated EDD:</span>
                                <span className="font-bold text-blue-700">{formState.intake.eddDate}</span>
                            </div>
                        )}
                        {formState.intake.currentContraceptiveMethod && (
                            <div>
                                <span className="text-gray-500 text-[11px] block">Contraceptive Method:</span>
                                <span className="font-bold text-gray-900">{formState.intake.currentContraceptiveMethod}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 1. Chief Complaint Section */}
            <ChiefComplaintSection
                data={formState.chiefComplaint}
                onChange={(updated) => setFormState({ ...formState, chiefComplaint: updated })}
            />

            {/* 2. Current Pregnancy Status Section */}
            <CurrentPregnancySection
                data={formState.currentPregnancy}
                onChange={(updated) => setFormState({ ...formState, currentPregnancy: updated })}
            />

            {/* 3. Menstrual History Section */}
            <MenstrualHistorySection
                data={formState.menstrualHistory}
                onChange={(updated) => setFormState({ ...formState, menstrualHistory: updated })}
            />

            {/* 4. Obstetric History Section */}
            <ObstetricHistorySection
                summary={formState.obstetricHistory.summary}
                pastPregnancies={formState.obstetricHistory.pastPregnancies}
                onChangeSummary={(summary) => setFormState({
                    ...formState,
                    obstetricHistory: { ...formState.obstetricHistory, summary }
                })}
                onChangePregnancies={(pastPregnancies) => setFormState({
                    ...formState,
                    obstetricHistory: { ...formState.obstetricHistory, pastPregnancies }
                })}
            />

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

            {/* 8. Assessment & Clinical Diagnosis */}
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Clinical Assessment & Diagnosis</h3>
                        <p className="text-xs text-gray-500">Record primary diagnosis, ICD-10 coding, and clinical reasoning</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Primary Diagnosis <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Polycystic Ovarian Syndrome (PCOS), Fibroid Uterus, Abnormal Uterine Bleeding..."
                            value={formState.assessment.primaryDiagnosis || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                assessment: { ...formState.assessment, primaryDiagnosis: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">ICD Code / Diagnosis Code</label>
                        <input
                            type="text"
                            placeholder="e.g. E28.2 (PCOS), N92.0 (Menorrhagia), N80.0 (Endometriosis)"
                            value={formState.assessment.diagnosisCode || ''}
                            onChange={(e) => setFormState({
                                ...formState,
                                assessment: { ...formState.assessment, diagnosisCode: e.target.value }
                            })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* 9. Advice & Follow-Up */}
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
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
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
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
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3.5 flex items-center justify-end gap-3 z-20 shadow-lg rounded-b-xl">
                <button
                    type="button"
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-all border border-blue-200 flex items-center gap-1.5"
                >
                    <Pill className="w-4 h-4 text-blue-600" />
                    Digital Prescription
                </button>

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
                    className="px-6 py-2 bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    Complete Gynecology Consultation
                </button>
            </div>

            {/* Digital Prescription Modal Integration */}
            {isPrescriptionModalOpen && (
                <DigitalPrescriptionModal
                    isOpen={isPrescriptionModalOpen}
                    onClose={() => setIsPrescriptionModalOpen(false)}
                    onSave={handlePrescriptionSave}
                    patient={patient}
                    initialDiagnosis={formState.assessment.primaryDiagnosis}
                />
            )}
        </div>
    );
};
