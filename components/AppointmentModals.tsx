import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, MapPin, Phone, Mail, Stethoscope, FileText, CheckCircle2, Search } from 'lucide-react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { DOCTORS } from '../constants';

interface BookAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (appointment: any) => void;
    initialDate?: Date;
    initialTime?: number;
    initialTab?: 'new' | 'existing';
    initialData?: {
        name?: string;
        phone?: string;
        age?: string;
        sex?: string;
        email?: string;
        patientId?: string;
    };
    doctors?: any[];
    patients?: any[];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({ isOpen, onClose, onConfirm, initialDate, initialTime, initialTab, initialData, doctors = DOCTORS, patients: initialPatients }) => {
    const [formData, setFormData] = useState({
        name: '',
        date: initialDate ? initialDate.toISOString().split('T')[0] : '',
        time: initialTime ? (initialTime < 10 ? `0${initialTime}:00` : `${initialTime}:00`) : '09:00',
        dob: '',
        age: '',
        sex: 'Female',
        maritalStatus: 'Married',
        address: '',
        pin: '',
        email: '',
        phone: '',
        consultant: '',
        speciality: 'IVF Specialist',
        referralDoctor: '',
        referralDoctorMobile: '',
        source: 'Walk-In',
        patientId: ''
    });

    const [activeTab, setActiveTab] = useState<'new' | 'existing'>(initialTab || 'new');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 400);

    React.useEffect(() => {
        if (isOpen) {
            setFormData(prev => {
                const updates: any = {};

                // Sync Date (Fix: Use local date to avoid UTC shifts)
                if (initialDate) {
                    const year = initialDate.getFullYear();
                    const month = String(initialDate.getDate()).padStart(2, '0'); // Fix previously swapped month/date logic in original? Check original carefuly.
                    // Actually, original used getMonth()+1. Let's stick to original or correct it.
                    // Original: const month = String(initialDate.getMonth() + 1).padStart(2, '0');
                    // Original: const day = String(initialDate.getDate()).padStart(2, '0');
                    // Let's rewrite safely.
                    const y = initialDate.getFullYear();
                    const m = String(initialDate.getMonth() + 1).padStart(2, '0');
                    const d = String(initialDate.getDate()).padStart(2, '0');
                    updates.date = `${y}-${m}-${d}`;
                }

                // Sync Time
                if (initialTime !== undefined) {
                    updates.time = initialTime < 10 ? `0${initialTime}:00` : `${initialTime}:00`;
                }

                // Sync Initial Data (if provided)
                if (initialData) {
                    updates.name = initialData.name || '';
                    updates.phone = initialData.phone || '';
                    updates.age = initialData.age || '';
                    updates.sex = initialData.sex || 'Female';
                    updates.email = initialData.email || '';
                    updates.patientId = initialData.patientId || '';
                }

                return { ...prev, ...updates };
            });
            // Also reset active tab if reopen
            if (initialTab) setActiveTab(initialTab);
        }
    }, [isOpen, initialDate, initialTime, initialData, initialTab]);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchQuery('');
            setShowResults(false);
            setSearchResults([]);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Effect for Server-Side Search
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await api.searchPatients(debouncedSearchQuery);
                let items: any[] = [];
                // Handle various response shapes
                if (Array.isArray(response)) {
                    items = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    items = response.data;
                } else if (response?.items && Array.isArray(response.items)) {
                    items = response.items;
                }
                setSearchResults(items.slice(0, 10)); // Limit to 10
            } catch (error) {
                console.warn('Patient search failed', error);
                // Fallback to client side filtering of passed patients if available
                if (initialPatients) {
                    const fallback = initialPatients.filter(p =>
                    (p.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                        p.phone?.includes(debouncedSearchQuery) ||
                        p.uhid?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
                    ).slice(0, 5);
                    setSearchResults(fallback);
                }
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedSearchQuery, initialPatients]);


    const handlePatientSelect = (patient: any) => {
        setFormData(prev => ({
            ...prev,
            name: patient.name,
            phone: patient.phone || patient.mobile || '',
            age: patient.age ? String(patient.age) : '25', // Default if missing
            sex: (patient.gender === 'Male' || patient.gender === 'Female') ? patient.gender : 'Female',
            email: patient.email || '',
            patientId: patient.id
        }));
        setSearchQuery('');
        setShowResults(false);
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative bg-brand-surface w-full max-w-6xl rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-brand-border h-[85vh] flex flex-col">
                <div className="bg-brand-bg p-6 flex justify-between items-center border-b border-brand-border flex-shrink-0">
                    <div>
                        <h3 className="text-brand-textPrimary text-xl font-bold">Book Appointment</h3>
                        <p className="text-brand-textSecondary text-sm">
                            {activeTab === 'new' ? 'Register new patient and book slot.' : 'Search existing patient and book slot.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-brand-border bg-brand-bg px-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        className={`pb-3 pt-2 text-sm font-bold border-b-2 transition-colors mr-6 ${activeTab === 'new' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
                    >
                        New Patient
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('existing')}
                        className={`pb-3 pt-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'existing' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
                    >
                        Existing Patient
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Existing Patient Search UI */}
                            {activeTab === 'existing' && (
                                <div className="col-span-1 lg:col-span-2 space-y-4 mb-2">
                                    <div className="bg-brand-primary/5 p-6 rounded-xl border border-brand-primary/10 relative">
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 mb-2 block">Search Patient</label>
                                        <div className="relative flex items-center">
                                            <Search className="absolute left-4 text-brand-textSecondary" size={20} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowResults(true);
                                                }}
                                                placeholder="Search by Patient Name, Mobile Number or UHID..."
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-brand-border rounded-xl text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Search Results Dropdown */}
                                        {showResults && searchQuery && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-brand-border z-50 overflow-hidden max-h-60 overflow-y-auto">
                                                {searchResults.length > 0 ? (
                                                    searchResults.map((p: any) => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => handlePatientSelect(p)}
                                                            className="p-3 hover:bg-brand-bg cursor-pointer border-b border-brand-border last:border-0 flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-bold text-brand-textPrimary">{p.name}</p>
                                                                {/* User requested to remove misleading UHID/Date string */}
                                                                <p className="text-xs text-brand-textSecondary">{p.phone || p.mobile}</p>
                                                            </div>
                                                            <div className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                                                                Select
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-brand-textSecondary">
                                                        {isSearching ? 'Searching...' : 'No patients found.'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Selected Patient Feedback */}
                                        {formData.name && (formData as any).patientId && (
                                            <div className="mt-4 p-4 bg-white border border-brand-success/30 rounded-xl flex items-center justify-between text-brand-success">
                                                <div className="flex items-center">
                                                    <CheckCircle2 size={20} className="mr-2" />
                                                    <div>
                                                        <p className="text-xs font-bold uppercase">Patient Selected</p>
                                                        <p className="text-sm font-bold">{formData.name}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, patientId: '', name: '', phone: '', email: '' }))}
                                                    className="text-brand-textSecondary hover:text-brand-textPrimary p-2"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section 1: Personal & Contact Details (New Patient Only) */}
                            {activeTab === 'new' && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border pb-2 mb-4">Patient Information</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Patient Name</label>
                                            <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" required placeholder="Full Name" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Phone Number</label>
                                            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" required placeholder="10-digit Mobile" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Age</label>
                                            <input type="number" name="age" value={(formData as any).age || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" placeholder="Years" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Sex</label>
                                            <select name="sex" value={formData.sex} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all">
                                                <option value="Female">Female</option>
                                                <option value="Male">Male</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Marital Status</label>
                                            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all">
                                                <option value="Married">Married</option>
                                                <option value="Single">Single</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Email (Optional)</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" placeholder="patient@example.com" />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Source</label>
                                        <select name="source" value={(formData as any).source} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all">
                                            <option value="Walk-In">Walk-In</option>
                                            <option value="Social Media">Social Media</option>
                                            <option value="Google">Google</option>
                                            <option value="Referral">Referral</option>
                                            <option value="Camp">Camp</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Section 2: Appointment Details */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border pb-2 mb-4">Appointment Details</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Date</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Time</label>
                                        <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Consultant</label>
                                        <select
                                            name="consultant"
                                            value={formData.consultant}
                                            onChange={(e) => {
                                                const selectedDoc = doctors?.find(d => d.name === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    consultant: e.target.value,
                                                    speciality: selectedDoc?.speciality || formData.speciality
                                                });
                                            }}
                                            className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all"
                                        >
                                            <option value="">Select Doctor</option>
                                            {doctors?.map((doc: any) => (
                                                <option key={doc.id} value={doc.name}>{doc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-brand-textSecondary uppercase ml-1 block mb-1">Speciality</label>
                                        <input name="speciality" value={formData.speciality} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 px-3 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-brand-border bg-brand-bg flex-shrink-0 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-textSecondary hover:bg-brand-bg rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-8 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-primary/20 transform active:scale-95 transition-all">
                            Book Appointment
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};


interface AppointmentActionCardProps {
    isOpen?: boolean;
    appointment: Appointment;
    onClose: () => void;
    onCancel: () => void;
    onReschedule?: () => void;
    doctors?: any[];
}

export const AppointmentActionCard: React.FC<AppointmentActionCardProps> = ({ appointment, onClose, onCancel, onReschedule, doctors }) => {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Robust Name Resolution
    // 1. Try direct name from appointment (if valid and not an ID)
    // 2. Try lookup by ID from passed doctors list
    // 3. Try lookup by ID from MOCK_DOCTORS (import needed if not passed)
    // 4. Fallback to Unknown

    // 4. Fallback to Unknown

    // Removed Local Mock, using global DOCTORS if needed or passed doctors


    let doctorName = appointment.doctorName;

    // Check if doctorName looks like an ID (e.g. 'dr3') or is missing
    const isIdLike = (name: string) => name && (name.startsWith('dr') || name.length < 5); // Heuristic

    if (!doctorName || doctorName === 'Unknown' || isIdLike(doctorName)) {
        // Try to find by ID first (Pass explicit ID if you have it, or try to use the name as ID if it looks like one)
        const targetId = appointment.doctorId || (isIdLike(doctorName) ? doctorName : undefined);

        const found = doctors?.find(d => d.id === targetId) || DOCTORS.find(d => d.id === targetId);
        if (found) {
            doctorName = found.name;
        } else if (isIdLike(doctorName)) {
            const foundInGlobal = DOCTORS.find(d => d.id === doctorName);
            if (foundInGlobal) doctorName = foundInGlobal.name;
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-brand-border">

                {/* Status Bar */}
                <div className={`h-2 w-full ${appointment.status === 'Arrived' ? 'bg-green-500' :
                    appointment.status === 'Checked-In' ? 'bg-blue-500' :
                        appointment.status === 'Canceled' ? 'bg-red-500' :
                            'bg-brand-primary'
                    }`} />

                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-brand-textPrimary">{appointment.patientName}</h3>
                            <p className="text-brand-textSecondary text-sm mt-1 flex items-center">
                                <Clock size={14} className="mr-1" /> {appointment.time} • {appointment.type}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center p-3 bg-brand-bg rounded-xl border border-brand-border">
                            <Stethoscope size={18} className="text-brand-primary mr-3" />
                            <div>
                                <p className="text-xs font-bold text-brand-textSecondary uppercase">Doctor</p>
                                <p className="text-sm font-bold text-brand-textPrimary">{doctorName}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-brand-bg rounded-xl border border-brand-border">
                            <CheckCircle2 size={18} className="text-brand-primary mr-3" />
                            <div>
                                <p className="text-xs font-bold text-brand-textSecondary uppercase">Status</p>
                                <p className="text-sm font-bold text-brand-textPrimary">{appointment.status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {appointment.status !== 'Canceled' && (
                            <>
                                {onReschedule && (
                                    <button
                                        onClick={onReschedule}
                                        className="w-full py-3 border border-brand-border text-brand-textSecondary hover:bg-brand-bg font-bold rounded-xl transition-all"
                                    >
                                        Reschedule
                                    </button>
                                )}
                                <button
                                    onClick={onCancel}
                                    className="w-full py-3 border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all"
                                >
                                    Cancel Appointment
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

