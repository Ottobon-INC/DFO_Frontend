import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { DOCTORS } from '../constants';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
  patientName: string;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, onConfirm, patientName }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-brand-surface w-full max-w-lg rounded-2xl shadow-2xl animate-slide-down overflow-hidden border border-brand-border">
        <div className="bg-brand-bg p-6 flex justify-between items-center border-b border-brand-border">
          <div>
            <h3 className="text-brand-textPrimary text-lg font-bold">Reschedule Appointment</h3>
            <p className="text-brand-textSecondary text-xs">Patient: <span className="text-brand-primary">{patientName}</span></p>
          </div>
          <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wide">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={16} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wide">Select Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={16} />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-brand-textSecondary hover:bg-brand-bg rounded-lg transition-colors border border-transparent hover:border-brand-border"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (date && time) onConfirm(date, time);
              }}
              className="px-8 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg text-sm font-bold rounded-lg shadow-lg shadow-brand-primary/20 transform active:scale-95 transition-all"
            >
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed top-6 right-6 z-[110] animate-slide-in-left">
      <div className="bg-brand-surface text-brand-textPrimary px-6 py-4 rounded-xl shadow-2xl border-l-4 border-brand-success flex items-center space-x-4 border-y border-r border-brand-border">
        <div className="bg-brand-success/10 p-1 rounded-full border border-brand-success/20">
          <CheckCircle size={16} className="text-brand-success" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary">Notification</p>
          <p className="text-sm font-semibold">{message}</p>
        </div>
        <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary ml-4">
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
};

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { visitType: string; remarks: string }) => void;
  patientName: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onConfirm, patientName }) => {
  const [visitType, setVisitType] = useState('Consultation');
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative bg-brand-surface w-full max-w-md rounded-2xl shadow-2xl animate-slide-down overflow-hidden border border-brand-border">
        <div className="bg-brand-bg p-6 flex justify-between items-center border-b border-brand-border">
          <div>
            <h3 className="text-brand-textPrimary text-lg font-bold">Patient Check-In</h3>
            <p className="text-brand-textSecondary text-xs">Patient: <span className="text-brand-primary">{patientName}</span></p>
          </div>
          <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wide block mb-2">Visit Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="Consultation">Consultation</option>
              <option value="Procedure">Procedure</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Scan">Scan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wide block mb-2">Remarks / Notes</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any specific notes for the doctor or nurse..."
              className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-sm font-medium text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none h-24 resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-brand-textSecondary hover:bg-brand-bg rounded-lg transition-colors border border-transparent hover:border-brand-border">
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm({ visitType, remarks });
                onClose();
              }}
              className="px-8 py-2.5 bg-brand-primary hover:bg-brand-secondary text-brand-bg text-sm font-bold rounded-lg shadow-lg shadow-brand-primary/20 transform active:scale-95 transition-all"
            >
              Confirm Check-In
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    phone: string;
    source: string;
    inquiry: string;
    referralRequired: 'Yes' | 'No'; // New
    alternativePhoneNumber: string; // New
    husbandOrGuardianName: string; // New
    husbandAge: string; // New
    location: string; // New
    age: string;
    gender: 'Male' | 'Female' | 'Other';
    problem: string;
    treatmentDoctor: string;
    treatmentSuggested: string;
  }) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [data, setData] = useState({
    name: '',
    phone: '',
    source: 'Walk-In',
    inquiry: 'General',
    referralRequired: 'No' as 'Yes' | 'No', // Default
    alternativePhoneNumber: '',
    husbandOrGuardianName: '',
    husbandAge: '',
    location: '',
    age: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    problem: '',
    treatmentDoctor: '',
    treatmentSuggested: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(data);
    onClose();
    setData({
      name: '',
      phone: '',
      source: 'Walk-In',
      inquiry: 'General',
      referralRequired: 'No',
      alternativePhoneNumber: '',
      husbandOrGuardianName: '',
      husbandAge: '',
      location: '',
      age: '',
      gender: 'Female',
      problem: '',
      treatmentDoctor: '',
      treatmentSuggested: ''
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative bg-brand-surface w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-in overflow-hidden border border-brand-border flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg flex-shrink-0">
          <h3 className="text-lg font-bold text-brand-textPrimary">Add New Lead</h3>
          <button onClick={onClose} className="text-brand-textSecondary hover:text-brand-textPrimary">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="col-span-2 md:col-span-1 space-y-4">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border pb-2">Personal Details</h4>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Full Name</label>
                  <input
                    required
                    value={data.name}
                    onChange={e => setData({ ...data, name: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Age</label>
                    <input
                      type="number"
                      value={data.age}
                      onChange={e => setData({ ...data, age: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Gender</label>
                    <select
                      value={data.gender}
                      onChange={e => setData({ ...data, gender: e.target.value as any })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Husband / Guardian Name</label>
                  <input
                    value={data.husbandOrGuardianName}
                    onChange={e => setData({ ...data, husbandOrGuardianName: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter husband/guardian name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Husband Age</label>
                  <input
                    type="number"
                    value={data.husbandAge}
                    onChange={e => setData({ ...data, husbandAge: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Husband Age"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">City / Location</label>
                  <input
                    value={data.location}
                    onChange={e => setData({ ...data, location: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter city/location"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Phone Number</label>
                  <input
                    required
                    value={data.phone}
                    onChange={e => setData({ ...data, phone: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Alternative Phone Number</label>
                  <input
                    value={data.alternativePhoneNumber}
                    onChange={e => setData({ ...data, alternativePhoneNumber: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter alt phone"
                  />
                </div>
              </div>

              {/* Clinical / Camp Info */}
              <div className="col-span-2 md:col-span-1 space-y-4">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border pb-2">Camp / Clinical Info</h4>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Presenting Problem</label>
                  <textarea
                    value={data.problem}
                    onChange={e => setData({ ...data, problem: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors h-20 resize-none"
                    placeholder="Describe the main complaint..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Treatment Doctor (Camp) <span className="text-brand-textSecondary/50 normal-case">(Optional)</span></label>
                  <select
                    value={data.treatmentDoctor}
                    onChange={e => {
                      const selected = DOCTORS.find(d => d.name === e.target.value);
                      setData({
                        ...data,
                        treatmentDoctor: e.target.value,
                        treatmentSuggested: selected?.speciality || data.treatmentSuggested // Auto-suggest speciality
                      });
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                  >
                    <option value="">Select Doctor (Optional)</option>
                    {DOCTORS.map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Suggested Treatment <span className="text-brand-textSecondary/50 normal-case">(Optional)</span></label>
                  <input
                    value={data.treatmentSuggested}
                    onChange={e => setData({ ...data, treatmentSuggested: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                    placeholder="e.g. IVF, IUI, Scan"
                  />
                </div>
              </div>
            </div>

            {/* Source & Inquiry */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-border">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Source</label>
                <select
                  value={data.source}
                  onChange={e => setData({ ...data, source: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                >
                  <option>Walk-In</option>
                  <option>Camp</option>
                  <option>Referral</option>
                  <option>Website</option>
                  <option>Social Media</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase mb-1">Referral Required</label>
                <select
                  value={data.referralRequired} // Cleaned up from Inquiry Type
                  onChange={e => setData({ ...data, referralRequired: e.target.value as 'Yes' | 'No' })}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-textPrimary outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-brand-bg font-bold rounded-xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
                Create Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
