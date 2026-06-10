import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Define DB Types based on user prompt
export type AppRole = 'cro' | 'nurse' | 'doctor';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
  phone: string | null;
  created_at: string;
}

export interface OnboardingData {
  id: string;
  user_id: string;
  role: AppRole;
  data: any;
  completed: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  onboardingState: OnboardingData | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
    }

    if (profileData) {
      setProfile(profileData);
      setOnboardingState(profileData.role ? ({ completed: true } as any) : null);
    } else {
      setProfile(null);
      setOnboardingState(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        console.log("Auth: Initializing...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log("Auth: Session found:", !!session);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (!session) {
            console.log("Auth: No session, setting loading to false");
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth: Init error:", err);
        if (mounted) setIsLoading(false);
      }
    }


    initAuth();

    // Safety timeout: Never stay in loading state longer than 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Auth: Safety timeout reached, forcing loading to false");
        setIsLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (!session) {
            console.log("Auth: State change - No session, setting loading to false");
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };

  }, []);

  // Whenever user changes, re-fetch profile
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setOnboardingState(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log("Auth: Hydrating profile for user:", user.id);
        await refreshProfile();
        console.log("Auth: Profile hydrated");
      } catch (err) {
        console.error("Auth: Hydrate error:", err);
      } finally {
        if (mounted) {
          console.log("Auth: Setting loading to false");
          setIsLoading(false);
        }
      }

    }

    hydrate();

    return () => { mounted = false; };
  }, [user]);


  const signInWithGoogle = async () => {
    try {
      console.log("Auth: Initiating Google Sign In...");
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}` 
        : 'https://janmasethu-dfo.vercel.app';
      
      console.log("Auth: Redirecting to:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Auth: Google Sign-in error:", err);
      throw err;
    }
  };

  const signOut = async () => {

    try {
      console.log("Auth: Signing out...");
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Auth: Signout error:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setOnboardingState(null);
      setIsLoading(false);
      
      // Clear persistence and force a clean entry
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin;
      
      console.log("Auth: Signed out, storage cleared, and redirected");
    }
  };


  return (
    <AuthContext.Provider value={{ session, user, profile, onboardingState, isLoading, refreshProfile, signInWithGoogle, signOut }}>

      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
