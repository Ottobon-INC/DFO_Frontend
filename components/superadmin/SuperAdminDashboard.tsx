import React, { useState, useEffect } from 'react';
import { Server, Users, FileText, Plus, Trash2, ShieldCheck, AlertTriangle, Building, LogOut, Loader2, X, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SuperAdminAnalytics, Clinic } from '../../types';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clinic_name: '',
    owner_name: '',
    owner_email: '',
    owner_role: 'Admin'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, clinicsRes] = await Promise.all([
        api.getSuperAdminAnalytics(),
        api.getSuperAdminClinics()
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (clinicsRes.success) setClinics(clinicsRes.data);
    } catch (e) {
      console.error("Failed to fetch super admin data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createClinic(formData);
      
      // If we made it here, the backend threw no 4xx/5xx HTTP errors (or our api client returns success)
      if (res.success) {
        showToast("Clinic created securely.", "success");
        setIsModalOpen(false);
        setFormData({ clinic_name: '', owner_name: '', owner_email: '', owner_role: 'Admin' });
        fetchData(); // Refresh the table
      } else {
        // Unlikely to hit this if the backend throws 409 HttpException, but just in case
        setFormError(res.error || "Failed to create clinic.");
      }
    } catch (err: any) {
      console.error("Clinic creation error:", err);
      // The API client throws an error for non-2xx responses. 
      // The backend returns { success: false, error: "...", code: "EMAIL_ALREADY_REGISTERED" }
      // Our fetchJson likely throws an Error with the message. Let's handle it gracefully.
      const errorMsg = err?.message || err?.error || "An unknown error occurred.";
      setFormError(errorMsg);
      
      if (err?.code === 'EMAIL_ALREADY_REGISTERED' || errorMsg.includes('already registered')) {
         showToast("Operation blocked: Email in use.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClinic = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the clinic: ${name}?`)) {
      try {
        await api.deleteClinic(id);
        showToast("Clinic deleted.", "success");
        fetchData();
      } catch (err: any) {
        showToast(err?.message || "Failed to delete clinic", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-textPrimary selection:bg-red-500/30">
      {/* Navbar */}
      <header className="bg-brand-surface border-b border-brand-border px-8 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-900/20 text-red-500 flex items-center justify-center shadow-inner border border-red-500/20">
            <Server size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">System Control Tower</h1>
            <p className="text-[10px] text-brand-textSecondary uppercase tracking-widest font-bold">Level 5 Clearance</p>
          </div>
        </div>
        
        <button onClick={onLogout} className="flex items-center space-x-2 text-brand-textSecondary hover:text-red-500 transition-colors px-4 py-2 rounded-xl hover:bg-red-500/10">
          <LogOut size={16} />
          <span className="font-bold text-sm">Terminate Session</span>
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8 animate-slide-up">
        {/* Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2"><Building size={14} /> Total Clinics</h4>
            <div className="text-4xl font-extrabold text-brand-textPrimary">{analytics?.total_clinics || 0}</div>
          </div>
          
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full pointer-events-none"></div>
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14} /> Total Patients</h4>
            <div className="text-4xl font-extrabold text-brand-textPrimary">{analytics?.total_patients || 0}</div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
            <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={14} /> Clinical Documents</h4>
            <div className="text-4xl font-extrabold text-brand-textPrimary">{analytics?.total_files || 0}</div>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden">
          <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/10">
            <div>
              <h3 className="text-lg font-bold text-brand-textPrimary">Registered Clinics</h3>
              <p className="text-xs text-brand-textSecondary mt-1">Multi-tenant management console.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
            >
              <Plus size={16} /> New Clinic
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg text-brand-textSecondary text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Clinic Name</th>
                  <th className="p-4">Users Count</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {clinics.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-brand-textSecondary">No clinics active.</td></tr>
                ) : (
                  clinics.map(clinic => (
                    <tr key={clinic.id} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="p-4 pl-6 text-xs text-brand-textSecondary font-mono truncate max-w-[100px]">{clinic.id}</td>
                      <td className="p-4 font-bold text-brand-textPrimary">{clinic.name}</td>
                      <td className="p-4 text-brand-textSecondary font-bold">{clinic.users_count || 0}</td>
                      <td className="p-4 text-xs text-brand-textSecondary">{new Date(clinic.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
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
      </main>

      {/* Create Clinic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-3xl w-full max-w-lg border border-brand-border shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="text-brand-primary" size={20} /> Provision New Clinic
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-full text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClinic} className="p-6 space-y-5">
              {formError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-semibold text-red-500">{formError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Clinic Name</label>
                <input 
                  type="text" 
                  value={formData.clinic_name}
                  onChange={e => setFormData({...formData, clinic_name: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Owner Name</label>
                  <input 
                    type="text" 
                    value={formData.owner_name}
                    onChange={e => setFormData({...formData, owner_name: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Owner Role</label>
                  <select 
                    value={formData.owner_role}
                    onChange={e => setFormData({...formData, owner_role: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Doctor">Doctor</option>
                    <option value="CRO">CRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Owner Email (Genesis Login)</label>
                <input 
                  type="email" 
                  value={formData.owner_email}
                  onChange={e => setFormData({...formData, owner_email: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
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
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Provision Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-50 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-brand-surface border border-brand-border text-brand-textPrimary'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} className="text-green-500" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// CheckCircle missing from lucide import, let's just create a quick svg for the toast if missing, or use Server.
// Actually CheckCircle is standard in lucide-react. I'll add it to imports.
