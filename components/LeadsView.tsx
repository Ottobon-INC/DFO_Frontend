import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, UserPlus, Phone, MessageSquare,
    ChevronRight, CheckCircle2, X,
    FileText, History, Ban, RefreshCw, Calendar, Download, Upload
} from 'lucide-react';
import { api } from '../services/api';
import { Lead } from '../types';
import { DOCTORS } from '../constants';

interface LeadsViewProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onOpenAddModal: () => void;
    initialFilter?: string;
    onRefresh?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ leads, onUpdateLead, onOpenAddModal, initialFilter = 'All', onRefresh }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null); // Store ID, not object
    const [activeTab, setActiveTab] = useState<'intake' | 'comms' | 'retention'>('intake');
    const [filterStatus, setFilterStatus] = useState<string>(initialFilter);
    const [editFormData, setEditFormData] = useState<Partial<Lead>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Derived state ensures we always have the latest data from props
    const selectedLead = leads.find(l => l.id === selectedLeadId) || null;

    // Check for deep link to specific lead via navigation state
    const location = useLocation();
    React.useEffect(() => {
        if (location.state && location.state.selectedLeadId) {
            setSelectedLeadId(location.state.selectedLeadId);
            // Clear state so it doesn't persist on refresh/back if desired (optional)
            // window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    React.useEffect(() => {
        if (selectedLead) {
            setEditFormData(selectedLead);
        }
    }, [selectedLead]);

    const handleInputChange = (field: keyof Lead, value: string) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = () => {
        if (selectedLead && editFormData) {
            // Create a complete Lead object by merging selectedLead with editFormData
            const updatedLead = { ...selectedLead, ...editFormData } as Lead;
            onUpdateLead(updatedLead);
            // No need to manually update selectedLead state as it will automatically reflect 
            // the new data from 'leads' prop once parent updates it.
        }
    };


    const filteredLeads = leads.filter(lead =>
        (filterStatus === 'All' || lead.status === filterStatus) &&
        (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm))
    );

    const handleConvert = (lead: Lead) => {
        // Navigate to patients page and pass the lead data in state
        navigate('/dashboard/patients', { state: { leadToConvert: lead } });
    };

    // --- Export Feature ---
    const handleExportCSV = () => {
        if (filteredLeads.length === 0) {
            alert('No leads to export.');
            return;
        }

        const headers = ['Name', 'Phone', 'Status', 'Source', 'Gender', 'Age', 'Problem', 'Date Added'];
        const csvRows = [
            headers.join(','),
            ...filteredLeads.map(lead => [
                `"${lead.name || ''}"`,
                `"${lead.phone || ''}"`,
                `"${lead.status || ''}"`,
                `"${lead.source || ''}"`,
                `"${lead.gender || ''}"`,
                `"${lead.age || ''}"`,
                `"${lead.problem || ''}"`,
                `"${lead.dateAdded || ''}"`
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Include filter status in filename
        const dateStr = new Date().toISOString().split('T')[0];
        const statusLabel = filterStatus === 'All' ? 'All_Leads' : filterStatus.replace(/ /g, '_');
        a.download = `JanmaSethu_Leads_${statusLabel}_${dateStr}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Import Feature ---
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
            // CSV columns match export: Name, Phone, Status, Source, Gender, Age, Problem, Date Added
            // Skipping header if detected
            const startIndex = rows[0][0].toLowerCase().includes('name') ? 1 : 0;

            let successCount = 0;
            let errorCount = 0;

            for (let i = startIndex; i < rows.length; i++) {
                const cols = rows[i].map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length < 2 || !cols[0]) continue; // Skip empty rows

                // Match export column order: Name, Phone, Status, Source, Gender, Age, Problem, Date Added
                const [name, phone, _status, source, gender, age, problem] = cols;

                // Basic validation
                if (!name || !phone) continue;

                try {
                    // Create lead with all CSV fields properly mapped
                    // Note: We trim values and keep them as strings - the backend will handle empty strings
                    const genderVal = gender ? gender.trim() : '';
                    const ageVal = age ? age.trim() : '';
                    const problemVal = problem ? problem.trim() : '';

                    const leadData: Record<string, any> = {
                        name,
                        phone,
                        source: source ? source.trim() : 'Bulk Import',
                        // Always set status to 'New Inquiry' for imported leads
                        status: 'New Inquiry',
                        inquiry: 'Bulk Import',
                        date_added: new Date().toISOString()
                    };

                    // Only add these fields if they have actual values
                    if (genderVal) leadData.gender = genderVal;
                    if (ageVal) leadData.age = ageVal;
                    if (problemVal) leadData.problem = problemVal;

                    console.log('Importing lead:', name, leadData);
                    await api.createLead(leadData);
                    successCount++;
                } catch (err) {
                    console.error('Failed to import lead:', name, err);
                    errorCount++;
                }
            }

            alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
            if (onRefresh && successCount > 0) {
                onRefresh();
            }
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 relative">
            {/* Main Table Area */}
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 min-w-0 ${selectedLead ? 'lg:w-2/3' : 'w-full'}`}>

                {/* Toolbar */}
                <div className="p-3 sm:p-4 lg:p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-brand-bg/50">
                    <div className="flex items-center bg-brand-surface px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-brand-border w-full sm:w-auto sm:max-w-xs lg:w-96 focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all shadow-sm">
                        <Search size={18} className="text-brand-textSecondary mr-2 sm:mr-3 flex-shrink-0" />
                        <input
                            placeholder="Search Leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent outline-none text-xs sm:text-sm w-full text-brand-textPrimary placeholder:text-brand-textSecondary font-medium"
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

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-brand-surface border border-brand-border text-brand-textSecondary font-bold rounded-lg sm:rounded-xl hover:bg-brand-bg flex items-center text-xs sm:text-sm outline-none focus:border-brand-primary"
                        >
                            <option value="All">All</option>
                            <option value="New Inquiry">New</option>
                            <option value="Stalling - Sent to CRO">CRO</option>
                            <option value="Converted - Active Patient">Converted</option>
                        </select>
                        <button
                            onClick={onOpenAddModal}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-lg sm:rounded-xl shadow-lg shadow-brand-primary/20 flex items-center text-xs sm:text-sm transition-all active:scale-95"
                        >
                            <UserPlus size={16} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Add Lead</span><span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-bg sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Name</th>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Status</th>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border hidden md:table-cell">Source</th>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border hidden lg:table-cell">Staff</th>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border hidden md:table-cell">Time</th>
                                <th className="p-2 sm:p-4 text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase tracking-wider border-b border-brand-border">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filteredLeads.map(lead => (
                                <tr
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`hover:bg-brand-bg/50 transition-colors cursor-pointer group ${selectedLead?.id === lead.id ? 'bg-brand-primary/10' : ''}`}
                                >
                                    <td className="p-2 sm:p-4">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-brand-bg flex items-center justify-center text-brand-textSecondary font-bold text-xs sm:text-sm border border-brand-border flex-shrink-0">
                                                {lead.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-brand-textPrimary text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{lead.name}</p>
                                                <p className="text-[10px] sm:text-xs text-brand-textSecondary truncate">{lead.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2 sm:p-4">
                                        <span className={`text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-wider border whitespace-nowrap ${lead.status === 'New Inquiry' ? 'bg-brand-warning/10 text-brand-warning border-brand-warning/20' :
                                            lead.status === 'Contacted' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                                                lead.status === 'Converted - Active Patient' ? 'bg-brand-success/10 text-brand-success border-brand-success/20' :
                                                    'bg-brand-error/10 text-brand-error border-brand-error/20'
                                            }`}>
                                            <span className="hidden sm:inline">{lead.status}</span>
                                            <span className="sm:hidden">{lead.status.split(' ')[0]}</span>
                                        </span>
                                    </td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-brand-textSecondary font-medium hidden md:table-cell">{lead.source}</td>
                                    <td className="p-2 sm:p-4 text-[10px] sm:text-xs text-brand-textSecondary font-bold hidden lg:table-cell">
                                        {lead.status.includes('CRO') ? 'CRO Anjali' : 'Front Desk'}
                                    </td>
                                    <td className="p-2 sm:p-4 text-[10px] sm:text-xs text-brand-textSecondary font-medium hidden md:table-cell">
                                        {lead.dateAdded.includes('Days') ? lead.dateAdded : 'Today'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                                                className="text-brand-primary hover:bg-brand-primary/10 p-2 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Panel (Slide-over) - Full screen on mobile */}
            {selectedLead && (
                <div className="fixed inset-0 sm:absolute sm:inset-auto sm:right-0 sm:h-full w-full sm:w-[400px] lg:w-[500px] bg-brand-surface border-l border-brand-border shadow-2xl flex flex-col animate-slide-in-right z-30">
                    <div className="p-3 sm:p-4 lg:p-6 border-b border-brand-border flex justify-between items-start bg-brand-bg/50">
                        <div className="min-w-0 flex-1 pr-2">
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-brand-textPrimary truncate">{selectedLead.name}</h2>
                            <p className="text-xs sm:text-sm text-brand-textSecondary mt-1 flex items-center"><Phone size={12} className="mr-1 flex-shrink-0" /> {selectedLead.phone}</p>
                        </div>
                        <button onClick={() => setSelectedLeadId(null)} className="text-brand-textSecondary hover:text-brand-textPrimary p-1.5 sm:p-2 rounded-full hover:bg-brand-bg transition-colors flex-shrink-0">
                            <X size={18} />
                        </button>
                    </div>


                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-brand-bg/30">
                        {activeTab === 'intake' && (
                            <div className="space-y-4 sm:space-y-6">
                                {/* Summary Box */}
                                <div className="bg-brand-surface p-3 sm:p-4 rounded-lg sm:rounded-xl border border-brand-border shadow-sm">
                                    <h3 className="text-[10px] sm:text-xs font-bold text-brand-textSecondary uppercase mb-3 sm:mb-4">Lead Summary</h3>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-brand-textSecondary uppercase">Status</p>
                                            <span className={`inline-block mt-1 text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-wider border ${selectedLead.status === 'Stalling - Sent to CRO' ? 'bg-brand-error/10 text-brand-error border-brand-error/20' : 'bg-brand-bg text-brand-textSecondary border-brand-border'}`}>
                                                <span className="hidden sm:inline">{selectedLead.status}</span>
                                                <span className="sm:hidden">{selectedLead.status.split(' ')[0]}</span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-bold text-brand-textSecondary uppercase">Created By</p>
                                            <p className="text-xs sm:text-sm font-bold text-brand-textPrimary mt-1">Front Desk</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 sm:pt-4 border-t border-brand-border flex flex-wrap gap-2 sm:gap-3">
                                        <button
                                            onClick={() => onUpdateLead({ ...selectedLead, status: 'Lost' })}
                                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-brand-error/20 text-brand-error hover:bg-brand-error/10 font-bold rounded-lg text-[10px] sm:text-xs transition-colors whitespace-nowrap"
                                            title="Mark as Lost"
                                        >
                                            <Ban size={12} className="inline mr-0.5 sm:mr-1" /><span className="hidden sm:inline">Drop</span>
                                        </button>
                                        <button
                                            onClick={() => onUpdateLead({ ...selectedLead, status: selectedLead.status === 'Stalling - Sent to CRO' ? 'Contacted' : 'Stalling - Sent to CRO' })}
                                            className={`flex-1 py-1.5 sm:py-2 font-bold rounded-lg text-[10px] sm:text-xs transition-colors border ${selectedLead.status === 'Stalling - Sent to CRO'
                                                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20'
                                                : 'bg-brand-warning/10 text-brand-warning border-brand-warning/20 hover:bg-brand-warning/20'}`}
                                        >
                                            <span className="hidden sm:inline">{selectedLead.status === 'Stalling - Sent to CRO' ? 'Return to Front Desk' : 'Send to CRO'}</span>
                                            <span className="sm:hidden">{selectedLead.status === 'Stalling - Sent to CRO' ? 'Return' : 'CRO'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/dashboard/appointments', { state: { leadToAppointment: selectedLead } });
                                            }}
                                            className="flex-1 py-1.5 sm:py-2 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-lg text-[10px] sm:text-xs transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center"
                                        >
                                            <Calendar size={12} className="mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Appointment</span><span className="sm:hidden">Book</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-bold text-brand-textSecondary uppercase">Demographics & Clinical</h3>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                                            >
                                                Edit Details
                                            </button>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="text-xs font-bold text-brand-textSecondary hover:bg-brand-bg px-2 py-1 rounded border border-brand-border transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleSaveChanges();
                                                        setIsEditing(false);
                                                    }}
                                                    className="text-xs font-bold text-brand-bg bg-brand-primary hover:bg-brand-secondary px-2 py-1 rounded transition-colors shadow-sm"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Full Name</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.name || ''}
                                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Phone</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.phone || ''}
                                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Husband/Guardian</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.husbandOrGuardianName || ''}
                                                        onChange={(e) => handleInputChange('husbandOrGuardianName', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.husbandOrGuardianName || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Alt Phone</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.alternativePhoneNumber || ''}
                                                        onChange={(e) => handleInputChange('alternativePhoneNumber', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.alternativePhoneNumber || 'N/A'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Husband Age</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.husbandAge || ''}
                                                        onChange={(e) => handleInputChange('husbandAge', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.husbandAge || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] sm:text-xs font-bold text-brand-textSecondary mb-1">Location</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.location || ''}
                                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-xs sm:text-sm font-bold text-brand-textPrimary">{selectedLead.location || 'N/A'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Age</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.age || ''}
                                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                                        placeholder="N/A"
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-bold text-brand-textPrimary">{selectedLead.age || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Gender</label>
                                                {isEditing ? (
                                                    <select
                                                        value={editFormData.gender || 'Female'}
                                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    >
                                                        <option value="Female">Female</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-sm font-bold text-brand-textPrimary">{selectedLead.gender || 'Female'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-brand-textSecondary mb-1">Presenting Problem</label>
                                            {isEditing ? (
                                                <textarea
                                                    value={editFormData.problem || ''}
                                                    onChange={(e) => handleInputChange('problem', e.target.value)}
                                                    placeholder="No details logged..."
                                                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors h-16 resize-none"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-brand-textPrimary bg-brand-bg/50 p-2 rounded-lg border border-brand-border/50">{selectedLead.problem || 'No details logged.'}</p>
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
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    >
                                                        <option value="">Select Doctor</option>
                                                        {DOCTORS.map(doc => (
                                                            <option key={doc.id} value={doc.name}>{doc.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-sm font-bold text-brand-textPrimary">{selectedLead.treatmentDoctor || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Suggested Tx</label>
                                                {isEditing ? (
                                                    <input
                                                        value={editFormData.treatmentSuggested || ''}
                                                        onChange={(e) => handleInputChange('treatmentSuggested', e.target.value)}
                                                        placeholder="N/A"
                                                        className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-bold text-brand-textPrimary">{selectedLead.treatmentSuggested || 'N/A'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>

                    {/* Footer Actions (General) */}
                    <div className="p-6 border-t border-brand-border bg-brand-bg">
                        <button
                            onClick={() => handleConvert(selectedLead)}
                            className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-xl shadow-lg shadow-brand-primary/20 flex items-center justify-center transition-all active:scale-95"
                        >
                            <CheckCircle2 size={18} className="mr-2" /> Finalize Conversion & Create Patient File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
