import React from 'react';
import { TrendingUp, Users, Activity, ArrowUpRight, PieChart } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
    return (
        <div className="flex flex-col h-full gap-4 sm:gap-6 lg:gap-8 overflow-y-auto custom-scrollbar p-1 sm:p-2">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
                <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-textPrimary">Strategic Analytics</h2>
                    <p className="text-xs sm:text-sm text-brand-textSecondary mt-1">Performance metrics and conversion insights.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select className="bg-brand-surface border border-brand-border text-brand-textSecondary text-xs sm:text-sm font-bold py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl outline-none focus:border-brand-primary">
                        <option>Last 30 Days</option>
                        <option>This Quarter</option>
                        <option>Year to Date</option>
                    </select>
                    <button className="bg-brand-primary/10 text-brand-primary text-xs sm:text-sm font-bold py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl hover:bg-brand-primary/20 transition-colors border border-brand-primary/20 whitespace-nowrap">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Report 1: Funnel Performance */}
            <div className="bg-brand-surface p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-brand-border shadow-sm">
                <h3 className="font-bold text-sm sm:text-base text-brand-textPrimary mb-4 sm:mb-6 flex items-center">
                    <Activity size={18} className="mr-2 text-brand-primary" /> Conversion Funnel Performance
                </h3>
                <div className="flex items-end justify-between space-x-2 sm:space-x-4 h-48 sm:h-56 lg:h-64 px-2 sm:px-4 lg:px-8 overflow-x-auto">
                    {/* Funnel Bars */}
                    <FunnelBar label="New Leads" count={120} height="h-full" color="bg-brand-bg" dropOff="0%" />
                    <ArrowUpRight className="text-brand-textSecondary mb-24 sm:mb-28 lg:mb-32 hidden sm:block flex-shrink-0" size={16} />
                    <FunnelBar label="1st Consult" count={85} height="h-3/4" color="bg-brand-primary/20" dropOff="-29%" />
                    <ArrowUpRight className="text-brand-textSecondary mb-16 sm:mb-20 lg:mb-24 hidden sm:block flex-shrink-0" size={16} />
                    <FunnelBar label="Follow-up / CRO" count={60} height="h-1/2" color="bg-brand-secondary/20" dropOff="-29%" />
                    <ArrowUpRight className="text-brand-textSecondary mb-12 sm:mb-14 lg:mb-16 hidden sm:block flex-shrink-0" size={16} />
                    <FunnelBar label="Converted Patient" count={42} height="h-1/3" color="bg-brand-primary" dropOff="-30%" isFinal />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Report 2: Source ROI */}
                <div className="bg-brand-surface p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-brand-border shadow-sm">
                    <h3 className="font-bold text-sm sm:text-base text-brand-textPrimary mb-4 sm:mb-6 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-brand-primary" /> Lead Source ROI
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                        <SourceBar label="Sakhi App Referral" count={45} total={120} color="bg-pink-500" />
                        <SourceBar label="Google Ads" count={30} total={120} color="bg-blue-500" />
                        <SourceBar label="Walk-Ins" count={25} total={120} color="bg-brand-success" />
                        <SourceBar label="Social Media" count={20} total={120} color="bg-purple-500" />
                    </div>
                </div>

                {/* Report 4: Reasons for Loss */}
                <div className="bg-brand-surface p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-brand-border shadow-sm">
                    <h3 className="font-bold text-sm sm:text-base text-brand-textPrimary mb-4 sm:mb-6 flex items-center">
                        <PieChart size={18} className="mr-2 text-brand-error" /> Reasons for Loss
                    </h3>
                    <div className="flex items-center justify-center h-40 sm:h-44 lg:h-48">
                        {/* Simple Visual Representation instead of actual Pie Chart */}
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-[8px] sm:border-[10px] lg:border-[12px] border-brand-error/20 border-t-brand-error flex items-center justify-center">
                                    <span className="font-bold text-sm sm:text-base text-brand-textPrimary">45%</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-brand-textSecondary mt-2 text-center">Financial Issues</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-[6px] sm:border-[8px] lg:border-[10px] border-brand-warning/20 border-t-brand-warning flex items-center justify-center">
                                    <span className="font-bold text-sm sm:text-base text-brand-textPrimary">30%</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-brand-textSecondary mt-2 text-center">Disengagement</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-[5px] sm:border-[6px] lg:border-[8px] border-brand-bg border-t-brand-textSecondary flex items-center justify-center">
                                    <span className="font-bold text-xs sm:text-sm text-brand-textPrimary">25%</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold text-brand-textSecondary mt-2 text-center">Other</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report 3: Staff Efficiency */}
            <div className="bg-brand-surface p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-brand-border shadow-sm">
                <h3 className="font-bold text-sm sm:text-base text-brand-textPrimary mb-4 sm:mb-6 flex items-center">
                    <Users size={18} className="mr-2 text-brand-primary" /> Staff Efficiency
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <StaffCard name="CRO Anjali" role="CRO Lead" leads={45} conversion="68%" avgTime="2 Days" />
                    <StaffCard name="Front Desk Priya" role="Reception" leads={120} conversion="45%" avgTime="1 Day" />
                    <StaffCard name="Nurse Sarah" role="Care Coordinator" leads={30} conversion="80%" avgTime="4 Days" />
                </div>
            </div>
        </div>
    );
};

const FunnelBar: React.FC<{ label: string; count: number; height: string; color: string; dropOff: string; isFinal?: boolean }> = ({ label, count, height, color, dropOff, isFinal }) => (
    <div className="flex flex-col items-center justify-end h-full w-full group">
        <div className={`w-full ${height} ${color} rounded-t-xl relative flex items-end justify-center pb-4 transition-all group-hover:opacity-90`}>
            <span className={`font-bold ${isFinal ? 'text-brand-bg' : 'text-brand-textPrimary'} text-xl`}>{count}</span>
        </div>
        <div className="text-center mt-3">
            <p className="text-xs font-bold text-brand-textSecondary uppercase">{label}</p>
            {!isFinal && <p className="text-xs font-bold text-brand-error mt-1">{dropOff}</p>}
        </div>
    </div>
);

const SourceBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => (
    <div>
        <div className="flex justify-between text-xs font-bold text-brand-textSecondary mb-1">
            <span>{label}</span>
            <span>{Math.round((count / total) * 100)}% ({count})</span>
        </div>
        <div className="w-full h-2 bg-brand-bg rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${(count / total) * 100}%` }}></div>
        </div>
    </div>
);

const StaffCard: React.FC<{ name: string; role: string; leads: number; conversion: string; avgTime: string }> = ({ name, role, leads, conversion, avgTime }) => (
    <div className="p-4 border border-brand-border rounded-xl bg-brand-bg hover:border-brand-primary transition-colors">
        <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-brand-textSecondary">
                {name.charAt(0)}
            </div>
            <div>
                <p className="font-bold text-brand-textPrimary text-sm">{name}</p>
                <p className="text-xs text-brand-textSecondary">{role}</p>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
            <div>
                <p className="text-[10px] font-bold text-brand-textSecondary uppercase">Leads</p>
                <p className="font-bold text-brand-textPrimary">{leads}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold text-brand-textSecondary uppercase">Conv. Rate</p>
                <p className="font-bold text-brand-primary">{conversion}</p>
            </div>
            <div>
                <p className="text-[10px] font-bold text-brand-textSecondary uppercase">Avg Time</p>
                <p className="font-bold text-brand-textPrimary">{avgTime}</p>
            </div>
        </div>
    </div>
);
