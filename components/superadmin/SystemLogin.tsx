import React, { useState } from 'react';
import { Lock, Loader2, ShieldCheck, ArrowRight, Server } from 'lucide-react';
import { FloatingInput } from '../FloatingInput';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface SystemLoginProps {
  onLoginSuccess: (user: any) => void;
}

export const SystemLogin: React.FC<SystemLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.superAdminLogin({ email, password });
      if (response.success && response.data) {
        onLoginSuccess(response.data);
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (err: any) {
      console.error("Super Admin Login Error:", err);
      setError(err?.message || "Invalid credentials. This attempt has been logged.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-brand-bg overflow-hidden animate-slide-up">
      {/* Background Elements for System Login */}
      <div className="absolute inset-0 bg-wireframe opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md bg-brand-surface/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-red-900/20">
            <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-900/20 text-red-500 mb-6 shadow-inner border border-red-500/20">
                        <Server size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-textPrimary tracking-tight">System Control</h2>
                    <p className="text-brand-textSecondary mt-2 font-medium">Super Administrator Terminal</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3">
                        <ShieldCheck className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm font-semibold text-red-500">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <FloatingInput
                        id="email"
                        label="Admin Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <FloatingInput
                        id="password"
                        label="Master Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center space-x-2 group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center space-x-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={20} className="group-hover:hidden" />
                                    <ArrowRight size={20} className="hidden group-hover:block" />
                                    <span>Secure Login</span>
                                </>
                            )}
                        </span>
                    </button>
                </form>
            </div>
            <div className="bg-brand-bg/50 px-8 py-5 border-t border-brand-border flex justify-between items-center text-xs font-bold">
                <span className="text-brand-textSecondary">IP Logged: <span className="text-red-400 font-mono">192.168.1.1</span></span>
                <span className="text-brand-textSecondary hover:text-brand-textPrimary cursor-pointer transition-colors" onClick={() => navigate('/')}>Return Home</span>
            </div>
        </div>

        <p className="mt-8 text-brand-textSecondary text-sm font-semibold">
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
};
