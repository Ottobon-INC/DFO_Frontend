import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Calendar, ChevronLeft, ChevronRight, 
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let formattedEndDate = undefined;
      if (endDate) {
        formattedEndDate = `${endDate}T23:59:59+05:30`;
      }

      let formattedStartDate = undefined;
      if (startDate) {
        formattedStartDate = `${startDate}T00:00:00+05:30`;
      }

      const res = await api.getSystemAuditLogs({
        limit,
        offset: page * limit,
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });

      if (res && res.data) {
        setLogs(Array.isArray(res.data) ? res.data : []);
        setTotalCount(res.totalCount || res.count || (Array.isArray(res.data) ? res.data.length : 0));
      } else if (Array.isArray(res)) {
        setLogs(res);
        setTotalCount(res.length);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Failed to fetch audit logs", err);
      toast.error(err?.message || "Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  // Human-friendly Action Formatter
  const formatActionName = (rawAction: string) => {
    if (!rawAction) return 'System Action';
    const clean = rawAction.toLowerCase().replace(/_/g, ' ');
    return clean.replace(/\b\w/g, char => char.toUpperCase());
  };

  const getActionBadgeClass = (actionName: string) => {
    const act = (actionName || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('BOOK') || act.includes('SUCCESS') || act.includes('ADMIT')) {
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('DISCHARGE') || act.includes('FAIL')) {
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('TRANSFER')) {
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
    return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
  };

  const getRoleBadgeClass = (roleName: string) => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('doctor')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    if (r.includes('nurse')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (r.includes('admin')) return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    if (r.includes('front') || r.includes('receptionist')) return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="h-full flex flex-col space-y-5 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
                Activity & Audit Logs
              </h1>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Real-time chronological staff action history and compliance logs ({totalCount} total events)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-brand-border bg-brand-bg hover:bg-brand-surface text-brand-textPrimary transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              title="Refresh Logs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

        </div>

        {/* Filter Toolbar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 pt-4 border-t border-brand-border/60 flex flex-wrap items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-brand-textSecondary" />
            <input
              type="text"
              placeholder="Search staff name, email, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-brand-textPrimary placeholder:text-brand-textSecondary outline-none focus:border-brand-primary"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="bg-brand-bg border border-brand-border rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="">All Activities</option>
            <option value="login_success">Login Successful</option>
            <option value="create_appointment">Create Appointment</option>
            <option value="update_lead">Update Lead</option>
            <option value="CREATE_PATIENT">Create Patient</option>
            <option value="link_document">Link Document</option>
            <option value="PII_VIEW_ACCESS">PII View Access</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs text-brand-textSecondary bg-brand-bg border border-brand-border rounded-xl px-2.5 py-1">
            <Calendar size={13} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-xs text-brand-textPrimary outline-none cursor-pointer"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-xs text-brand-textPrimary outline-none cursor-pointer"
            />
          </div>

          {(search || actionFilter || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setStartDate('');
                setEndDate('');
                setPage(0);
              }}
              className="text-xs font-bold text-brand-primary hover:underline px-1"
            >
              Reset
            </button>
          )}

        </form>
      </div>

      {/* Main Table (Clean 4 Columns) */}
      <div className="flex-1 bg-brand-surface rounded-2xl border border-brand-border overflow-hidden shadow-xs flex flex-col">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/80 border-b border-brand-border text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
                <th className="p-3.5 px-6">Date & Time</th>
                <th className="p-3.5 px-6">Staff / Actor</th>
                <th className="p-3.5 px-6">Role</th>
                <th className="p-3.5 px-6 text-right">Activity</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-brand-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-brand-textSecondary">
                    <div className="w-7 h-7 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs">Loading activity logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-brand-textSecondary">
                    <ShieldCheck size={32} className="mx-auto text-brand-textSecondary/40 mb-2" />
                    <p className="font-bold text-sm text-brand-textPrimary">No Activity Found</p>
                    <p className="text-xs mt-0.5">No log entries matching the selected filters.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const timestamp = new Date(log.created_at || log.timestamp || new Date()).toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const actorName = log.actor_name || log.actor_email || log.actor_id || 'System';
                  const actorRole = log.actor_role || log.actor_type || log.role || 'Staff';
                  const actionName = log.action || 'ACCESS';

                  return (
                    <tr key={log.id} className="hover:bg-brand-bg/40 transition-colors">
                      <td className="p-3.5 px-6 font-mono text-[11px] text-brand-textSecondary whitespace-nowrap">
                        {timestamp}
                      </td>

                      <td className="p-3.5 px-6">
                        <div className="font-bold text-brand-textPrimary">{actorName}</div>
                        {log.actor_email && log.actor_email !== actorName && (
                          <div className="text-[10px] text-brand-textSecondary">{log.actor_email}</div>
                        )}
                      </td>

                      <td className="p-3.5 px-6 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getRoleBadgeClass(actorRole)}`}>
                          {actorRole}
                        </span>
                      </td>

                      <td className="p-3.5 px-6 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-flex items-center gap-1.5 ${getActionBadgeClass(actionName)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {formatActionName(actionName)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && logs.length > 0 && (
          <div className="p-3.5 px-6 border-t border-brand-border bg-brand-bg/40 flex items-center justify-between text-xs">
            <span className="text-brand-textSecondary">
              Showing <strong>{page * limit + 1}</strong> to <strong>{Math.min((page + 1) * limit, totalCount)}</strong> of <strong>{totalCount}</strong> records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-textPrimary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-bg transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              
              <span className="px-2.5 font-bold text-brand-textPrimary">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-textPrimary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-bg transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
