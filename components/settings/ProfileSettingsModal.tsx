import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, User, Building, Phone, Mail, BadgeInfo, Stethoscope, Briefcase } from 'lucide-react';
import { api } from '../../services/api';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: (updatedUser: any) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    profile_image_url: '',
    hospital_id: '',
    department: '',
    designation: '',
    specialization: '',
  });

  const userRole = (currentUser?.role || '').toLowerCase();
  const isDoctor = userRole === 'doctor';

  useEffect(() => {
    if (isOpen && currentUser) {
      const nameParts = (currentUser.name || '').trim().split(' ');
      const defaultFirst = currentUser.first_name || nameParts[0] || '';
      const defaultLast = currentUser.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '';

      setFormData({
        first_name: defaultFirst,
        middle_name: currentUser.middle_name || '',
        last_name: defaultLast,
        phone_number: currentUser.phone_number || '',
        email: currentUser.email || '',
        profile_image_url: currentUser.profile_image_url || '',
        hospital_id: currentUser.hospital_id || '',
        department: currentUser.department || '',
        designation: currentUser.designation || '',
        specialization: currentUser.specialization || '',
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.updateUserProfile(formData);
      if (response?.data?.success || response?.success || response?.data) {
        setSuccess('Profile updated successfully!');
        const updatedData = response?.data?.data || response?.data || response?.user || formData;
        const mergedUser = {
          ...currentUser,
          ...updatedData,
          name: [formData.first_name, formData.last_name].filter(Boolean).join(' ') || currentUser?.name
        };
        try {
          localStorage.setItem('user', JSON.stringify(mergedUser));
        } catch (e) { }
        onUpdate(mergedUser);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(response?.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-brand-border max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-hover/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-textPrimary">Profile Settings</h2>
              <p className="text-xs text-brand-textSecondary">Manage your personal and work details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-brand-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">⚠️ {error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2">✓ {success}</div>}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-7">
            
            {/* --- Personal Information --- */}
            <div>
              <h3 className="text-sm font-bold text-brand-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border pb-2 flex items-center gap-2">
                <User size={16} className="text-brand-primary" /> Personal Information
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Profile Image Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-4 border-brand-surface shadow-md overflow-hidden bg-brand-hover flex items-center justify-center">
                      {formData.profile_image_url ? (
                        <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-brand-textSecondary/50" />
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primaryDark transition-colors group-hover:scale-110 duration-200"
                    >
                      <Camera size={14} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <span className="text-xs text-brand-textSecondary font-medium">Profile Image</span>
                </div>

                {/* Name Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase">First Name <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange} 
                      placeholder="e.g. Samira"
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase">Middle Name</label>
                    <input 
                      name="middle_name" 
                      value={formData.middle_name} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase">Last Name</label>
                    <input 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange} 
                      placeholder="e.g. Rao"
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" 
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Mail size={12}/> Email Address <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Phone size={12}/> Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone_number" 
                    value={formData.phone_number} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" 
                    placeholder="+91 90000 00000"
                  />
                </div>
              </div>
            </div>

            {/* --- Professional Details --- */}
            <div>
              <div className="flex items-center justify-between border-b border-brand-border pb-2 mb-4">
                <h3 className="text-sm font-bold text-brand-textPrimary uppercase tracking-wider flex items-center gap-2">
                  <Building size={16} className="text-brand-primary" /> Professional Details
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-brand-primary/10 text-brand-primary font-bold rounded-full text-xs uppercase tracking-wide">
                    {currentUser?.role || 'Staff'}
                  </span>
                  {currentUser?.is_clinic_admin && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 font-bold rounded-full text-[10px] uppercase">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><BadgeInfo size={12}/> Employee ID</label>
                  <input
                    type="text"
                    name="hospital_id"
                    value={formData.hospital_id}
                    onChange={handleChange}
                    placeholder="e.g. EMP-101"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Building size={12}/> Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Front Desk, OPD, Nursing"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Briefcase size={12}/> Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Receptionist, Staff Nurse, Consultant"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary"
                  />
                </div>

                {isDoctor && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Stethoscope size={12}/> Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Gynecology, Pediatrics"
                      className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary"
                    />
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border bg-brand-hover flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-brand-textSecondary hover:bg-brand-surface rounded-lg transition-colors border border-transparent hover:border-brand-border">
            Cancel
          </button>
          <button 
            type="submit" 
            form="profile-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 active:scale-95"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
