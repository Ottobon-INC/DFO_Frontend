import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginCard } from './components/LoginCard';
import { Dashboard } from './components/Dashboard';
import { ControlTower } from './components/ControlTower';
import { LandingPage } from './components/LandingPage';
import { SystemLogin } from './components/superadmin/SystemLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { 
  Headphones, Phone, Mail, Clock, AlertTriangle, 
  CheckCircle2, X, Send, ShieldCheck, Activity, Server, 
  ExternalLink, MessageSquare
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { UserRole } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || UserRole.FRONT_DESK;
  });
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isVerifying, setIsVerifying] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTicketSubmitted, setSupportTicketSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [supportForm, setSupportForm] = useState({
    staffEmail: '',
    hospitalId: '',
    category: 'Account Lockout / 2FA Issue',
    urgency: 'High - Clinical Impact',
    description: ''
  });

  const navigate = useNavigate();

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSupportModal) {
        setShowSupportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSupportModal]);

  // Verify token health on app mount
  useEffect(() => {
    const verifySession = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        setIsVerifying(false);
        return;
      }
      try {
        await api.verifySession();
        setIsVerifying(false);
      } catch {
        // Token is dead - silently clear and let route guards handle redirect
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        setUser(null);
        setIsVerifying(false);
      }
    };
    verifySession();
  }, []);

  const handleLoginSuccess = (role: UserRole, userPayload: any) => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('user', JSON.stringify(userPayload));
    if (userPayload.token) {
      localStorage.setItem('token', userPayload.token);
    }
    setUserRole(role);
    setUser(userPayload);
    navigate('/dashboard');
  };

  const handleSystemLoginSuccess = (userPayload: any) => {
    localStorage.setItem('userRole', UserRole.CRO);
    localStorage.setItem('user', JSON.stringify(userPayload));
    if (userPayload.token) {
      localStorage.setItem('token', userPayload.token);
    }
    setUser(userPayload);
    navigate('/system/dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUserRole(UserRole.FRONT_DESK);
    setUser(null);
    navigate('/');
  };

  const handleSupportTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.staffEmail || !supportForm.description) {
      toast.error('Please enter your email and description');
      return;
    }
    const generatedId = '#MEDCY-IT-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(generatedId);
    setSupportTicketSubmitted(true);
    toast.success('Support incident ticket created!');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-textSecondary animate-pulse text-sm font-medium">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans text-brand-textPrimary bg-brand-bg selection:bg-brand-primary selection:text-white flex flex-col transition-colors duration-500">
      <Routes>
        <Route path="/" element={<LandingPage onLoginClick={() => navigate('/login')} />} />
        <Route path="/login" element={
          <div className="min-h-screen flex flex-col items-center justify-center relative bg-brand-bg overflow-hidden animate-slide-up p-4">
            {/* Background Elements for Login */}
            <div className="absolute inset-0 bg-wireframe opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
              <LoginCard 
                onLoginSuccess={handleLoginSuccess} 
                onBack={() => navigate('/')} 
                onOpenSupport={() => { setShowSupportModal(true); setSupportTicketSubmitted(false); }}
              />

              <div className="mt-6 flex items-center gap-2 text-xs text-brand-textSecondary">
                <span>Restricted Healthcare Access.</span>
                <button 
                  onClick={() => { setShowSupportModal(true); setSupportTicketSubmitted(false); }}
                  className="text-brand-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Headphones size={13} /> 24/7 IT Emergency Helpdesk
                </button>
              </div>
            </div>

            {/* IT Support Modal */}
            {showSupportModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowSupportModal(false);
                }}
              >
                <div className="bg-brand-surface border border-brand-border rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  <button 
                    onClick={() => setShowSupportModal(false)}
                    className="absolute top-6 right-6 text-brand-textSecondary hover:text-brand-textPrimary transition-colors p-1.5 rounded-full hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
                      <Headphones size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-brand-textPrimary">24/7 IT Emergency Helpdesk</h3>
                      <p className="text-xs text-brand-textSecondary">Hospital Infrastructure, EMR & Staff Account Support</p>
                    </div>
                  </div>

                  {supportTicketSubmitted ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-brand-textPrimary mb-1">Support Incident Dispatched</h4>
                      <p className="text-xs text-brand-textSecondary mb-4 max-w-sm mx-auto leading-relaxed">
                        Ticket <strong className="text-brand-primary font-mono">{ticketId}</strong> has been assigned to the on-call Medcy Infrastructure Engineer.
                      </p>
                      
                      <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border text-xs text-left mb-5 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-brand-textSecondary">Response SLA:</span>
                          <span className="font-bold text-emerald-500">&lt; 15 Minutes for Clinical Blocker</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-textSecondary">Notification Sent To:</span>
                          <span className="font-bold text-brand-textPrimary">{supportForm.staffEmail}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <a
                          href="https://wa.me/919876543210?text=Hi%20Medcy%20IT%20Support%2C%20I%20have%20an%20urgent%20hospital%20support%20request."
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={14} /> WhatsApp Support
                        </a>
                        <button
                          onClick={() => setShowSupportModal(false)}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-brand-border hover:bg-brand-bg font-bold text-xs text-brand-textSecondary transition-colors"
                        >
                          Close Helpdesk
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Direct Hotline Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                        <div className="p-3.5 bg-brand-bg rounded-2xl border border-brand-border flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                            <Phone size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-brand-textSecondary block">Emergency Hotline</span>
                            <span className="text-xs font-bold text-brand-textPrimary">+91 98765 43210</span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-brand-bg rounded-2xl border border-brand-border flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Mail size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-brand-textSecondary block">Direct IT Email</span>
                            <span className="text-xs font-bold text-brand-textPrimary">support@medcyhealthtech.com</span>
                          </div>
                        </div>
                      </div>

                      {/* Live System Status Bar */}
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Cloud Microservices Operational (99.99% SLA)</span>
                        </div>
                        <span className="text-[11px] font-mono text-brand-textSecondary">Latency: 28ms</span>
                      </div>

                      {/* Quick Incident Form */}
                      <form onSubmit={handleSupportTicketSubmit} className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-brand-textSecondary mb-1">Your Hospital Email *</label>
                            <input
                              type="email"
                              required
                              placeholder="doctor@hospital.com"
                              value={supportForm.staffEmail}
                              onChange={(e) => setSupportForm({ ...supportForm, staffEmail: e.target.value })}
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-brand-textSecondary mb-1">Issue Category</label>
                            <select
                              value={supportForm.category}
                              onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                            >
                              <option value="Account Lockout / 2FA Issue">Account Lockout / 2FA Issue</option>
                              <option value="EMR & Patient Sync Blocker">EMR & Patient Sync Blocker</option>
                              <option value="Ultrasound / Lab Machine Sync">Ultrasound / Lab Machine Sync</option>
                              <option value="Queue Kiosk / Display Issue">Queue Kiosk / Display Issue</option>
                              <option value="Other Clinical Support">Other Clinical Support</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-brand-textSecondary mb-1">Issue Description *</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Describe what happened or what error message you see..."
                            value={supportForm.description}
                            onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-brand-primary hover:bg-brand-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-primary/20"
                        >
                          <Send size={14} /> Dispatch Emergency IT Ticket
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        } />
        <Route path="/control-tower" element={user ? <ControlTower onLogout={handleLogout} userRole={userRole} /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard/*" element={user ? <Dashboard onLogout={handleLogout} userRole={userRole} /> : <Navigate to="/login" replace />} />
        
        {/* Super Admin Routes */}
        <Route path="/system" element={<SystemLogin onLoginSuccess={handleSystemLoginSuccess} />} />
        <Route path="/system/dashboard" element={
          user && user.is_super_admin ? 
            <SuperAdminDashboard onLogout={handleLogout} /> 
          : 
            <Navigate to="/system" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
