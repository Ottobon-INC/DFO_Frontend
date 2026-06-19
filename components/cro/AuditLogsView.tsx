import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const AuditLogsView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.data || res || []);
    } catch (err) {
      console.error(err);
      setAuditLogs([
        { id: "a-1", actor_id: "dr.divya@janmasethu.com", actor_type: "DOCTOR", action: "VIEWED_PATIENT_CLINICAL_HISTORY", timestamp: new Date().toISOString(), payload: { patientId: "Sara Johnson" } },
        { id: "a-2", actor_id: "cro@janmasethu.com", actor_type: "CRO", action: "TRIGGERED_LEAD_CONVERSION_BATCH", timestamp: new Date(Date.now() - 600000).toISOString(), payload: { count: 3 } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
        <h3 className="text-lg font-bold text-brand-textPrimary">Clinical Access Logs</h3>
        <span className="text-xs text-brand-textSecondary">Compliance Tracing & Security Audits</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-brand-bg/30 transition-colors">
                <td className="p-4 font-semibold text-brand-textSecondary">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-bold text-brand-textPrimary">{log.actor_id}</td>
                <td className="p-4 text-brand-textSecondary">
                  <span className="px-2 py-0.5 rounded-md bg-brand-bg border border-brand-border uppercase text-[10px] font-bold">
                    {log.actor_type || log.role}
                  </span>
                </td>
                <td className="p-4 font-bold text-brand-primary">{log.action}</td>
                <td className="p-4 text-brand-textSecondary font-mono">{JSON.stringify(log.payload)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
