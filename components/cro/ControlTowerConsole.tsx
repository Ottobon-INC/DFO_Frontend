import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Users, CheckCircle2, AlertTriangle, Clock, 
  RefreshCw, TrendingUp, ShieldCheck, ArrowRight, UserCheck, CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';

export const ControlTowerConsole: React.FC = () => {
  const [patientFlow, setPatientFlow] = useState({ scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 });
  const [waitingAlerts, setWaitingAlerts] = useState<any[]>([]);
  const [liveQueue, setLiveQueue] = useState<any[]>([]);
  const [doctorUtilization, setDoctorUtilization] = useState<any[]>([]);
  const [leadSnapshot, setLeadSnapshot] = useState({ new: 0, contacted: 0, stalling: 0, converted: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [flowData, alertsData, queueData, docData, leadsData] = await Promise.all([
        api.getPatientFlowSummary().catch(() => ({ scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 })),
        api.getWaitingAlerts().catch(() => ({ thresholdMinutes: 30, count: 0, patients: [] })),
        api.getLiveQueue().catch(() => ([])),
        api.getDoctorUtilization().catch(() => ([])),
        api.getLeadSnapshot().catch(() => ({ new: 0, contacted: 0, stalling: 0, converted: 0 }))
      ]);

      setPatientFlow(flowData || { scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 });
      setWaitingAlerts(alertsData?.patients || (Array.isArray(alertsData) ? alertsData : []));
      setLiveQueue(Array.isArray(queueData) ? queueData : []);
      setDoctorUtilization(Array.isArray(docData) ? docData : []);
      setLeadSnapshot(leadsData?.data || leadsData || { new: 0, contacted: 0, stalling: 0, converted: 0 });
    } catch (err) {
      console.error("Control tower data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        
        {/* Scheduled Today */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-textSecondary block mb-1">
              Scheduled Today
            </span>
            <span className="text-3xl font-extrabold text-brand-textPrimary">
              {patientFlow.scheduled}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
        </div>

        {/* Arrived */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-textSecondary block mb-1">
              Arrived
            </span>
            <span className="text-3xl font-extrabold text-brand-textPrimary">
              {patientFlow.arrived}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-textSecondary block mb-1">
              Checked In
            </span>
            <span className="text-3xl font-extrabold text-brand-textPrimary">
              {patientFlow.checkedIn}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-textSecondary block mb-1">
              Completed
            </span>
            <span className="text-3xl font-extrabold text-brand-textPrimary">
              {patientFlow.completed}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
        </div>

      </div>

      {/* Main Grid: Left Queue & Alerts, Right Doctor Load & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Alerts & Live Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Critical Waiting Alerts */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className={waitingAlerts.length > 0 ? "text-rose-500" : "text-brand-textSecondary"} />
                <h3 className="text-sm font-bold text-brand-textPrimary uppercase tracking-wider">
                  Critical Queue Alerts
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${waitingAlerts.length > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-brand-bg text-brand-textSecondary border-brand-border"}`}>
                {waitingAlerts.length} {waitingAlerts.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>

            {waitingAlerts.length === 0 ? (
              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-brand-textSecondary">
                  ✨ All patient waiting times are within normal operational limits (&lt; 30 mins).
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {waitingAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-textPrimary">{alert.patientName}</h4>
                        <p className="text-[11px] text-brand-textSecondary">{alert.doctorName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      {alert.waitingMinutes} mins wait
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Patient Queue Table */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 px-5 border-b border-brand-border flex items-center justify-between bg-brand-bg/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textPrimary">
                  Live Patient Queue
                </h3>
              </div>
              <button
                onClick={fetchData}
                className="text-xs text-brand-textSecondary hover:text-brand-textPrimary flex items-center gap-1 font-medium transition-colors"
              >
                <RefreshCw size={12} />
                <span>Sync</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/60 border-b border-brand-border text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
                    <th className="p-3.5 px-5">Patient</th>
                    <th className="p-3.5">Doctor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-5">Wait Time</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-border text-xs">
                  {liveQueue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-brand-textSecondary">
                        <Users size={28} className="mx-auto text-brand-textSecondary/40 mb-2" />
                        <p className="font-bold text-sm text-brand-textPrimary">No Patients in Active Queue</p>
                        <p className="text-xs mt-0.5">Checked-in or arrived patients for today will appear here in real-time.</p>
                      </td>
                    </tr>
                  ) : (
                    liveQueue.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg/40 transition-colors">
                        <td className="p-3.5 px-5 font-bold text-brand-textPrimary">
                          {item.patientName}
                        </td>
                        <td className="p-3.5 text-brand-textSecondary font-medium">
                          {item.doctor}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1 ${
                            item.status === 'Arrived' 
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5 font-mono text-brand-textPrimary font-semibold">
                          {item.waitingMinutes} <span className="text-[10px] text-brand-textSecondary">mins</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Doctor Load & Funnel Snapshot */}
        <div className="space-y-6">
          
          {/* Doctor Load */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-brand-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textPrimary">
                Doctor Schedule Load
              </h3>
            </div>

            {doctorUtilization.length === 0 ? (
              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-6 text-center">
                <p className="text-xs font-semibold text-brand-textSecondary">
                  No appointments scheduled for doctors today.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {doctorUtilization.map((doc, idx) => {
                  const percentComplete = doc.total > 0 ? (doc.completed / doc.total) * 100 : 0;
                  
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-textPrimary">{doc.doctorName}</span>
                        <span className="font-mono text-brand-textSecondary text-[11px]">
                          {doc.completed}/{doc.total} ({doc.pending} left)
                        </span>
                      </div>

                      <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                        <div 
                          className="h-full bg-brand-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentComplete}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Funnel Snapshot */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textPrimary mb-4">
              Inquiry Pipeline Snapshot
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-bg border border-brand-border rounded-xl p-3.5 text-center">
                <span className="text-2xl font-extrabold text-blue-500 block">
                  {leadSnapshot.new}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary mt-0.5 block">
                  New Inquiries
                </span>
              </div>

              <div className="bg-brand-bg border border-brand-border rounded-xl p-3.5 text-center">
                <span className="text-2xl font-extrabold text-purple-500 block">
                  {leadSnapshot.contacted}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary mt-0.5 block">
                  Contacted
                </span>
              </div>

              <div className="bg-brand-bg border border-brand-border rounded-xl p-3.5 text-center">
                <span className="text-2xl font-extrabold text-amber-500 block">
                  {leadSnapshot.stalling}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary mt-0.5 block">
                  In Progress
                </span>
              </div>

              <div className="bg-brand-bg border border-brand-border rounded-xl p-3.5 text-center">
                <span className="text-2xl font-extrabold text-emerald-500 block">
                  {leadSnapshot.converted}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary mt-0.5 block">
                  Converted
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
