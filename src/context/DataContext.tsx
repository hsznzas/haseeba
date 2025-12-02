import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog, HabitType, PrayerQuality, CustomReason } from '../../types';
import { useAuth } from './AuthContext';
import { INITIAL_HABITS } from '../../constants';

// Prayer quality level names for notifications
const PRAYER_LEVEL_NAMES: Record<number, { en: string; ar: string }> = {
  [PrayerQuality.TAKBIRAH]: { en: '1st Takbirah', ar: 'تكبيرة الإحرام' },
  [PrayerQuality.JAMAA]: { en: 'In Group', ar: 'جماعة' },
  [PrayerQuality.ON_TIME]: { en: 'On Time', ar: 'في الوقت' },
  [PrayerQuality.MISSED]: { en: 'Missed', ar: 'فائتة' },
};

import * as storage from '../services/storage';
import * as api from '../services/api';

// Helper to enrich loaded habits with icon/color from INITIAL_HABITS
const enrichHabitsWithIcons = (loadedHabits: Habit[]): Habit[] => {
  return loadedHabits.map(habit => {
    // Find matching preset habit by ID
    const presetHabit = INITIAL_HABITS.find(h => h.id === habit.id);
    if (presetHabit) {
      return {
        ...habit,
        icon: habit.icon || presetHabit.icon,
        color: habit.color || presetHabit.color,
      };
    }
    return habit;
  });
};

