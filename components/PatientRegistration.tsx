import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, UserPlus, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useDoctors } from '../hooks/useDoctors';
import toast from 'react-hot-toast';

// --- Daily Register Table ---
export const DailyRegisterTable: React.FC = () => {
    const [registerData, setRegisterData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Add Walk-In
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [walkInAge, setWalkInAge] = useState('');
    const [walkInConsultant, setWalkInConsultant] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
    const [selectedWalkIn, setSelectedWalkIn] = useState<any>(null);

    // Filters
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const { doctors } = useDoctors();

    const fetchRegisterData = async () => {
        try {
            setLoading(true);

            let start_date = '';
            let end_date = '';
            const today = new Date();

            if (dateFilter === 'today') {
                start_date = today.toISOString().split('T')[0];
                end_date = start_date;
            } else if (dateFilter === 'week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                start_date = startOfWeek.toISOString().split('T')[0];
                end_date = today.toISOString().split('T')[0];
            } else if (dateFilter === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                start_date = startOfMonth.toISOString().split('T')[0];
                end_date = today.toISOString().split('T')[0];
            } else if (dateFilter === 'custom') {
                start_date = customStartDate;
                end_date = customEndDate;
            }

            if (dateFilter === 'custom' && (!start_date || !end_date)) {
                setRegisterData([]);
                setLoading(false);
                return;
            }

            const [apptsData, patientsData, doctorsData] = await Promise.all([
                api.getAppointments({ start_date, end_date, limit: 500 }),
                api.getPatients(),
                api.getDoctors()
            ]);

            const apptItems = Array.isArray(apptsData?.data) ? apptsData.data : (apptsData?.data?.items ?? []);
            const patientItems = patientsData?.data?.items ?? (Array.isArray(patientsData?.data) ? patientsData.data : (Array.isArray(patientsData) ? patientsData : []));
            const doctorsList = doctorsData?.data ?? [];

            const patientMap = new Map();
            if (Array.isArray(patientItems)) {
                patientItems.forEach((p: any) => patientMap.set(p.id, p));
            }

            const mapped = apptItems
                // Filter out canceled appointments so canceled bookings do not create duplicates in the daily register
                .filter((item: any) => {
                    const status = (item.status || '').toLowerCase();
                    return status !== 'canceled' && status !== 'cancelled';
                })
                .map((item: any) => {
                    const patientObj = patientMap.get(item.patient_id);
                    const docId = item.doctor_id || item.doctorId;
                    const docName = item.doctor_name_snapshot || item.doctor_name || doctorsList.find((d: any) => d.id === docId)?.name || 'Unassigned';

                    return {
                        id: item.id,
                        patientId: item.patient_id,
                        date: item.appointment_date || item.date || new Date().toISOString().split('T')[0],
                        name: item.patient_name_snapshot || item.patient_name || patientObj?.name || 'Unknown Patient',
                        age: item.patient_age_snapshot || patientObj?.age || '-',
                        phone: item.phone_snapshot || item.patient_phone_snapshot || patientObj?.mobile || item.phone || '-',
                        visit: item.type || 'Consultation',
                        consultant: docName,
                        notes: (() => {
                        const raw = item.notes || item.visit_reason || '';
                        if (!raw || raw.toLowerCase() === 'consultant' || raw.toLowerCase() === 'consultation') {
                            return '-';
                        }
                        return raw;
                    })()
                    };
                });

            // Sort by date descending
            mapped.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setRegisterData(mapped);
        } catch (error) {
            console.error("Failed to fetch register data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegisterData();
    }, [dateFilter, customStartDate, customEndDate]);

    const handleAddWalkIn = () => {
        setWalkInName('');
        setWalkInPhone('');
        setWalkInAge('');
        setWalkInConsultant('');
        setModalError(null);
        setIsWalkInModalOpen(true);
    };

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!walkInName.trim()) {
            setModalError("Patient name is required.");
            return;
        }

        if (!walkInPhone || walkInPhone.length < 10) {
            setModalError("Phone number must be exactly 10 digits.");
            return;
        }

        setIsSubmitting(true);
        setModalError(null);
        try {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');

            const payload = {
                patient_name_snapshot: walkInName.trim(),
                patient_phone_snapshot: walkInPhone,
                name: walkInName.trim(),
                phone: walkInPhone,
                age: walkInAge ? parseInt(walkInAge) : null,
                appointment_date: new Date().toISOString().split('T')[0],
                start_time: currentTime,
                doctor_id: walkInConsultant || undefined,
                type: 'Consultation',
                status: 'Checked-In',
                visit_reason: 'Walk-In'
            };
            await api.createAppointment(payload);
            toast.success('Walk-in patient registered!');
            setIsWalkInModalOpen(false);
            fetchRegisterData();
        } catch (err: any) {
            console.error("Failed to add walk-in", err);
            setModalError(err?.message || err?.error || "Failed to add walk-in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden">
            <div className="p-6 border-b border-brand-border bg-brand-bg/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-textPrimary flex items-center">
                    <FileText className="mr-2 text-brand-primary" size={20} /> Daily Patient Register
                </h3>
                <div className="flex space-x-2">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary"
                            />
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary"
                            />
                        </div>
                    )}

                    <button onClick={handleAddWalkIn} className="px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-bold text-brand-textSecondary hover:text-brand-primary transition-colors">
                        Add Walk-In
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-brand-secondary transition-colors">
                        Print Register
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-bg sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">DATE</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">PATIENT NAME</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">AGE</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">PHONE NO</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">VISIT TYPE</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">CONSULTANT</th>
                                <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">NOTES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {registerData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-sm text-brand-textSecondary">No register entries found for the selected period.</td>
                                </tr>
                            ) : (
                                registerData.map((row, index) => (
                                    <tr key={row.id || index} className="hover:bg-brand-bg/50 transition-colors">
                                        <td className="p-4 text-sm text-brand-textPrimary font-medium">{row.date}</td>
                                        <td className="p-4 text-sm text-brand-textPrimary font-bold">{row.name}</td>
                                        <td className="p-4 text-sm text-brand-textSecondary">{row.age}</td>
                                        <td className="p-4 text-sm text-brand-textSecondary font-mono">{row.phone}</td>
                                        <td className="p-4 text-sm text-brand-textPrimary">{row.visit}</td>
                                        <td className="p-4 text-sm text-brand-textPrimary">{row.consultant}</td>
                                        <td className="p-4 text-sm text-brand-textSecondary">{row.notes}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isWalkInModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-scale-in">
                    <div
                        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                            if (!isSubmitting) setIsWalkInModalOpen(false);
                        }}
                    />

                    <div className="relative bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-brand-border flex flex-col max-h-[90vh]">
                        <div className="bg-brand-bg p-5 flex justify-between items-center border-b border-brand-border flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <UserPlus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-brand-textPrimary text-base font-bold">Add Walk-In Patient</h3>
                                    <p className="text-brand-textSecondary text-[10px] font-medium">Create a new registration & appointment</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWalkInModalOpen(false)}
                                disabled={isSubmitting}
                                className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mx-5 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle size={15} className="flex-shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleModalSubmit} className="p-5 space-y-4 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wide">Patient Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    value={walkInName}
                                    onChange={(e) => setWalkInName(e.target.value)}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wide">Phone Number (10 digits) *</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    placeholder="e.g. 9876543210"
                                    value={walkInPhone}
                                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wide">Age (Optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="120"
                                        placeholder="e.g. 28"
                                        value={walkInAge}
                                        onChange={(e) => setWalkInAge(e.target.value)}
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wide">Consultant (Optional)</label>
                                    <select
                                        value={walkInConsultant}
                                        onChange={(e) => setWalkInConsultant(e.target.value)}
                                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                                    >
                                        <option value="">Unassigned</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsWalkInModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-brand-border rounded-xl text-xs font-bold text-brand-textSecondary hover:bg-brand-bg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Registering...' : 'Register Walk-In'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
