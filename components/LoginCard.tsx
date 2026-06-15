import React, { useState } from 'react';
import { Lock, Loader2, ShieldCheck, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { FloatingInput } from './FloatingInput';
import { UserRole } from '../types';
import { api } from '../services/api';

interface LoginCardProps {
  className?: string;
  onLoginSuccess?: (role: UserRole, user: any) => void;
  onBack?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ className = '', onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.FRONT_DESK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLoginMode) {
        const response = await api.login({ email, password });
        if (response.user) {
          // Normalize role from backend case-insensitively
          const backendRole = (response.user.role || '').toLowerCase();
          let userRole: UserRole = UserRole.FRONT_DESK; // Default
          if (backendRole === 'doctor') userRole = UserRole.DOCTOR;
          else if (backendRole === 'cro') userRole = UserRole.CRO;
          else if (backendRole === 'nurse') userRole = UserRole.NURSE;
          else if (backendRole === 'admin') userRole = UserRole.ADMIN;
          else if (backendRole === 'frontdesk' || backendRole === 'front_desk' || backendRole === 'front desk') userRole = UserRole.FRONT_DESK;

          if (onLoginSuccess) {
            onLoginSuccess(userRole, response.user);
          }
        } else {
          throw new Error(response.message || "Login failed");
        }
      } else {
        // Sign up logic (not implemented yet just simulate success OR error)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setError("Registration is currently invite-only. Please contact administrator.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-5xl bg-brand-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-brand-border ${className}`}>

      {/* Left Side: Visual & Branding */}
      <div className="w-full md:w-1/2 bg-brand-bg p-12 text-brand-textPrimary flex flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-lg">
              <Heart size={24} className="text-brand-primary" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-brand-textPrimary">JanmaSethu</span>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6 text-brand-textPrimary">
            {isLoginMode ? 'Welcome Back.' : 'Join the Network.'}
          </h2>
          <p className="text-brand-textSecondary text-lg leading-relaxed max-w-sm">
            {isLoginMode
              ? 'Secure access for fertility specialists, maternity teams, and hospital administrators.'
              : 'Register your clinic to access the unified operating system for modern healthcare.'
            }
          </p>
        </div>

        <div className="relative z-10 mt-12">
          <div className="flex items-center space-x-6 text-sm font-medium text-brand-textSecondary/90">
            <div className="flex items-center"><ShieldCheck size={18} className="mr-2 text-brand-primary" /> HIPAA Compliant</div>
            <div className="flex items-center"><Lock size={18} className="mr-2 text-brand-primary" /> 256-Bit Encryption</div>
          </div>
        </div>
      </div>

      {/* Right Side: Login/Signup Form */}
      <div className="w-full md:w-1/2 p-12 bg-brand-surface flex flex-col justify-center relative">
        {onBack && (
          <button onClick={onBack} className="absolute top-6 right-6 text-sm text-brand-textSecondary hover:text-brand-primary font-medium flex items-center">
            Back to Home
          </button>
        )}

        <div className="max-w-sm mx-auto w-full">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-brand-textPrimary mb-2">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-brand-textSecondary">
              {isLoginMode ? 'Enter your credentials to access the portal.' : 'Get started with your free trial.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginMode && (
              <FloatingInput
                id="name"
                label="Full Name"
                type="text"
                value=""
                onChange={() => { }}
                required
              />
            )}

            <FloatingInput
              id="email"
              label={isLoginMode ? "Hospital Email ID" : "Work Email"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FloatingInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showCapsLockWarning
            />

            {isLoginMode && (
              <div className="flex items-center justify-between pt-2">
                {/* Role Selector (For Demo Purposes) */}
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="appearance-none bg-brand-bg border border-brand-border rounded-lg py-1.5 px-3 text-xs font-bold text-brand-textSecondary hover:border-brand-primary focus:outline-none cursor-pointer uppercase tracking-wide transition-colors"
                  >
                    {[UserRole.DOCTOR, UserRole.CRO, UserRole.FRONT_DESK].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <a href="#" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
                  Forgot Password?
                </a>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start animate-pulse">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center py-4 px-6 rounded-xl shadow-lg shadow-brand-primary/20
                text-sm font-bold tracking-wider text-white uppercase
                bg-brand-primary hover:bg-brand-secondary active:scale-[0.98]
                transition-all duration-300
                ${isLoading ? 'cursor-not-allowed opacity-80' : ''}
              `}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {isLoginMode ? 'Access Portal' : 'Start Free Trial'} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-brand-border pt-6">
            <p className="text-sm text-brand-textSecondary">
              {isLoginMode ? "New to JanmaSethu? " : "Already have an account? "}
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="font-bold text-brand-primary hover:text-brand-secondary transition-colors focus:outline-none ml-1"
              >
                {isLoginMode ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
