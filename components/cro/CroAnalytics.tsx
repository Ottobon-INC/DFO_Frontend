import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TrendingUp, Users, Clock, CheckCircle2, RefreshCw, Layers, ArrowRight } from 'lucide-react';

export const CroAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await api.getCRODashboard();
      if (res.success && res.data) {
        setAnalyticsData({
          kpis: res.data.kpis || {},
          funnel: res.data.funnel || { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 }
        });
      } else {
        setAnalyticsData({
          kpis: { conversionRate: 0, croSuccessRate: 0, avgTimeToConvertDays: 0, patientChurnRate: 0 },
          funnel: { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 }
        });
      }
    } catch (err) {
      console.error("Failed to load CRO analytics data:", err);
      setAnalyticsData({
        kpis: { conversionRate: 0, croSuccessRate: 0, avgTimeToConvertDays: 0, patientChurnRate: 0 },
        funnel: { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {};
  const funnel = analyticsData?.funnel || { newLeads: 0, firstConsult: 0, followUp: 0, converted: 0 };
  const totalPatients = funnel.newLeads || 0;
  const compliance = kpis.slaCompliance !== undefined ? kpis.slaCompliance : 100;

  const base = funnel.newLeads > 0 ? funnel.newLeads : 1;
  const calcPct = (val: number) => funnel.newLeads > 0 ? ((val / base) * 100).toFixed(0) + '%' : '0%';

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Inquiries / Leads */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
              Total Inquiries Managed
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{totalPatients}</span>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live
              </span>
            </div>
            <p className="text-[10px] text-brand-textSecondary">Active pipeline inquiries</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        {/* Lead Conversion Rate */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
              Lead Conversion Rate
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{kpis.conversionRate || 0}%</span>
              <span className="text-[11px] text-brand-textSecondary font-semibold">
                {funnel.converted}/{funnel.newLeads || 0}
              </span>
            </div>
            <p className="text-[10px] text-brand-textSecondary">Inquiry to active registered patient</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Operational SLA Compliance */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
              SLA Compliance
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-textPrimary">{compliance}%</span>
              <span className="text-[11px] text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                Target 95%
              </span>
            </div>
            <p className="text-[10px] text-brand-textSecondary">Response and consultation adherence</p>
          </div>
          
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

      </div>

      {/* Main Patient Onboarding Funnel */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-brand-textPrimary">
              Patient Onboarding Pipeline
            </h3>
            <p className="text-xs text-brand-textSecondary mt-0.5">
              Live lifecycle progression from initial inquiry to completed registration
            </p>
          </div>

          <button
            onClick={fetchAnalyticsData}
            className="px-3 py-1.5 rounded-xl border border-brand-border bg-brand-bg hover:bg-brand-surface text-brand-textPrimary transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PipelineCard 
            step="1"
            label="New Inquiries" 
            value={funnel.newLeads} 
            percentage={funnel.newLeads > 0 ? "100%" : "0%"} 
            color="bg-blue-500" 
          />
          <PipelineCard 
            step="2"
            label="First Consult" 
            value={funnel.firstConsult} 
            percentage={calcPct(funnel.firstConsult)} 
            color="bg-purple-500" 
          />
          <PipelineCard 
            step="3"
            label="Follow Up" 
            value={funnel.followUp} 
            percentage={calcPct(funnel.followUp)} 
            color="bg-amber-500" 
          />
          <PipelineCard 
            step="4"
            label="Converted" 
            value={funnel.converted} 
            percentage={calcPct(funnel.converted)} 
            color="bg-emerald-500" 
          />
        </div>
      </div>

    </div>
  );
};

interface PipelineCardProps {
  step: string;
  label: string;
  value: number;
  percentage: string;
  color: string;
}

const PipelineCard: React.FC<PipelineCardProps> = ({ step, label, value, percentage, color }) => (
  <div className="bg-brand-bg/60 border border-brand-border rounded-xl p-4 flex flex-col justify-between space-y-3">
    <div className="flex items-center justify-between">
      <span className="w-5 h-5 rounded-full bg-brand-surface border border-brand-border text-[10px] font-bold text-brand-textSecondary flex items-center justify-center">
        {step}
      </span>
      <span className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">
        {label}
      </span>
    </div>

    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-extrabold text-brand-textPrimary">{value}</span>
      <span className="text-xs text-brand-textSecondary font-bold font-mono">{percentage}</span>
    </div>

    <div className="w-full bg-brand-surface rounded-full h-1.5 overflow-hidden border border-brand-border/60">
      <div 
        className={`h-full rounded-full ${color} transition-all duration-500 ease-out`} 
        style={{ width: percentage }}
      ></div>
    </div>
  </div>
);
