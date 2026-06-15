import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginCard } from './components/LoginCard';
import { Dashboard } from './components/Dashboard';
import { ControlTower } from './components/ControlTower';
import { LandingPage } from './components/LandingPage';

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
  const navigate = useNavigate();

  const handleLoginSuccess = (role: UserRole, user: any) => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('user', JSON.stringify(user));
    setUserRole(role);
    setUser(user);
    navigate('/dashboard');
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
        <Route path="/control-tower" element={<ControlTower onLogout={handleLogout} userRole={userRole} />} />
        <Route path="/dashboard/*" element={<Dashboard onLogout={handleLogout} userRole={userRole} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
