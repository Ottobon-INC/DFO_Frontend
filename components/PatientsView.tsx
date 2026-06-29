import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, UserPlus, List, FileText, ClipboardList, ArrowRight, Upload, Download } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { PatientProfile } from './PatientProfile';
import { BookAppointmentModal } from './AppointmentModals';
import { PatientConversionForm } from './PatientRegistration';
import { api } from '../services/api';

// Mock Data
// MOCK_PATIENTS removed in favor of API
const MOCK_PATIENTS: Patient[] = [];

interface PatientsViewProps {
    onNavigateToLeads: () => void;
}

type PatientTab = 'list' | 'conversion';

export const PatientsView: React.FC<PatientsViewProps> = ({ onNavigateToLeads }) => {
    const location = useLocation();
    const leadToConvert = location.state?.leadToConvert;

    // Set initial tab based on navigation state
    const [activeTab, setActiveTab] = useState<PatientTab>(leadToConvert ? 'conversion' : 'list');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Patients');
    const [filterGender, setFilterGender] = useState('All Genders');
    const [filterMonth, setFilterMonth] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);

    const fetchPatients = async () => {
        try {
            const response = await api.getPatients();

            // Robust data extraction to handle varied API shapes
            let items: any[] = [];
            if (Array.isArray(response)) {
                items = response;
            } else if (response?.data && Array.isArray(response.data)) {
                items = response.data;
            } else if (response?.data?.items && Array.isArray(response.data.items)) {
                items = response.data.items;
            } else if (response?.items && Array.isArray(response.items)) {
                items = response.items;
            }

            // Map API response to Patient interface
            const mapped: Patient[] = items.map((item: any) => ({
                ...item,
                // Ensure mandatory fields exist with defaults
                id: item.id || `temp-${Math.random()}`,
                name: item.name || 'Unknown Patient',
                mobile: item.mobile || item.phone || '-',
                gender: item.gender || 'Female',
                status: item.status || 'Active',
                // Critical: Ensure registrationDate exists for filtering
                registrationDate: item.registrationDate || item.registration_date || item.date || new Date().toISOString().split('T')[0],
                uhid: item.uhid || item.UHID || '-',
                bloodGroup: item.bloodGroup || item.blood_group || '-',
                maritalStatus: item.maritalStatus || item.marital_status || '-',
                referralDoctor: item.referralDoctor || item.referral_doctor || '-',
                hospitalAddress: item.hospitalAddress || item.hospital_address || '-',
                aadhar: item.aadhar || item.aadhar_id || '-',
            }));

            // Sort by latest registration date
            mapped.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

            setPatients(mapped);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // --- Export Patients to CSV ---
    const handleExportCSV = () => {
        if (filteredPatients.length === 0) {
            alert('No patients to export.');
            return;
        }

        const headers = [
            'UHID', 'Name', 'Gender', 'Mobile', 'Email', 'DOB', 'Age', 
            'Marital Status', 'Blood Group', 'Aadhar', 'House', 'Street', 
            'Area', 'City', 'District', 'State', 'Postal Code', 'Reg. Date', 'Status'
        ];

        const csvRows = [
            headers.join(','),
            ...filteredPatients.map(p => [
                `"${p.uhid || ''}"`,
                `"${p.name || ''}"`,
                `"${p.gender || ''}"`,
                `"${p.mobile || ''}"`,
                `"${p.email || ''}"`,
                `"${p.dob || ''}"`,
                `"${p.age || ''}"`,
                `"${p.maritalStatus || p.marital_status || ''}"`,
                `"${p.bloodGroup || p.blood_group || ''}"`,
                `"${p.aadhar || ''}"`,
                `"${p.house || ''}"`,
                `"${p.street || ''}"`,
                `"${p.area || ''}"`,
                `"${p.city || ''}"`,
                `"${p.district || ''}"`,
                `"${p.state || ''}"`,
                `"${p.postalCode || p.postal_code || ''}"`,
                `"${p.registrationDate || p.registration_date || ''}"`,
                `"${p.status || ''}"`
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `JanmaSethu_Patients_${dateStr}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Import Patients from CSV ---
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const rows = text.split('\n').map(row => row.split(','));
            const startIndex = rows[0][0] && (rows[0][0].toLowerCase().includes('uhid') || rows[0][0].toLowerCase().includes('name')) ? 1 : 0;

            let successCount = 0;
            let errorCount = 0;

            for (let i = startIndex; i < rows.length; i++) {
                const cols = rows[i].map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length < 2 || !cols[1]) continue; // Skip empty rows or rows without name

                const [
                    uhid, name, gender, mobile, email, dob, age, 
                    maritalStatus, bloodGroup, aadhar, house, street, 
                    area, city, district, state, postalCode, regDate, status
                ] = cols;

                try {
                    const patientData = {
                        uhid: uhid || undefined,
                        name,
                        gender: gender || 'Female',
                        mobile,
                        phone: mobile,
                        email: email || undefined,
                        dob: dob || undefined,
                        age: age || undefined,
                        marital_status: maritalStatus || 'Married',
                        blood_group: bloodGroup || undefined,
                        aadhar: aadhar || undefined,
                        house: house || undefined,
                        street: street || undefined,
                        area: area || undefined,
                        city: city || undefined,
                        district: district || undefined,
                        state: state || undefined,
                        postal_code: postalCode || undefined,
                        registration_date: regDate || new Date().toISOString().split('T')[0],
                        status: status || 'Active'
                    };

                    console.log('Importing patient:', name, patientData);
                    await api.createPatient(patientData);
                    successCount++;
                } catch (err) {
                    console.error('Failed to import patient:', name, err);
                    errorCount++;
                }
            }

            alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
            if (successCount > 0) {
                fetchPatients();
            }
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
        };
        reader.readAsText(file);
    };


    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [patientForBooking, setPatientForBooking] = useState<Patient | null>(null);

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = (
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (patient.id && patient.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.mobile && patient.mobile.includes(searchTerm))
        );
        const matchesStatus = filterStatus === 'All Patients' || patient.status === filterStatus;
        const matchesGender = filterGender === 'All Genders' || patient.gender === filterGender;
        const matchesMonth = !filterMonth || patient.registrationDate.startsWith(filterMonth);

        return matchesSearch && matchesStatus && matchesGender && matchesMonth;
    });

    const handleBookingConfirm = (details: unknown) => {
        console.log('Booking confirmed for:', patientForBooking?.name, details);
        setIsBookingModalOpen(false);
        setPatientForBooking(null);
    };

    const handleConversionSuccess = () => {
        fetchPatients();
        setActiveTab('list');
    };

    return (
        <div className="flex flex-col h-full gap-4 lg:gap-6 relative">

            {/* Top Navigation Tabs */}
            <div className="flex space-x-2 sm:space-x-4 border-b border-brand-border pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${activeTab === 'list' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
                >
                    <List size={16} />
                    <span>Patients</span>
                </button>

                <button
                    onClick={() => setActiveTab('conversion')}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-xs sm:text-sm ${activeTab === 'conversion' ? 'border-brand-primary text-brand-primary font-bold' : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'}`}
                >
                    <ClipboardList size={16} />
                    <span>Convert</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'list' && (
                    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
                        {/* Filters Sidebar - Hidden on mobile */}
                        <div className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-6">
                            <div className="bg-brand-surface p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm border border-brand-border h-full overflow-y-auto custom-scrollbar">
                                <div className="flex items-center space-x-2 mb-4 lg:mb-6 text-brand-textPrimary">
                                    <Filter size={18} className="text-brand-primary" />
                                    <h3 className="font-bold text-base lg:text-lg">Filters</h3>
                                </div>
                                <div className="space-y-4 lg:space-y-6">
                                    <div>
                                        <label className="block text-[10px] lg:text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2 lg:mb-3">Status</label>
                                        <div className="space-y-1 lg:space-y-2">
                                            <button onClick={() => setFilterStatus('All Patients')} className={`w-full text-left px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors ${filterStatus === 'All Patients' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-textSecondary hover:bg-brand-bg'}`}>All</button>
                                            <button onClick={() => setFilterStatus('Active')} className={`w-full text-left px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${filterStatus === 'Active' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-textSecondary hover:bg-brand-bg'}`}>Active</button>
                                            <button onClick={() => setFilterStatus('Discharged')} className={`w-full text-left px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${filterStatus === 'Discharged' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-textSecondary hover:bg-brand-bg'}`}>Discharged</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] lg:text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2 lg:mb-3">Gender</label>
                                        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors">
                                            <option>All Genders</option>
                                            <option>Female</option>
                                            <option>Male</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] lg:text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2 lg:mb-3">Month</label>
                                        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main List */}
                        <div className="flex-1 flex flex-col h-full bg-brand-surface rounded-xl lg:rounded-2xl shadow-sm border border-brand-border overflow-hidden min-w-0">
                            <div className="p-3 sm:p-4 lg:p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-brand-bg/50">
                                <div className="flex items-center bg-brand-surface px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-brand-border w-full sm:w-auto sm:max-w-xs lg:w-96 focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all shadow-sm">
                                    <Search size={18} className="text-brand-textSecondary mr-2 sm:mr-3 flex-shrink-0" />
                                    <input
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent outline-none text-sm w-full text-brand-textPrimary placeholder:text-brand-textSecondary font-medium"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={handleExportCSV}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-surface border border-brand-border hover:bg-brand-bg text-brand-textSecondary font-bold rounded-lg sm:rounded-xl flex items-center text-xs sm:text-sm transition-all active:scale-95"
                                        title="Export to CSV"
                                    >
                                        <Download size={16} className="sm:mr-2" /> <span className="hidden sm:inline">Export</span>
                                    </button>
                                    <button
                                        onClick={handleImportClick}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-surface border border-brand-border hover:bg-brand-bg text-brand-textSecondary font-bold rounded-lg sm:rounded-xl flex items-center text-xs sm:text-sm transition-all active:scale-95"
                                        title="Import from CSV"
                                    >
                                        <Upload size={16} className="sm:mr-2" /> <span className="hidden sm:inline">Import</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('conversion')}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-lg sm:rounded-xl shadow-lg shadow-brand-primary/20 flex items-center text-xs sm:text-sm transition-all active:scale-95"
                                    >
                                        <UserPlus size={16} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">New Patient</span><span className="sm:hidden">New</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-brand-bg sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Patient Name / ID</th>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Contact</th>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Gender</th>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Reg. Date</th>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Status</th>
                                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {filteredPatients.map(patient => (
                                            <tr
                                                key={patient.id}
                                                onClick={() => setSelectedPatient(patient)}
                                                className="hover:bg-brand-bg/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm border border-brand-primary/20">
                                                            {patient.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-brand-textPrimary text-sm">{patient.name}</p>
                                                            <p className="text-xs text-brand-textSecondary font-mono">{patient.uhid}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-brand-textSecondary">{patient.mobile}</td>
                                                <td className="p-4 text-sm text-brand-textPrimary">{patient.gender}</td>
                                                <td className="p-4 text-sm text-brand-textSecondary">{patient.registrationDate}</td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                                                        {patient.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button className="text-brand-primary hover:bg-brand-primary/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                        <ArrowRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}



                {activeTab === 'conversion' && (
                    <PatientConversionForm
                        initialData={leadToConvert}
                        onSuccess={handleConversionSuccess}
                    />
                )}
            </div>

            {/* Patient Profile Overlay */}
            {selectedPatient && (
                <PatientProfile
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onPatientUpdate={fetchPatients}
                />
            )}

            {/* Book Appointment Modal */}
            <BookAppointmentModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onConfirm={handleBookingConfirm}
            />
        </div>
    );
};
