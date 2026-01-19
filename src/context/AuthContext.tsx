import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { DemoPersona, clearAllData, seedDemoData } from "../services/storage";
import { Preferences } from '@capacitor/preferences';
// Extended User type to include demo flag
export type AppUser = User & { isDemo?: boolean; name: string; email?: string };
interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  startDemo: (persona: DemoPersona) => void;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updateUserPassword: (newPassword: string) => Promise<{ error: any }>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoPersona, setDemoPersona] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setLoading(false);
      const storedPersona = localStorage.getItem("haseeb_demo_persona");
      if (storedPersona) {
        setDemoPersona(storedPersona);
      }
      return;
    }
    // 1. Check for active Supabase session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();
    // 2. Listen for Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Bridge auth token to native iOS app via Capacitor Preferences
      if (session?.access_token) {
        await Preferences.set({
          key: 'user_session_token',
          value: session.access_token
        });
        console.log('✅ Auth token bridged to native iOS app');
      } else {
        // Clear token on sign out
        await Preferences.remove({ key: 'user_session_token' });
        console.log('🗑️ Auth token cleared from native iOS app');
      }
      
      // If a real user logs in, ensure we clear the local demo flag
      if (session?.user) {
        localStorage.removeItem("haseeb_demo_persona");
        setDemoPersona(null);
      }
    });
    // 3. Check for existing local demo session after main loading is done
    const storedPersona = localStorage.getItem("haseeb_demo_persona");
    if (!user && !session && storedPersona) {
      setDemoPersona(storedPersona);
    }
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Supabase is not configured." } };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };
  const signUpWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Supabase is not configured." } };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/#/welcome`,
      },
    });
    return { error };
  };
  const signOut = async () => {
    if (demoPersona) {
      localStorage.removeItem("haseeb_demo_persona");
      clearAllData(); // Clear demo data
      setDemoPersona(null);
      setUser(null);
      window.location.reload(); // Hard reload to reset local state
    } else if (!isSupabaseConfigured) {
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
  };
  const startDemo = useCallback((persona: DemoPersona) => {
    console.log(`🚀 Starting Demo Mode with persona: ${persona}`);
    localStorage.setItem("haseeb_demo_persona", persona);
    seedDemoData(persona); // CRITICAL: Seed data BEFORE reload
    setDemoPersona(persona);
    console.log('🔄 Reloading app to mount DataContext with seeded data...');
    window.location.reload(); // Reload to force DataContext re-mount
  }, []);

  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Supabase is not configured." } };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/update-password`,
    });
    return { error };
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Supabase is not configured." } };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };
  const appUser: AppUser | null = useMemo(() => {
    if (user) {
      return {
        ...user,
        isDemo: false,
        name: user.email || "Haseeb User",
      } as AppUser;
    } else if (demoPersona) {
      return {
        id: "demo_user",
        email: "demo@haseeb.app",
        isDemo: true,
        name: `Guest (${demoPersona})`,
      } as AppUser;
    }
    return null;
  }, [user, demoPersona]);
  const value = {
    session,
    user: appUser,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    startDemo,
    resetPasswordForEmail,
    updateUserPassword,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
