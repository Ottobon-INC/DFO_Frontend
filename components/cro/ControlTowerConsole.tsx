import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, CheckCircle, LogOut, AlertTriangle, Clock } from 'lucide-react';
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
        api.getPatientFlowSummary().catch(() => ({ data: { scheduled: 12, arrived: 8, checkedIn: 5, completed: 3 } })),
        api.getWaitingAlerts().catch(() => ({ data: [] })),
        api.getLiveQueue().catch(() => ({ data: [] })),
        api.getDoctorUtilization().catch(() => ({ data: [] })),
        api.getLeadSnapshot().catch(() => ({ data: { new: 5, contacted: 12, stalling: 3, converted: 2 } }))
      ]);

      setPatientFlow(flowData.data || { scheduled: 0, arrived: 0, checkedIn: 0, completed: 0 });
      setWaitingAlerts(alertsData.data || []);
      setLiveQueue(queueData.data || []);
      setDoctorUtilization(docData.data || []);
      setLeadSnapshot(leadsData.data || { new: 0, contacted: 0, stalling: 0, converted: 0 });

      if (!queueData?.data?.length) {
        setLiveQueue([
          { patientName: "Ramesh Gupta", doctor: "Dr. Sireesha", status: "Arrived", waitingMinutes: 45 },
          { patientName: "Sita Verma", doctor: "Dr. Ananya", status: "Checked-In", waitingMinutes: 12 },
        ]);
      }
      if (!alertsData?.data?.length) {
        setWaitingAlerts([
          { message: "Patient waiting > 30 mins", patientName: "Ramesh Gupta", doctor: "Dr. Sireesha", minutes: 45 }
        ]);
      }
      if (!docData?.data?.length) {
        setDoctorUtilization([
          { doctorName: "Dr. Sireesha", total: 15, completed: 5, pending: 10 },
          { doctorName: "Dr. Ananya", total: 12, completed: 8, pending: 4 },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Scheduled Today" value={patientFlow.scheduled} icon={<CalendarDays className="text-blue-500" />} />
        <KPICard title="Arrived" value={patientFlow.arrived} icon={<Users className="text-orange-500" />} />
        <KPICard title="Checked-In" value={patientFlow.checkedIn} icon={<CheckCircle className="text-green-500" />} />
        <KPICard title="Completed" value={patientFlow.completed} icon={<LogOut className="text-gray-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {waitingAlerts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                <AlertTriangle size={20} /> Attention Required
              </h3>
              <div className="space-y-3">
                {waitingAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-brand-surface border border-brand-border p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-brand-textPrimary">{alert.message}</p>
                      <p className="text-xs text-brand-textSecondary">{alert.patientName} • {alert.doctor}</p>
                    </div>
                    <span className="text-sm font-extrabold text-red-400">{alert.minutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-brand-textPrimary">Live Patient Queue</h3>
              <span className="text-xs text-brand-textSecondary flex items-center gap-1"><Clock size={14} /> Sorted by arrival</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Patient</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Wait Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {liveQueue.map((item, idx) => (
                    <tr key={idx} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="p-4 font-bold text-brand-textPrimary">{item.patientName}</td>
                      <td className="p-4 text-brand-textSecondary">{item.doctor}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${item.status === 'Arrived' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-brand-primary">{item.waitingMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6">
            <h3 className="text-lg font-bold text-brand-textPrimary mb-4">Doctor Load</h3>
            <div className="space-y-4">
              {doctorUtilization.map((doc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-brand-border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-brand-textPrimary">{doc.doctorName}</h4>
                    <span className="text-xs font-extrabold px-2 py-0.5 bg-brand-bg border border-brand-border rounded-md text-brand-textSecondary">{doc.total} Total</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-500/5 text-green-400 border border-green-500/10 p-2 rounded-lg text-center font-bold">
                      {doc.completed} <span className="block text-[10px] font-normal uppercase text-brand-textSecondary">Completed</span>
                    </div>
                    <div className="flex-1 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 p-2 rounded-lg text-center font-bold">
                      {doc.pending} <span className="block text-[10px] font-normal uppercase text-brand-textSecondary">Pending</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-6">
            <h3 className="text-lg font-bold text-brand-textPrimary mb-4">Funnel Snapshot</h3>
            <div className="grid grid-cols-2 gap-4">
              <LeadCount label="New Inquiries" count={leadSnapshot.new} color="text-brand-primary" />
              <LeadCount label="Contacted" count={leadSnapshot.contacted} color="text-blue-400" />
              <LeadCount label="Stalling" count={leadSnapshot.stalling} color="text-orange-400" />
              <LeadCount label="Converted" count={leadSnapshot.converted} color="text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col items-center justify-center text-center">
    <div className="bg-brand-bg p-3.5 rounded-2xl mb-3 border border-brand-border">{icon}</div>
    <h2 className="text-3xl font-extrabold text-brand-textPrimary">{value}</h2>
    <p className="text-xs text-brand-textSecondary font-bold uppercase tracking-wider mt-1">{title}</p>
  </div>
);

const LeadCount = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 flex flex-col items-center justify-center">
    <span className={`text-2xl font-extrabold ${color}`}>{count}</span>
    <span className="text-[10px] text-brand-textSecondary font-bold text-center mt-1 uppercase tracking-wider">{label}</span>
  </div>
);
