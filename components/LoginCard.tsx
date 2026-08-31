import React, { useState } from 'react';
import { 
  Lock, Mail, UserCheck, Stethoscope, 
  ShieldCheck, Eye, EyeOff, AlertCircle, RefreshCw, 
  CheckCircle2, ChevronRight, Phone, MessageSquare, 
  ArrowLeft, Activity, Users, Award, Sparkles, Building2
} from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface LoginCardProps {
  onLoginSuccess: (role: UserRole, user: any) => void;
  onBack?: () => void;
  className?: string;
  onOpenSupport?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ 
  onLoginSuccess, 
  onBack, 
  className = '',
  onOpenSupport 
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DOCTOR);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'login' | 'forgot' | 'demo'>('login');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [devCode, setDevCode] = useState('');

  // Demo Request State
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoResponse, setDemoResponse] = useState<any>(null);
  const [demoForm, setDemoForm] = useState({
    hospitalName: '',
    contactName: '',
    designation: 'Doctor / Consultant Physician',
    facilityType: 'Multi-Specialty Hospital',
    city: '',
    workEmail: '',
    phone: '',
    patientVolume: '200 - 1,000 Patients / month',
    preferredChannel: 'Google Meet (Live Screen Walkthrough)',
    preferredSlot: 'Tomorrow Morning (10:00 AM - 1:00 PM)',
    message: ''
  });

  const roles = [
    { role: UserRole.DOCTOR, label: 'Doctor', icon: Stethoscope },
    { role: UserRole.ADMIN, label: 'Clinic Admin', icon: ShieldCheck },
    { role: UserRole.NURSE, label: 'Nurse', icon: Activity },
    { role: UserRole.FRONT_DESK, label: 'Front Desk', icon: Users },
    { role: UserRole.CRO, label: 'CRO', icon: Award },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your hospital email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login({ email, password, role: selectedRole } as any);
      
      let actualRole = UserRole.DOCTOR;
      if (response.user && response.user.role) {
        const rawRole = response.user.role.toUpperCase();
        if (rawRole.includes('ADMIN')) actualRole = UserRole.ADMIN;
        else if (rawRole.includes('DOCTOR') || rawRole.includes('PHYSICIAN')) actualRole = UserRole.DOCTOR;
        else if (rawRole.includes('NURSE')) actualRole = UserRole.NURSE;
        else if (rawRole.includes('FRONT') || rawRole.includes('RECEPTION')) actualRole = UserRole.FRONT_DESK;
        else if (rawRole.includes('CRO') || rawRole.includes('SALES')) actualRole = UserRole.CRO;
      }

      // Enforce portal department matching
      if (actualRole !== selectedRole) {
        const roleLabelMap: Record<UserRole, string> = {
          [UserRole.DOCTOR]: 'Doctor',
          [UserRole.ADMIN]: 'Clinic Admin',
          [UserRole.NURSE]: 'Nurse',
          [UserRole.FRONT_DESK]: 'Front Desk',
          [UserRole.CRO]: 'CRO'
        };
        const selectedLabel = roleLabelMap[selectedRole] || selectedRole;
        const actualLabel = roleLabelMap[actualRole] || actualRole;

        const roleError = `Access Denied: Your account is registered as ${actualLabel}. You cannot sign in through the ${selectedLabel} portal. Please select the ${actualLabel} tab.`;
        setError(roleError);
        toast.error(`Wrong Portal: Please switch to the ${actualLabel} tab.`);
        return;
      }

      toast.success(`Welcome, ${response.user?.name || 'Staff Member'} (${actualRole})`);
      onLoginSuccess(actualRole, response.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your registered hospital email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.forgotPassword(forgotEmail);
      setResetSessionToken(res.reset_session_token);
      setDevCode(res.dev_code || '');
      setForgotStep(2);
      toast.success('Security PIN generated!');
    } catch (err: any) {
      setError(err.message || 'Failed to locate staff account. Please contact your Clinic Administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !newPassword || !confirmPassword) {
      setError('Please fill in all security fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.resetPassword({
        email: forgotEmail,
        reset_code: verificationCode,
        reset_session_token: resetSessionToken,
        new_password: newPassword
      });

      toast.success('Password successfully reset! Please sign in with your new password.');
      setViewMode('login');
      setForgotStep(1);
      setPassword('');
      setEmail(forgotEmail);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please check the 6-digit code or request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.hospitalName || !demoForm.contactName || !demoForm.workEmail || !demoForm.phone) {
      toast.error('Please fill in all mandatory clinic contact fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: demoForm.contactName,
        hospital_name: demoForm.hospitalName,
        email: demoForm.workEmail,
        phone: demoForm.phone,
        designation: `${demoForm.designation} (${demoForm.facilityType})`,
        city: demoForm.city,
        patient_volume: demoForm.patientVolume,
        preferred_contact_method: demoForm.preferredChannel,
        preferred_slot: demoForm.preferredSlot,
        message: demoForm.message
      };

      const res = await api.submitDemoRequest(payload);
      setDemoResponse(res);
      setDemoSubmitted(true);
      toast.success('Demo consultation request submitted!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit demo request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full transition-all duration-300 ${
      viewMode === 'demo' ? 'max-w-2xl' : 'max-w-lg'
    } ${className}`}>
      <div className="bg-brand-surface border border-brand-border/80 rounded-3xl shadow-2xl overflow-hidden p-7 md:p-9 relative backdrop-blur-xl">

        {/* Back to Home Link */}
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 right-7 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary flex items-center gap-1 transition-colors"
          >
            ← Home
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-13 h-13 p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center shadow-inner mb-3">
            <img src="/logo.png" alt="Medcy Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
            Medcy Health Tech
          </h1>
          <p className="text-xs text-brand-textSecondary mt-0.5 font-medium">
            {viewMode === 'login' && 'Sign in to access your account'}
            {viewMode === 'forgot' && 'Staff account security & password recovery'}
            {viewMode === 'demo' && 'Request a live clinic walkthrough & onboarding'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start animate-shake">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: LOGIN MODE                                                        */}
        {/* ========================================================================= */}
        {viewMode === 'login' && (
          <div className="animate-fadeIn space-y-5">
            {/* Segmented Role Selector */}
            <div>
              <label className="block text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider mb-2">
                Select Department / Portal
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-brand-bg rounded-2xl border border-brand-border">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => { setSelectedRole(item.role); setError(null); }}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-brand-surface text-brand-primary shadow-sm border border-brand-border font-bold' 
                          : 'text-brand-textSecondary hover:text-brand-textPrimary hover:bg-white/5'
                      }`}
                    >
                      <Icon size={17} className={isActive ? 'text-brand-primary' : 'text-brand-textSecondary'} />
                      <span className="text-[10px] mt-1 text-center font-bold truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                  Hospital Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-brand-textSecondary" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-bg/70 border border-brand-border rounded-xl pl-10 pr-4 py-3 text-xs font-medium text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot'); setForgotEmail(email); setError(null); }}
                    className="text-xs text-brand-primary hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-brand-textSecondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-bg/70 border border-brand-border rounded-xl pl-10 pr-11 py-3 text-xs font-medium text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-brand-textSecondary hover:text-brand-textPrimary p-0.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 disabled:opacity-50 mt-2"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <UserCheck size={16} />}
                Sign In
              </button>
            </form>

            {/* Bottom Demo Switcher */}
            <div className="pt-4 mt-2 border-t border-brand-border flex items-center justify-between text-xs text-brand-textSecondary">
              <span>New hospital or practice?</span>
              <button
                type="button"
                onClick={() => { setViewMode('demo'); setError(null); }}
                className="font-bold text-brand-primary hover:underline flex items-center gap-1"
              >
                Book a Live Demo <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FORGOT PASSWORD                                                   */}
        {/* ========================================================================= */}
        {viewMode === 'forgot' && (
          <div className="animate-fadeIn space-y-4">
            <button 
              onClick={() => { setViewMode('login'); setForgotStep(1); setError(null); }}
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                    Registered Hospital Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-brand-textSecondary" />
                    <input
                      type="email"
                      required
                      placeholder="doctor@hospital.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-brand-bg/70 border border-brand-border rounded-xl pl-10 pr-4 py-3 text-xs font-medium text-brand-textPrimary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Generate 6-Digit Security PIN
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {devCode && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                    <span>Generated PIN: <strong className="font-mono text-sm tracking-widest">{devCode}</strong></span>
                    <span className="text-[10px] uppercase font-bold text-brand-textSecondary">Verified</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1.5">
                    6-Digit Security PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full text-center tracking-[0.5em] font-mono text-base font-bold bg-brand-bg/70 border border-brand-border rounded-xl py-3 text-brand-textPrimary outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Confirm & Update Password
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DEMO REQUEST FORM                                                 */}
        {/* ========================================================================= */}
        {viewMode === 'demo' && (
          <div className="animate-fadeIn">
            {demoSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-brand-textPrimary mb-1">Walkthrough Scheduled!</h3>
                <p className="text-xs text-brand-textSecondary mb-5 max-w-md mx-auto leading-relaxed">
                  Our healthcare specialist will contact <strong>{demoForm.contactName}</strong> at <strong>{demoForm.hospitalName}</strong> for your onboarding walkthrough.
                </p>

                <div className="space-y-2.5">
                  {demoResponse?.contact_channels?.whatsapp_url && (
                    <a
                      href={demoResponse.contact_channels.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} /> Connect Immediately on WhatsApp
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setDemoSubmitted(false);
                      setViewMode('login');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-brand-border hover:bg-brand-bg font-bold text-xs text-brand-textSecondary transition-colors"
                  >
                    Return to Staff Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button 
                  onClick={() => { setViewMode('login'); setError(null); }}
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 mb-3"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

                <form onSubmit={handleDemoSubmit} className="space-y-3 text-xs">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Hospital / Clinic Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro Specialty Hospital"
                        value={demoForm.hospitalName}
                        onChange={(e) => setDemoForm({ ...demoForm, hospitalName: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Priya Sharma / Rajesh Verma"
                        value={demoForm.contactName}
                        onChange={(e) => setDemoForm({ ...demoForm, contactName: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Designation / Role</label>
                      <select
                        value={demoForm.designation}
                        onChange={(e) => setDemoForm({ ...demoForm, designation: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="Doctor / Consultant Physician">Doctor / Consultant Physician</option>
                        <option value="Medical Director / CMO">Medical Director / CMO</option>
                        <option value="Hospital Managing Director / Owner">Hospital Managing Director / Owner</option>
                        <option value="Clinic Administrator / Operations Head">Clinic Administrator / Operations Head</option>
                        <option value="Chief Technology / IT Officer">Chief Technology / IT Officer</option>
                        <option value="Lead Nurse / Nursing Superintendent">Lead Nurse / Nursing Superintendent</option>
                        <option value="Front Desk & Patient Relations Lead">Front Desk & Patient Relations Lead</option>
                        <option value="Healthcare Consultant / Other">Healthcare Consultant / Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Primary Facility Type</label>
                      <select
                        value={demoForm.facilityType}
                        onChange={(e) => setDemoForm({ ...demoForm, facilityType: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="Multi-Specialty Hospital">Multi-Specialty Hospital</option>
                        <option value="General OPD & Polyclinic">General OPD & Polyclinic</option>
                        <option value="Maternity & Women's Health">Maternity & Women's Health</option>
                        <option value="Fertility & IVF Center">Fertility & IVF Center</option>
                        <option value="Pediatrics & Child Care">Pediatrics & Child Care</option>
                        <option value="Orthopedics & Surgery">Orthopedics & Surgery</option>
                        <option value="Diagnostics, Ultrasound & Lab">Diagnostics, Ultrasound & Lab</option>
                        <option value="Other Clinical Specialty">Other Clinical Specialty</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Official Work Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="administrator@metrohealth.com"
                        value={demoForm.workEmail}
                        onChange={(e) => setDemoForm({ ...demoForm, workEmail: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Hyderabad / Bengaluru"
                        value={demoForm.city}
                        onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Monthly OPD Volume</label>
                      <select
                        value={demoForm.patientVolume}
                        onChange={(e) => setDemoForm({ ...demoForm, patientVolume: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="< 200 Patients / mo">&lt; 200 Patients / mo</option>
                        <option value="200 - 1,000 Patients / mo">200 - 1,000 Patients / mo</option>
                        <option value="1,000 - 3,000 Patients / mo">1,000 - 3,000 Patients / mo</option>
                        <option value="3,000+ Multi-Branch Network">3,000+ Multi-Branch Network</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Walkthrough Mode</label>
                      <select
                        value={demoForm.preferredChannel}
                        onChange={(e) => setDemoForm({ ...demoForm, preferredChannel: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="Google Meet (Live Screen Walkthrough)">Google Meet (Live Screen Walkthrough)</option>
                        <option value="WhatsApp Guided Tour">WhatsApp Guided Tour</option>
                        <option value="Direct Phone Consultation">Direct Phone Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-brand-textSecondary mb-1">Timing Slot</label>
                      <select
                        value={demoForm.preferredSlot}
                        onChange={(e) => setDemoForm({ ...demoForm, preferredSlot: e.target.value })}
                        className="w-full bg-brand-bg/70 border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-textPrimary outline-none focus:border-brand-primary cursor-pointer"
                      >
                        <option value="Urgent / Next 2 Hours">Urgent / Next 2 Hours</option>
                        <option value="Tomorrow Morning (10:00 AM - 1:00 PM)">Tomorrow Morning (10:00 AM - 1:00 PM)</option>
                        <option value="Tomorrow Afternoon (2:00 PM - 6:00 PM)">Tomorrow Afternoon (2:00 PM - 6:00 PM)</option>
                        <option value="This Weekend">This Weekend</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-xs text-white uppercase tracking-wider bg-brand-primary hover:bg-brand-secondary active:scale-[0.99] transition-all shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <ShieldCheck className="mr-2" size={16} />}
                    Request Clinic Onboarding Walkthrough →
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
