import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Activity,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DashboardView } from './DashboardView';
import { PatientsView } from './PatientsView';
import { AppointmentsView } from './AppointmentsView';
import { LeadsView } from './LeadsView';
import { InboxView } from './InboxView';
import { ConsultationsView } from './ConsultationsView';
import { RiskMonitorView } from './RiskMonitorView';
import { ProfileView } from './ProfileView';
import { ClinicalAssistant } from './ClinicalAssistant';
import { Logo } from '@/components/ui/Logo';

export function DashboardLayout() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Patients', icon: Users },
    { label: 'Schedule', icon: Calendar },
    { label: 'Threads', icon: MessageSquare },
    { label: 'Monitors', icon: Activity },
    { label: 'CRM', icon: UserPlus },
    { label: 'Reports', icon: ConsultationsView }, // Placeholder icon/view matching
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Patients': return <PatientsView />;
      case 'Schedule': return <AppointmentsView />;
      case 'Threads': return <InboxView threads={[]} messages={{}} fetchMessages={()=>{}} sendMessage={()=>{}} />;
      case 'Monitors': return <RiskMonitorView />;
      case 'CRM': return <LeadsView leads={[]} onConvert={async () => ({success: true})} />;
      case 'Reports': return <ConsultationsView patient={{}} consultations={[]} refreshConsultations={()=>{}} />;
      case 'Settings': return <div className="p-6">Settings Module Placeholder</div>;
      case 'Profile': return <ProfileView profile={{}} user={{}} role="Admin" onSignOut={signOut} />;
      case 'Overview':
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex bg-slate-50 h-screen w-screen overflow-hidden text-slate-900 font-sans">
      
      {/* Strict Compact Sidebar */}
      <aside className="w-16 border-r border-slate-200 bg-white flex flex-col items-center py-4 shrink-0 z-20">
        <div className="mb-8 cursor-pointer" onClick={() => setActiveTab('Overview')}>
           {/* Abstract Geometric minimal logo for sidebar */}
           <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
             <rect x="14" y="4" width="14" height="24" fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="square"/>
             <path d="M4 10H20V22H4V10Z" fill="white" stroke="#0F172A" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"/>
           </svg>
        </div>
        
        <nav className="flex flex-col gap-4 flex-1 w-full px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center rounded transition-colors mx-auto ${
                activeTab === item.label 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-400 border border-transparent hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4 w-full px-2 mt-4 border-t border-slate-200 pt-4">
          <button 
            onClick={() => setActiveTab('Profile')}
            title="Profile"
            className="w-12 h-12 flex items-center justify-center rounded transition-colors mx-auto text-slate-400 border border-transparent hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={signOut}
            title="Sign Out"
            className="w-12 h-12 flex items-center justify-center rounded transition-colors mx-auto text-slate-400 border border-transparent hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Structural Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        
        {/* Topbar: Search + Actions */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">{activeTab}</h1>
            
            {/* Search */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded w-full max-w-md focus-within:ring-1 focus-within:ring-sky-500 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient MRN, condition, or provider ID..." 
                className="bg-transparent border-none outline-none text-xs w-full font-bold text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-slate-200 ml-4">
            <Button variant="outline" size="sm" className="h-8 bg-white border-slate-200 rounded text-[10px] font-black uppercase tracking-widest hidden sm:flex">
              <Activity className="w-3.5 h-3.5 mr-2 text-sky-600" /> System Status: Optimal
            </Button>
            
            <Button variant="outline" size="icon" className="h-8 w-8 rounded border-slate-200 relative bg-white">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </Button>

            <button onClick={() => setActiveTab('Profile')} className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-black hover:bg-slate-800 transition-colors">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Dense Content Viewport */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 content-start">
          {renderContent()}
        </main>
      </div>
      
      {/* Assistant */}
      <ClinicalAssistant />
    </div>
  );
}
