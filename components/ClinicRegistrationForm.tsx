import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, HeartPulse, Stethoscope, ChevronDown, CheckCircle, Activity, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface ClinicRegistrationFormProps {
  initialData?: any;
  onSuccess: (patientId: string, appointmentId?: string) => void;
  onCancel: () => void;
}

export const ClinicRegistrationForm: React.FC<ClinicRegistrationFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [successModalData, setSuccessModalData] = useState<any>(null);
  
  // Duplicate Detection
  const [duplicateMatch, setDuplicateMatch] = useState<any | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [useExistingPatient, setUseExistingPatient] = useState(false);

  // Personal Details
  const [name, setName] = useState(initialData?.name || initialData?.fullname || '');
  const [mobile, setMobile] = useState(initialData?.phone || initialData?.mobile || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [dob, setDob] = useState(initialData?.dob || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [maritalStatus, setMaritalStatus] = useState(initialData?.marital_status || initialData?.maritalStatus || '');
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup || '');
  const [address, setAddress] = useState(initialData?.address || initialData?.location || '');

  // Emergency / Kin
  const [kinName, setKinName] = useState('');
  const [kinRelation, setKinRelation] = useState('');
  const [kinPhone, setKinPhone] = useState('');

  // Visit Details
  const [source, setSource] = useState('Walk-In');
  const [referralDoctor, setReferralDoctor] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [visitReason, setVisitReason] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.getDoctors();
        const docs = res?.data || res;
        if (Array.isArray(docs)) setDoctors(docs);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    if (mobile.length >= 7 && !useExistingPatient) {
      const timeout = setTimeout(async () => {
        setIsCheckingDuplicate(true);
        try {
          const res = await api.searchPatients(mobile);
          const results = res?.data?.items || (Array.isArray(res?.data) ? res.data : res) || [];
          if (results.length > 0) {
            setDuplicateMatch(results[0]);
          } else {
            setDuplicateMatch(null);
          }
        } catch { }
        setIsCheckingDuplicate(false);
      }, 500);
      return () => clearTimeout(timeout);
    } else if (mobile.length < 7) {
      setDuplicateMatch(null);
      setUseExistingPatient(false);
    }
  }, [mobile, useExistingPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !doctorId || !visitReason) {
      toast("Name, Mobile, Assigned Doctor, and Visit Reason are mandatory.");
      return;
    }

    setLoading(true);
    try {
      let finalPatientId = '';
      let generatedPin = '';

      if (useExistingPatient && duplicateMatch) {
        finalPatientId = duplicateMatch.id || duplicateMatch.patientId;
      } else {
        // 1. Create Patient (or find existing if already registered)
        const patientPayload = {
          name,
          mobile,
          email,
          dob,
          age,
          gender: gender || undefined,
          marital_status: maritalStatus || undefined,
          bloodGroup,
          address,
          kin_name: kinName,
          kin_relation: kinRelation,
            kin_phone: kinPhone,
            source,
            assigned_doctor_id: doctorId,
            referral_doctor: referralDoctor
          };
        
        try {
          const patientRes = await api.createPatient(patientPayload);
          const newPatientId = patientRes?.data?.id || patientRes?.id || patientRes?.patientId;
          if (!newPatientId) {
            throw new Error("Patient ID not returned from creation.");
          }
          finalPatientId = newPatientId;
          
          if (patientRes?.generatedPin) {
            generatedPin = patientRes.generatedPin;
          }
        } catch (patientErr: any) {
          // If patient already exists (409 Conflict), find them by mobile and continue
          const is409 = patientErr?.message?.includes('409') || patientErr?.message?.includes('already exists') || String(patientErr).includes('409') || String(patientErr).includes('already exists');
          if (is409) {
            const searchRes = await api.searchPatients(mobile);
            const items = searchRes?.data?.items || searchRes?.data || (Array.isArray(searchRes) ? searchRes : []);
            const found = items.find((p: any) => p.mobile === mobile || p.phone === mobile);
            if (found) {
              finalPatientId = found.id || found.patientId;
            } else {
              throw new Error("Patient already exists but could not be found. Please use 'Existing Patient' option.");
            }
          } else {
            throw patientErr;
          }
        }
      }

      // 2. QMS Walk-In: Creates appointment + generates token + enqueues in one call
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      const qmsPayload = {
        doctor_id: doctorId,
        date: now.toISOString().split('T')[0],
        time: currentTime,
        mobile: mobile,
        name: name,
        patient_id: finalPatientId,
        type: 'Consultation',
        visit_reason: visitReason,
        patient_email_snapshot: email,
        patient_age_snapshot: age,
        sex_snapshot: gender,
        patient_marital_status_snapshot: maritalStatus,
        patient_address_snapshot: address
      };

      const qmsRes = await api.qmsWalkIn(qmsPayload);
      const newApptId = qmsRes?.appointment_id || qmsRes?.data?.appointment_id;

      if (generatedPin) {
        setSuccessModalData({
          patientId: finalPatientId,
          appointmentId: newApptId,
          pin: generatedPin,
          message: "Patient registered and checked in successfully!"
        });
      } else {
        setSuccessModalData({
          patientId: finalPatientId,
          appointmentId: newApptId,
          pin: null,
          message: "Patient registered and checked in successfully!"
        });
      }
      
      // Delay onSuccess until modal is closed
    } catch (err: any) {
      console.error("Registration failed:", err);
      // We will also use an error modal state or generic alert for errors, for now just use a simple state error or keep alert
      toast.error(err.message || "Failed to register patient.");
    } finally {
      setLoading(false);
    }
  };

  if (successModalData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mb-2">Success!</h2>
          <p className="text-brand-text/70 mb-6">{successModalData.message}</p>
          
          {successModalData.pin && (
            <div className="bg-brand-dark/50 border border-brand-border rounded-xl p-4 mb-6">
              <p className="text-sm text-brand-text/50 uppercase tracking-wider font-semibold mb-1">Patient Portal PIN</p>
              <p className="text-4xl font-mono text-brand-accent font-bold tracking-widest">{successModalData.pin}</p>
              <p className="text-xs text-brand-text/50 mt-2">Please share this with the patient</p>
            </div>
          )}
          
          <button 
            onClick={() => onSuccess(successModalData.patientId, successModalData.appointmentId)}
            className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-4xl mx-auto overflow-hidden animate-fade-in flex flex-col max-h-full">
      {/* Header */}
      <div className="bg-brand-primary p-6 text-white flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus size={24} /> New Patient Registration
          </h2>
          <p className="text-white/80 text-sm mt-1">Generic clinic intake form. Note: UHID is auto-generated.</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Form Body */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-brand-bg/50">
        <form id="clinic-registration-form" onSubmit={handleSubmit} className="space-y-8">
          
          {/* Duplicate Detection Banner */}
          {duplicateMatch && !useExistingPatient && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> EXISTING PATIENT FOUND
                  </h3>
                  <div className="mt-2 text-xs text-yellow-700 grid grid-cols-2 gap-x-8 gap-y-2">
                    <p><span className="font-semibold">Name:</span> {duplicateMatch.name || duplicateMatch.fullname}</p>
                    <p><span className="font-semibold">UHID:</span> {duplicateMatch.uhid || 'N/A'}</p>
                    <p><span className="font-semibold">Phone:</span> {duplicateMatch.phone || duplicateMatch.mobile}</p>
                    <p><span className="font-semibold">Last Visit:</span> {duplicateMatch.lastVisitDate ? new Date(duplicateMatch.lastVisitDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setUseExistingPatient(true);
                      setName(duplicateMatch.name || duplicateMatch.fullname || '');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    Check-In This Patient
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDuplicateMatch(null)}
                    className="text-yellow-600 hover:text-yellow-800 text-xs font-semibold underline"
                  >
                    Ignore, Register as New
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {useExistingPatient && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm flex justify-between items-center animate-fade-in">
              <p className="text-sm text-green-800 font-semibold">
                Checking in existing patient: <span className="font-bold">{name}</span> ({duplicateMatch?.uhid})
              </p>
              <button 
                type="button" 
                onClick={() => { setUseExistingPatient(false); setDuplicateMatch(null); }}
                className="text-xs text-green-700 underline font-semibold hover:text-green-900"
              >
                Cancel / New Patient
              </button>
            </div>
          )}

          {/* 1. Personal Details */}
          {!useExistingPatient && (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-brand-primary mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-brand-border pb-2">
                <User size={16} /> Personal Details
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Full Name *</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Mobile Number *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                  <input 
                    type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" 
                    placeholder="10-digit number" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Email Address</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                  placeholder="john@example.com" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Date of Birth</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                  <input 
                    type="date" value={dob} onChange={e => setDob(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Age</label>
                <input 
                  type="number" value={age} onChange={e => setAge(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                  placeholder="e.g. 30" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Gender</label>
                <select 
                  value={gender} onChange={e => setGender(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Marital Status</label>
                <select 
                  value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Blood Group</label>
                <select 
                  value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Full Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                  <input 
                    type="text" value={address} onChange={e => setAddress(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                    placeholder="Street, City, State, ZIP" 
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {/* 2. Emergency / Kin Contact */}
          {!useExistingPatient && (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-brand-border pb-2">
                <HeartPulse size={16} /> Emergency / Kin Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Kin Name</label>
                  <input 
                    type="text" value={kinName} onChange={e => setKinName(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                    placeholder="e.g. Mary Doe" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Relation</label>
                  <select 
                    value={kinRelation} onChange={e => setKinRelation(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    
                      <option value="Partner">Partner</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Friend">Friend</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Kin Mobile</label>
                  <input 
                    type="tel" value={kinPhone} onChange={e => setKinPhone(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                    placeholder="10-digit number" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Visit Details */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-brand-accent mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-brand-border pb-2">
              <Activity size={16} /> Visit Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Source of Visit</label>
                <select 
                  value={source} onChange={e => setSource(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="Walk-In">Walk-In</option>
                  <option value="Referral">Doctor Referral</option>
                  <option value="Google">Google / Online</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Social Media">Social Media</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Referral Doctor (if applicable)</label>
                <input 
                  type="text" value={referralDoctor} onChange={e => setReferralDoctor(e.target.value)} 
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                  placeholder="e.g. Dr. Smith" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Assigned Consultation Doctor *</label>
                <div className="relative">
                  <Stethoscope size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                  <select 
                    required value={doctorId} onChange={e => setDoctorId(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id || d.doctorId} value={d.id || d.doctorId}>
                        {d.name || d.user?.name || `Dr. ${d.user?.firstName || ''} ${d.user?.lastName || ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Visit Reason / Handoff Notes *</label>
                <textarea 
                  required value={visitReason} onChange={e => setVisitReason(e.target.value)} 
                  rows={3}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" 
                  placeholder="Enter the primary reason for the visit (e.g. Fever for 3 days, follow-up). This will be sent directly to the doctor's active consultation queue." 
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-brand-border bg-brand-surface flex justify-end gap-3 flex-shrink-0">
        <button 
          type="button" onClick={onCancel}
          className="px-6 py-2.5 text-sm font-bold text-brand-textSecondary border border-brand-border rounded-xl hover:bg-brand-bg transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" form="clinic-registration-form" disabled={loading}
          className="px-8 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? 'Registering...' : <><CheckCircle size={18} /> Register & Check-In</>}
        </button>
      </div>
    </div>
  );
};

