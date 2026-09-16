import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Pill, Plus, Trash2, Minus, Save, Loader2, Stethoscope, Activity, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MedicationItem {
    medication_name: string;
    dosage: string;
    frequency: number;
    quantity: string;
    duration_days: number;
    special_instructions?: string;
}

interface UnifiedConsultationPadProps {
    patientId: string;
    userRole?: string;
    existingNote?: string;
    historyNotes?: any[];
    onSaveComplete?: () => void;
    onConsultationComplete?: () => void;
}

// ── Draft Autosave Hook ────────────────────────────────────────────────────────

const DRAFT_KEY_PREFIX = 'consultation_draft_';

function useDraftSave(patientId: string) {
    const key = DRAFT_KEY_PREFIX + patientId;

    const loadDraft = useCallback(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch { /* ignore corrupted data */ }
        return null;
    }, [key]);

    const saveDraft = useCallback((data: { chiefComplaint: string; diagnosis: string; clinicalNotes: string; medications: MedicationItem[]; followUpDate: string; followUpReason: string }) => {
        try {
            localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
        } catch { /* storage full — fail silently */ }
    }, [key]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(key);
    }, [key]);

    return { loadDraft, saveDraft, clearDraft };
}

// ── Empty Medication Factory ───────────────────────────────────────────────────

const emptyMedication = (): MedicationItem => ({
    medication_name: '',
    dosage: '',
    frequency: 2,
    quantity: '',
    duration_days: 1,
    special_instructions: '',
});

// ── Component ──────────────────────────────────────────────────────────────────

