import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, HeartPulse, Stethoscope, ChevronDown, CheckCircle, Activity, UserPlus } from 'lucide-react';
import { api } from '../services/api';

interface ClinicRegistrationFormProps {
  initialData?: any;
  onSuccess: (patientId: string, appointmentId?: string) => void;
  onCancel: () => void;
}

export const ClinicRegistrationForm: React.FC<ClinicRegistrationFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Personal Details
  const [name, setName] = useState(initialData?.name || initialData?.fullname || '');
  const [mobile, setMobile] = useState(initialData?.phone || initialData?.mobile || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [dob, setDob] = useState(initialData?.dob || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [gender, setGender] = useState(initialData?.gender || 'Female');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !doctorId || !visitReason) {
      alert("Name, Mobile, Assigned Doctor, and Visit Reason are mandatory.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Patient
      const patientPayload = {
        name,
        mobile,
        email,
        dob,
        age,
        gender,
        bloodGroup,
        address,
        kin_name: kinName,
        kin_relation: kinRelation,
        kin_phone: kinPhone,
        source
      };
      
      const patientRes = await api.createPatient(patientPayload);
      const newPatientId = patientRes?.data?.id || patientRes?.id || patientRes?.patientId;

      if (!newPatientId) {
          throw new Error("Patient ID not returned from creation.");
      }

      // 2. Create Appointment (Walk-in check-in)
      const docObj = doctors.find((d: any) => (d.id === doctorId || d.doctorId === doctorId));
      const apptPayload = {
        patient_id: newPatientId,
        doctor_id: doctorId,
        department_id: docObj?.departmentId || docObj?.department?.id,
        appointment_date: new Date().toISOString().split('T')[0],
        type: 'CONSULTATION',
        visit_reason: visitReason
      };

      const apptRes = await api.createAppointment(apptPayload);
      const newApptId = apptRes?.data?.id || apptRes?.id || apptRes?.appointmentId;

      // 3. Mark as Checked-In immediately for Walk-Ins
      if (newApptId) {
         try {
             await api.updateAppointmentStatus(newApptId, { status: 'Checked-In' });
         } catch (statusErr) {
             console.warn("Failed to auto check-in:", statusErr);
         }
      }

      alert("Patient registered and checked in successfully!");
      onSuccess(newPatientId, newApptId);
    } catch (err: any) {
      console.error("Registration failed:", err);
      alert(err.message || "Failed to register patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-4xl mx-auto overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-6 text-white flex justify-between items-center flex-shrink-0">
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
          
          {/* 1. Personal Details */}
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
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
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

          {/* 2. Emergency / Kin Contact */}
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
                  <option value="Child">Child</option>
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
                  <option value="Practo">Practo / Lybrate</option>
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
