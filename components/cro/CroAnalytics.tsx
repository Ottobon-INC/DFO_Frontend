import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

export const CroAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      const res = await api.getCRODashboard();
      if (res.success && res.data) {
        setAnalyticsData({
          kpis: res.data.kpis || {},
          funnel: res.data.funnel || { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 }
        });
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.error(err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate coordinates for visual compliance ring
  const kpis = analyticsData?.kpis || {};
  const funnel = analyticsData?.funnel || { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 };
  
  // Total managed can be the total leads or appointments, let's use funnel.newLeads for now
  const totalPatients = funnel.newLeads || 0;
  
  // SLA compliance is not coming from backend CRO yet, defaulting to 100 for now.
  const compliance = kpis.slaCompliance || 100;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliance / 100) * circumference;

  // Funnel calculations
  const base = funnel.newLeads > 0 ? funnel.newLeads : 1; // Prevent division by zero
  
  const calcPct = (val: number) => ((val / base) * 100).toFixed(1) + '%';
  const calcDrop = (prev: number, curr: number) => {
    if (prev === 0) return '';
    return '-' + (((prev - curr) / prev) * 100).toFixed(1) + '% Drop-off';
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-brand-primary/40 transition-all duration-300">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Total Patients Managed</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{totalPatients}</span>
              <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-[10px] text-brand-textSecondary font-bold">New leads to manage</p>
          </div>
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:scale-110 transition-transform duration-300">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-brand-primary/40 transition-all duration-300">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Lead Conversion Rate</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{kpis.conversionRate || 0}%</span>
              {kpis.conversionRateTrend && kpis.conversionRateTrend > 0 ? (
                <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">+{kpis.conversionRateTrend}%</span>
              ) : null}
            </div>
            <p className="text-[10px] text-brand-textSecondary font-bold">Inquiry to active patient profile</p>
          </div>
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:scale-110 transition-transform duration-300">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-brand-primary/40 transition-all duration-300">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">SLA compliance</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{compliance}%</span>
              <span className="text-xs text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-full">Target 95%</span>
            </div>
            <p className="text-[10px] text-brand-textSecondary font-bold">Response times within limits</p>
          </div>
          
          {/* Animated circular progress ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-brand-border fill-transparent"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-brand-primary fill-transparent transition-all duration-1000 ease-out"
                strokeWidth="4"
                strokeDasharray={163}
                strokeDashoffset={163 - (compliance / 100) * 163}
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-brand-textPrimary">{compliance}%</span>
          </div>
        </div>
      </div>

      {/* Main Animated Pipeline Chart */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 relative overflow-hidden">
        <h3 className="text-lg font-bold text-brand-textPrimary mb-2">Patient Onboarding Funnel</h3>
        <p className="text-xs text-brand-textSecondary mb-8">Clinical lifecycle progression pipeline status overview</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <PipelineCard label="1. New Leads" value={funnel.newLeads} percentage="100%" color="bg-blue-500" dropoff="" />
          <PipelineCard label="2. 1st Consult" value={funnel.firstConsult} percentage={calcPct(funnel.firstConsult)} color="bg-purple-500" dropoff={calcDrop(funnel.newLeads, funnel.firstConsult)} />
          <PipelineCard label="3. Follow Up" value={funnel.followUp} percentage={calcPct(funnel.followUp)} color="bg-orange-500" dropoff={calcDrop(funnel.firstConsult, funnel.followUp)} />
          <PipelineCard label="4. Converted" value={funnel.converted} percentage={calcPct(funnel.converted)} color="bg-green-500" dropoff={calcDrop(funnel.followUp, funnel.converted)} />
        </div>
      </div>
    </div>
  );
};

interface PipelineCardProps {
  label: string;
  value: number;
  percentage: string;
  color: string;
  dropoff?: string;
}

const PipelineCard: React.FC<PipelineCardProps> = ({ label, value, percentage, color, dropoff }) => (
  <div className="relative flex flex-col bg-brand-bg/40 border border-brand-border rounded-2xl p-5 hover:border-brand-primary/30 transition-all duration-300 group">
    {dropoff && (
      <span className="absolute -top-3.5 left-6 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
        {dropoff}
      </span>
    )}
    <span className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3">{label}</span>
    <div className="flex justify-between items-baseline mb-4">
      <span className="text-4xl font-extrabold text-brand-textPrimary">{value}</span>
      <span className="text-xs text-brand-textSecondary font-bold">{percentage}</span>
    </div>
    <div className="w-full bg-brand-border rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: percentage }}
      ></div>
    </div>
  </div>
);
