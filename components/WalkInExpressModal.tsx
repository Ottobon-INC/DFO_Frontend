import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, User, Phone, UserCog } from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors';
import { api } from '../services/api';

interface WalkInExpressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, details: any) => void;
}

export const WalkInExpressModal: React.FC<WalkInExpressModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female'); // Default to female given Medcy/Sakhi
  const [doctorId, setDoctorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { doctors, isLoading: doctorsLoading } = useDoctors();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form on open
      setName('');
      setPhone('');
      setGender('Female');
      setDoctorId('');
      setError(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !doctorId) {
      setError('Name, phone, and assigned doctor are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.walkInExpress({
        name,
        phone,
        gender,
        doctor_id: doctorId
      });
      
      if (response.success && response.token) {
        onSuccess(response.token, { name, doctorName: doctors.find(d => d.id === doctorId)?.name || 'Doctor' });
      } else {
        throw new Error('Failed to generate token');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Walk-In Express check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-brand-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 flex justify-between items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Walk-in Express</h2>
              <p className="text-brand-surface/80 text-xs">Instant Check-in & Queue</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors relative z-10 p-1 bg-black/10 hover:bg-black/20 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-textPrimary mb-1.5 flex items-center gap-2">
                <User size={14} className="text-brand-textSecondary" /> Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                placeholder="Enter patient's full name"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-textPrimary mb-1.5 flex items-center gap-2">
                <Phone size={14} className="text-brand-textSecondary" /> Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-brand-textPrimary mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-textPrimary mb-1.5 flex items-center gap-2">
                <UserCog size={14} className="text-brand-textSecondary" /> Assigned Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
              >
                <option value="">Select Doctor</option>
                {!doctorsLoading && doctors?.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialization || 'Consultant'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-brand-textSecondary hover:bg-brand-hover transition-colors font-medium text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-brand-primary/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Express Check-In
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
