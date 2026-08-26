import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Search, Filter, UserPlus, FileText, Upload, Download, Activity, Users, Calendar, Eye, CalendarPlus, ArrowLeft } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { PatientProfile } from './PatientProfile';
import { BookAppointmentModal } from './AppointmentModals';
import { ClinicRegistrationForm } from './ClinicRegistrationForm';
import { api } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';
import { Pagination } from './Pagination';


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
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 20;

    const fetchPatients = async () => {
        try {
            const response = await api.getPatients({ 
                page: currentPage, 
                limit: itemsPerPage, 
                q: searchTerm 
            });

            // Handle pagination metadata
            if (response?.pagination) {
                setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
                setTotalItems(response.pagination.total);
            }

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
        const timeoutId = setTimeout(() => {
            fetchPatients();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [currentPage, searchTerm, filterStatus, filterGender, filterMonth]);

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
        const matchesStatus = filterStatus === 'All Patients' || (patient.status && String(patient.status).toLowerCase() === filterStatus.toLowerCase());
        const matchesGender = filterGender === 'All Genders' || (patient.gender && String(patient.gender).toLowerCase() === filterGender.toLowerCase());
        const matchesMonth = !filterMonth || (patient.registrationDate && String(patient.registrationDate).startsWith(filterMonth));

        return matchesStatus && matchesGender && matchesMonth;
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight mb-0.5">Total Patients</p>
                        <h3 className="text-xl font-black text-slate-900">{totalPatients}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-md bg-sky-50 flex items-center justify-center text-brand-primary border border-sky-100">
                        <Users size={16} />
                    </div>
                </Card>
                <Card className="p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight mb-0.5">Active Cases</p>
                        <h3 className="text-xl font-black text-slate-900">{activePatients}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Activity size={16} />
                    </div>
                </Card>
                <Card className="p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight mb-0.5">New This Month</p>
                        <h3 className="text-xl font-black text-slate-900">+{newThisMonth}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <Calendar size={16} />
                    </div>
                </Card>
            </div>

            {/* Content Area - Main List */}
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-2xs border border-brand-border overflow-hidden min-w-0">
                {/* Top Action Bar */}
                <div className="p-3 border-b border-brand-border bg-slate-50/60 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
                    
                    {/* Horizontal Filters */}
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        <div className="flex items-center w-full sm:w-auto sm:min-w-[220px]">
                            <Input
                                placeholder="Search by name, UHID, mobile..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs"
                            />
                        </div>

                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-primary transition-colors shadow-2xs cursor-pointer h-8.5">
                            <option>All Patients</option>
                            <option>Active</option>
                            <option>Discharged</option>
                            <option>Archived</option>
                        </select>

                        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-primary transition-colors shadow-2xs cursor-pointer h-8.5">
                            <option>All Genders</option>
                            <option>Female</option>
                            <option>Male</option>
                        </select>

                        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand-primary transition-colors shadow-2xs cursor-pointer h-8.5" />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
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
                            <Download size={13} className="mr-1.5" /> Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImportClick}
                            title="Import from CSV"
                        >
                            <Upload size={13} className="mr-1.5" /> Import
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsNewPatientMode(true)}
                        >
                            <UserPlus size={13} className="mr-1.5" /> New Patient
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-brand-border">
                            <tr>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Patient Name / UHID</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Contact</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Gender</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Reg. Date</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Status</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-tight text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredPatients.map((patient, idx) => (
                                <tr
                                    key={patient.id}
                                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <td className="px-3.5 py-2.5">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 rounded-md bg-sky-50 text-brand-primary flex items-center justify-center font-bold text-xs border border-sky-200">
                                                {String(patient.name).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs group-hover:text-brand-primary transition-colors">{patient.name}</p>
                                                <p className="text-[11px] text-slate-400 font-mono">{patient.uhid}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-xs text-slate-600 font-medium">{patient.mobile}</td>
                                    <td className="px-3.5 py-2.5 text-xs text-slate-800 font-medium">{patient.gender}</td>
                                    <td className="px-3.5 py-2.5 text-xs text-slate-500">{patient.registrationDate}</td>
                                    <td className="px-3.5 py-2.5">
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                             patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                             patient.status === 'Discharged' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                             'bg-slate-100 text-slate-600 border-slate-200'
                                         }`}>
                                             {patient.status}
                                         </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-brand-primary bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors flex items-center gap-1"
                                                onClick={() => setSelectedPatient(patient)}
                                            >
                                                <FileText size={12} />
                                                <span>Profile</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPatients.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Filter size={24} className="opacity-30 mb-2" />
                                            <p className="font-semibold text-xs text-slate-600">No patients found matching current filters.</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name or clear filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                    />
                </div>
            </div>

            {isNewPatientMode && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 md:p-10 py-10">
                    <ClinicRegistrationForm
                        initialData={{}} // Empty for new patient
                        onSuccess={() => {
                            setIsNewPatientMode(false);
                            fetchPatients();
                        }}
                        onCancel={() => setIsNewPatientMode(false)}
                    />
                </div>,
                document.body
            )}

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

