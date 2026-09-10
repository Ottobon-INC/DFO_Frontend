import { GynecCaseSheetData, GynecIntakeData } from '../types';

/**
 * Appointment-Aware In-Memory Mock Store for Gynecology Records.
 * Mirrors the exact signature of future backend APIs.
 * Keyed by: `${patientId}_${appointmentId}` (or fallback to `patientId` if appointmentId is omitted).
 */

const STORAGE_KEY = 'dfo_gynec_mock_records';

function getStore(): Record<string, GynecCaseSheetData> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveStore(store: Record<string, GynecCaseSheetData>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
        console.warn('Failed to save mock gynec store', e);
    }
}

function buildKey(patientId: string, appointmentId?: string): string {
    if (appointmentId && appointmentId.trim()) {
        return `${patientId.trim()}_${appointmentId.trim()}`;
    }
    return patientId.trim();
}

/**
 * Creates default initial data structure for a new Gynecology Case Sheet.
 */
export function getDefaultGynecRecord(patientId: string, appointmentId?: string, intake?: GynecIntakeData): GynecCaseSheetData {
    return {
        patientId,
        appointmentId,
        intake: intake || {
            mainConcern: 'Routine Gynecology Checkup',
            lmpDate: ''
        },
        chiefComplaint: {
            mainComplaint: intake?.mainConcern || 'Routine Gynecology Checkup',
            duration: '',
            severity: 'Moderate',
            additionalComplaints: [],
            briefDescription: intake?.additionalNotes || ''
        },
        menstrualHistory: {
            lmpDate: intake?.lmpDate || '',
            cycleRegularity: intake?.cycleRegularity || 'Regular',
            flowIntensity: intake?.flowIntensity || 'Moderate',
            hasClots: intake?.hasClots || false,
            painSeverity: intake?.painSeverity || 'Mild'
        },
        obstetricHistory: {
            summary: {
                gravida: intake?.gravida ?? 0,
                para: intake?.para ?? 0,
                abortions: 0,
                living: intake?.para ?? 0
            },
            pastPregnancies: []
        },
        currentPregnancy: {
            pregnancyStatus: intake?.mainConcern === 'Pregnancy Consultation' ? 'Confirmed' : 'Not Pregnant',
            lmpDate: intake?.lmpDate || '',
            eddDate: intake?.eddDate || '',
            gestationalAgeWeeks: intake?.gestationalAgeWeeks || 0,
            currentSymptoms: []
        },
        gynecologicalHistory: {
            conditions: {},
            surgeries: {}
        },
        sexualContraceptiveHistory: {
            currentContraceptiveMethod: intake?.currentContraceptiveMethod || '',
            planningPregnancy: intake?.pregnancyPlanningGoal === 'Active Conception'
        },
        examination: {
            general: { generalCondition: 'Good', pallor: false, icterus: false, edema: false },
            abdominal: { tenderness: false, abdominalMass: false, distension: false },
            pelvic: { examinationPerformed: false, consentObtained: false, chaperonePresent: true }
        },
        assessment: {
            primaryDiagnosis: '',
            diagnosisCode: '',
            clinicalAssessmentNotes: ''
        },
        advice: {
            medicationInstructions: '',
            warningSigns: 'Return immediately if severe lower abdominal pain, heavy vaginal bleeding, high fever, or foul discharge occurs.',
            lifestyleAdvice: ''
        },
        followUp: {
            followUpRequired: false,
            followUpDate: '',
            followUpReason: ''
        }
    };
}

/**
 * Retrieves a mock Gynecology record for a specific patient and appointment.
 * If no specific record exists for (patientId, appointmentId), falls back to the latest patient record.
 */
export function getGynecRecord(patientId: string, appointmentId?: string): GynecCaseSheetData {
    const store = getStore();
    const specificKey = buildKey(patientId, appointmentId);

    if (store[specificKey]) {
        return store[specificKey];
    }

    // Fallback: look for generic patientId key
    if (store[patientId]) {
        return {
            ...store[patientId],
            appointmentId: appointmentId || store[patientId].appointmentId
        };
    }

    return getDefaultGynecRecord(patientId, appointmentId);
}

/**
 * Persists/updates a mock Gynecology record for a specific patient and appointment.
 */
export function saveGynecRecord(patientId: string, appointmentId: string | undefined, data: GynecCaseSheetData): GynecCaseSheetData {
    const store = getStore();
    const specificKey = buildKey(patientId, appointmentId);
    
    const updatedRecord: GynecCaseSheetData = {
        ...data,
        patientId,
        appointmentId: appointmentId || data.appointmentId
    };

    store[specificKey] = updatedRecord;
    // Also update patient-level latest reference
    store[patientId] = updatedRecord;

    saveStore(store);
    return updatedRecord;
}

/**
 * Saves Front Desk Intake data to the appointment mock record.
 */
export function saveGynecIntake(patientId: string, appointmentId: string | undefined, intake: GynecIntakeData): GynecCaseSheetData {
    const existing = getGynecRecord(patientId, appointmentId);
    
    const updated: GynecCaseSheetData = {
        ...existing,
        patientId,
        appointmentId,
        intake,
        chiefComplaint: {
            ...existing.chiefComplaint,
            mainComplaint: intake.mainConcern,
            briefDescription: intake.additionalNotes || existing.chiefComplaint.briefDescription
        },
        menstrualHistory: {
            ...existing.menstrualHistory,
            lmpDate: intake.lmpDate || existing.menstrualHistory.lmpDate,
            cycleRegularity: intake.cycleRegularity || existing.menstrualHistory.cycleRegularity,
            flowIntensity: intake.flowIntensity || existing.menstrualHistory.flowIntensity,
            hasClots: intake.hasClots ?? existing.menstrualHistory.hasClots
        },
        obstetricHistory: {
            ...existing.obstetricHistory,
            summary: {
                ...existing.obstetricHistory.summary,
                gravida: intake.gravida ?? existing.obstetricHistory.summary.gravida,
                para: intake.para ?? existing.obstetricHistory.summary.para
            }
        },
        currentPregnancy: {
            ...existing.currentPregnancy,
            pregnancyStatus: intake.mainConcern === 'Pregnancy Consultation' ? 'Confirmed' : existing.currentPregnancy.pregnancyStatus,
            lmpDate: intake.lmpDate || existing.currentPregnancy.lmpDate,
            eddDate: intake.eddDate || existing.currentPregnancy.eddDate,
            gestationalAgeWeeks: intake.gestationalAgeWeeks ?? existing.currentPregnancy.gestationalAgeWeeks
        },
        sexualContraceptiveHistory: {
            ...existing.sexualContraceptiveHistory,
            currentContraceptiveMethod: intake.currentContraceptiveMethod || existing.sexualContraceptiveHistory.currentContraceptiveMethod
        }
    };

    return saveGynecRecord(patientId, appointmentId, updated);
}
