import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, User, Calendar, Ban, CheckCircle2 } from 'lucide-react';
import { Lead } from '../types';
import { DOCTORS } from '../constants';

interface LeadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onUpdateLead: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
    isOpen,
    onClose,
    lead,
    onUpdateLead,
    onConvert
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Lead>>({});

    useEffect(() => {
        if (lead) {
            setEditFormData(lead);
        }
    }, [lead]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setIsEditing(false);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !lead) return null;

    const handleInputChange = (field: keyof Lead, value: string) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = () => {
        if (lead && editFormData) {
            const updatedLead = { ...lead, ...editFormData } as Lead;
            onUpdateLead(updatedLead);
            setIsEditing(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative bg-brand-surface w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-brand-border max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-brand-border flex justify-between items-start bg-brand-bg">
                    <div>
                        <h2 className="text-xl font-bold text-brand-textPrimary">{lead.name}</h2>
                        <p className="text-sm text-brand-textSecondary mt-1 flex items-center">
                            <Phone size={14} className="mr-1" /> {lead.phone}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary p-2 hover:bg-brand-surface rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-bg/30">
                    <div className="space-y-6">
                        {/* Summary & Actions */}
                        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-xs font-bold text-brand-textSecondary uppercase">Current Status</p>
                                    <span className={`inline-block mt-1 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border ${lead.status === 'Stalling - Sent to CRO'
                                            ? 'bg-brand-error/10 text-brand-error border-brand-error/20'
                                            : 'bg-brand-bg text-brand-textSecondary border-brand-border'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-brand-textSecondary uppercase">Created By</p>
                                    <p className="text-sm font-bold text-brand-textPrimary mt-1">Front Desk</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-brand-border flex gap-3">
                                <button
                                    onClick={() => onUpdateLead({ ...lead, status: 'Lost' })}
                                    className="px-3 py-2 border border-brand-error/20 text-brand-error hover:bg-brand-error/10 font-bold rounded-lg text-xs transition-colors"
                                >
                                    <Ban size={14} className="inline mr-1" /> Mark Lost
                                </button>
                                <button
                                    onClick={() => onUpdateLead({ ...lead, status: lead.status === 'Stalling - Sent to CRO' ? 'Contacted' : 'Stalling - Sent to CRO' })}
                                    className={`flex-1 py-2 font-bold rounded-lg text-xs transition-colors border ${lead.status === 'Stalling - Sent to CRO'
                                            ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20'
                                            : 'bg-brand-warning/10 text-brand-warning border-brand-warning/20 hover:bg-brand-warning/20'
                                        }`}
                                >
                                    {lead.status === 'Stalling - Sent to CRO' ? 'Return to Front Desk' : 'Send to CRO'}
                                </button>
                            </div>
                        </div>

                        {/* Details Form */}
                        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-brand-textSecondary uppercase">Demographics & Clinical</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-bold text-brand-primary hover:text-brand-secondary"
                                    >
                                        Edit Details
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-xs font-bold text-brand-textSecondary hover:bg-brand-bg px-2 py-1 rounded border border-brand-border"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveChanges}
                                            className="text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary px-2 py-1 rounded shadow-sm"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Full Name</label>
                                        {isEditing ? (
                                            <input
                                                value={editFormData.name || ''}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Phone</label>
                                        {isEditing ? (
                                            <input
                                                value={editFormData.phone || ''}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Age</label>
                                        {isEditing ? (
                                            <input
                                                value={editFormData.age || ''}
                                                onChange={(e) => handleInputChange('age', e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.age || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Gender</label>
                                        {isEditing ? (
                                            <select
                                                value={editFormData.gender || 'Female'}
                                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            >
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.gender || 'Female'}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-brand-textSecondary mb-1">Presenting Problem</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editFormData.problem || ''}
                                            onChange={(e) => handleInputChange('problem', e.target.value)}
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary h-20 resize-none"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-brand-textPrimary bg-brand-bg/50 p-3 rounded-lg border border-brand-border/50">
                                            {lead.problem || 'No details logged.'}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Camp Doctor</label>
                                        {isEditing ? (
                                            <select
                                                value={editFormData.treatmentDoctor || ''}
                                                onChange={(e) => {
                                                    const selected = DOCTORS.find(d => d.name === e.target.value);
                                                    handleInputChange('treatmentDoctor', e.target.value);
                                                    if (selected) {
                                                        handleInputChange('treatmentSuggested', selected.speciality);
                                                    }
                                                }}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            >
                                                <option value="">Select Doctor</option>
                                                {DOCTORS.map(doc => (
                                                    <option key={doc.id} value={doc.name}>{doc.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.treatmentDoctor || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-textSecondary mb-1">Suggested Tx</label>
                                        {isEditing ? (
                                            <input
                                                value={editFormData.treatmentSuggested || ''}
                                                onChange={(e) => handleInputChange('treatmentSuggested', e.target.value)}
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary"
                                            />
                                        ) : (
                                            <p className="text-sm font-bold text-brand-textPrimary">{lead.treatmentSuggested || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-brand-border bg-brand-bg">
                    <button
                        onClick={() => onConvert(lead)}
                        className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-xl shadow-lg shadow-brand-primary/20 flex items-center justify-center transition-all active:scale-95"
                    >
                        <CheckCircle2 size={18} className="mr-2" /> Finalize Conversion & Create Patient File
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
