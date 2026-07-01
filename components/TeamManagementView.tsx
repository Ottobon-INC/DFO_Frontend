import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, ShieldAlert, Edit2, Key, Mail, Building, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../types';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic_id: string;
  is_clinic_admin: boolean;
  created_at?: string;
}

export const TeamManagementView: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Receptionist',
  });

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await api.getClinicUsers();
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch team members", error);
      showToast("Failed to load team members", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', email: '', password: '', role: 'Receptionist' });
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setModalMode('edit');
    setSelectedMember(member);
    setFormData({ name: member.name, email: member.email, password: '', role: member.role });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await api.createClinicUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        showToast("Team member added successfully", "success");
      } else if (modalMode === 'edit' && selectedMember) {
        const payload: any = { role: formData.role };
        if (formData.name !== selectedMember.name) payload.name = formData.name;
        if (formData.password) payload.password = formData.password;

        await api.updateClinicUser(selectedMember.id, payload);
        showToast("Team member updated successfully", "success");
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to save team member", error);
      showToast(error.message || "Action failed", "error");
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!window.confirm(`Are you sure you want to completely remove ${member.name} from the clinic? This action cannot be undone.`)) return;
    
    try {
      await api.removeClinicUser(member.id);
      showToast("Team member removed successfully", "success");
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to remove team member", error);
      showToast(error.message || "Failed to remove member", "error");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Doctor': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CRO': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Nurse': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'Receptionist':
      case 'Front Desk':
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg border z-50 animate-slide-up flex items-center space-x-3
          ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-surface border-brand-primary/20 text-brand-primary'}`}
        >
          {toast.type === 'error' ? <ShieldAlert size={20} /> : <Shield size={20} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-brand-textPrimary flex items-center">
            <Users className="mr-3 text-brand-primary" size={28} />
            Team Management
          </h1>
          <p className="text-sm text-brand-textSecondary mt-1">
            Manage your clinic's staff, roles, and access controls.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-brand-primary text-brand-bg px-5 py-2.5 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5"
        >
          <Plus size={18} className="mr-2" />
          Add Member
        </button>
      </div>

      {/* Content */}
      <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-brand-textSecondary">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mr-3"></div>
              Loading team...
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-brand-textSecondary">
              <Users size={48} className="mb-4 opacity-20" />
              <p>No team members found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-brand-surface z-10 shadow-sm border-b border-brand-border">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Email</th>
                  <th className="py-4 px-6 text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Access Level</th>
                  <th className="py-4 px-6 text-right text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-brand-hover/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs mr-3">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-brand-textPrimary text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-brand-textSecondary">
                      <div className="flex items-center">
                        <Mail size={14} className="mr-2 opacity-50" />
                        {member.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {member.is_clinic_admin ? (
                        <span className="flex items-center text-xs font-bold text-brand-accent">
                          <Shield size={14} className="mr-1.5" /> Clinic Admin
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-brand-textSecondary">
                          Standard Access
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-2 text-brand-textSecondary hover:text-brand-primary bg-brand-bg rounded-lg hover:bg-brand-primary/10 transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Edit Member"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!member.is_clinic_admin && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-2 text-brand-textSecondary hover:text-red-500 bg-brand-bg rounded-lg hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove Member"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border border-brand-border">
            <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h3 className="font-bold text-lg text-brand-textPrimary flex items-center">
                {modalMode === 'create' ? <Plus size={20} className="mr-2 text-brand-primary" /> : <Edit2 size={20} className="mr-2 text-brand-primary" />}
                {modalMode === 'create' ? 'Add Team Member' : 'Edit Team Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-textSecondary">
                    <Users size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="Dr. Sarah Connor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Email Address {modalMode === 'edit' && '(Read Only)'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-textSecondary">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="sarah@clinic.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="CRO">CRO</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Receptionist">Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-2">
                    {modalMode === 'edit' ? 'New Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-textSecondary">
                      <Key size={18} />
                    </div>
                    <input
                      type="password"
                      required={modalMode === 'create'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                      placeholder={modalMode === 'edit' ? "Leave blank to keep" : "••••••••"}
                    />
                  </div>
                </div>
              </div>

              {modalMode === 'edit' && selectedMember?.is_clinic_admin && (
                <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-xl mt-4 flex items-start space-x-3">
                  <ShieldAlert size={18} className="text-brand-accent mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-accent font-medium leading-relaxed">
                    This user is a Clinic Admin. You cannot revoke admin privileges here, but you can change their role and password.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-brand-textSecondary hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-primary text-brand-bg rounded-xl font-bold text-sm hover:bg-opacity-90 shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
                >
                  {modalMode === 'create' ? 'Create Member' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