// ============================================
// NOTIFICATION STATE & COMPONENT
// ============================================
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Notification Bar Component - positioned at bottom to avoid phone notch
export const NotificationBar: React.FC<{ notification: NotificationState; onHide: () => void }> = ({ notification, onHide }) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(onHide, 2500);
      return () => clearTimeout(timer);
    }
  }, [notification.show, onHide]);

  if (!notification.show) return null;

  return (
    <div 
      className={`fixed bottom-20 left-4 right-4 z-[9999] transition-all duration-300 ease-out ${
        notification.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`py-3 px-4 rounded-xl text-center text-sm font-medium shadow-lg backdrop-blur-md ${
        notification.type === 'success' 
          ? 'bg-emerald-500/95 text-white border border-emerald-400/30' 
          : 'bg-red-500/95 text-white border border-red-400/30'
      }`}>
        {notification.message}
      </div>
    </div>
  );
};

// ============================================
// CONTEXT TYPE
// ============================================
interface DataContextType {
  habits: Habit[];
  logs: HabitLog[];
  customReasons: CustomReason[];
  loading: boolean;
  notification: NotificationState;
  hideNotification: () => void;
  refreshData: () => Promise<void>;
  handleSaveLog: (log: HabitLog) => Promise<void>;
  handleDeleteLog: (habitId: string, date: string) => Promise<void>;
  handleSaveHabit: (habit: Habit) => Promise<void>;
  handleDeleteHabit: (id: string) => Promise<void>;
  handleSaveCustomReason: (reason: CustomReason) => Promise<void>;
  handleDeleteCustomReason: (reasonId: string) => Promise<void>;
  handleSeedData: () => void;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  handleReorderHabits: (newOrder: Habit[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [customReasons, setCustomReasons] = useState<CustomReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  const refreshData = useCallback(async () => {
    if (authLoading || !user) return;
    
    setLoading(true);
    try {
      if (user.isDemo) {
        console.log('🔵 Loading data for mode: DEMO (LocalStorage)');
        const loadedHabits = storage.getHabits();
        const loadedLogs = storage.getLogs();
        const loadedReasons = storage.getCustomReasons();
        console.log(`✅ Demo Mode: Loaded ${loadedHabits.length} habits, ${loadedLogs.length} logs, ${loadedReasons.length} custom reasons from LocalStorage`);
        // Enrich habits with icons/colors from INITIAL_HABITS
        setHabits(enrichHabitsWithIcons(loadedHabits));
        setLogs(loadedLogs);
        setCustomReasons(loadedReasons);
      } else {
        console.log('🟢 Loading data for mode: CLOUD (Supabase)');
        const [fetchedHabits, fetchedLogs, fetchedReasons] = await Promise.all([
          api.getHabits(),
          api.getLogs(),
          api.getCustomReasons()
        ]);
        console.log(`✅ Cloud Mode: Loaded ${fetchedHabits.length} habits, ${fetchedLogs.length} logs, ${fetchedReasons.length} custom reasons from Supabase`);
        // Enrich habits with icons/colors from INITIAL_HABITS
        setHabits(enrichHabitsWithIcons(fetchedHabits));
        setLogs(fetchedLogs);
        setCustomReasons(fetchedReasons);
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============================================
  // OPTIMISTIC UI: handleSaveLog
  // ============================================
  const handleSaveLog = async (log: HabitLog) => {
    if (!user) {
      console.error('❌ Cannot save log: No user found');
      return;
    }

    // 1. Store previous state for potential rollback
    const previousLogs = [...logs];
    
    // 2. OPTIMISTIC UPDATE - Update UI immediately
    setLogs(prevLogs => {
      const existingIndex = prevLogs.findIndex(
        l => l.habitId === log.habitId && l.date === log.date
      );
      if (existingIndex >= 0) {
        // Update existing log
        const updated = [...prevLogs];
        updated[existingIndex] = log;
        return updated;
      } else {
        // Add new log
        return [...prevLogs, log];
      }
    });

    // 3. Build notification message
    const habit = habits.find(h => h.id === log.habitId);
    let notificationMsg = '✓ Saved';
    
    // For prayer habits, show the quality level name
    if (habit?.type === HabitType.PRAYER && log.value !== undefined) {
      const levelNames = PRAYER_LEVEL_NAMES[log.value];
      if (levelNames) {
        // Get language from localStorage preferences
        const prefs = localStorage.getItem('haseeb_preferences');
        const lang = prefs ? JSON.parse(prefs).language || 'en' : 'en';
        const levelName = lang === 'ar' ? levelNames.ar : levelNames.en;
        notificationMsg = `✓ ${levelName}`;
      }
    }

    // 4. Persist to storage in background
    try {
      if (user.isDemo) {
        storage.saveLog(log);
        showNotification(notificationMsg, 'success');
      } else {
        await api.saveLog(log);
        showNotification(notificationMsg, 'success');
      }
    } catch (error) {
      console.error('❌ Error saving log:', error);
      // Rollback on error
      setLogs(previousLogs);
      showNotification('Failed to save', 'error');
    }
  };

  // ============================================
  // OPTIMISTIC UI: handleDeleteLog
  // ============================================
  const handleDeleteLog = async (habitId: string, date: string) => {
    if (!user) {
      console.error('❌ Cannot delete log: No user found');
      return;
    }

    // 1. Store previous state for rollback
    const previousLogs = [...logs];
    
    // 2. OPTIMISTIC UPDATE - Remove from UI immediately
    setLogs(prevLogs => prevLogs.filter(
      l => !(l.habitId === habitId && l.date === date)
    ));

    // 3. Persist deletion in background
    try {
      if (user.isDemo) {
        storage.deleteLog(habitId, date);
        showNotification('✓ Removed', 'success');
      } else {
        await api.deleteLog(habitId, date);
        showNotification('✓ Removed', 'success');
      }
    } catch (error) {
      console.error('❌ Error deleting log:', error);
      // Rollback on error
      setLogs(previousLogs);
      showNotification('Failed to delete', 'error');
    }
  };

  const handleSaveHabit = async (habit: Habit) => {
    console.log('💾 Attempting to save HABIT:', habit.name);

    if (!user) {
      console.error('❌ Cannot save habit: No user found');
      return;
    }
    
    // Optimistic update
    const previousHabits = [...habits];
    setHabits(prevHabits => {
      const existingIndex = prevHabits.findIndex(h => h.id === habit.id);
      if (existingIndex >= 0) {
        const updated = [...prevHabits];
        updated[existingIndex] = habit;
        return updated;
      }
      return [...prevHabits, habit];
    });

    try {
      if (user.isDemo) {
        storage.saveHabit(habit);
        showNotification('✓ Habit saved', 'success');
      } else {
        await api.saveHabit(habit);
        showNotification('✓ Habit synced', 'success');
      }
    } catch (error) {
      console.error('❌ Error saving habit:', error);
      setHabits(previousHabits);
      showNotification('Failed to save habit', 'error');
      throw error;
    }
  };

  const handleDeleteHabit = async (id: string) => {
    console.log('🗑️ Attempting to delete HABIT:', id);

    if (!user) {
      console.error('❌ Cannot delete habit: No user found');
      return;
    }
    
    // Optimistic update
    const previousHabits = [...habits];
    setHabits(prevHabits => prevHabits.filter(h => h.id !== id));

    try {
      if (user.isDemo) {
        storage.deleteHabit(id);
        showNotification('✓ Habit deleted', 'success');
      } else {
        await api.deleteHabit(id);
        showNotification('✓ Habit deleted', 'success');
      }
    } catch (error) {
      console.error('❌ Error deleting habit:', error);
      setHabits(previousHabits);
      showNotification('Failed to delete habit', 'error');
      throw error;
    }
  };

  const handleSaveCustomReason = async (reason: CustomReason) => {
    console.log('💾 Attempting to save custom reason:', reason.text);
    
    if (!user) {
      console.error('❌ Cannot save custom reason: No user found');
      return;
    }
    
    // Optimistic update
    const previousReasons = [...customReasons];
    const existingIndex = customReasons.findIndex(r => r.id === reason.id);
    if (existingIndex >= 0) {
      setCustomReasons(prev => {
        const updated = [...prev];
        updated[existingIndex] = reason;
        return updated;
      });
    } else {
      setCustomReasons(prev => [...prev, reason]);
    }

    try {
      if (user.isDemo) {
        storage.saveCustomReason(reason);
        showNotification('✓ Reason saved', 'success');
      } else {
        await api.saveCustomReason(reason);
        showNotification('✓ Reason synced', 'success');
      }
    } catch (error) {
      console.error('❌ Error saving custom reason:', error);
      setCustomReasons(previousReasons);
      showNotification('Failed to save reason', 'error');
    }
  };

  const handleDeleteCustomReason = async (reasonId: string) => {
    console.log('🗑️ Attempting to delete custom reason:', reasonId);
    
    if (!user) {
      console.error('❌ Cannot delete custom reason: No user found');
      return;
    }
    
    // Optimistic update
    const previousReasons = [...customReasons];
    setCustomReasons(prev => prev.filter(r => r.id !== reasonId));

    try {
      if (user.isDemo) {
        storage.deleteCustomReason(reasonId);
        showNotification('✓ Reason deleted', 'success');
      } else {
        await api.deleteCustomReason(reasonId);
        showNotification('✓ Reason deleted', 'success');
      }
    } catch (error) {
      console.error('❌ Error deleting custom reason:', error);
      setCustomReasons(previousReasons);
      showNotification('Failed to delete reason', 'error');
    }
  };

  const handleSeedData = () => {
    storage.seedDemoData();
    refreshData();
    showNotification('✓ Demo data seeded', 'success');
  };

  const handleReorderHabits = async (newOrder: Habit[]) => {
    console.log('🔄 Reordering habits...');
    
    // Calculate new order values based on array index
    const updatedHabits = newOrder.map((habit, index) => ({
      ...habit,
      order: index,
    }));
    
    // Optimistic UI update - immediately update local state
    setHabits(prevHabits => {
      const reorderedIds = new Set(updatedHabits.map(h => h.id));
      const otherHabits = prevHabits.filter(h => !reorderedIds.has(h.id));
      return [...updatedHabits, ...otherHabits].sort((a, b) => a.order - b.order);
    });
    
    if (!user) {
      console.error('❌ Cannot reorder habits: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        for (const habit of updatedHabits) {
          storage.saveHabit(habit);
        }
      } else {
        await api.updateHabitOrder(updatedHabits);
      }
    } catch (error) {
      console.error('❌ Error reordering habits:', error);
      await refreshData();
    }
  };

  return (
    <DataContext.Provider value={{ 
      habits, 
      logs, 
      customReasons,
      loading,
      notification,
      hideNotification,
      refreshData, 
      handleSaveLog, 
      handleDeleteLog, 
      handleSaveHabit,
      handleDeleteHabit,
      handleSaveCustomReason,
      handleDeleteCustomReason,
      handleSeedData,
      setHabits,
      handleReorderHabits
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
