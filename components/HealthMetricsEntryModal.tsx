import React, { useState } from 'react';
import { X, Activity, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface HealthMetricsEntryModalProps {
    patientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const HealthMetricsEntryModal: React.FC<HealthMetricsEntryModalProps> = ({ patientId, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<'vitals' | 'allergies' | 'history'>('vitals');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Vitals State
    const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', weight: '' });
    
    // Allergies State
    const [allergyName, setAllergyName] = useState('');
    const [severity, setSeverity] = useState('MEDIUM');
    const [reaction, setReaction] = useState('');

    // History State
    const [conditionName, setConditionName] = useState('');
    const [diagnosisDate, setDiagnosisDate] = useState('');

    const handleSaveVitals = async () => {
        setIsSubmitting(true);
        try {
            const recorded_at = new Date().toISOString();
            if (vitals.bp) await api.addPatientVitals(patientId, { vital_type: 'blood_pressure', value: vitals.bp, recorded_at });
            if (vitals.hr) await api.addPatientVitals(patientId, { vital_type: 'heart_rate', value: vitals.hr, recorded_at });
            if (vitals.temp) await api.addPatientVitals(patientId, { vital_type: 'temperature', value: vitals.temp, recorded_at });
            if (vitals.weight) await api.addPatientVitals(patientId, { vital_type: 'weight', value: vitals.weight, recorded_at });
            
            alert('Vitals saved successfully');
            onSuccess();
            setVitals({ bp: '', hr: '', temp: '', weight: '' });
        } catch (error) {
            console.error(error);
            alert('Failed to save vitals');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAllergy = async () => {
        if (!allergyName) return alert('Allergy name is required');
        setIsSubmitting(true);
        try {
            await api.addPatientAllergy(patientId, { allergy_name: allergyName, severity, reaction });
            alert('Allergy saved successfully');
            onSuccess();
            setAllergyName('');
            setReaction('');
        } catch (error) {
            console.error(error);
            alert('Failed to save allergy');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveHistory = async () => {
        if (!conditionName) return alert('Condition name is required');
        setIsSubmitting(true);
        try {
            await api.addPatientMedicalHistory(patientId, { condition_name: conditionName, diagnosis_date: diagnosisDate });
            alert('Medical history saved successfully');
            onSuccess();
            setConditionName('');
            setDiagnosisDate('');
        } catch (error) {
            console.error(error);
            alert('Failed to save medical history');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-brand-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-slide-in-up border border-brand-border">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
                    <div>
                        <h2 className="text-xl font-bold text-brand-textPrimary flex items-center">
                            <Activity className="mr-2 text-brand-primary" size={24} />
                            Clinical Intake
                        </h2>
                        <p className="text-xs text-brand-textSecondary mt-1">Record patient vitals, allergies, and history</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-full text-brand-textSecondary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-brand-border">
                    <button 
                        onClick={() => setActiveTab('vitals')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'vitals' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-textSecondary hover:bg-brand-bg'}`}
                    >
                        <Activity size={16} className="mr-2" /> Vitals
                    </button>
                    <button 
                        onClick={() => setActiveTab('allergies')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'allergies' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-textSecondary hover:bg-brand-bg'}`}
                    >
                        <AlertCircle size={16} className="mr-2" /> Allergies
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'history' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-textSecondary hover:bg-brand-bg'}`}
                    >
                        <FileText size={16} className="mr-2" /> Medical History
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 bg-brand-bg/30">
                    {activeTab === 'vitals' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Blood Pressure (mmHg)</label>
                                    <input placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Heart Rate (bpm)</label>
                                    <input placeholder="72" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Temperature (°F)</label>
                                    <input placeholder="98.6" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Weight (kg)</label>
                                    <input placeholder="70" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                            </div>
                            <button disabled={isSubmitting} onClick={handleSaveVitals} className="w-full mt-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
                                <CheckCircle2 size={18} className="mr-2" /> Save Vitals
                            </button>
                        </div>
                    )}

                    {activeTab === 'allergies' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-xs text-brand-textSecondary font-bold block mb-1">Allergen / Allergy Name</label>
                                <input placeholder="e.g. Penicillin, Peanuts" value={allergyName} onChange={e => setAllergyName(e.target.value)} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Severity</label>
                                    <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-brand-textSecondary font-bold block mb-1">Reaction (Optional)</label>
                                    <input placeholder="e.g. Hives, Anaphylaxis" value={reaction} onChange={e => setReaction(e.target.value)} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                                </div>
                            </div>
                            <button disabled={isSubmitting || !allergyName} onClick={handleSaveAllergy} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
                                <AlertCircle size={18} className="mr-2" /> Save Allergy Record
                            </button>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-xs text-brand-textSecondary font-bold block mb-1">Condition Name</label>
                                <input placeholder="e.g. Type 2 Diabetes, Hypertension" value={conditionName} onChange={e => setConditionName(e.target.value)} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-brand-textSecondary font-bold block mb-1">Approximate Diagnosis Date (Optional)</label>
                                <input type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)} className="w-full text-sm font-bold text-brand-textPrimary bg-brand-surface border border-brand-border rounded-lg px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                            </div>
                            <button disabled={isSubmitting || !conditionName} onClick={handleSaveHistory} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
                                <FileText size={18} className="mr-2" /> Save Medical History
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
