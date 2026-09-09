import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, Users, User, Lock, TrendingUp, Settings, Search, Bell, LogOut, ChevronDown, UserCheck, Activity, Stethoscope, MessageSquare, Clock, FileText, Shield, ShieldAlert, Inbox, Bed, AlertCircle, CheckCircle2, Menu, X, UserPlus, Sparkles } from 'lucide-react';
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
import { RescheduleModal, Toast, AddLeadModal } from './Modals';
import { BookAppointmentModal } from './AppointmentModals';
import { ClinicRegistrationForm } from './ClinicRegistrationForm';

import { WaitingRoomView } from './WaitingRoomView';
import { Appointment, Lead, DashboardProps, UserRole, Patient } from '../types';
import { api } from '../services/api';
import { DoctorDashboard } from './DoctorDashboard';
import { DoctorDashboard as ClinicalEscalationsView } from './doctor/DoctorDashboard';
import { NurseDashboard } from './nurse/NurseDashboard';
import { TriageConsole } from './nurse/TriageConsole';
import { LobbyRoster } from './nurse/LobbyRoster';
import { ControlTowerConsole } from './cro/ControlTowerConsole';
import { CroInbox } from './cro/CroInbox';
import { CroAnalytics } from './cro/CroAnalytics';
import { AuditLogsView } from './cro/AuditLogsView';

import { DailyRegisterTable } from './PatientRegistration';
import { TeamManagementView } from './TeamManagementView';
import { DoctorSchedulesView } from './settings/DoctorSchedulesView';
import { UserProfileModal, ChangePasswordModal } from './ProfileModals';
import DoctorScheduleSettings from './settings/DoctorScheduleSettings';
import { ProfileSettingsModal } from './settings/ProfileSettingsModal';
import { RequireTier } from './common/RequireTier';
import { getRoleTier } from '../constants/roles.constants';

