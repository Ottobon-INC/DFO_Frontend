import React, { useState, useEffect } from 'react';
import { X, Search, User, Phone, UserPlus } from 'lucide-react';
import { api } from '../services/api';

interface AssignDocumentModalProps {
    documentId: string;
    documentName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssignDocumentModal: React.FC<AssignDocumentModalProps> = ({ documentId, documentName, onClose, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [documentType, setDocumentType] = useState('other');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newPatientName, setNewPatientName] = useState('');
    const [newPatientMobile, setNewPatientMobile] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch(searchQuery);
            } else {
                setPatients([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setIsSearching(true);
        try {
            const response = await api.searchPatients(query);
            if (response.success && response.data) {
                setPatients(response.data);
            } else if (Array.isArray(response)) {
                setPatients(response);
            }
        } catch (error) {
            console.error("Patient search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAssign = async (patientId: string) => {
        setIsAssigning(true);
        try {
            await api.linkDocument(documentId, patientId, documentType);
            onSuccess();
        } catch (error: any) {
            console.error("Assignment failed", error);
            alert(error.message || "Failed to assign document");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleCreateAndAssign = async () => {
        if (!newPatientName || !newPatientMobile) {
            alert("Name and Mobile are required");
            return;
        }
        setIsAssigning(true);
        try {
            const response = await api.linkNewPatientToDocument(documentId, {
                name: newPatientName,
                mobile: newPatientMobile,
                document_type: documentType
            });
            
            const newPin = response?.data?.generatedPin || response?.generatedPin;
            if (newPin) {
                alert(`Patient ${newPatientName} created and document linked successfully!\n\nPORTAL ACCESS PIN: ${newPin}\n\nPlease share this 4-digit PIN with the patient.`);
            } else {
                alert(`Patient ${newPatientName} created and document linked successfully!`);
            }

            onSuccess();
        } catch (error: any) {
            console.error("Create and Assignment failed", error);
            alert(error.message || "Failed to create patient and assign document");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in p-4">
            <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-xl border border-brand-border flex flex-col overflow-hidden animate-slide-up">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-bg/50">
                    <div>
                        <h3 className="font-bold text-lg text-brand-textPrimary">Assign Document</h3>
                        <p className="text-xs text-brand-textSecondary mt-0.5 truncate max-w-[250px]">{documentName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-full text-brand-textSecondary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Body */}
                <div className="p-6 flex-1 overflow-hidden flex flex-col">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Classify Document</label>
                        <select 
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                        >
                            <option value="prescription">Prescription</option>
                            <option value="lab-report">Lab Report</option>
                            <option value="scan-imaging">Scan/Imaging</option>
                            <option value="clinical-note">Clinical Note</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-textSecondary" />
                        <input 
                            type="text"
                            placeholder="Search by patient name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px] max-h-[300px] border border-brand-border rounded-xl bg-brand-bg/50">
                        {isCreatingNew ? (
                            <div className="p-4 flex flex-col gap-3">
                                <h4 className="font-bold text-brand-textPrimary mb-2 flex items-center"><UserPlus size={16} className="mr-2" /> Create New Patient</h4>
                                <div>
                                    <label className="block text-xs font-bold text-brand-textSecondary mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={newPatientName}
                                        onChange={(e) => setNewPatientName(e.target.value)}
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm outline-none focus:border-brand-primary"
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-textSecondary mb-1">Mobile Number</label>
                                    <input 
                                        type="tel" 
                                        value={newPatientMobile}
                                        onChange={(e) => setNewPatientMobile(e.target.value)}
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm outline-none focus:border-brand-primary"
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button 
                                        onClick={() => setIsCreatingNew(false)}
                                        className="flex-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-bold text-brand-textSecondary hover:text-brand-primary"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCreateAndAssign}
                                        disabled={isAssigning || !newPatientName || !newPatientMobile}
                                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-secondary disabled:opacity-50"
                                    >
                                        {isAssigning ? 'Creating...' : 'Create & Link'}
                                    </button>
                                </div>
                            </div>
                        ) : isSearching ? (
                            <div className="flex items-center justify-center h-full text-brand-textSecondary text-sm">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary mr-2"></div>
                                Searching...
                            </div>
                        ) : patients.length > 0 ? (
                            <div className="divide-y divide-brand-border">
                                {patients.map(p => (
                                    <div key={p.id} className="p-3 hover:bg-brand-surface flex items-center justify-between group transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-brand-textPrimary">{p.name}</p>
                                                <div className="flex items-center text-xs text-brand-textSecondary gap-2 mt-0.5">
                                                    <span className="flex items-center"><Phone size={10} className="mr-1" /> {p.mobile}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAssign(p.id)}
                                            disabled={isAssigning}
                                            className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                        >
                                            {isAssigning ? 'Linking...' : 'Select'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery.length >= 2 ? (
                            <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary text-sm p-4">
                                <User size={32} className="opacity-20 mb-2" />
                                <span className="mb-4">No patients found for "{searchQuery}"</span>
                                <button 
                                    onClick={() => {
                                        // Auto-fill form based on whether query looks like a number
                                        const isNumber = /^\d+$/.test(searchQuery.replace(/\s+/g, ''));
                                        if (isNumber) {
                                            setNewPatientMobile(searchQuery.replace(/\s+/g, ''));
                                            setNewPatientName('');
                                        } else {
                                            setNewPatientName(searchQuery);
                                            setNewPatientMobile('');
                                        }
                                        setIsCreatingNew(true);
                                    }}
                                    className="px-4 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg text-sm font-bold hover:bg-brand-primary hover:text-white transition-colors flex items-center"
                                >
                                    <UserPlus size={16} className="mr-2" /> Create New Patient
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-brand-textSecondary text-sm text-center px-4">
                                Type a name or phone number to search for a patient.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
