import React, { useState, useEffect } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { api } from '../services/api';

export const StaffActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [action, setAction] = useState('');
    const [targetTable, setTargetTable] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    // Modal
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Apply IST end of day cutoff if endDate is provided
            let formattedEndDate = undefined;
            if (endDate) {
                // Construct a date object representing the end of the selected day in IST
                // Simplest approach: append T23:59:59+05:30 to the YYYY-MM-DD string
                formattedEndDate = `${endDate}T23:59:59+05:30`;
            }

            let formattedStartDate = undefined;
            if (startDate) {
                formattedStartDate = `${startDate}T00:00:00+05:30`;
            }

            const res = await api.getSystemAuditLogs({
                limit,
                offset: page * limit,
                search: search || undefined,
                action: action || undefined,
                target_table: targetTable || undefined,
                start_date: formattedStartDate,
                end_date: formattedEndDate
            });
            if (res && res.data) {
                setLogs(res.data);
                setTotalCount(res.totalCount || 0);
            } else {
                setLogs([]);
                setTotalCount(0);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch activity logs. Access denied or server error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [search, action, targetTable, startDate, endDate, page]);

    const getActionColor = (act: string) => {
        if (act === 'CREATE') return 'bg-green-100 text-green-800 border-green-200';
        if (act === 'DELETE') return 'bg-red-100 text-red-800 border-red-200';
        if (act === 'UPDATE') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-brand-bg text-brand-textSecondary border-brand-border';
    };

    const exportToCSV = () => {
        if (!logs.length) return;
        const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Record Type', 'Record ID', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                `"${new Date(log.created_at).toISOString()}"`,
                `"${log.actor_name}"`,
                `"${log.actor_role}"`,
                `"${log.action}"`,
                `"${log.entity_name}"`,
                `"${log.entity_id}"`,
                `"${log.ip_address || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="animate-fade-in flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-brand-textPrimary">Staff Activity History</h2>
                    <p className="text-brand-textSecondary mt-1">Track actions and security events securely.</p>
                </div>
                <button 
                    onClick={exportToCSV}
                    disabled={logs.length === 0}
                    className="text-brand-textSecondary font-bold text-sm border border-brand-border px-4 py-2 rounded-lg hover:bg-brand-bg flex items-center disabled:opacity-50"
                >
                    <Download size={18} className="mr-2" /> Export
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff or records..."
                        className="w-full bg-brand-surface border border-brand-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center space-x-2">
                    <input
                        type="date"
                        className="bg-brand-surface border border-brand-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-brand-primary text-brand-textSecondary"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                    <span className="text-brand-textSecondary text-sm">to</span>
                    <input
                        type="date"
                        className="bg-brand-surface border border-brand-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-brand-primary text-brand-textSecondary"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                
                <select
                    className="bg-brand-surface border border-brand-border rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-brand-primary"
                    value={action}
                    onChange={e => setAction(e.target.value)}
                >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                </select>

                <select
                    className="bg-brand-surface border border-brand-border rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-brand-primary"
                    value={targetTable}
                    onChange={e => setTargetTable(e.target.value)}
                >
                    <option value="">All Records</option>
                    <option value="patients">Patients</option>
                    <option value="sakhi_clinic_appointments">Appointments</option>
                    <option value="sakhi_clinic_users">Staff Users</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mb-4">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="border border-brand-border rounded-xl overflow-hidden bg-brand-surface flex-1">
                <table className="w-full text-left">
                    <thead className="bg-brand-bg border-b border-brand-border">
                        <tr>
                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Timestamp (IST)</th>
                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Staff Member</th>
                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Action</th>
                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Record Type</th>
                            <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-sm">
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-brand-textSecondary">
                                    <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-brand-textSecondary">No activity logs found.</td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-brand-bg/30 transition-colors">
                                    <td className="p-4 font-medium text-brand-textSecondary">
                                        {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-brand-textPrimary">{log.actor_name}</span>
                                            <span className="px-2 py-0.5 bg-brand-bg text-brand-textSecondary text-[10px] font-bold rounded uppercase border border-brand-border">
                                                {log.actor_role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-brand-textSecondary capitalize font-medium">{log.entity_name?.replace(/_/g, ' ') || 'Unknown'}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-1.5 text-brand-textSecondary hover:text-brand-primary hover:bg-brand-bg rounded-lg transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-brand-textSecondary">
                    Showing {logs.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, totalCount)} of {totalCount} logs
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="p-2 border border-brand-border rounded-lg disabled:opacity-50 hover:bg-brand-bg"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * limit >= totalCount || loading}
                        className="p-2 border border-brand-border rounded-lg disabled:opacity-50 hover:bg-brand-bg"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* JSON Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-brand-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-scale-up flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-brand-border flex justify-between items-center">
                            <h3 className="text-xl font-bold text-brand-textPrimary">Log Details</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-brand-textSecondary hover:text-brand-primary">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-brand-textSecondary font-bold mb-1">RECORD TYPE</p>
                                    <p className="font-semibold text-brand-textPrimary capitalize">{selectedLog.entity_name?.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-brand-textSecondary font-bold mb-1">RECORD ID</p>
                                    <p className="font-mono text-sm text-brand-textPrimary">{selectedLog.entity_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-brand-textSecondary font-bold mb-1">IP ADDRESS</p>
                                    <p className="font-mono text-sm text-brand-textPrimary">{selectedLog.ip_address || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-brand-border">
                                {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                                    <div>
                                        <p className="text-xs text-red-600 font-bold mb-2">BEFORE (OLD VALUES)</p>
                                        <pre className="bg-red-50 p-4 rounded-xl text-xs overflow-x-auto text-red-900 font-mono border border-red-100">
                                            {JSON.stringify(selectedLog.old_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                                    <div>
                                        <p className="text-xs text-green-600 font-bold mb-2">AFTER (NEW VALUES)</p>
                                        <pre className="bg-green-50 p-4 rounded-xl text-xs overflow-x-auto text-green-900 font-mono border border-green-100">
                                            {JSON.stringify(selectedLog.new_values, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
