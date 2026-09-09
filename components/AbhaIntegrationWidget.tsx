import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import { Patient } from '../types';
import AbhaFlowModal from './AbhaFlowModal';

interface AbhaIntegrationWidgetProps {
    patient: Patient;
    onUpdate: () => void;
}

const AbhaIntegrationWidget: React.FC<AbhaIntegrationWidgetProps> = ({ patient, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialFlow, setInitialFlow] = useState<'CREATION' | 'VERIFICATION'>('CREATION');

    const abha = patient.abha;
    const isLinked = abha && abha.abha_number;
    const isVerified = abha && abha.verification_status === 'VERIFIED';

    const maskedAbhaNumber = abha?.abha_number
        ? `XX-XXXX-XXXX-${abha.abha_number.slice(-4)}`
        : null;

    return (
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-textPrimary flex items-center">
                    <Shield size={18} className="mr-2 text-brand-primary" /> ABDM / ABHA Integration
                </h3>
                {isLinked && isVerified && (
                    <span className="px-2 py-1 bg-brand-success/10 text-brand-success text-xs font-bold rounded-full flex items-center">
                        <ShieldCheck size={14} className="mr-1" /> Verified
                    </span>
                )}
                {isLinked && !isVerified && (
                    <span className="px-2 py-1 bg-brand-warning/10 text-brand-warning text-xs font-bold rounded-full flex items-center">
                        <ShieldAlert size={14} className="mr-1" /> Unverified
                    </span>
                )}
            </div>

            {isLinked ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border">
                            <p className="text-xs font-bold text-brand-textSecondary uppercase mb-1">ABHA Number</p>
                            <p className="text-sm font-bold text-brand-textPrimary">{maskedAbhaNumber}</p>
                        </div>
                        <div className="bg-brand-bg p-3 rounded-xl border border-brand-border">
                            <p className="text-xs font-bold text-brand-textSecondary uppercase mb-1">ABHA Address</p>
                            <p className="text-sm font-bold text-brand-textPrimary">{abha.abha_address || 'Not created'}</p>
                        </div>
                    </div>

                    {!isVerified && (
                        <button
                            onClick={() => {
                                setInitialFlow('VERIFICATION');
                                setIsModalOpen(true);
                            }}
                            className="w-full py-2 bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-lg hover:bg-brand-primary/20 transition-colors"
                        >
                            Verify ABHA Address
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-brand-textSecondary">
                        This patient does not have an Ayushman Bharat Health Account (ABHA) linked.
                    </p>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={() => {
                                setInitialFlow('CREATION');
                                setIsModalOpen(true);
                            }}
                            className="w-full py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center justify-center shadow-sm"
                        >
                            <Plus size={16} className="mr-2" /> Create / Link ABHA
                        </button>
                        <button
                            onClick={() => {
                                setInitialFlow('VERIFICATION');
                                setIsModalOpen(true);
                            }}
                            className="w-full py-2 bg-brand-surface border border-brand-border text-brand-textPrimary text-sm font-bold rounded-lg hover:bg-brand-bg transition-colors"
                        >
                            Verify Existing ABHA Address
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AbhaFlowModal
                    patientId={patient.id}
                    initialFlow={initialFlow}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        onUpdate();
                    }}
                />
            )}
        </div>
    );
};

export default AbhaIntegrationWidget;
