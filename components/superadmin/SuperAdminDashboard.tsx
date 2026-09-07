import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Plus, Trash2, LogOut, ShieldCheck, 
  RefreshCw, CheckCircle, AlertTriangle, X, Loader2, Sparkles, 
  Calendar, Phone, Mail, MessageSquare, ArrowRight, UserCheck, 
  Clock, Filter, Search, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

interface ClinicItem {
  id: string;
  name: string;
  created_at: string;
  users_count?: number;
  is_active?: boolean;
}

interface DemoRequestItem {
  id: string;
  hospital_name: string;
  contact_name: string;
  designation?: string;
  email: string;
  phone: string;
  city?: string;
  patient_volume?: string;
  preferred_channel?: string;
  preferred_slot?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'rejected';
  notes?: string;
  created_at: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'demos' | 'clinics'>('demos');
  const [clinics, setClinics] = useState<ClinicItem[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequestItem[]>([]);
  const [analytics, setAnalytics] = useState<{ total_clinics: number; total_patients: number; total_files: number }>({
    total_clinics: 0,
    total_patients: 0,
    total_files: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    clinic_name: '',
    owner_name: '',
    owner_email: '',
    owner_role: 'Admin'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, clinicsRes, demosRes] = await Promise.all([
        api.getSuperAdminAnalytics().catch(() => ({ data: { total_clinics: 0, total_patients: 0, total_files: 0 } })),
        api.getSuperAdminClinics().catch(() => ({ data: [] })),
        api.getSuperAdminDemoRequests().catch(() => ({ data: [] }))
      ]);

      if (analyticsRes && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (clinicsRes && Array.isArray(clinicsRes.data)) {
        setClinics(clinicsRes.data);
      }
      if (demosRes && Array.isArray(demosRes.data)) {
        setDemoRequests(demosRes.data);
      }
    } catch (e: any) {
      showToast('Error loading platform metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.createClinic(formData);
      showToast(`Clinic "${formData.clinic_name}" provisioned successfully!`);
      setIsModalOpen(false);
      setFormData({ clinic_name: '', owner_name: '', owner_email: '', owner_role: 'Admin' });
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create clinic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClinic = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to completely delete clinic "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteClinic(id);
      showToast(`Clinic "${name}" deleted.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete clinic', 'error');
    }
  };

  const handleUpdateDemoStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateSuperAdminDemoRequest(id, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      setDemoRequests(prev => prev.map(d => d.id === id ? { ...d, status: newStatus as any } : d));
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleConvertDemoToClinic = (demo: DemoRequestItem) => {
    setFormData({
      clinic_name: demo.hospital_name,
      owner_name: demo.contact_name,
      owner_email: demo.email,
      owner_role: 'Admin'
    });
    setIsModalOpen(true);
  };

  const filteredDemos = demoRequests.filter(demo => {
    const matchesStatus = statusFilter === 'all' || demo.status === statusFilter;
    const matchesSearch = !searchQuery || 
      demo.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (demo.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingDemosCount = demoRequests.filter(d => d.status === 'pending').length;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-textPrimary flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-brand-border bg-brand-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-textPrimary flex items-center gap-2">
              Medcy Control Tower <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-mono">SUPER ADMIN</span>
            </h1>
            <p className="text-xs text-brand-textSecondary">Multi-Tenant Healthcare Cloud Infrastructure</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData} 
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-brand-textSecondary hover:text-brand-textPrimary transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin text-brand-primary" : ""} />
          </button>
          <button 
            onClick={() => {
              setFormData({ clinic_name: '', owner_name: '', owner_email: '', owner_role: 'Admin' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Provision Clinic
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 border border-brand-border hover:bg-brand-bg rounded-xl font-bold text-xs text-brand-textSecondary hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary">Active Clinics</p>
              <h3 className="text-3xl font-extrabold text-brand-textPrimary mt-0.5">{analytics.total_clinics}</h3>
            </div>
          </div>

          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary">Inbound Demo Requests</p>
              <h3 className="text-3xl font-extrabold text-brand-textPrimary mt-0.5">{demoRequests.length}</h3>
            </div>
          </div>

          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary">Pending Walkthroughs</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-0.5">{pendingDemosCount}</h3>
            </div>
          </div>

          <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary">Total Platform Patients</p>
              <h3 className="text-3xl font-extrabold text-brand-textPrimary mt-0.5">{analytics.total_patients}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div className="flex items-center gap-2 p-1 bg-brand-surface rounded-2xl border border-brand-border">
            <button
              onClick={() => setActiveTab('demos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'demos'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-brand-textSecondary hover:text-brand-textPrimary'
              }`}
            >
              <Calendar size={15} /> Inbound Demo Requests ({demoRequests.length})
              {pendingDemosCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-white font-mono font-bold">
                  {pendingDemosCount} new
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('clinics')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'clinics'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-brand-textSecondary hover:text-brand-textPrimary'
              }`}
            >
              <Building2 size={15} /> Provisioned Clinics ({clinics.length})
            </button>
          </div>

          {activeTab === 'demos' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-brand-textSecondary" />
                <input
                  type="text"
                  placeholder="Search hospital, doctor, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-brand-surface border border-brand-border rounded-xl pl-9 pr-4 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs font-bold text-brand-textSecondary outline-none focus:border-brand-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: INBOUND DEMO REQUESTS */}
        {activeTab === 'demos' && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-brand-textPrimary">Hospital Onboarding Inquiries</h3>
                <p className="text-xs text-brand-textSecondary">Prospective clinics requesting guided walkthroughs and tenant provisioning</p>
              </div>
              <span className="text-xs font-bold text-brand-textSecondary font-mono">{filteredDemos.length} Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Hospital / Clinic</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Slot & Channel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Onboarding Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {filteredDemos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-brand-textSecondary">
                        <Calendar size={32} className="mx-auto mb-2 text-brand-textSecondary/40" />
                        <p className="font-bold">No demo requests found matching filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDemos.map(demo => {
                      const whatsappUrl = `https://wa.me/${demo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${demo.contact_name}, this is the Medcy Health Tech Solutions team regarding your demo walkthrough request for ${demo.hospital_name}.`
                      )}`;

                      return (
                        <tr key={demo.id} className="hover:bg-brand-bg/50 transition-colors">
                          <td className="p-4 pl-6">
                            <strong className="font-bold text-brand-textPrimary text-sm block">{demo.hospital_name}</strong>
                            <span className="text-brand-textSecondary text-[11px]">{demo.city || 'Location unspecified'} • {demo.patient_volume || 'Vol: Standard'}</span>
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-brand-textPrimary block">{demo.contact_name}</span>
                            <span className="text-brand-textSecondary text-[11px]">{demo.designation || 'Representative'}</span>
                          </td>

                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-brand-textPrimary">
                              <Mail size={12} className="text-brand-primary" /> {demo.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-brand-textSecondary font-mono">
                                <Phone size={12} /> {demo.phone}
                              </span>
                              <a 
                                href={whatsappUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500 hover:text-white transition-colors"
                              >
                                <MessageSquare size={10} /> WhatsApp
                              </a>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-brand-textPrimary block">{demo.preferred_slot || 'ASAP'}</span>
                            <span className="text-brand-textSecondary text-[11px]">{demo.preferred_channel || 'WhatsApp Walkthrough'}</span>
                          </td>

                          <td className="p-4">
                            <select
                              value={demo.status}
                              onChange={e => handleUpdateDemoStatus(demo.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none border cursor-pointer ${
                                demo.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                demo.status === 'contacted' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                demo.status === 'scheduled' ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' :
                                demo.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                'bg-red-500/10 text-red-500 border-red-500/30'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => handleConvertDemoToClinic(demo)}
                              className="px-3.5 py-2 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/20 font-bold text-xs transition-all flex items-center gap-1.5 ml-auto"
                              title="Provision Tenant for this Clinic"
                            >
                              <ShieldCheck size={14} /> Provision Clinic <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROVISIONED CLINICS */}
        {activeTab === 'clinics' && (
          <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-brand-textPrimary">Provisioned Clinics & Hospitals</h3>
                <p className="text-xs text-brand-textSecondary">Active multi-tenant instances on Medcy Health Tech</p>
              </div>
              <button 
                onClick={() => {
                  setFormData({ clinic_name: '', owner_name: '', owner_email: '', owner_role: 'Admin' });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-brand-primary text-white rounded-xl font-bold text-xs hover:bg-brand-secondary transition-colors"
              >
                <Plus size={14} /> Add New Clinic
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Tenant ID</th>
                    <th className="p-4">Clinic Name</th>
                    <th className="p-4">Staff Count</th>
                    <th className="p-4">Provisioned At</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {clinics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-brand-textSecondary">
                        <Building2 size={32} className="mx-auto mb-2 text-brand-textSecondary/40" />
                        <p className="font-bold">No active clinics found.</p>
                      </td>
                    </tr>
                  ) : (
                    clinics.map(clinic => (
                      <tr key={clinic.id} className="hover:bg-brand-bg/50 transition-colors">
                        <td className="p-4 pl-6 text-xs text-brand-textSecondary font-mono truncate max-w-[120px]">{clinic.id}</td>
                        <td className="p-4 font-bold text-brand-textPrimary text-sm">{clinic.name}</td>
                        <td className="p-4 text-brand-textSecondary font-bold">{clinic.users_count || 0} Staff</td>
                        <td className="p-4 text-brand-textSecondary">{new Date(clinic.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button 
                            onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                            className="p-2 text-brand-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Clinic"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Provision Clinic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-3xl w-full max-w-lg border border-brand-border shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="text-brand-primary" size={20} /> Provision Clinic Tenant
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-full text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClinic} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-500">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <p className="font-semibold">{formError}</p>
                </div>
              )}
              
              <div>
                <label className="block font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">Hospital / Clinic Name *</label>
                <input 
                  type="text" 
                  value={formData.clinic_name}
                  onChange={e => setFormData({...formData, clinic_name: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs font-medium focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g. Apollo Fertility Clinic"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">Owner / Admin Name *</label>
                  <input 
                    type="text" 
                    value={formData.owner_name}
                    onChange={e => setFormData({...formData, owner_name: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs font-medium focus:border-brand-primary outline-none transition-all"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">Initial Role</label>
                  <select 
                    value={formData.owner_role}
                    onChange={e => setFormData({...formData, owner_role: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs font-medium focus:border-brand-primary outline-none transition-all"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Doctor">Doctor</option>
                    <option value="CRO">CRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">Genesis Login Email *</label>
                <input 
                  type="email" 
                  value={formData.owner_email}
                  onChange={e => setFormData({...formData, owner_email: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs font-medium focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g. sarah.j@apollofertility.com"
                  required
                />
              </div>

              <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-brand-textSecondary hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />}
                  Provision Clinic Instance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-50 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-brand-surface border border-brand-border text-brand-textPrimary'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} className="text-emerald-500" />}
          <span className="font-bold text-xs">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
