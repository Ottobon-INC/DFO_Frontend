import React from 'react';
import { Users, CalendarDays, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { Card } from './ui/Card';

export const PremiumDashboard: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in pb-8">
      {/* Top Row: Hero & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Hero Card (spans 8 cols) */}
        <Card className="lg:col-span-8 bg-brand-surface border-brand-border flex flex-col justify-between overflow-hidden relative p-0">
          <div className="p-5 flex flex-col md:flex-row justify-between h-full z-10 relative">
            <div className="flex flex-col justify-center">
              <h2 className="text-xl font-bold text-brand-primary mb-1">Clinic Overview</h2>
              <p className="text-brand-textSecondary text-xs mb-6">Check today's statistics</p>
              
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-brand-textSecondary mb-1">Today's Revenue</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-brand-primary">$4,250</h3>
                    <span className="flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                      +12%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-brand-textSecondary mb-1">Appointments</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-brand-primary">48</h3>
                    <span className="flex items-center text-[10px] font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">
                      -5%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Illustration Placeholder (Right side) */}
            <div className="hidden md:flex items-end justify-center w-64">
              <div className="w-full h-48 bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center relative overflow-hidden">
                 <div className="text-brand-textSecondary text-xs">Illustration Space</div>
                 <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-surface-light to-transparent opacity-50" />
              </div>
            </div>
          </div>
        </Card>

        {/* Right side KPIs (spans 4 cols, 2 stacked) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1 bg-brand-surface border-brand-border p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-brand-textPrimary">New Patients</p>
              <div className="p-1.5 bg-brand-bg rounded-md text-brand-textSecondary">
                <Users size={16} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-3xl font-bold text-brand-primary">124</h3>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">+18%</span>
            </div>
            <a href="#" className="text-xs font-medium text-brand-textPrimary flex items-center hover:text-brand-primary transition-colors">
              See Report <ArrowUpRight size={14} className="ml-1" />
            </a>
          </Card>
          
          <Card className="flex-1 bg-brand-surface border-brand-border p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-brand-textPrimary">Available Beds</p>
              <div className="p-1.5 bg-brand-bg rounded-md text-brand-textSecondary">
                <CalendarDays size={16} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-3xl font-bold text-brand-primary">12</h3>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">-2%</span>
            </div>
            <a href="#" className="text-xs font-medium text-brand-textPrimary flex items-center hover:text-brand-primary transition-colors">
              See Report <ArrowUpRight size={14} className="ml-1" />
            </a>
          </Card>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Patient Footfall (spans 8 cols) */}
        <Card className="lg:col-span-8 bg-brand-surface border-brand-border p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-brand-textPrimary">Patient Footfall Updates</h3>
              <p className="text-xs text-brand-textSecondary">Overview of clinic visits</p>
            </div>
            <select className="bg-brand-surface border border-brand-border text-brand-primary text-sm rounded-lg px-3 py-2 focus:ring-brand-primary outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>

          {/* Simulated Chart Area */}
          <div className="h-48 w-full relative mt-4">
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-brand-textSecondary">
              <div className="flex items-center gap-2"><span className="w-4 text-right">3k</span><div className="flex-1 border-b border-dashed border-brand-border/50"></div></div>
              <div className="flex items-center gap-2"><span className="w-4 text-right">2k</span><div className="flex-1 border-b border-dashed border-brand-border/50"></div></div>
              <div className="flex items-center gap-2"><span className="w-4 text-right">1k</span><div className="flex-1 border-b border-dashed border-brand-border/50"></div></div>
              <div className="flex items-center gap-2"><span className="w-4 text-right">0</span><div className="flex-1 border-b border-dashed border-brand-border/50"></div></div>
            </div>
            
            {/* Overlay KPI */}
            <div className="absolute bottom-4 right-4 bg-brand-surface border border-brand-border rounded-xl p-3 shadow-md flex items-center gap-3">
              <div className="p-2 bg-brand-bg rounded-lg text-brand-textSecondary">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-brand-primary">1,489</h4>
                <p className="text-[10px] text-brand-textSecondary">Total Patients</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Right side charts (spans 4 cols, 2 stacked) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Collections */}
          <Card className="flex-1 bg-brand-surface border-brand-border p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="z-10 relative">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-brand-textPrimary">Monthly Collections</h3>
              <DollarSign size={16} className="text-brand-textSecondary" />
            </div>
            <h2 className="text-3xl font-bold text-brand-primary mt-1">$46,820</h2>
            <span className="inline-block mt-2 text-[10px] font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">
              -4% than last year
            </span>
          </div>
             
             <div className="h-24 w-full relative overflow-hidden">
                {/* SVG Line representation */}
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-border)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="var(--color-surface)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,15 Q10,25 25,10 T50,15 T75,5 T100,10 L100,30 Z" fill="url(#gradient)" />
                  <path d="M0,15 Q10,25 25,10 T50,15 T75,5 T100,10" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                </svg>
             </div>
          </Card>

          {/* Department Breakdown Donut Chart */}
          <Card className="flex-1 bg-brand-surface border-brand-border p-6">
            <h3 className="text-base font-bold text-brand-primary mb-6">Revenue by Dept</h3>
            <div className="flex items-center gap-6">
               <div className="flex-1">
                 <h2 className="text-2xl font-bold text-brand-primary mb-1">$36,358</h2>
                 <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                   +9% last year
                 </span>
                 
                 <div className="flex items-center gap-4 mt-6">
                   <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                     <span className="text-xs text-brand-textSecondary">Cardio</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                     <span className="text-xs text-brand-textSecondary">Ortho</span>
                   </div>
                 </div>
               </div>
               
               <div className="w-24 h-24 relative flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--color-bg)"
                      strokeWidth="4"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="4"
                      strokeDasharray="60, 100"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="4"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-60"
                    />
                  </svg>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