export const UnifiedConsultationPad: React.FC<UnifiedConsultationPadProps> = ({
    patientId,
    userRole,
    existingNote = '',
    historyNotes = [],
    onSaveComplete,
    onConsultationComplete,
}) => {
    const isDoctorRole = userRole === 'Doctor' || userRole === 'Admin' || userRole === 'doctor' || userRole === 'admin';
    const { loadDraft, saveDraft, clearDraft } = useDraftSave(patientId);

    // ── State ──────────────────────────────────────────────────────────────────
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState(existingNote);
    const [medications, setMedications] = useState<MedicationItem[]>([emptyMedication()]);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpReason, setFollowUpReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);

    // ── Restore Draft on Mount ─────────────────────────────────────────────────
    useEffect(() => {
        const draft = loadDraft();
        if (draft) {
            setChiefComplaint(draft.chiefComplaint || '');
            setDiagnosis(draft.diagnosis || '');
            setClinicalNotes(draft.clinicalNotes || '');
            if (draft.medications?.length > 0) setMedications(draft.medications);
            setFollowUpDate(draft.followUpDate || '');
            setFollowUpReason(draft.followUpReason || '');
            setDraftRestored(true);
        }
    }, [loadDraft]);

    // ── Autosave Draft on Change (debounced) ───────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            const hasContent = chiefComplaint || diagnosis || clinicalNotes || medications.some(m => m.medication_name) || followUpDate;
            if (hasContent) {
                saveDraft({ chiefComplaint, diagnosis, clinicalNotes, medications, followUpDate, followUpReason });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [chiefComplaint, diagnosis, clinicalNotes, medications, saveDraft]);

    // ── Medication Handlers ────────────────────────────────────────────────────
    const handleMedicationChange = (index: number, field: keyof MedicationItem, value: any) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const addMedication = () => setMedications([...medications, emptyMedication()]);
    const removeMedication = (index: number) => {
        if (medications.length === 1) return;
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleDateChipClick = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        setFollowUpDate(d.toISOString().split('T')[0]);
    };

    // ── Unified Save Handler ───────────────────────────────────────────────────
    const handleCompleteConsultation = async () => {
        const hasMeds = medications.some(m => m.medication_name && m.dosage);
        const hasNotes = chiefComplaint || diagnosis || clinicalNotes;

        if (!hasNotes && !hasMeds) {
            toast.error('Please add clinical notes or medications before saving.');
            return;
        }

        setIsSaving(true);
        try {
            // Build the full clinical note text
            const noteLines: string[] = [];
            if (chiefComplaint) noteLines.push(`Reason for Visit: ${chiefComplaint}`);
            if (diagnosis) noteLines.push(`Diagnosis: ${diagnosis}`);
            if (clinicalNotes) noteLines.push(`\nClinical Notes:\n${clinicalNotes}`);
            const fullNote = noteLines.join('\n');

            // Save clinical note
            if (fullNote.trim()) {
                await api.saveClinicalNote(patientId, fullNote);
            }

            // Save prescription if medications exist
            const validMeds = medications.filter(m => m.medication_name && m.dosage);
            if (validMeds.length > 0) {
                await api.addPrescription({
                    patient_id: patientId,
                    clinical_notes: fullNote.trim(),
                    medications: validMeds,
                });
            }

            // Save follow-up if selected
            if (followUpDate) {
                try {
                    // Try to get doctor_id from user object (assume login provides user id)
                    const userStr = localStorage.getItem('user');
                    let doctorId = '';
                    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
                        const user = JSON.parse(userStr);
                        if (user && user.id) doctorId = user.id;
                    }

                    await api.createFollowUp({
                        patient_id: patientId,
                        doctor_id: doctorId,
                        follow_up_date: followUpDate,
                        reason: followUpReason
                    });
                } catch (err) {
                    console.error("Failed to save follow up", err);
                    toast.error("Consultation saved, but failed to save Follow-Up.");
                }
            }

            clearDraft();
            toast.success('Consultation saved & prescription generated!');
            onSaveComplete?.();
            onConsultationComplete?.();
        } catch (error: any) {
            console.error('Failed to complete consultation:', error);
            toast.error(error?.message || 'Failed to save consultation. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Draft Restored Banner */}
            {draftRestored && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium animate-in fade-in duration-300">
                    <AlertCircle size={14} />
                    <span>Unsaved draft restored from your last session.</span>
                    <button
                        onClick={() => {
                            clearDraft();
                            setChiefComplaint('');
                            setDiagnosis('');
                            setClinicalNotes('');
                            setMedications([emptyMedication()]);
                            setFollowUpDate('');
                            setFollowUpReason('');
                            setDraftRestored(false);
                        }}
                        className="ml-auto text-amber-600 hover:text-amber-800 font-bold underline"
                    >
                        Discard Draft
                    </button>
                </div>
            )}

            {/* ═══════════════════ CLINICAL NOTES SECTION (TOP) ═══════════════════ */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="bg-brand-primary/5 border-b border-brand-primary/20 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-sm">
                            <Stethoscope size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-textPrimary text-base">Clinical Notes</h3>
                            <p className="text-xs text-brand-textSecondary">Record the patient's chief complaint, diagnosis, and your clinical observations</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Chief Complaint */}
                    <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                            Reason for Visit
                        </label>
                        <textarea
                            value={chiefComplaint}
                            onChange={(e) => setChiefComplaint(e.target.value)}
                            placeholder="Why is the patient here? e.g. Fever for 3 days, cough, headache..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-bg resize-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Diagnosis */}
                    <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                            Diagnosis
                        </label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Your clinical diagnosis e.g. Acute Upper Respiratory Tract Infection, Viral Fever..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-bg resize-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Clinical Notes / Observations */}
                    <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                            Clinical Observations / Examination Findings
                        </label>
                        <textarea
                            value={clinicalNotes}
                            onChange={(e) => setClinicalNotes(e.target.value)}
                            placeholder="Detailed clinical observations, vitals, examination findings, treatment plan notes..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-bg resize-none leading-relaxed placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* ═══════════════════ MEDICATIONS SECTION (BELOW) ═══════════════════ */}
            <div className={`bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden ${!isDoctorRole ? 'opacity-60 pointer-events-none' : ''}`}>
                {/* Section Header */}
                <div className="bg-brand-primary/5 border-b border-brand-primary/20 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-sm">
                                <Pill size={20} className="text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-textPrimary text-base">Prescribed Medications</h3>
                                <p className="text-xs text-brand-textSecondary">
                                    {isDoctorRole ? 'Add medications below — a prescription PDF will be generated automatically' : 'Only doctors can prescribe medications'}
                                </p>
                            </div>
                        </div>
                        {!isDoctorRole && (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 shadow-sm">
                                🔒 DOCTOR ONLY
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {medications.map((med, index) => (
                        <div key={index} className="bg-brand-bg border border-brand-border rounded-xl p-4 relative">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-brand-border/50">
                                <h4 className="font-bold text-brand-primary flex items-center text-xs">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[11px] font-bold mr-2 border border-brand-primary/20">
                                        {index + 1}
                                    </div>
                                    Medication #{index + 1}
                                </h4>
                                {medications.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex items-center text-xs font-semibold"
                                    >
                                        <Trash2 size={13} className="mr-1" /> Remove
                                    </button>
                                )}
                            </div>

                            {/* Row 1: Name */}
                            <div className="mb-3">
                                <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                    Medication Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={med.medication_name}
                                    onChange={(e) => handleMedicationChange(index, 'medication_name', e.target.value)}
                                    placeholder="e.g. Paracetamol 500mg"
                                    className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                />
                            </div>

                            {/* Row 2: Dosage + Quantity */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                        Dosage / How to Take <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={med.dosage}
                                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                        placeholder="e.g. 1 tablet, 500mg, 5ml"
                                        className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={med.quantity}
                                        onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                                        placeholder="e.g. 15 tablets"
                                        className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Frequency + Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div className="min-w-0">
                                    <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                        Frequency (times/day) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center h-[38px] border border-brand-border rounded-lg overflow-hidden bg-brand-surface w-full">
                                        <button
                                            type="button"
                                            onClick={() => handleMedicationChange(index, 'frequency', Math.max(1, med.frequency - 1))}
                                            className="px-3 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border-r border-brand-border flex items-center shrink-0"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="flex-1 text-center font-semibold text-brand-textPrimary text-xs truncate">
                                            {med.frequency}x / day
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleMedicationChange(index, 'frequency', Math.min(10, med.frequency + 1))}
                                            className="px-3 h-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border-l border-brand-border flex items-center shrink-0"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                        Duration (days) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={med.duration_days}
                                        onChange={(e) => handleMedicationChange(index, 'duration_days', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Special Instructions */}
                            <div>
                                <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                                    Special Instructions (Optional)
                                </label>
                                <textarea
                                    value={med.special_instructions || ''}
                                    onChange={(e) => handleMedicationChange(index, 'special_instructions', e.target.value)}
                                    placeholder="e.g. Take after meals"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface resize-none"
                                />
                            </div>
                        </div>
                    ))}

                    {/* Add Medication Button */}
                    {isDoctorRole && (
                        <button
                            type="button"
                            onClick={addMedication}
                            className="w-full py-3 border-2 border-dashed border-brand-primary/30 text-brand-primary font-bold rounded-xl hover:bg-brand-primary/5 hover:border-brand-primary transition-all flex items-center justify-center text-xs"
                        >
                            <Plus size={16} className="mr-2" /> Add Another Medication
                        </button>
                    )}
                </div>
            </div>

            {/* ═══════════════════ FOLLOW-UP SECTION ═══════════════════ */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden">
                <div className="bg-blue-500/5 border-b border-blue-500/20 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm">
                            <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-brand-textPrimary">Schedule Follow-up</h2>
                            <p className="text-[11px] text-brand-textSecondary mt-0.5">When should the patient return?</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                <button type="button" onClick={() => handleDateChipClick(3)} className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded">3 Days</button>
                                <button type="button" onClick={() => handleDateChipClick(7)} className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded">1 Week</button>
                                <button type="button" onClick={() => handleDateChipClick(14)} className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded">2 Weeks</button>
                                <button type="button" onClick={() => handleDateChipClick(30)} className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded">1 Month</button>
                            </div>
                        </div>
                        <div className="flex-2 w-full sm:w-auto">
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider mb-2">
                                Reason / Notes
                            </label>
                            <input
                                type="text"
                                value={followUpReason}
                                onChange={(e) => setFollowUpReason(e.target.value)}
                                placeholder="e.g. Review blood test results"
                                className="w-full px-3 py-2 rounded-lg border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                            />
                        </div>
                        {followUpDate && (
                            <button type="button" onClick={() => { setFollowUpDate(''); setFollowUpReason(''); }} className="mb-2 sm:mb-0 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════ ACTION BAR ═══════════════════ */}
            <div className="flex items-center justify-between bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
                <p className="text-[11px] text-brand-textSecondary">
                    {isDoctorRole
                        ? '📋 Notes and prescriptions will be saved together & a PDF will be generated'
                        : '📝 Only clinical notes will be saved (medications require doctor access)'}
                </p>
                <button
                    onClick={handleCompleteConsultation}
                    disabled={isSaving}
                    className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2 shadow-lg active:scale-[0.97] ${
                        isSaving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-brand-primary hover:bg-brand-secondary shadow-brand-primary/20 hover:shadow-brand-primary/30'
                    }`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} /> Complete & Save Consultation
                        </>
                    )}
                </button>
            </div>

            {/* ═══════════════════ PAST HISTORY ═══════════════════ */}
            {historyNotes.length > 0 && (
                <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
                    <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center text-sm">
                        <Activity size={16} className="mr-2 text-brand-primary" /> Past Consultation History
                    </h3>
                    <div className="space-y-3">
                        {historyNotes.map((note: any, idx: number) => (
                            <div key={note.id || idx} className="p-4 border border-brand-border rounded-xl bg-brand-bg/50">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold text-brand-textPrimary">{note.doctor_name || 'Doctor'}</p>
                                    <span className="text-[10px] text-brand-textSecondary">
                                        {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Unknown Date'}
                                    </span>
                                </div>
                                <p className="text-xs text-brand-textSecondary whitespace-pre-line">
                                    {note.note || note.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
