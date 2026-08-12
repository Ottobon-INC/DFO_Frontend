import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, UserPlus, FileText, Upload, Download, Activity, Users, Calendar, Eye, CalendarPlus, ArrowLeft } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { PatientProfile } from './PatientProfile';
import { BookAppointmentModal } from './AppointmentModals';
import { ClinicRegistrationForm } from './ClinicRegistrationForm';
import { api } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';import toast from 'react-hot-toast';


interface PatientsViewProps {
    onNavigateToLeads: () => void;
    userRole?: string;
}

export const PatientsView: React.FC<PatientsViewProps> = ({ onNavigateToLeads, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All Patients');
    const [filterGender, setFilterGender] = useState('All Genders');
    const [filterMonth, setFilterMonth] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isNewPatientMode, setIsNewPatientMode] = useState(false);
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
            toast('No patients to export.');
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

            toast.error(`Import Complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
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
            (patient.name && String(patient.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.id && String(patient.id).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (patient.mobile && String(patient.mobile).includes(searchTerm)) ||
            (patient.uhid && String(patient.uhid).toLowerCase().includes(searchTerm.toLowerCase()))
        );
        const matchesStatus = filterStatus === 'All Patients' || (patient.status && String(patient.status).toLowerCase() === filterStatus.toLowerCase());
        const matchesGender = filterGender === 'All Genders' || (patient.gender && String(patient.gender).toLowerCase() === filterGender.toLowerCase());
        const matchesMonth = !filterMonth || (patient.registrationDate && String(patient.registrationDate).startsWith(filterMonth));

        return matchesSearch && matchesStatus && matchesGender && matchesMonth;
    });

    const handleBookingConfirm = (details: unknown) => {
        console.log('Booking confirmed for:', patientForBooking?.name, details);
        setIsBookingModalOpen(false);
        setPatientForBooking(null);
    };

    // Calculate Summary Metrics
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'Active').length;
    const currentMonth = new Date().toISOString().substring(0, 7);
    const newThisMonth = patients.filter(p => p.registrationDate && p.registrationDate.startsWith(currentMonth)).length;

    return (
        <div className="flex flex-col h-full gap-4 lg:gap-6 relative">
            
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">Total Patients</p>
                        <h3 className="text-2xl font-bold text-brand-textPrimary">{totalPatients}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <Users size={20} />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">Active Cases</p>
                        <h3 className="text-2xl font-bold text-brand-textPrimary">{activePatients}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                        <Activity size={20} />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">New This Month</p>
                        <h3 className="text-2xl font-bold text-brand-textPrimary">+{newThisMonth}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Calendar size={20} />
                    </div>
                </Card>
            </div>

            {/* Content Area - Main List */}
            <div className="flex-1 flex flex-col bg-brand-surface rounded-xl shadow-sm border border-brand-border overflow-hidden min-w-0">
                {/* Top Action Bar (Merged Filters and Actions) */}
                <div className="p-4 border-b border-brand-border bg-brand-bg/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    
                    {/* Horizontal Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center w-full sm:w-auto sm:min-w-[200px]">
                            <Input
                                placeholder="Search by name, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-9 text-sm"
                            />
                        </div>

                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary transition-colors shadow-sm cursor-pointer h-9">
                            <option>All Patients</option>
                            <option>Active</option>
                            <option>Discharged</option>
                            <option>Archived</option>
                        </select>

                        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary transition-colors shadow-sm cursor-pointer h-9">
                            <option>All Genders</option>
                            <option>Female</option>
                            <option>Male</option>
                        </select>

                        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm font-medium text-brand-textPrimary outline-none focus:border-brand-primary transition-colors shadow-sm cursor-pointer h-9" />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        {!isNewPatientMode && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportCSV}
                                    title="Export to CSV"
                                >
                                    <Download size={14} className="mr-2" /> Export
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleImportClick}
                                    title="Import from CSV"
                                >
                                    <Upload size={14} className="mr-2" /> Import
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsNewPatientMode(true)}
                                >
                                    <UserPlus size={14} className="mr-2" /> New Patient
                                </Button>
                            </>
                        )}
                        {isNewPatientMode && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsNewPatientMode(false)}
                            >
                                <ArrowLeft size={14} className="mr-2" /> Back to List
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table or New Patient Form */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {isNewPatientMode ? (
                        <div className="flex flex-col h-full overflow-hidden relative">
                            <ClinicRegistrationForm
                                initialData={{}} // Empty for new patient
                                onSuccess={() => {
                                    setIsNewPatientMode(false);
                                    fetchPatients();
                                }}
                                onCancel={() => setIsNewPatientMode(false)}
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-brand-bg sticky top-0 z-10 shadow-sm border-b border-brand-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Patient Name / ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Gender</th>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Reg. Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-brand-textSecondary uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border bg-brand-surface">
                            {filteredPatients.map((patient, idx) => (
                                <tr
                                    key={patient.id}
                                    className={`hover:bg-brand-hover transition-colors group ${idx % 2 === 0 ? 'bg-transparent' : 'bg-brand-bg/30'}`}
                                >
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm border border-brand-primary/20 shadow-sm">
                                                {String(patient.name).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-textPrimary text-sm group-hover:text-brand-primary transition-colors">{patient.name}</p>
                                                <p className="text-xs text-brand-textSecondary font-mono mt-0.5">{patient.uhid}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-brand-textSecondary">{patient.mobile}</td>
                                    <td className="px-6 py-4 text-sm text-brand-textPrimary font-medium">{patient.gender}</td>
                                    <td className="px-6 py-4 text-sm text-brand-textSecondary font-medium">{patient.registrationDate}</td>
                                    <td className="px-6 py-4">
                                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                                             patient.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                                             patient.status === 'Discharged' ? 'bg-blue-100 text-brand-primary border-blue-200' :
                                             'bg-brand-hover text-brand-textSecondary border-brand-border'
                                         }`}>
                                             {patient.status}
                                         </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}
                                            >
                                                <FileText size={14} className="mr-1.5" />
                                                <span>File</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPatients.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-brand-textSecondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <Filter size={32} className="opacity-20 mb-3" />
                                            <p className="font-medium text-sm">No patients found matching the current filters.</p>
                                            <p className="text-xs mt-1 opacity-70">Try adjusting your search or clearing the filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {/* Patient Profile Overlay */}
            {selectedPatient && (
                <PatientProfile
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onPatientUpdate={fetchPatients}
                    userRole={userRole}
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
