import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../services/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { DemoPersona, clearAllData, seedDemoData } from "../services/storage";
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };
  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
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