// Isolated Digital Clock component to prevent 1000ms global re-renders of the entire dashboard tree
const DigitalClock: React.FC = React.memo(() => {
  const [time, setTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-[11px] font-bold text-brand-textPrimary ml-0.5">
      {time.toLocaleString('en-GB', {
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
  );
});

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leadsFilter, setLeadsFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profileInitialTab, setProfileInitialTab] = useState<string>('overview');

  // --- API State ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // --- Refresh Trigger ---
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const [apptsData, upcomingApptsData, leadsData, patientsData, doctorsData] = await Promise.all([
          api.getAppointments({ date: today.toISOString().split('T')[0] }), // Fetch all appointments today
          api.getAppointments({ 
            start_date: tomorrow.toISOString().split('T')[0],
            end_date: dayAfter.toISOString().split('T')[0]
          }), // Fetch next 48 hours
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
        const mapAppointments = (data: any) => {
          const items = Array.isArray(data?.data) ? data.data : (data?.data?.items ?? []);
          return Array.isArray(items) ? items.map((item: any) => {
          // patient_name might be missing or 'Unknown', so handle explicitly
          let resolvedName = item.patient?.name || item.patient?.full_name || item.patient_name_snapshot || item.patient_name || item.patientName || item.name;

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
            queueStatus: item.queue_status || item.queueStatus,
            resourceId: item.resource_id
          };
        }) : [];
        };

        setAppointments(mapAppointments(apptsData));
        
        let upcoming = mapAppointments(upcomingApptsData);
        if (userRole === 'Doctor') {
            // Wait, we need the logged in user's ID
            const userStr = localStorage.getItem('user');
            const loggedInUser = userStr ? JSON.parse(userStr) : null;
            const loggedInDoctorId = loggedInUser?.id || loggedInUser?.userId || 'dr_sireesha'; // default fallback
            upcoming = upcoming.filter((a: any) => a.doctorId === loggedInDoctorId);
        }
        setUpcomingAppointments(upcoming);

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
  const [walkInInitialData, setWalkInInitialData] = useState<any>(undefined);
  const [expressTokenResult, setExpressTokenResult] = useState<{ token: string; details: any } | null>(null);
  
  // Global Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

    useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) { }

    const syncFreshProfile = async () => {
      try {
        const res = await api.verifySession();
        if (res?.success && res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch (err) { }
    };
    syncFreshProfile();
  }, []);

  const parseSearchQuery = (query: string) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return {};

    const digitsOnly = trimmed.replace(/\D/g, '');
    const isPhoneLike = digitsOnly.length >= 3 && (digitsOnly.length / trimmed.length >= 0.5);

    if (isPhoneLike) {
      let cleanPhone = digitsOnly;
      if (cleanPhone.startsWith('91') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(2);
      } else if (cleanPhone.startsWith('0') && cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(1);
      }
      return { phone: cleanPhone, mobile: cleanPhone };
    }

    if (trimmed.includes('@')) {
      return { email: trimmed };
    }

    return { name: trimmed, fullname: trimmed };
  };

  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await api.searchPatients(globalSearch);
      setSearchResults(res?.data?.items || (Array.isArray(res?.data) ? res.data : res) || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (globalSearch.trim()) handleGlobalSearch();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [globalSearch]);

  // --- Derived State ---
  const leadsInCROQueue = leads.filter(l => l.status === 'Stalling - Sent to CRO').length;
  const leadsConvertedToday = leads.filter(l => l.status === 'Converted - Active Patient').length;

    // --- Handlers ---
  const handleCheckIn = async (id: string) => {
    const targetApt = appointments.find(a => a.id === id);
    try {
      await api.updateAppointmentStatus(id, { status: 'Checked-In' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Checked-In' } : a));
      
      // Auto-enqueue to walk-in queue / waiting room if patientId and doctorId exist
      if (targetApt?.patientId && targetApt?.doctorId) {
        try {
          await api.createWalkInQueue({
            patient_id: targetApt.patientId,
            doctor_id: targetApt.doctorId,
            chief_complaint: targetApt.notes || targetApt.type || 'Scheduled Appointment',
            priority: 'standard'
          });
        } catch (qmsErr) {
          // Handled or already enqueued
        }
      }
      
      const docInfo = targetApt?.doctorName ? ` for ${targetApt.doctorName}` : '';
      showToast(`✓ ${targetApt?.patientName || 'Patient'} checked in${docInfo}! Added to waiting queue.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      console.error('Check in failed:', e);
      showToast(e?.message || 'Failed to check in');
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
              icon={userRole === UserRole.DOCTOR ? <Stethoscope size={20} /> : <LayoutDashboard size={20} />}
              label={userRole === UserRole.NURSE ? "Vitals Intake" : userRole === UserRole.DOCTOR ? "OPD Consultation Queue" : "Dashboard"}
              active={location.pathname === '/dashboard' || location.pathname === '/dashboard/' || (userRole === UserRole.NURSE && location.pathname === '/dashboard/nurse') || (userRole === UserRole.DOCTOR && (location.pathname === '/dashboard' || location.pathname === '/dashboard/doctor'))}
              onClick={() => navigate(userRole === UserRole.NURSE ? '/dashboard/nurse' : userRole === UserRole.DOCTOR ? '/dashboard/doctor' : '/dashboard')}
            />
              {userRole === UserRole.NURSE && (
                <>
                  <NavItem
                    icon={<MessageSquare size={20} />}
                    label="Triage Console"
                    active={location.pathname === '/dashboard/nurse/triage'}
                    onClick={() => navigate('/dashboard/nurse/triage')}
                  />
                  <NavItem
                    icon={<Users size={20} />}
                    label="Lobby Roster"
                    active={location.pathname === '/dashboard/nurse/lobby'}
                    onClick={() => navigate('/dashboard/nurse/lobby')}
                  />
                </>
              )}
            <RequireTier minTier={3} userRole={userRole}>
              <NavItem
                icon={<Users size={20} />}
                label="Leads Pipeline"
                active={location.pathname === '/dashboard/leads'}
                onClick={() => { setLeadsFilter('All'); navigate('/dashboard/leads'); }}
              />
            </RequireTier>
            <RequireTier minTier={3} userRole={userRole}>
              <NavItem
                icon={<FileText size={20} />}
                label="Daily Register"
                active={location.pathname === '/dashboard/daily-register'}
                onClick={() => navigate('/dashboard/daily-register')}
              />
            </RequireTier>
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
              onClick={() => navigate('/dashboard/schedules/view')}
            />
          </div>

          {/* Specialist & Clinical Dashboards */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest px-4 mb-3 flex items-center gap-2 opacity-80">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-sm"></span>
              Operations Dashboards
            </div>
            <RequireTier minTier={3} userRole={userRole}>
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
            </RequireTier>
            <RequireTier minTier={1} userRole={userRole}>
              <NavItem
                icon={<ShieldAlert size={20} />}
                label="Clinical Escalations"
                active={location.pathname === '/dashboard/clinical-escalations'}
                onClick={() => navigate('/dashboard/clinical-escalations')}
              />
            </RequireTier>
            
            <RequireTier minTier={3} userRole={userRole}>
              <NavItem
                icon={<Clock size={20} />}
                label="Audit Logs"
                active={location.pathname === '/dashboard/audit-logs'}
                onClick={() => navigate('/dashboard/audit-logs')}
              />
            </RequireTier>
          </div>

          {/* Specialty Desks */}
          {currentUser?.clinic_specialty === 'IVF' && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest px-4 mb-3 flex items-center gap-2 opacity-80">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-sm"></span>
                Specialty Desks
              </div>
              <NavItem
                icon={<Sparkles size={20} />}
                label="IVF Desk"
                active={false}
                onClick={() => navigate('/dashboard/patients')}
              />
            </div>
          )}

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
        <header className="bg-brand-surface border-b border-brand-border px-3.5 sm:px-5 py-2.5 sm:py-3 flex justify-between items-center flex-shrink-0 gap-2 sm:gap-3">

          {/* Left side: Mobile Toggle + Logo + Search Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Brand Icon/Title */}
            <div className="flex md:hidden items-center gap-1.5 min-w-0">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain flex-shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">Medcy</span>
            </div>

            {/* Search Bar - Top Center/Left (sm+) */}
            <div className="flex-1 max-w-xl hidden sm:flex items-center relative" ref={searchRef}>
              <div className="flex items-center bg-brand-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-brand-border w-full focus-within:ring-2 focus-within:ring-brand-primary/30 transition-all">
                <Search size={15} className="text-brand-textSecondary mr-2 flex-shrink-0" />
                <input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => { if(globalSearch) setShowSearchResults(true); }}
                  placeholder="Search Patient Name, Phone, or ID..."
                  className="bg-transparent outline-none text-xs sm:text-sm w-full text-brand-textPrimary placeholder:text-brand-textSecondary"
                />
                <div className="hidden lg:flex items-center gap-1 opacity-60">
                  <span className="text-[10px] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded text-brand-textSecondary">Ctrl</span>
                  <span className="text-[10px] text-brand-textSecondary">+</span>
                  <span className="text-[10px] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded text-brand-textSecondary">K</span>
                </div>
              </div>

              {/* Predictive Search Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full mt-2 w-full bg-brand-surface border border-brand-border rounded-2xl shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-brand-textSecondary animate-pulse">Searching global records...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-2 border-b border-brand-border bg-brand-bg/50">
                        <span className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest ml-2">Matches Found</span>
                      </div>
                      {searchResults.map(patient => (
                        <div key={patient.id || patient.patientId} className="p-3 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-0 flex justify-between items-center group transition-colors">
                          <div>
                            <p className="text-sm font-bold text-brand-textPrimary">{patient.name || patient.fullname || patient.patientName}</p>
                            <p className="text-xs text-brand-textSecondary mt-0.5">{patient.phone || patient.mobile} {patient.uhid ? `• ${patient.uhid}` : ''}</p>
                          </div>
                          <button 
                             onClick={() => {
                               setShowSearchResults(false);
                               setGlobalSearch('');
                               setWalkInInitialData({
                                 name: patient.name || patient.fullname || patient.patientName,
                                 phone: patient.phone || patient.mobile
                               });
                               setIsWalkInExpressOpen(true);
                             }}
                             className="opacity-0 group-hover:opacity-100 bg-brand-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Check-In
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm font-bold text-brand-textPrimary mb-1">No existing patient found</p>
                      <p className="text-xs text-brand-textSecondary mb-3">
                        {globalSearch.trim().replace(/\D/g, '').length >= 3 
                          ? `Mobile number "${globalSearch.trim()}" will be auto-filled in the registration form.`
                          : `Patient name "${globalSearch.trim()}" will be auto-filled in the registration form.`}
                      </p>
                      <button 
                        onClick={() => { 
                          const initial = parseSearchQuery(globalSearch);
                          setWalkInInitialData(initial);
                          setShowSearchResults(false); 
                          setIsWalkInExpressOpen(true); 
                          setGlobalSearch(''); 
                        }} 
                        className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                      >
                        <UserPlus size={14} /> Register New Walk-In
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Status / Toggles */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            
            {/* Walk-In and Queue Action Buttons */}
            <div className="flex items-center gap-1.5">
               <button 
                onClick={() => setIsWalkInExpressOpen(true)}
                className="flex items-center gap-1 bg-brand-primary hover:bg-brand-primaryDark text-white px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold shadow-xs active:scale-95 transition-all"
               >
                 <Activity size={13} /> <span className="hidden sm:inline">Walk-In</span>
               </button>
               <button
                onClick={() => navigate('/dashboard/waiting-room')}
                className="hidden md:flex items-center gap-1.5 bg-brand-surface border border-brand-border text-brand-textPrimary hover:border-brand-primary px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-2xs"
               >
                 <Users size={13} className="text-brand-primary" /> Queue
               </button>
            </div>

            {/* Language Toggles */}
            <div className="hidden lg:flex items-center bg-slate-100 rounded-md p-0.5 border border-brand-border">
              <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer shadow-2xs">EN</span>
              <span className="text-brand-textSecondary text-[10px] font-bold px-2 py-0.5 cursor-pointer hover:text-brand-textPrimary">HI</span>
            </div>
            {/* Time / Date */}
            <div className="hidden xl:flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-md px-2.5 py-1 shadow-2xs">
              <Clock size={12} className="text-brand-primary" />
              <span className="text-[11px] font-semibold text-brand-textSecondary">IST</span>
              <DigitalClock />
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2 cursor-pointer relative" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
              <div className="text-right hidden sm:block mr-1">
                <p className="text-xs font-bold text-brand-textPrimary leading-tight">
                  {currentUser?.name || 'Dr. Rajia'}
                </p>
                <p className="text-[10px] text-brand-textSecondary mt-0.5">{userRole === UserRole.ADMIN ? 'Admin Terminal' : userRole === UserRole.CRO ? 'CRO Terminal' : userRole === UserRole.DOCTOR ? 'Doctor Terminal' : userRole === UserRole.NURSE ? 'Nurse Terminal' : 'Front Desk Terminal'}</p>
              </div>
              <div className="w-8 h-8 rounded-md overflow-hidden bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs shadow-2xs">
                {currentUser?.profile_image_url ? (
                  <img src={currentUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || 'D').charAt(0).toUpperCase()
                )}
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-brand-surface border border-brand-border rounded-xl shadow-xl py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-brand-border">
                    <p className="text-xs font-bold text-brand-textPrimary">{currentUser?.name || 'User'}</p>
                    <p className="text-[10px] text-brand-textSecondary">{currentUser?.email || 'user@example.com'}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">{userRole}</span>
                  </div>

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setIsProfileModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-brand-textPrimary hover:bg-brand-hover flex items-center space-x-2 transition-colors"
                  >
                    <User size={14} className="text-brand-textSecondary" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setIsChangePasswordModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-brand-textPrimary hover:bg-brand-hover flex items-center space-x-2 transition-colors"
                  >
                    <Lock size={14} className="text-brand-textSecondary" />
                    <span>Change Password</span>
                  </button>

                  <div className="border-t border-brand-border my-1"></div>

                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Views Container */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 min-h-0 relative">
          <Routes>
            <Route index element={
              userRole === UserRole.NURSE ? <Navigate to="/dashboard/nurse" replace /> :
              <DashboardHome
                userRole={userRole}
                leads={leads}
                appointments={appointments}
                upcomingAppointments={upcomingAppointments}
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
              <div className="w-full flex-1 bg-brand-surface rounded-lg shadow-2xs border border-brand-border overflow-hidden animate-slide-up flex flex-col min-h-0">
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
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <AppointmentsView userRole={userRole} />
              </div>
            } />
            <Route path="rooms" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <RoomsView />
              </div>
            } />
            <Route path="pending-files" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <div className="bg-brand-surface rounded-lg shadow-2xs border border-brand-border overflow-hidden h-full flex flex-col">
                  <UnassignedDocumentsView />
                </div>
              </div>
            } />
            <Route path="patients" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <PatientsView userRole={userRole} onNavigateToLeads={() => { setLeadsFilter('All'); navigate('/dashboard/leads'); }} />
              </div>
            } />
            <Route path="doctor" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <DoctorDashboard appointments={appointments} upcomingAppointments={upcomingAppointments} onPatientSelect={handlePatientSelect} />
              </div>
            } />
            <Route path="clinical-escalations" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
                <ClinicalEscalationsView appointments={appointments} onPatientSelect={handlePatientSelect} />
              </div>
            } />
            <Route path="nurse" element={<NurseDashboard />} />
            <Route path="nurse/triage" element={<TriageConsole />} />
            <Route path="nurse/lobby" element={<LobbyRoster />} />
            <Route path="control-tower" element={<ControlTowerConsole />} />
            <Route path="cro-inbox" element={<CroInbox />} />
            <Route path="cro-analytics" element={<CroAnalytics />} />
            <Route path="audit-logs" element={<AuditLogsView />} />
            <Route path="daily-register" element={<DailyRegisterTable />} />
            <Route path="waiting-room" element={
              <div className="w-full flex-1 flex flex-col animate-slide-up min-h-0">
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
              <div className="bg-brand-surface rounded-lg shadow-2xs border border-brand-border overflow-hidden animate-slide-up h-full flex flex-col p-4 sm:p-6">
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

            {isWalkInExpressOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <ClinicRegistrationForm 
            initialData={walkInInitialData}
            onCancel={() => {
              setIsWalkInExpressOpen(false);
              setWalkInInitialData(undefined);
            }}
            onSuccess={(patientId, appointmentId) => {
              setIsWalkInExpressOpen(false);
              setWalkInInitialData(undefined);
              setRefreshTrigger(prev => prev + 1);
            }}
          />
        </div>
      )}

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
      flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all duration-150 group mb-0.5 select-none
      ${isSubItem ? 'pl-7' : ''}
      ${customClass ? customClass : active
        ? 'bg-brand-primary text-white shadow-xs font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}
    `}
  >
    <div className="flex items-center space-x-2.5">
      <div className={`transition-transform duration-150 flex-shrink-0 ${active || customClass ? '' : 'text-slate-500 group-hover:text-slate-700'}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
      <span className={`text-xs tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </div>
    {rightIcon && <div className="text-slate-400">{rightIcon}</div>}
  </div>
);





