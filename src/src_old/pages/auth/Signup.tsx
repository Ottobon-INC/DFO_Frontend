import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function Signup({ onSwitchToLogin, onBackToLanding }: { onSwitchToLogin: () => void, onBackToLanding: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { signInWithGoogle } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: window.location.origin }
    });

    if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
    }

    if (authData.user) {
        await supabase.from('users').upsert([{
            id: authData.user.id,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString(),
        }], { onConflict: 'email' });
    }

    setLoading(false);
    if (!authData.session) setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-[400px]">
        {/* Header Block */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-6">
             <Logo className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
            Create DFO Account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-center font-medium">
            Clinical Management Platform
          </p>
        </div>

        {/* Auth form container */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg">
          <form className="space-y-4" onSubmit={handleSignup}>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded flex items-start gap-3 border border-destructive/20 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded flex flex-col items-center gap-2 text-xs text-center border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="font-bold uppercase tracking-wide">Verification Sent</span>
                <span>Check your email inbox to verify your account.</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Dr. Sarah Johnson"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                placeholder="clinician@hospital.org"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded font-bold text-sm shadow-none mt-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <Button
              variant="outline"
              onClick={() => signInWithGoogle()}
              className="w-full h-10 rounded bg-background border-border hover:bg-muted font-bold text-xs shadow-none uppercase tracking-wider"
            >
              SSO Registration
            </Button>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={onSwitchToLogin}
            className="text-xs font-semibold text-primary hover:underline uppercase tracking-wide"
          >
            I already have access (Sign In)
          </button>
          <button
            onClick={onBackToLanding}
            className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest"
          >
            Return to Portal
          </button>
        </div>
      </div>
    </div>
  );
}
