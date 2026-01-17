import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Welcome from './pages/Welcome';
import HabitDetails from './pages/HabitDetails';
import AdminDashboard from './pages/AdminDashboard';
import { UserPreferences } from '../types';
import { getPreferences, savePreferences } from './services/storage';
import { supabaseGetPreferences, supabaseSavePreferences } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, NotificationBar, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext'; // Restored
import { Sparkles, Hourglass, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

// Animated Loading Hourglass with Flames
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
    {/* Logo */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 mb-8"
    >
      <Sparkles className="text-emerald-500" size={32} />
      <span className="text-white font-bold text-2xl tracking-tight">Haseeb</span>
    </motion.div>
    
    {/* Animated Hourglass with Flames */}
    <div className="relative">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Spinning Hourglass */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative z-10"
      >
        <Hourglass size={48} className="text-emerald-500" strokeWidth={1.5} />
      </motion.div>
      
      {/* Flame effects */}
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Flame size={16} className="text-orange-500" fill="rgba(249, 115, 22, 0.5)" />
      </motion.div>
      <motion.div
        className="absolute -bottom-1 -left-2"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 0.4, repeat: Infinity, delay: 0.15 }}
      >
        <Flame size={12} className="text-orange-400" fill="rgba(251, 146, 60, 0.5)" />
      </motion.div>
      <motion.div
        className="absolute top-1/2 -right-3"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      >
        <Flame size={10} className="text-yellow-500" fill="rgba(234, 179, 8, 0.5)" />
      </motion.div>
    </div>
    
    {/* Loading text */}
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-6 text-white/40 text-sm"
    >
      Loading...
    </motion.p>
  </div>
);

// Notification Wrapper Component
const NotificationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification, hideNotification } = useData();
  return (
    <>
      <NotificationBar notification={notification} onHide={hideNotification} />
      {children}
    </>
  );
};

// --- Preferences Context ---
interface AppContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  refreshPreferences: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("usePreferences must be used within AppProvider");
  return context;
};

// Preferences Provider that syncs with Supabase for authenticated users
const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    const stored = getPreferences();
    return stored as UserPreferences;
  });

  // Load preferences from Supabase when user is authenticated
  const refreshPreferences = useCallback(async () => {
    if (authLoading) return;
    
    if (user && !user.isDemo) {
      console.log('📥 Loading preferences from Supabase...');
      try {
        const cloudPrefs = await supabaseGetPreferences(user.id);
        setPreferencesState(cloudPrefs as UserPreferences);
        savePreferences(cloudPrefs as any); // Also update local cache
        console.log('✅ Preferences loaded from cloud:', cloudPrefs);
      } catch (err) {
        console.error('❌ Error loading preferences from cloud:', err);
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  const setPreferences = useCallback(async (prefs: UserPreferences) => {
    setPreferencesState(prefs);
    savePreferences(prefs as any); // Always save to localStorage

    // Sync to Supabase for authenticated users
    if (user && !user.isDemo) {
      console.log('💾 Syncing preferences to Supabase...');
      try {
        await supabaseSavePreferences(user.id, prefs);
        console.log('✅ Preferences synced to cloud');
      } catch (err) {
        console.error('❌ Error syncing preferences to cloud:', err);
      }
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = preferences.language;
    document.documentElement.classList.add('dark');
  }, [preferences.language]);

  return (
    <AppContext.Provider value={{ preferences, setPreferences, refreshPreferences }}>
      {children}
    </AppContext.Provider>
  );
};

// --- PWA Home Redirect Hook ---
// Forces redirect to home when app is opened as PWA (standalone mode)
const usePWAHomeRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run once on initial mount
    if (hasRedirected.current) return;
    
    // Check if running as PWA (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;
    
    // If PWA and not already on home, redirect to home
    if (isPWA && location.pathname !== '/') {
      hasRedirected.current = true;
      navigate('/', { replace: true });
    }
  }, []);
};

// --- App Routing and Protection ---
const AppRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  
  // Force redirect to home when opened as PWA
  usePWAHomeRedirect();

  if (authLoading) {
    return <LoadingScreen />;
  }

  // Always allow access to update-password route (Supabase handles auth via URL token)
  return (
    <Routes>
      {/* Public routes - accessible regardless of auth state */}
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/super-secret-admin" element={<AdminDashboard />} />
      
      {/* Protected Routes */}
      {user ? (
        <>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/habit/:habitId" element={<HabitDetails />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="*" element={<Login />} />
        </>
      )}
    </Routes>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <DataProvider>
          <ToastProvider>
            <NotificationWrapper>
              <Router>
                <AppRoutes />
              </Router>
            </NotificationWrapper>
          </ToastProvider>
        </DataProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
};

export default App;