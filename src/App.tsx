import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { UserPreferences } from '@/index';
import { getPreferences, savePreferences } from './services/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext'; // Restored
import { Loader2 } from 'lucide-react';

// --- Preferences Context ---
interface AppContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("usePreferences must be used within AppProvider");
  return context;
};

// --- App Routing and Protection ---
const AppRoutes = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // Unauthenticated users see Login page
  if (!user) {
    return <Login />;
  }

  // User is logged in (Supabase or Demo), show app layout
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [preferences, setPreferencesState] = useState<UserPreferences>(getPreferences());

  const setPreferences = (prefs: UserPreferences) => {
    setPreferencesState(prefs);
    savePreferences(prefs);
  };

  useEffect(() => {
    document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = preferences.language;
    
    // Add dark mode class to html
    document.documentElement.classList.add('dark');
  }, [preferences.language]);

  return (
    <AuthProvider>
      <AppContext.Provider value={{ preferences, setPreferences }}>
        <DataProvider>
          <ToastProvider> {/* Restored Toast Provider */}
             <Router>
               <AppRoutes />
             </Router>
          </ToastProvider>
        </DataProvider>
      </AppContext.Provider>
    </AuthProvider>
  );
};

export default App;