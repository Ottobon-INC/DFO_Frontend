import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginCard } from './components/LoginCard';
import { Dashboard } from './components/Dashboard';
import { ControlTower } from './components/ControlTower';
import { LandingPage } from './components/LandingPage';
import { SystemLogin } from './components/superadmin/SystemLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';

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
  const navigate = useNavigate();

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
        // Token is dead — silently clear and let route guards handle redirect
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        setUser(null);
        setIsVerifying(false);
      }
    };
    verifySession();
  }, []);

  const handleLoginSuccess = (role: UserRole, user: any) => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('user', JSON.stringify(user));
    setUserRole(role);
    setUser(user);
    navigate('/dashboard');
  };

  const handleSystemLoginSuccess = (user: any) => {
    localStorage.setItem('userRole', UserRole.CRO); // Super admin might not fit perfectly into UserRole, but CRO is close or we can just use ADMIN
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
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
    setUserRole(UserRole.FRONT_DESK);
    setUser(null);
    navigate('/');
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
          <div className="min-h-screen flex flex-col items-center justify-center relative bg-brand-bg overflow-hidden animate-slide-up">
            {/* Background Elements for Login */}
            <div className="absolute inset-0 bg-wireframe opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
              <LoginCard onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} />

              <p className="mt-8 text-brand-textSecondary text-sm">
                Restricted Access. <a href="#" className="text-brand-primary hover:underline font-semibold">Contact IT Support</a>
              </p>
            </div>
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

import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
