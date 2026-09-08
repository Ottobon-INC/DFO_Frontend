import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, Calendar, HeartPulse, Stethoscope, ChevronDown, CheckCircle, Activity, UserPlus, FileText } from 'lucide-react';
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
  
  // Input Refs for Smart Auto-Focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup || initialData?.blood_group || '');
  const [address, setAddress] = useState(initialData?.address || initialData?.location || '');

  // Emergency / Kin
  const [kinName, setKinName] = useState(initialData?.kin_name || initialData?.guardian_name || '');
  const [kinRelation, setKinRelation] = useState(initialData?.kin_relation || '');
  const [kinPhone, setKinPhone] = useState(initialData?.kin_phone || '');

  // Visit Details
  const [source, setSource] = useState(initialData?.source || 'Walk-In');
  const [referralDoctor, setReferralDoctor] = useState(initialData?.referralDoctor || initialData?.referral_doctor || '');
  const [doctorId, setDoctorId] = useState(initialData?.doctorId || initialData?.doctor_id || '');
  const [visitReason, setVisitReason] = useState(initialData?.visitReason || initialData?.visit_reason || initialData?.problem || '');

  // Sync state if initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.name || initialData.fullname) setName(initialData.name || initialData.fullname || '');
      if (initialData.phone || initialData.mobile) setMobile(initialData.phone || initialData.mobile || '');
      if (initialData.email) setEmail(initialData.email || '');
      if (initialData.dob) setDob(initialData.dob || '');
      if (initialData.age) setAge(initialData.age || '');
      if (initialData.gender) setGender(initialData.gender || '');
      if (initialData.marital_status || initialData.maritalStatus) setMaritalStatus(initialData.marital_status || initialData.maritalStatus || '');
      if (initialData.bloodGroup || initialData.blood_group) setBloodGroup(initialData.bloodGroup || initialData.blood_group || '');
      if (initialData.address || initialData.location) setAddress(initialData.address || initialData.location || '');
      if (initialData.kin_name || initialData.guardian_name) setKinName(initialData.kin_name || initialData.guardian_name || '');
      if (initialData.kin_relation) setKinRelation(initialData.kin_relation || '');
      if (initialData.kin_phone) setKinPhone(initialData.kin_phone || '');
      if (initialData.source) setSource(initialData.source || 'Walk-In');
      if (initialData.referralDoctor || initialData.referral_doctor) setReferralDoctor(initialData.referralDoctor || initialData.referral_doctor || '');
      if (initialData.doctorId || initialData.doctor_id) setDoctorId(initialData.doctorId || initialData.doctor_id || '');
      if (initialData.visitReason || initialData.visit_reason || initialData.problem) {
        setVisitReason(initialData.visitReason || initialData.visit_reason || initialData.problem || '');
      }
    }
  }, [initialData]);

  // Smart Auto-Focus & Cursor Management
  useEffect(() => {
    const timer = setTimeout(() => {
      const phoneVal = (initialData?.phone || initialData?.mobile || mobile || '').toString();
      if (phoneVal) {
        if (phoneVal.length < 10 && mobileInputRef.current) {
          mobileInputRef.current.focus();
          const len = mobileInputRef.current.value.length;
          mobileInputRef.current.setSelectionRange(len, len);
        } else if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      } else if (initialData?.name && mobileInputRef.current) {
        mobileInputRef.current.focus();
      } else if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [initialData]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.getDoctors();
        const docs = res?.data || res;
        if (Array.isArray(docs)) {
          setDoctors(docs);
          // Auto match doctor by name if lead had treatmentDoctor
          if (initialData?.treatmentDoctor && !doctorId) {
            const matchedDoc = docs.find((d: any) => {
              const docName = d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim();
              return docName.toLowerCase() === initialData.treatmentDoctor.toLowerCase();
            });
            if (matchedDoc) {
              setDoctorId(matchedDoc.id || matchedDoc.doctorId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDocs();
  }, [initialData]);

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
    } else {
      setDuplicateMatch(null);
    }
  }, [mobile, useExistingPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !useExistingPatient) {
      toast.error("Please enter the patient's full name.");
      return;
    }
    if (!mobile && !useExistingPatient) {
      toast.error("Please enter a mobile contact number.");
      return;
    }
    if (!doctorId) {
      toast.error("Please assign a consultation doctor.");
      return;
    }
    if (!visitReason) {
      toast.error("Please enter the visit reason / handoff notes.");
      return;
    }

    setLoading(true);
    try {
      let finalPatientId = duplicateMatch?.id || duplicateMatch?.patientId;

      if (!useExistingPatient || !finalPatientId) {
        // Create or Convert Lead to New Patient
        const patientPayload = {
          name: name.trim(),
          phone: mobile.trim(),
          email: email.trim() || undefined,
          dob: dob || undefined,
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
          marital_status: maritalStatus || undefined,
          blood_group: bloodGroup || undefined,
          address: address.trim() || undefined,
          kin_name: kinName.trim() || undefined,
          kin_relation: kinRelation || undefined,
          kin_phone: kinPhone.trim() || undefined,
          source: source,
          referral_doctor: referralDoctor.trim() || undefined,
        };
        
        try {
          let patientRes: any;
          if (initialData?.id && initialData?.status && initialData?.status !== 'Converted') {
            try {
              patientRes = await api.convertLead(initialData.id, patientPayload);
            } catch (convertErr: any) {
              console.warn("Convert lead API failed, falling back to createPatient:", convertErr);
              patientRes = await api.createPatient(patientPayload);
            }
          } else {
            patientRes = await api.createPatient(patientPayload);
          }

          const newPatientId = patientRes?.data?.patient_id || patientRes?.data?.id || patientRes?.id || patientRes?.patientId;
          if (!newPatientId) {
            throw new Error("Patient ID not returned from creation.");
          }
          finalPatientId = newPatientId;
          
          if (patientRes?.generatedPin) {
            toast.success(`Patient Registered! Security PIN: ${patientRes.generatedPin}`, { duration: 6000 });
          } else {
            toast.success("Patient registered successfully!");
          }
        } catch (patientErr: any) {
          throw new Error(patientErr?.message || "Failed to save patient record.");
        }
      }

      // Check-In Walk-In Appointment / Queue
      const appointmentPayload = {
        patient_id: finalPatientId,
        doctor_id: doctorId,
        appointment_date: new Date().toISOString(),
        visit_reason: visitReason,
        source: source,
        status: 'Waiting in Clinic'
      };

      const apptRes = await api.createAppointment(appointmentPayload);
      const newAppointmentId = apptRes?.data?.id || apptRes?.id;

      // Also create QMS token if enabled
      let generatedToken: string | null = null;
      try {
        const qmsRes = await api.enqueuePatient(newAppointmentId);
        generatedToken = qmsRes?.data?.token_number || qmsRes?.token_number || null;
      } catch (qmsErr) {
        console.warn("QMS direct enqueue fallback (already enqueued by trigger):", qmsErr);
      }

      setSuccessModalData({
        patientName: name || duplicateMatch?.name,
        patientId: finalPatientId,
        appointmentId: newAppointmentId,
        token: generatedToken,
        doctorName: doctors.find(d => (d.id || d.doctorId) === doctorId)?.name || 'Doctor'
      });

    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successModalData) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-lg mx-auto shadow-2xl animate-fade-in text-center">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
          <CheckCircle size={36} />
        </div>
        <h2 className="text-2xl font-bold text-brand-textPrimary mb-1">Patient Check-In Complete!</h2>
        <p className="text-sm text-brand-textSecondary mb-6">
          <span className="font-semibold text-brand-textPrimary">{successModalData.patientName}</span> is now active in the OPD consultation queue.
        </p>

        {successModalData.token && (
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 mb-6 inline-block">
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold block mb-1">Queue Token</span>
            <span className="text-4xl font-extrabold text-brand-primary font-mono tracking-tight">#{successModalData.token}</span>
          </div>
        )}

        <div className="bg-brand-bg rounded-xl p-4 text-xs text-left mb-6 space-y-2 border border-brand-border">
          <div className="flex justify-between">
            <span className="text-brand-textSecondary">Assigned Doctor:</span>
            <span className="font-bold text-brand-textPrimary">{successModalData.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-textSecondary">Status:</span>
            <span className="font-bold text-amber-500">Waiting in Clinic</span>
          </div>
        </div>

        <button
          onClick={() => {
            onSuccess(successModalData.patientId, successModalData.appointmentId);
          }}
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl transition-colors shadow-md"
        >
          Done & Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-4xl mx-auto overflow-hidden animate-fade-in flex flex-col max-h-full">
      {/* Header */}
      <div className="bg-brand-primary p-6 text-white flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus size={24} /> {initialData?.name ? `Finalize Lead: ${initialData.name}` : 'New Patient Registration'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {initialData?.name ? 'Review pre-filled lead details and complete patient registration. Note: UHID is auto-generated.' : 'Generic clinic intake form. Note: UHID is auto-generated.'}
          </p>
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
                    ref={nameInputRef}
                    type="text" required value={name} onChange={e => setName(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" 
                    placeholder="e.g. Ananya Sharma" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                    <input 
                      ref={mobileInputRef}
                      type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} 
                      className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium" 
                      placeholder="10-digit mobile number" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Email Address</label>
                  <input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                    placeholder="patient@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3.5 text-brand-textSecondary" />
                    <input 
                      type="date" value={dob} onChange={e => {
                        setDob(e.target.value);
                        if (e.target.value) {
                          const diff = Date.now() - new Date(e.target.value).getTime();
                          const calculatedAge = Math.abs(new Date(diff).getUTCFullYear() - 1970);
                          setAge(calculatedAge.toString());
                        }
                      }} 
                      className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-primary" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary mb-1.5">Age</label>
                  <input 
                    type="number" min="0" max="120" value={age} onChange={e => setAge(e.target.value)} 
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
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
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
                    <option value="Married">Married</option>
                    <option value="Single">Single</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
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
            <h3 className="text-sm font-bold text-brand-primary mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-brand-border pb-2">
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
