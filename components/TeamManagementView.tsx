import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldAlert, Trash2, Edit2, Key, Mail, CheckCircle2, AlertCircle, Plus, Building, Phone, Stethoscope, Briefcase, BadgeInfo, Camera } from 'lucide-react';
import { api } from '../services/api';

interface TeamMember {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  role: 'Doctor' | 'CRO' | 'Receptionist' | 'Nurse' | 'Admin';
  hospital_id?: string;
  department?: string;
  designation?: string;
  specialization?: string;
  profile_image_url?: string;
  is_clinic_admin: boolean;
  is_active?: boolean;
  created_at: string;
}

const ROLE_DEFAULTS: Record<string, { prefix: string; department: string; designation: string; specialization: string }> = {
  Doctor: {
    prefix: 'DOC',
    department: 'OPD',
    designation: 'Doctor',
    specialization: 'General Medicine'
  },
  Nurse: {
    prefix: 'NUR',
    department: 'Nursing',
    designation: 'Staff Nurse',
    specialization: ''
  },
  Receptionist: {
    prefix: 'REC',
    department: 'Front Desk',
    designation: 'Receptionist',
    specialization: ''
  },
  CRO: {
    prefix: 'CRO',
    department: 'Patient Care',
    designation: 'CRO',
    specialization: ''
  },
  Admin: {
    prefix: 'ADM',
    department: 'Administration',
    designation: 'Administrator',
    specialization: ''
  }
};

