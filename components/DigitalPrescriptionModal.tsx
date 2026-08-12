import React, { useState } from 'react';
import { X, Pill, Save, Loader2, Plus, Trash2, Minus } from 'lucide-react';import toast from 'react-hot-toast';


export interface MedicationItem {
    medication_name: string;
    dosage: string;
    frequency: number; // Storing as number for the up/down buttons
    quantity: string;
    duration_days: number;
    special_instructions?: string;
}

export interface PrescriptionData {
    medications: MedicationItem[];
}

interface DigitalPrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: PrescriptionData) => Promise<void>;
}

const emptyMedication = (): MedicationItem => ({
    medication_name: '',
    dosage: '',
    frequency: 2, // Default: twice a day
    quantity: '',
    duration_days: 1,
    special_instructions: '',
});

export const DigitalPrescriptionModal: React.FC<DigitalPrescriptionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [medications, setMedications] = useState<MedicationItem[]>([emptyMedication()]);

    if (!isOpen) return null;

    const handleMedicationChange = (index: number, field: keyof MedicationItem, value: any) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const addMedication = () => {
        setMedications([...medications, emptyMedication()]);
    };

    const removeMedication = (index: number) => {
        if (medications.length === 1) return;
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSave({ medications });
            setMedications([emptyMedication()]); // reset on success
            onClose();
        } catch (error) {
            console.error('Failed to save prescription', error);
            toast.error("Failed to save prescription. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = medications.every(m => m.medication_name && m.dosage && m.quantity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-brand-primary p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0 rounded-t-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center">
                            <Pill className="mr-3" size={24} />
                            Digital Prescription
                        </h2>
                        <p className="text-brand-primary-light text-sm mt-1 opacity-90">
                            Add multiple medications for this patient
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form (Scrollable Area) */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-brand-bg">
                    <form id="prescription-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {medications.map((med, index) => (
                            <div key={index} className="bg-white border border-brand-border rounded-xl p-5 shadow-sm relative">
                                <div className="flex justify-between items-center mb-4 border-b border-brand-border pb-3">
                                    <h4 className="font-bold text-brand-primary flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs mr-2">
                                            {index + 1}
                                        </div>
                                        Medication
                                    </h4>
                                    {medications.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMedication(index)}
                                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex items-center text-sm font-semibold"
                                        >
                                            <Trash2 size={16} className="mr-1" /> Remove
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                            Medication Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={med.medication_name}
                                            onChange={(e) => handleMedicationChange(index, 'medication_name', e.target.value)}
                                            placeholder="e.g. Paracetamol"
                                            className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                                Dosage <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                placeholder="e.g. 500mg"
                                                className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={med.quantity}
                                                onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                                                placeholder="e.g. Full Sheet or 4 tablets"
                                                className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                                Frequency (Times per day) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center h-[42px] border border-brand-border rounded-xl overflow-hidden bg-brand-surface">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMedicationChange(index, 'frequency', Math.max(1, med.frequency - 1))}
                                                    className="px-4 h-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border-r border-brand-border flex items-center justify-center"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <div className="flex-1 text-center font-semibold text-brand-textPrimary text-sm">
                                                    {med.frequency} {med.frequency === 1 ? 'time' : 'times'} / day
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMedicationChange(index, 'frequency', Math.min(10, med.frequency + 1))}
                                                    className="px-4 h-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border-l border-brand-border flex items-center justify-center"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                                Duration (Days) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                value={med.duration_days}
                                                onChange={(e) => handleMedicationChange(index, 'duration_days', parseInt(e.target.value) || 1)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                                            Special Instructions (Optional)
                                        </label>
                                        <textarea
                                            value={med.special_instructions}
                                            onChange={(e) => handleMedicationChange(index, 'special_instructions', e.target.value)}
                                            placeholder="e.g. Take after food"
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm text-brand-textPrimary bg-brand-surface resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addMedication}
                            className="w-full py-3.5 border-2 border-dashed border-brand-primary/30 text-brand-primary font-bold rounded-xl hover:bg-brand-primary/5 hover:border-brand-primary transition-all flex items-center justify-center"
                        >
                            <Plus size={18} className="mr-2" /> Add Another Medication
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-brand-border bg-white flex justify-end space-x-3 shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-brand-textSecondary hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="prescription-form"
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Generate Prescription
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

