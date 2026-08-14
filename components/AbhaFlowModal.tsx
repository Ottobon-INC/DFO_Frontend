import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, CheckCircle2, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface AbhaFlowModalProps {
    patientId: string;
    initialFlow: 'CREATION' | 'VERIFICATION';
    onClose: () => void;
    onSuccess: () => void;
}

const AbhaFlowModal: React.FC<AbhaFlowModalProps> = ({ patientId, initialFlow, onClose, onSuccess }) => {
    const [flowType, setFlowType] = useState<'CREATION' | 'VERIFICATION'>(initialFlow);
    const [step, setStep] = useState<'INPUT_ID' | 'VERIFY_OTP' | 'SELECT_ADDRESS' | 'SUCCESS'>('INPUT_ID');

    // State
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [abhaAddress, setAbhaAddress] = useState('');
    const [otp, setOtp] = useState('');
    const [mobile, setMobile] = useState('');
    const [txnId, setTxnId] = useState<string | null>(null);
    const [suggestedAddresses, setSuggestedAddresses] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [customAddress, setCustomAddress] = useState('');
    const [authMethods, setAuthMethods] = useState<string[]>([]);
    const [selectedAuthMethod, setSelectedAuthMethod] = useState<'MOBILE_OTP' | 'AADHAAR_OTP' | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const resetState = () => {
        setAadhaarNumber('');
        setOtp('');
        setTxnId(null);
        setMobile('');
        setSuggestedAddresses([]);
        setSelectedAddress('');
        setCustomAddress('');
        setAuthMethods([]);
        setSelectedAuthMethod(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    // --- CREATION FLOW ---
    const handleRequestCreationOtp = async () => {
        if (!aadhaarNumber || aadhaarNumber.length !== 12) {
            toast.error('Please enter a valid 12-digit Aadhaar number');
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.requestAadhaarOtpForCreation(aadhaarNumber);
            if (res.success && res.txnId) {
                setTxnId(res.txnId);
                setStep('VERIFY_OTP');
                toast.success('OTP sent to Aadhaar registered mobile');
            } else {
                toast.error(res.error || 'Failed to request OTP');
            }
        } catch (err: any) {
            if (err.status === 409) {
                toast.error('This Aadhaar/ABHA is already linked to another patient.');
            } else {
                toast.error(err.message || 'Failed to request OTP');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCreationOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        if (!mobile || mobile.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        if (!txnId) return;

        setIsLoading(true);
        try {
            const res = await api.enrolAbhaViaAadhaarOtp(patientId, txnId, otp, mobile);
            if (res.success) {
                // Now fetch address suggestions
                const suggestionsRes = await api.getAbhaAddressSuggestions(patientId, txnId);
                if (suggestionsRes.success && suggestionsRes.data) {
                    setSuggestedAddresses(suggestionsRes.data);
                    setStep('SELECT_ADDRESS');
                } else {
                    // If no suggestions, still move to address step to allow custom creation
                    setStep('SELECT_ADDRESS');
                }
            } else {
                toast.error(res.error || 'Failed to verify OTP');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAbhaAddress = async () => {
        const addressToUse = selectedAddress === 'custom' ? customAddress : selectedAddress;
        if (!addressToUse) {
            toast.error('Please select or enter an ABHA address');
            return;
        }
        if (!txnId) return;

        setIsLoading(true);
        try {
            const res = await api.createAbhaAddress(patientId, txnId, addressToUse);
            if (res.success) {
                setStep('SUCCESS');
                toast.success('ABHA created and linked successfully!');
            } else {
                toast.error(res.error || 'Failed to create ABHA address');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to create ABHA address');
        } finally {
            setIsLoading(false);
        }
    };

    // --- VERIFICATION FLOW ---
    const handleSearchAuthMethods = async () => {
        if (!abhaAddress) {
            toast.error('Please enter an ABHA Address');
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.searchAuthMethods(patientId, abhaAddress);
            if (res.success && res.data?.authMethods) {
                setAuthMethods(res.data.authMethods);
                setStep('VERIFY_OTP');
            } else {
                toast.error(res.error || 'Failed to find auth methods');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to find auth methods');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestVerificationOtp = async () => {
        if (!selectedAuthMethod) {
            toast.error('Please select an authentication method');
            return;
        }
        setIsLoading(true);
        try {
            let res;
            if (selectedAuthMethod === 'MOBILE_OTP') {
                res = await api.requestMobileOtp(patientId, abhaAddress);
            } else if (selectedAuthMethod === 'AADHAAR_OTP') {
                // First search aadhaar auth methods as required by backend flow
                await api.searchAuthMethodsAadhaar(patientId, abhaAddress);
                res = await api.requestAadhaarOtpForVerification(patientId, abhaAddress);
            }

            if (res?.success && res.txnId) {
                setTxnId(res.txnId);
                toast.success('OTP sent successfully');
            } else {
                toast.error(res?.error || 'Failed to request OTP');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to request OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyVerificationOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        if (!txnId || !selectedAuthMethod) return;

        setIsLoading(true);
        try {
            let res;
            if (selectedAuthMethod === 'MOBILE_OTP') {
                res = await api.verifyMobileOtp(patientId, txnId, otp, abhaAddress);
            } else if (selectedAuthMethod === 'AADHAAR_OTP') {
                res = await api.verifyAadhaarOtpForVerification(patientId, txnId, otp, abhaAddress);
            }

            if (res?.success) {
                setStep('SUCCESS');
                toast.success('ABHA Address verified successfully!');
            } else {
                toast.error(res?.error || 'Failed to verify OTP');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-brand-border">
                <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
                    <h3 className="font-bold text-brand-textPrimary text-lg flex items-center gap-2">
                        <Shield size={20} className="text-brand-primary" />
                        {flowType === 'CREATION' ? 'Create ABHA' : 'Verify ABHA Address'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 text-brand-textSecondary hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* CREATION FLOW */}
                    {flowType === 'CREATION' && (
                        <>
                            {step === 'INPUT_ID' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-brand-textSecondary">
                                        Enter the patient's Aadhaar number to initiate ABHA creation.
                                    </p>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">Aadhaar Number</label>
                                        <input
                                            type="text"
                                            maxLength={12}
                                            value={aadhaarNumber}
                                            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 12-digit Aadhaar"
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleRequestCreationOtp}
                                        disabled={isLoading || aadhaarNumber.length !== 12}
                                        className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Request OTP'}
                                    </button>
                                </div>
                            )}

                            {step === 'VERIFY_OTP' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-brand-textSecondary">
                                        Enter the OTP sent to the Aadhaar registered mobile number.
                                    </p>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">Mobile Number</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 10-digit mobile number"
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">OTP</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors tracking-widest text-center font-bold text-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={handleVerifyCreationOtp}
                                        disabled={isLoading || otp.length !== 6 || mobile.length !== 10}
                                        className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Continue'}
                                    </button>
                                </div>
                            )}

                            {step === 'SELECT_ADDRESS' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-brand-textSecondary">
                                        Select an ABHA Address (username) or create a custom one.
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {suggestedAddresses.map((addr) => (
                                            <label key={addr} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddress === addr ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg'}`}>
                                                <input
                                                    type="radio"
                                                    name="abhaAddress"
                                                    value={addr}
                                                    checked={selectedAddress === addr}
                                                    onChange={(e) => setSelectedAddress(e.target.value)}
                                                    className="mr-3 accent-brand-primary"
                                                />
                                                <span className="text-sm font-bold text-brand-textPrimary">{addr}</span>
                                            </label>
                                        ))}
                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddress === 'custom' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg'}`}>
                                            <input
                                                type="radio"
                                                name="abhaAddress"
                                                value="custom"
                                                checked={selectedAddress === 'custom'}
                                                onChange={(e) => setSelectedAddress(e.target.value)}
                                                className="mr-3 accent-brand-primary"
                                            />
                                            <span className="text-sm font-bold text-brand-textPrimary">Create Custom</span>
                                        </label>
                                    </div>

                                    {selectedAddress === 'custom' && (
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                value={customAddress}
                                                onChange={(e) => setCustomAddress(e.target.value)}
                                                placeholder="e.g., john.doe@abdm"
                                                className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCreateAbhaAddress}
                                        disabled={isLoading || !selectedAddress || (selectedAddress === 'custom' && !customAddress)}
                                        className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center mt-4"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create ABHA'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* VERIFICATION FLOW */}
                    {flowType === 'VERIFICATION' && (
                        <>
                            {step === 'INPUT_ID' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-brand-textSecondary">
                                        Enter the patient's ABHA Address to verify.
                                    </p>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">ABHA Address</label>
                                        <input
                                            type="text"
                                            value={abhaAddress}
                                            onChange={(e) => setAbhaAddress(e.target.value)}
                                            placeholder="e.g., john.doe@abdm"
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchAuthMethods}
                                        disabled={isLoading || !abhaAddress}
                                        className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={16} className="mr-2" /> Search Auth Methods</>}
                                    </button>
                                </div>
                            )}

                            {step === 'VERIFY_OTP' && (
                                <div className="space-y-4">
                                    {!txnId ? (
                                        <>
                                            <p className="text-sm text-brand-textSecondary">
                                                Select an authentication method to receive the OTP.
                                            </p>
                                            <div className="space-y-2">
                                                {authMethods.includes('MOBILE_OTP') && (
                                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAuthMethod === 'MOBILE_OTP' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg'}`}>
                                                        <input
                                                            type="radio"
                                                            name="authMethod"
                                                            value="MOBILE_OTP"
                                                            checked={selectedAuthMethod === 'MOBILE_OTP'}
                                                            onChange={() => setSelectedAuthMethod('MOBILE_OTP')}
                                                            className="mr-3 accent-brand-primary"
                                                        />
                                                        <span className="text-sm font-bold text-brand-textPrimary">Mobile OTP</span>
                                                    </label>
                                                )}
                                                {authMethods.includes('AADHAAR_OTP') && (
                                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAuthMethod === 'AADHAAR_OTP' ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:bg-brand-bg'}`}>
                                                        <input
                                                            type="radio"
                                                            name="authMethod"
                                                            value="AADHAAR_OTP"
                                                            checked={selectedAuthMethod === 'AADHAAR_OTP'}
                                                            onChange={() => setSelectedAuthMethod('AADHAAR_OTP')}
                                                            className="mr-3 accent-brand-primary"
                                                        />
                                                        <span className="text-sm font-bold text-brand-textPrimary">Aadhaar OTP</span>
                                                    </label>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleRequestVerificationOtp}
                                                disabled={isLoading || !selectedAuthMethod}
                                                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center mt-4"
                                            >
                                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Request OTP'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-brand-textSecondary">
                                                Enter the OTP sent via {selectedAuthMethod === 'MOBILE_OTP' ? 'Mobile' : 'Aadhaar'}.
                                            </p>
                                            <div>
                                                <label className="text-xs font-bold text-brand-textSecondary uppercase block mb-1">OTP</label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Enter 6-digit OTP"
                                                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition-colors tracking-widest text-center font-bold text-lg"
                                                />
                                            </div>
                                            <button
                                                onClick={handleVerifyVerificationOtp}
                                                disabled={isLoading || otp.length !== 6}
                                                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-lg shadow-sm hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
                                            >
                                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify OTP'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* SUCCESS STEP */}
                    {step === 'SUCCESS' && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-brand-success/10 rounded-full flex items-center justify-center text-brand-success mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-brand-textPrimary text-lg">
                                    {flowType === 'CREATION' ? 'ABHA Created Successfully' : 'ABHA Verified Successfully'}
                                </h4>
                                <p className="text-sm text-brand-textSecondary mt-1">
                                    The patient's ABHA details have been linked to their profile.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    resetState();
                                    onSuccess();
                                }}
                                className="w-full py-2.5 bg-brand-surface border border-brand-border text-brand-textPrimary font-bold rounded-lg hover:bg-brand-bg transition-colors mt-4"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AbhaFlowModal;
