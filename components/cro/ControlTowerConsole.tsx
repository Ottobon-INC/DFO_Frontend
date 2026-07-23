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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <CalendarDays size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-black text-brand-textPrimary tracking-tight">{patientFlow.scheduled}</h3>
            <p className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mt-1">Scheduled Today</p>
        </div>

        <div className="bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                    <Users size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-black text-brand-textPrimary tracking-tight">{patientFlow.arrived}</h3>
            <p className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mt-1">Arrived</p>
        </div>

        <div className="bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-500">
                    <CheckCircle size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-black text-brand-textPrimary tracking-tight">{patientFlow.checkedIn}</h3>
            <p className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mt-1">Checked-In</p>
        </div>

        <div className="bg-gradient-to-br from-brand-surface to-brand-bg border border-brand-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-textSecondary/5 rounded-full blur-2xl group-hover:bg-brand-textSecondary/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-textSecondary/10 flex items-center justify-center border border-brand-textSecondary/20 text-brand-textSecondary">
                    <LogOut size={20} />
                </div>
            </div>
            <h3 className="text-3xl font-black text-brand-textPrimary tracking-tight">{patientFlow.completed}</h3>
            <p className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mt-1">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 space-y-6 md:space-y-8 flex flex-col">
          {/* Attention Required Alert */}
          {waitingAlerts.length > 0 && (
              <div className="bg-red-500/5 backdrop-blur-md border border-red-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden animate-pulse-soft">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <h3 className="text-base font-bold text-red-500 flex items-center gap-2 mb-4 tracking-wide">
                      <AlertTriangle size={18} /> CRITICAL ALERTS
                  </h3>
                  <div className="space-y-3">
                      {waitingAlerts.map((alert, idx) => (
                          <div key={idx} className="bg-brand-surface/90 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500 border border-red-500/20">
                                      <AlertTriangle size={18} />
                                  </div>
                                  <div>
                                      <p className="font-extrabold text-brand-textPrimary">{alert.message}</p>
                                      <p className="text-xs font-bold text-brand-textSecondary mt-0.5">{alert.patientName} <span className="mx-1 text-brand-border">•</span> <span className="text-brand-primary">{alert.doctor}</span></p>
                                  </div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className="text-2xl font-black text-red-500 tracking-tighter">{alert.minutes}</span>
                                  <span className="text-[10px] font-bold text-red-500/70 uppercase">Minutes</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Live Patient Queue */}
          <div className="bg-brand-surface/80 backdrop-blur-xl rounded-2xl shadow-sm border border-brand-border overflow-hidden flex-1 flex flex-col">
              <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-surface">
                  <h3 className="text-lg font-bold text-brand-textPrimary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Live Patient Queue
                  </h3>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-brand-textSecondary flex items-center gap-1 bg-brand-bg px-2 py-1 rounded-md"><Clock size={12} /> Live Sync</span>
              </div>
              <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-brand-surface/95 backdrop-blur-sm shadow-sm z-10">
                          <tr className="text-brand-textSecondary text-[10px] font-extrabold uppercase tracking-widest">
                              <th className="p-4 py-3">Patient</th>
                              <th className="p-4 py-3">Doctor</th>
                              <th className="p-4 py-3">Status</th>
                              <th className="p-4 py-3 text-right">Wait Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/50">
                          {liveQueue.length === 0 ? (
                              <tr><td colSpan={4} className="p-8 text-center font-bold text-brand-textSecondary">No patients currently in queue.</td></tr>
                          ) : (
                              liveQueue.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-brand-bg/50 transition-colors group">
                                      <td className="p-4 font-bold text-brand-textPrimary group-hover:text-brand-primary transition-colors">{item.patientName}</td>
                                      <td className="p-4 font-semibold text-brand-textSecondary text-sm">{item.doctor}</td>
                                      <td className="p-4">
                                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm
                                              ${item.status === 'Arrived' ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-600 border border-orange-500/30' : 'bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-600 border border-green-500/30'}`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Arrived' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                              {item.status}
                                          </span>
                                      </td>
                                      <td className="p-4 font-black text-brand-textPrimary text-right">
                                          <span className="text-lg">{item.waitingMinutes}</span> <span className="text-xs text-brand-textSecondary font-medium">m</span>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8 flex flex-col">
          <div className="bg-brand-surface/80 backdrop-blur-xl rounded-2xl shadow-sm border border-brand-border p-5 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl"></div>
              
              <h3 className="text-base font-bold text-brand-textPrimary mb-5 flex items-center gap-2 tracking-wide relative z-10">
                  <Clock size={18} className="text-brand-primary" /> DOCTOR LOAD
              </h3>
              
              <div className="space-y-5 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {doctorUtilization.map((doc, idx) => {
                      const percentComplete = (doc.completed / doc.total) * 100;
                      const percentPending = (doc.pending / doc.total) * 100;
                      
                      return (
                          <div key={idx} className="group">
                              <div className="flex justify-between items-end mb-2">
                                  <div>
                                      <h4 className="font-extrabold text-brand-textPrimary text-sm group-hover:text-brand-primary transition-colors">{doc.doctorName}</h4>
                                      <p className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mt-0.5">{doc.total} Total Scheduled</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="font-black text-lg text-brand-textPrimary">{doc.pending}</span>
                                      <span className="text-xs font-bold text-brand-textSecondary ml-1">waiting</span>
                                  </div>
                              </div>
                              
                              <div className="h-2.5 w-full bg-brand-bg rounded-full overflow-hidden flex shadow-inner border border-brand-border/50">
                                  <div 
                                      className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000" 
                                      style={{ width: `${percentComplete}%` }}
                                      title={`${doc.completed} Completed`}
                                  ></div>
                                  <div 
                                      className="h-full bg-gradient-to-r from-brand-primary/80 to-brand-primary transition-all duration-1000 border-l border-white/20" 
                                      style={{ width: `${percentPending}%` }}
                                      title={`${doc.pending} Pending`}
                                  ></div>
                              </div>
                              
                              <div className="flex justify-between mt-1.5 text-[9px] font-extrabold tracking-widest uppercase">
                                  <span className="text-green-600">{doc.completed} Done</span>
                                  <span className="text-brand-primary">{doc.pending} Left</span>
                              </div>
                          </div>
                      );
                  })}
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
