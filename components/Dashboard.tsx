import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, Users, User, Lock, TrendingUp, Settings, Search, Bell, LogOut, ChevronDown, UserCheck, Activity, Stethoscope, MessageSquare, Clock, FileText, Shield, Inbox, Bed, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { DashboardHome } from './DashboardHome';
import { AnalyticsView } from './AnalyticsView';
import { LeadsView } from './LeadsView';
import { AppointmentsView } from './AppointmentsView';
import { PatientsView } from './PatientsView';
import { UnassignedDocumentsView } from './UnassignedDocumentsView';
import { SettingsView } from './SettingsView';
import { PatientProfile } from './PatientProfile';
import { RoomsView } from './RoomsView';
import { RescheduleModal, Toast, CheckInModal, AddLeadModal } from './Modals';
import { WalkInExpressModal } from './WalkInExpressModal';
import { WaitingRoomView } from './WaitingRoomView';
import { Appointment, Lead, DashboardProps, UserRole, Patient } from '../types';
import { api } from '../services/api';
import { DoctorDashboard } from './doctor/DoctorDashboard';
import { NurseDashboard } from './nurse/NurseDashboard';
import { ControlTowerConsole } from './cro/ControlTowerConsole';
import { CroInbox } from './cro/CroInbox';
import { CroAnalytics } from './cro/CroAnalytics';
import { AuditLogsView } from './cro/AuditLogsView';
import { InternalAssistant } from './internal-assistant/InternalAssistant';
import { DailyRegisterTable } from './PatientRegistration';
import { TeamManagementView } from './TeamManagementView';
import { DoctorSchedulesView } from './settings/DoctorSchedulesView';
import { UserProfileModal, ChangePasswordModal } from './ProfileModals';
import DoctorScheduleSettings from './settings/DoctorScheduleSettings';
import { ProfileSettingsModal } from './settings/ProfileSettingsModal';
export const Dashboard: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leadsFilter, setLeadsFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<string>('overview');

  // --- Clock State ---
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- API State ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // --- Refresh Trigger ---
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsData, leadsData, patientsData, doctorsData] = await Promise.all([
          api.getAppointments({ date: new Date().toISOString().split('T')[0] }), // Fetch all appointments today
          api.getLeads(),
          api.getPatients(),
          api.getDoctors()
        ]);

        // Save doctors list
        const doctorsList = doctorsData?.data ?? [];
        setDoctors(doctorsList);

        // Create Patient Map
        const patientItems = patientsData?.data?.items ?? [];
        const patientMap = new Map();
        if (Array.isArray(patientItems)) {
          patientItems.forEach((p: any) => patientMap.set(p.id, p.name));
        }

        // Create Lead Map (renamed to avoid conflict)
        const leadLookupItems = leadsData?.data?.items ?? [];
        const leadMap = new Map();
        if (Array.isArray(leadLookupItems)) {
          leadLookupItems.forEach((l: any) => leadMap.set(l.id, l.name));
        }

        // Normalize Appointments
        const apptItems = Array.isArray(apptsData?.data) ? apptsData.data : (apptsData?.data?.items ?? []);
        const mappedAppts: Appointment[] = Array.isArray(apptItems) ? apptItems.map((item: any) => {
          // patient_name might be missing or 'Unknown', so handle explicitly
          let resolvedName = item.patient_name_snapshot || item.patient_name || item.patientName || item.name;

          if (!resolvedName || resolvedName === 'Unknown') {
            if (item.patient_id || item.patientId) {
              resolvedName = patientMap.get(item.patient_id || item.patientId);
            }
          }

          if (!resolvedName || resolvedName === 'Unknown') {
            // Fallback: check linked lead (via lead_id if present) or try matching patient_id to a lead
            resolvedName = leadMap.get(item.lead_id) || leadMap.get(item.patient_id || item.patientId) || 'Unknown';
          }

          const docId = item.doctor_id || item.doctorId;
          // Robust Doctor Name Resolution
          let resolvedDocName = item.doctor_name_snapshot || item.doctor_name || item.doctorName || item.consultant;

          if (!resolvedDocName || resolvedDocName === 'Unknown') {
            resolvedDocName = doctorsList.find((d: any) => d.id === docId)?.name || 'Unknown';
          }

          // Final fallback for demo if ID exists but name failed (prevent 'Unknown' for valid-looking IDs)
          if ((!resolvedDocName || resolvedDocName === 'Unknown') && docId) {
            const found = doctorsList.find((d: any) => d.id === docId);
            if (found) resolvedDocName = found.name;
          }

          return {
            id: item.id,
            patientName: resolvedName,
            doctorName: resolvedDocName,
            doctorId: docId,
            patientId: item.patient_id || item.patientId,
            time: item.start_time || item.time,
            date: item.appointment_date || item.date,
            type: item.type,
            status: item.status,
            resourceId: item.resource_id
          };
        }) : [];

        setAppointments(mappedAppts);

        // Normalize Leads
        const leadItems = leadsData?.data?.items ?? [];
        const mappedLeads: Lead[] = Array.isArray(leadItems) ? leadItems.map((item: any) => ({
          ...item,
          id: item.id,
          name: item.name,
          phone: item.phone,
          // Robust Source Check
          source: item.source || item.Source || item.referral_source || item.lead_source || 'Walk-In',
          inquiry: item.inquiry,
          status: item.status,
          dateAdded: item.created_at || item.dateAdded || new Date().toISOString(),

          // Map snake_case backend fields to frontend camelCase (Robust)
          age: item.age || item.Age ? String(item.age || item.Age) : undefined,
          gender: item.gender || item.Gender || item.sex,
          problem: item.problem || item.Problem || item.presenting_problem,
          treatmentDoctor: item.treatment_doctor || item.treatmentDoctor || item.camp_doctor || item.CampDoctor,
          treatmentSuggested: item.treatment_suggested || item.treatmentSuggested || item.suggested_tx || item.SuggestedTx,
          husbandAge: item.husband_age || item.husbandAge,
          location: item.location || item.Location || item.city || item.City
        })) : [];
        console.log('Raw Leads Data (for debugging):', leadItems[0]); // Debug log
        setLeads(mappedLeads);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchData();
  }, [userRole, refreshTrigger]);

  // Refetch data when navigating to the main dashboard view to ensure fresh data
  useEffect(() => {
    if (
      location.pathname === '/dashboard' ||
      location.pathname === '/dashboard/' ||
      location.pathname === '/dashboard/leads'
    ) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [location.pathname]);

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isWalkInExpressOpen, setIsWalkInExpressOpen] = useState(false);
  const [expressTokenResult, setExpressTokenResult] = useState<{ token: string; details: any } | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) { }
  }, []);

  const handleGlobalSearch = () => {
    showToast(`Searching for: "${globalSearch}"...`);
  };

  // --- Derived State ---
  const leadsInCROQueue = leads.filter(l => l.status === 'Stalling - Sent to CRO').length;
  const leadsConvertedToday = leads.filter(l => l.status === 'Converted - Active Patient').length;

  // --- Handlers ---
  const handleCheckIn = (id: string) => {
    setCheckInId(id);
  };

  const handleCheckInConfirm = async (data: { visitType: string; remarks: string }) => {
    if (checkInId) {
      try {
        await api.updateAppointmentStatus(checkInId, { status: 'Checked-In' });
        setAppointments(prev => prev.map(a => a.id === checkInId ? { ...a, status: 'Checked-In' } : a));
        showToast(`Checked in ${appointments.find(a => a.id === checkInId)?.patientName}`);
        setCheckInId(null);
      } catch (e) {
        console.error(e);
        showToast('Failed to check in');
      }
    }
  };

  const handleRescheduleConfirm = async (date: string, time: string) => {
    if (rescheduleId) {
      try {
        const appt = appointments.find(a => a.id === rescheduleId);
        if (appt) {
          // Minimal payload for Reschedule as per updated backend specs
          await api.updateAppointment(rescheduleId, {
            appointment_date: date,
            appointment_time: time.split(' ')[0], // Changed from start_time -> appointment_time
            doctor_id: appt.doctorId,
            notes: 'Rescheduled via Dashboard' // New field
          } as any);
          setAppointments(prev => prev.map(a => a.id === rescheduleId ? { ...a, date, time: time, status: 'Scheduled' } : a)); // Reset to Scheduled?
          showToast(`Rescheduled to ${date} at ${time}`);
          setRescheduleId(null);
        }
      } catch (e: any) {
        console.error(e);
        showToast(e?.message || e?.error || 'Failed to reschedule');
      }
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.updateAppointmentStatus(id, { status: 'Canceled', cancellation_reason: 'Dashboard Cancel' });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Canceled' } : a));
        showToast('Appointment canceled');
      } catch (e) {
        console.error(e);
        showToast('Failed to cancel');
      }
    }
  };

  const handleAddLead = async (data: {
    name: string;
    phone: string;
    source: string;
    inquiry: string;
    referralRequired: 'Yes' | 'No';
    alternativePhoneNumber: string;
    husbandOrGuardianName: string;
    husbandAge: string;
    location: string;
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    problem: string;
    treatmentDoctor: string;
    treatmentSuggested: string;
  }) => {
    // Check for duplicates
    if (leads.some(l => l.phone === data.phone)) {
      showToast("Lead with this phone number already exists.");
      return;
    }

    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        source: data.source,
        // inquiry: data.inquiry, // Legacy
        inquiry: data.referralRequired === 'Yes' ? 'Referral Required' : 'General', // Auto-map for now
        referral_required: data.referralRequired,
        alternative_phone_number: data.alternativePhoneNumber,
        husband_or_guardian_name: data.husbandOrGuardianName,
        husband_age: data.husbandAge,
        location: data.location,
        status: 'New Inquiry',
        age: data.age,
        gender: data.gender,
        problem: data.problem,
        treatment_doctor: data.treatmentDoctor,
        treatment_suggested: data.treatmentSuggested,
        date_added: new Date().toISOString()
      };
      const createdLead = await api.createLead(payload);
      // Map back 
      const newLead: Lead = {
        // ... map from createdLead ...
        // For now assuming response structure or using local details
        ...payload,
        id: createdLead.data?.id || `lead-${Date.now()}`,
        dateAdded: new Date().toISOString().split('T')[0],
        referralRequired: data.referralRequired,
        alternativePhoneNumber: data.alternativePhoneNumber,
        husbandOrGuardianName: data.husbandOrGuardianName,
        husbandAge: data.husbandAge,
        location: data.location,
        treatmentDoctor: data.treatmentDoctor,
        treatmentSuggested: data.treatmentSuggested
      } as any;

      setLeads([newLead, ...leads]);
      setIsAddLeadModalOpen(false);

      showToast("Lead created successfully");
    } catch (e) {
      console.error("Failed to create lead", e);
      showToast("Failed to create lead");
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      // Sanitize payload: strip ID and read-only fields
      const { id, dateAdded, treatmentDoctor, treatmentSuggested, ...rest } = updatedLead;

      // Construct payload with correct backend field names (snake_case)
      const payload = {
        ...rest,
        treatment_doctor: treatmentDoctor,
        treatment_suggested: treatmentSuggested
      };

      await api.updateLead(updatedLead.id, payload);
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      if (updatedLead.status === 'Stalling - Sent to CRO') {
        showToast("Lead assigned to CRO Desk");
      } else if (updatedLead.status === 'Converted - Active Patient') {
        showToast("Patient file created successfully");
      }
    } catch (e) {
      console.error("Failed to update lead", e);
      showToast("Failed to update lead");
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleNavigateToLeads = (filter: string) => {
    setLeadsFilter(filter);
    navigate('/dashboard/leads');
  };

  const handlePatientSelect = (patient: Patient, tab?: string) => {
    setSelectedPatient(patient);
    setProfileInitialTab(tab || 'overview');
  };

  const handleConsultationComplete = async () => {
    const patientToComplete = selectedPatient; // Capture ref
    setSelectedPatient(null);
    showToast('Consultation Completed');

    if (patientToComplete) {
      // Auto-complete today's appointment if found
      const today = new Date().toISOString().split('T')[0];
      const targetAppt = appointments.find(a =>
        (a.patientName === patientToComplete.name || a.doctorId === patientToComplete.id /* fallback */) &&
        a.date === today &&
        a.status !== 'Completed' && a.status !== 'Canceled'
      );

      if (targetAppt) {
        try {
          await api.updateAppointmentStatus(targetAppt.id, { status: 'Completed' });
          setAppointments(prev => prev.map(a => a.id === targetAppt.id ? { ...a, status: 'Completed' } : a));
          // showToast('Appointment marked Completed'); // Optional, toast already shown
        } catch (e) {
          console.error("Failed to update appointment status", e);
        }
      }
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-brand-bg flex h-screen overflow-hidden font-sans text-brand-textPrimary selection:bg-brand-primary selection:text-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-56 md:w-52 lg:w-60 xl:w-[240px] bg-brand-surface flex-shrink-0 flex flex-col border-r border-brand-border fixed h-full z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo Area */}
        <div className="p-4 flex items-center space-x-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Medcy Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[13px] font-extrabold tracking-tight text-brand-textPrimary">Medcy Health Tech</h1>
            <p className="text-[9px] font-bold text-brand-textSecondary tracking-widest mt-0.5">CLINICAL PLATFORM</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Operations Section */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest px-4 mb-3 opacity-80">Operations</div>
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={location.pathname === '/dashboard' || location.pathname === '/dashboard/'}
              onClick={() => navigate('/dashboard')}
            />
            {(userRole === UserRole.ADMIN || userRole === UserRole.FRONT_DESK || userRole === UserRole.CRO) && (
              <NavItem
                icon={<Users size={20} />}
                label="Leads Pipeline"
                active={location.pathname === '/dashboard/leads'}
                onClick={() => { setLeadsFilter('All'); navigate('/dashboard/leads'); }}
              />
            )}
            {(userRole === UserRole.ADMIN || userRole === UserRole.FRONT_DESK || userRole === UserRole.CRO) && (
              <NavItem
                icon={<FileText size={20} />}
                label="Daily Register"
                active={location.pathname === '/dashboard/daily-register'}
                onClick={() => navigate('/dashboard/daily-register')}
              />
            )}
            <NavItem
              icon={<Users size={20} />}
              label="Waiting Room"
              active={location.pathname === '/dashboard/waiting-room'}
              onClick={() => navigate('/dashboard/waiting-room')}
            />
            <NavItem
              icon={<CalendarDays size={20} />}
              label="Appointments"
              active={location.pathname === '/dashboard/appointments'}
              onClick={() => navigate('/dashboard/appointments')}
            />
            <NavItem
              icon={<Inbox size={20} />}
              label="Pending Files"
              active={location.pathname === '/dashboard/pending-files'}
              onClick={() => navigate('/dashboard/pending-files')}
            />
            <NavItem
              icon={<UserCheck size={20} />}
              label="Patients"
              active={location.pathname === '/dashboard/patients'}
              onClick={() => navigate('/dashboard/patients')}
            />
            <NavItem
              icon={<Bed size={20} />}
              label="Rooms & Admissions"
              active={location.pathname === '/dashboard/rooms'}
              onClick={() => navigate('/dashboard/rooms')}
            />
            <NavItem
              icon={<Clock size={20} />}
              label="Doctor Schedules"
              active={location.pathname === '/dashboard/settings/schedules' || location.pathname === '/dashboard/schedules/view'}
              onClick={() => navigate(userRole === 'Front Desk' ? '/dashboard/schedules/view' : '/dashboard/settings/schedules')}
            />
          </div>

          {/* Specialist & Clinical Dashboards */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest px-4 mb-3 flex items-center gap-2 opacity-80">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-sm"></span>
              Operations Dashboards
            </div>
            {(userRole === UserRole.ADMIN || userRole === UserRole.CRO) && (
              <>
                <NavItem
                  icon={<Activity size={20} />}
                  label="Admin Overview"
                  active={location.pathname === '/dashboard/control-tower'}
                  onClick={() => navigate('/dashboard/control-tower')}
                />
                <NavItem
                  icon={<MessageSquare size={20} />}
                  label="Follow-up Tasks"
                  active={location.pathname === '/dashboard/cro-inbox'}
                  onClick={() => navigate('/dashboard/cro-inbox')}
                />
                <NavItem
                  icon={<TrendingUp size={20} />}
                  label="Performance Reports"
                  active={location.pathname === '/dashboard/cro-analytics'}
                  onClick={() => navigate('/dashboard/cro-analytics')}
                />
              </>
            )}
            {userRole === UserRole.DOCTOR && (
              <NavItem
                icon={<Stethoscope size={20} />}
                label="Doctor Dashboard"
                active={location.pathname === '/dashboard/doctor'}
                onClick={() => navigate('/dashboard/doctor')}
              />
            )}
            {userRole === UserRole.NURSE && (
              <NavItem
                icon={<Stethoscope size={20} />}
                label="Nurse Dashboard"
                active={location.pathname === '/dashboard/nurse'}
                onClick={() => navigate('/dashboard/nurse')}
              />
            )}
            {(userRole === UserRole.ADMIN || userRole === UserRole.CRO) && (
              <NavItem
                icon={<Clock size={20} />}
                label="Audit Logs"
                active={location.pathname === '/dashboard/audit-logs'}
                onClick={() => navigate('/dashboard/audit-logs')}
              />
            )}
          </div>

          {/* Team Management - Only for Clinic Admins */}
          {(() => {
            try {
              const userStr = localStorage.getItem('user');
              const user = userStr ? JSON.parse(userStr) : null;
              if (user?.is_clinic_admin) {
                return (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest px-3 mb-3 mt-6 flex items-center gap-1.5">
                      Administration
                    </div>
                    <NavItem
                      icon={<Shield size={20} />}
                      label="Team Management"
                      active={location.pathname === '/dashboard/team'}
                      onClick={() => navigate('/dashboard/team')}
                    />
                  </div>
                );
              }
            } catch (e) { }
            return null;
          })()}
        </nav>

        {/* System Status Pill */}
        <div className="p-4 bg-brand-surface">
          <div className="bg-brand-hover rounded-lg p-3.5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse"></span>
              <span className="text-xs font-bold text-brand-textPrimary uppercase tracking-widest">System Online</span>
            </div>
            <p className="text-[10px] text-brand-textSecondary">All systems operational</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden md:ml-52 lg:ml-60 xl:ml-[240px] flex flex-col relative z-10 bg-brand-bg`}>
        {/* Header */}
        <header className="bg-brand-surface border-b border-brand-border px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0 gap-3">

          {/* Search Bar - Top Center/Left */}
          <div className="flex-1 max-w-xl hidden md:flex items-center">
            <div className="flex items-center bg-brand-bg px-4 py-2 rounded-full border border-brand-border w-full focus-within:ring-2 focus-within:ring-brand-primary/30 transition-all">
              <Search size={16} className="text-brand-textSecondary mr-2" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                placeholder="Search Patient Name, Phone, or ID..."
                className="bg-transparent outline-none text-sm w-full text-brand-textPrimary placeholder:text-brand-textSecondary"
              />
              <div className="hidden lg:flex items-center gap-1 opacity-60">
                <span className="text-[10px] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded text-brand-textSecondary">Ctrl</span>
                <span className="text-[10px] text-brand-textSecondary">+</span>
                <span className="text-[10px] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded text-brand-textSecondary">K</span>
              </div>
            </div>
          </div>

          {/* Right Status / Toggles */}
          <div className="flex items-center space-x-4">
            
            {/* Walk-in Express and Queue Pill */}
            <div className="flex items-center gap-2">
               <button 
                onClick={() => setIsWalkInExpressOpen(true)}
                className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
               >
                 <Activity size={14} /> Walk-in Express
               </button>
               <button
                onClick={() => navigate('/dashboard/waiting-room')}
                className="hidden lg:flex items-center gap-1.5 bg-brand-hover border border-brand-border text-brand-textPrimary px-3 py-1.5 rounded-full text-xs font-bold hover:bg-brand-surface transition-colors"
               >
                 <Users size={14} className="text-brand-primary" /> Queue
               </button>
            </div>

            {/* Language Toggles */}
            <div className="hidden sm:flex items-center bg-brand-hover rounded-full p-1 border border-brand-border">
              <span className="bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full cursor-pointer">EN</span>
              <span className="text-brand-textSecondary text-[10px] font-bold px-3 py-1 cursor-pointer">HI</span>
            </div>

            {/* Time / Date */}
            <div className="hidden md:flex items-center gap-1.5 bg-brand-hover border border-brand-border rounded-full px-3 py-1.5">
              <Clock size={12} className="text-brand-primary" />
              <span className="text-[11px] font-medium text-brand-textSecondary">IST</span>
              <span className="text-[11px] font-medium text-brand-textPrimary ml-1">
                {currentTime.toLocaleString('en-GB', {
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                }).replace(',', '')}
              </span>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 cursor-pointer relative" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
              <div className="text-right hidden sm:block mr-2">
                <p className="text-sm font-semibold text-brand-textPrimary leading-tight">
                  {currentUser?.name || 'Suresh (Admin)'}
                </p>
                <p className="text-xs text-brand-textSecondary mt-0.5">{userRole === UserRole.ADMIN ? 'Admin Terminal' : 'Main Terminal'}</p>
              </div>
              <div className="w-9 h-9 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold text-sm">
                S(
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface rounded-lg shadow-xl border border-brand-border py-1 z-50">
                  <button onClick={() => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-brand-textPrimary hover:bg-brand-hover">Profile Settings</button>
                  <button onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-brand-hover">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${location.pathname.includes('cro-inbox') || location.pathname.includes('leads') ? 'p-0' : 'p-6 lg:p-8'}`}>
          <Routes>
            <Route index element={
              <DashboardHome
                userRole={userRole}
                leads={leads}
                appointments={appointments}
                leadsInCROQueue={leadsInCROQueue}
                leadsConvertedToday={leadsConvertedToday}
                onCheckIn={handleCheckIn}
                onReschedule={(id) => setRescheduleId(id)}
                onCancelAppointment={handleCancelAppointment}
                onUpdateLead={handleUpdateLead}
                onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
                onNavigateToLeads={handleNavigateToLeads}
                onPatientSelect={handlePatientSelect}
              />
            } />
            <Route path="leads" element={
              <div className="absolute inset-0 bg-brand-surface overflow-hidden animate-slide-up flex flex-col">
                <LeadsView
                  leads={leads}
                  onUpdateLead={handleUpdateLead}
                  onOpenAddModal={() => setIsAddLeadModalOpen(true)}
                  initialFilter={leadsFilter}
                  onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                />
              </div>
            } />
            <Route path="appointments" element={
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col animate-slide-up">
                <AppointmentsView userRole={userRole} />
              </div>
            } />
            <Route path="rooms" element={
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col animate-slide-up">
                <RoomsView />
              </div>
            } />
            <Route path="pending-files" element={
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col animate-slide-up">
                <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden h-full flex flex-col">
                  <UnassignedDocumentsView />
                </div>
              </div>
            } />
            <Route path="patients" element={
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col animate-slide-up">
                <PatientsView userRole={userRole} onNavigateToLeads={() => { setLeadsFilter('All'); navigate('/dashboard/leads'); }} />
              </div>
            } />
            <Route path="doctor" element={<DoctorDashboard />} />
            <Route path="nurse" element={<NurseDashboard />} />
            <Route path="control-tower" element={<ControlTowerConsole />} />
            <Route path="cro-inbox" element={<CroInbox />} />
            <Route path="cro-analytics" element={<CroAnalytics />} />
            <Route path="audit-logs" element={<AuditLogsView />} />
            <Route path="daily-register" element={<DailyRegisterTable />} />
            <Route path="waiting-room" element={
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col animate-slide-up">
                <WaitingRoomView />
              </div>
            } />
            <Route path="settings/schedules" element={<DoctorScheduleSettings userRole={userRole} currentUser={currentUser} />} />
            <Route path="schedules/view" element={<DoctorSchedulesView userRole={userRole} currentUser={currentUser} />} />

            <Route path="analytics" element={
              <div className="animate-slide-up">
                <AnalyticsView />
              </div>
            } />
            <Route path="team" element={
              <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden animate-slide-up h-full flex flex-col p-6">
                <TeamManagementView />
              </div>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* Overlays */}
      <RescheduleModal
        isOpen={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        onConfirm={handleRescheduleConfirm}
        patientName={appointments.find(a => a.id === rescheduleId)?.patientName || ''}
      />

      <CheckInModal
        isOpen={!!checkInId}
        onClose={() => setCheckInId(null)}
        onConfirm={handleCheckInConfirm}
        patientName={appointments.find(a => a.id === checkInId)?.patientName || ''}
      />

      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onConfirm={handleAddLead}
      />

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        showToast={showToast}
      />

      <WalkInExpressModal 
        isOpen={isWalkInExpressOpen} 
        onClose={() => setIsWalkInExpressOpen(false)} 
        onSuccess={(token, details) => {
          setIsWalkInExpressOpen(false);
          setExpressTokenResult({ token, details });
          setRefreshTrigger(prev => prev + 1);
        }} 
      />

      {/* Express Token Success Modal */}
      {expressTokenResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] animate-fade-in p-4" onClick={() => setExpressTokenResult(null)}>
          <div className="bg-brand-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-brand-primary" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-brand-textPrimary mb-1">Check-in Complete!</h2>
            <p className="text-brand-textSecondary text-sm mb-6">Patient added to the waiting room.</p>
            
            <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border mb-6">
              <p className="text-xs text-brand-textSecondary font-bold uppercase tracking-widest mb-2">Token Number</p>
              <div className="text-6xl font-black text-brand-primary tracking-tighter mb-2">{expressTokenResult.token}</div>
              <p className="text-sm font-medium text-brand-textPrimary mt-4 pt-4 border-t border-brand-border border-dashed">
                {expressTokenResult.details.name} <br/>
                <span className="text-brand-textSecondary text-xs">for {expressTokenResult.details.doctorName}</span>
              </p>
            </div>
            
            <button 
              onClick={() => setExpressTokenResult(null)}
              className="w-full py-3 bg-brand-hover text-brand-textPrimary font-bold rounded-xl hover:bg-brand-surface transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Patient Profile Overlay - Lifted to Dashboard level for z-index fix */}
      {selectedPatient && (
        <PatientProfile
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          userRole={userRole}
          initialTab={profileInitialTab}
          onCompleteConsultation={handleConsultationComplete}
          onPatientUpdate={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {/* Internal Assistant Chatbot */}
      <InternalAssistant />
    </div>
  );
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  rightIcon?: React.ReactNode;
  isSubItem?: boolean;
  customClass?: string;
}> = ({ icon, label, active, highlighted, onClick, rightIcon, isSubItem, customClass }) => (
  <div
    onClick={onClick}
    className={`
      flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group mb-1
      ${isSubItem ? 'pl-8' : ''}
      ${customClass ? customClass : active
        ? 'bg-brand-primary text-white shadow-md'
        : 'text-brand-textSecondary hover:bg-brand-hover'}
    `}
  >
    <div className="flex items-center space-x-3">
      <div className={`transition-transform duration-200 flex-shrink-0 ${active || customClass ? '' : 'text-brand-textSecondary group-hover:text-brand-textSecondary'}`}>
        {icon}
      </div>
      <span className={`text-[13px] tracking-wide ${active || (customClass && customClass.includes('font-medium')) ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </div>
    {rightIcon && <div className="text-brand-textSecondary">{rightIcon}</div>}
  </div>
);