export const TeamManagementView: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    name: '',
    email: '',
    phone_number: '',
    role: 'Doctor' as 'Doctor' | 'CRO' | 'Receptionist' | 'Nurse' | 'Admin',
    hospital_id: '',
    department: '',
    designation: '',
    specialization: '',
    profile_image_url: '',
    password: '',
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClinicUsers();
      if (res.success) {
        setTeam(res.data || []);
      } else {
        setError(res.error || 'Failed to fetch team members');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleRoleChange = (newRole: 'Doctor' | 'CRO' | 'Receptionist' | 'Nurse' | 'Admin') => {
    const defaults = ROLE_DEFAULTS[newRole] || ROLE_DEFAULTS.Doctor;
    
    if (modalMode === 'create') {
      const randomNum = Math.floor(100 + Math.random() * 900);
      setFormData(prev => ({
        ...prev,
        role: newRole,
        hospital_id: defaults.prefix + '-' + randomNum,
        department: defaults.department,
        designation: defaults.designation,
        specialization: defaults.specialization
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        role: newRole
      }));
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedMember(null);
    const initialRole = 'Doctor';
    const defaults = ROLE_DEFAULTS[initialRole];
    const randomNum = Math.floor(100 + Math.random() * 900);

    setFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      name: '',
      email: '',
      phone_number: '',
      role: initialRole,
      hospital_id: defaults.prefix + '-' + randomNum,
      department: defaults.department,
      designation: defaults.designation,
      specialization: defaults.specialization,
      profile_image_url: '',
      password: '',
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setModalMode('edit');
    setSelectedMember(member);
    const nameParts = (member.name || '').trim().split(' ');
    const fName = member.first_name || nameParts[0] || '';
    const lName = member.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '';

    setFormData({
      first_name: fName,
      middle_name: member.middle_name || '',
      last_name: lName,
      name: member.name || '',
      email: member.email || '',
      phone_number: member.phone_number || '',
      role: member.role,
      hospital_id: member.hospital_id || '',
      department: member.department || '',
      designation: member.designation || '',
      specialization: member.specialization || '',
      profile_image_url: member.profile_image_url || '',
      password: '',
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullName = [formData.first_name, formData.middle_name, formData.last_name].filter(Boolean).join(' ') || formData.name;
    const payload = {
      ...formData,
      name: fullName
    };

    try {
      if (modalMode === 'create') {
        const res = await api.createClinicUser(payload);
        if (res.success) {
          setSuccessMsg('Added ' + fullName + ' successfully');
          setIsModalOpen(false);
          fetchTeam();
        } else {
          setError(res.error || 'Failed to create team member');
        }
      } else if (modalMode === 'edit' && selectedMember) {
        const res = await api.updateClinicUser(selectedMember.id, payload);
        if (res.success) {
          setSuccessMsg('Updated ' + fullName + ' successfully');
          setIsModalOpen(false);
          fetchTeam();
        } else {
          setError(res.error || 'Failed to update team member');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!window.confirm('Are you sure you want to remove ' + (member.name || member.email) + ' from the team?')) {
      return;
    }

    try {
      setError(null);
      const res = await api.removeClinicUser(member.id);
      if (res.success) {
        setSuccessMsg((member.name || member.email) + ' has been removed');
        fetchTeam();
      } else {
        setError(res.error || 'Failed to remove member');
      }
    } catch (err: any) {
      setError(err.message || 'Error removing team member');
    }
  };

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20"><Shield size={11} /> Admin</span>;
    }
    switch (role?.toLowerCase()) {
      case 'doctor':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20"><Stethoscope size={11} /> Doctor</span>;
      case 'nurse':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Nurse</span>;
      case 'cro':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">CRO</span>;
      case 'receptionist':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Front Desk</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  const isFormDoctor = formData.role === 'Doctor';

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs">
        <div>
          <h2 className="text-xl font-black text-brand-textPrimary flex items-center gap-2.5">
            <Users className="text-brand-primary" size={24} />
            Team Management
          </h2>
          <p className="text-xs text-brand-textSecondary mt-1">
            Manage your clinic staff, roles, and accounts
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
        >
          <UserPlus size={16} />
          Add Member
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 flex items-center gap-3">
          <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-brand-textSecondary text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              Loading team directory...
            </div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-brand-textSecondary text-sm">
              <Users size={36} className="mx-auto text-brand-textSecondary/40 mb-3" />
              No staff members found. Click "Add Member" to onboard someone.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/60 text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {team.map((member) => {
                  const mRole = (member.role || '').toLowerCase();
                  const mIsDoctor = mRole === 'doctor';
                  return (
                    <tr key={member.id} className="hover:bg-brand-hover/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm overflow-hidden flex-shrink-0">
                            {member.profile_image_url ? (
                              <img src={member.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              (member.name || member.first_name || member.email || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-brand-textPrimary flex items-center gap-2">
                              {member.name || [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email.split('@')[0]}
                            </div>
                            <div className="text-xs text-brand-textSecondary">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {member.hospital_id ? (
                          <span className="font-mono text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
                            {member.hospital_id}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-textSecondary/60 italic">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(member.role, member.is_clinic_admin)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs font-medium text-brand-textPrimary">
                          {member.department || <span className="text-brand-textSecondary/60 italic">—</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-brand-textSecondary">
                          {member.designation || <span className="text-brand-textSecondary/60 italic">—</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {mIsDoctor ? (
                          <span className="text-xs font-medium text-brand-primary">
                            {member.specialization || <span className="text-brand-textSecondary/60 italic">General</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-textSecondary/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs text-brand-textSecondary">
                          {member.phone_number && (
                            <div className="flex items-center gap-1 text-brand-textPrimary font-medium">
                              <Phone size={11} className="text-brand-primary" /> {member.phone_number}
                            </div>
                          )}
                          <div className="text-brand-textSecondary text-[11px] truncate max-w-[150px]">{member.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {member.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="p-2 text-brand-textSecondary hover:text-brand-primary bg-brand-bg rounded-lg hover:bg-brand-primary/10 transition-all shadow-xs"
                            title="Edit Member"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!member.is_clinic_admin && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-2 text-brand-textSecondary hover:text-red-500 bg-brand-bg rounded-lg hover:bg-red-50 transition-all shadow-xs"
                              title="Remove Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-brand-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up border border-brand-border max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/60 flex-shrink-0">
              <h3 className="font-bold text-lg text-brand-textPrimary flex items-center gap-2">
                {modalMode === 'create' ? <Plus size={20} className="text-brand-primary" /> : <Edit2 size={20} className="text-brand-primary" />}
                {modalMode === 'create' ? 'Add Team Member' : 'Edit Team Member'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-brand-textSecondary hover:text-brand-textPrimary p-1.5 rounded-lg hover:bg-brand-surface transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3.5 bg-brand-bg/50 rounded-xl border border-brand-border">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-xl border-2 border-brand-border bg-brand-surface overflow-hidden flex items-center justify-center text-brand-primary font-bold text-lg shadow-xs">
                    {formData.profile_image_url ? (
                      <img src={formData.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (formData.first_name || formData.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-brand-primary text-white rounded-lg shadow-md hover:bg-brand-primaryDark cursor-pointer transition-transform group-hover:scale-105">
                    <Camera size={12} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, profile_image_url: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-brand-textPrimary">Profile Photo</h5>
                  <p className="text-[11px] text-brand-textSecondary">Upload staff photo</p>
                  {formData.profile_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profile_image_url: '' }))}
                      className="text-[11px] text-red-500 hover:underline mt-0.5"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users size={14} className="text-brand-primary" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Samira"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Rao"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Email Address <span className="text-red-500">*</span> {modalMode === 'edit' && '(Read-Only)'}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
                      <input
                        type="email"
                        required
                        disabled={modalMode === 'edit'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 pl-9 pr-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="staff@clinic.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 pl-9 pr-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        placeholder="+91 90000 00000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Work Details */}
              <div className="pt-2 border-t border-brand-border space-y-4">
                <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                  <Building size={14} className="text-brand-primary" /> Role & Work Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Role <span className="text-red-500">*</span></label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value as any)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-bold"
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Receptionist">Front Desk</option>
                      <option value="CRO">CRO</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Employee ID</label>
                    <div className="relative">
                      <BadgeInfo size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
                      <input
                        type="text"
                        value={formData.hospital_id}
                        onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 pl-9 pr-3 text-sm text-brand-textPrimary font-mono focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        placeholder="e.g. EMP-101"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Front Desk, OPD, Nursing"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Receptionist, Staff Nurse, Doctor"
                    />
                  </div>
                </div>

                {isFormDoctor && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-textSecondary mb-1">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 px-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      placeholder="e.g. Gynecology, Pediatrics"
                    />
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="pt-2 border-t border-brand-border">
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                  {modalMode === 'edit' ? 'Update Password (Optional)' : 'Password *'}
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
                  <input
                    type="password"
                    required={modalMode === 'create'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl py-2 pl-9 pr-3 text-sm text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                </div>
              </div>

              {modalMode === 'edit' && selectedMember?.is_clinic_admin && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    This user has Clinic Administrator privileges.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-brand-textSecondary hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-xl font-bold text-sm shadow-md shadow-brand-primary/20 transition-all active:scale-95"
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
