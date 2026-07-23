import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, Building, Phone, Mail, BadgeInfo, Stethoscope } from 'lucide-react';
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
    first_name: currentUser?.first_name || '',
    middle_name: currentUser?.middle_name || '',
    last_name: currentUser?.last_name || '',
    phone_number: currentUser?.phone_number || '',
    email: currentUser?.email || '',
    profile_image_url: currentUser?.profile_image_url || '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to Supabase Storage and get a URL.
      // For now, we'll use a local object URL to demonstrate the UI flow.
      const fakeUrl = URL.createObjectURL(file);
      setFormData({ ...formData, profile_image_url: fakeUrl });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/clinic/users/profile', formData);
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        // Update the local context with the new user object
        onUpdate(response.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-brand-border">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-hover/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-textPrimary">Profile Settings</h2>
              <p className="text-xs text-brand-textSecondary">Manage your personal and professional details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brand-textSecondary hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{success}</div>}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
            
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
                    <input required name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase">Middle Name</label>
                    <input name="middle_name" value={formData.middle_name} onChange={handleChange} className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-textSecondary uppercase">Last Name</label>
                    <input name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Mail size={12}/> Email Address <span className="text-red-500">*</span></label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Phone size={12}/> Phone Number</label>
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none bg-brand-surface text-brand-textPrimary" placeholder="+91 90000 00000"/>
                </div>
              </div>
            </div>

            {/* --- Professional Information (Read Only) --- */}
            <div>
              <h3 className="text-sm font-bold text-brand-textPrimary uppercase tracking-wider mb-4 border-b border-brand-border pb-2 flex items-center gap-2">
                <Building size={16} className="text-brand-primary" /> Professional Details (HR Controlled)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><BadgeInfo size={12}/> Hospital ID</label>
                  <div className="w-full px-3 py-2 bg-brand-hover/50 border border-brand-border rounded-lg text-sm text-brand-textSecondary font-mono">
                    {currentUser?.hospital_id || 'Not Assigned'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase flex items-center gap-1.5"><Stethoscope size={12}/> Department</label>
                  <div className="w-full px-3 py-2 bg-brand-hover/50 border border-brand-border rounded-lg text-sm text-brand-textSecondary">
                    {currentUser?.department || 'General'}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-brand-textSecondary uppercase">Designation & Role</label>
                  <div className="w-full px-3 py-2 bg-brand-hover/50 border border-brand-border rounded-lg text-sm text-brand-textSecondary flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary font-bold rounded text-xs">{currentUser?.role}</span>
                    {currentUser?.designation && <span>- {currentUser.designation}</span>}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border bg-brand-hover flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-brand-textSecondary hover:bg-brand-surface rounded-lg transition-colors border border-transparent hover:border-brand-border">
            Cancel
          </button>
          <button 
            type="submit" 
            form="profile-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
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
