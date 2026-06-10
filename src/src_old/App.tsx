import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

export default function App() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'login') {
      return (
        <Login 
          onBack={() => setAuthView('landing')} 
          onToggle={() => setAuthView('signup')} 
        />
      );
    }
    if (authView === 'signup') {
      return (
        <Signup 
          onBack={() => setAuthView('landing')} 
          onToggle={() => setAuthView('login')} 
        />
      );
    }
    return <Landing onLogin={() => setAuthView('login')} />;
  }

  return <DashboardLayout />;
}
