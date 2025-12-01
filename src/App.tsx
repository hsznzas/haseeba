import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import { UserPreferences } from '@/index';
import { getPreferences, savePreferences } from './services/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, NotificationBar, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext'; // Restored
import { Loader2 } from 'lucide-react';

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

  // Always allow access to update-password route (Supabase handles auth via URL token)
  return (
    <Routes>
      {/* Password Reset Route - accessible regardless of auth state */}
      <Route path="/update-password" element={<UpdatePassword />} />
      
      {/* Protected Routes */}
      {user ? (
        <>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
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
          <ToastProvider>
            <NotificationWrapper>
              <Router>
                <AppRoutes />
              </Router>
            </NotificationWrapper>
          </ToastProvider>
        </DataProvider>
      </AppContext.Provider>
    </AuthProvider>
  );
};

export default App;