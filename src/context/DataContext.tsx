import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog } from '../../types';
import { useAuth } from './AuthContext';

import * as storage from '../services/storage';
import * as api from '../services/api';

// ============================================
// NOTIFICATION STATE & COMPONENT
// ============================================
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Notification Bar Component (will be rendered in App)
export const NotificationBar: React.FC<{ notification: NotificationState; onHide: () => void }> = ({ notification, onHide }) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification.show, onHide]);

  if (!notification.show) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
        notification.show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={`py-2 px-4 text-center text-xs font-medium ${
        notification.type === 'success' 
          ? 'bg-emerald-500/90 text-white' 
          : 'bg-red-500/90 text-white'
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
  customReasons: string[];
  loading: boolean;
  notification: NotificationState;
  hideNotification: () => void;
  refreshData: () => Promise<void>;
  handleSaveLog: (log: HabitLog) => Promise<void>;
  handleDeleteLog: (habitId: string, date: string) => Promise<void>;
  handleSaveHabit: (habit: Habit) => Promise<void>;
  handleDeleteHabit: (id: string) => Promise<void>;
  handleAddCustomReason: (reason: string) => Promise<void>;
  handleSeedData: () => void;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  handleReorderHabits: (newOrder: Habit[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [customReasons, setCustomReasons] = useState<string[]>([]);
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
        setHabits(loadedHabits);
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
        setHabits(fetchedHabits);
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

    // 3. Persist to storage in background
    try {
      if (user.isDemo) {
        storage.saveLog(log);
        showNotification('✓ Saved', 'success');
      } else {
        await api.saveLog(log);
        showNotification('✓ Synced', 'success');
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

  const handleAddCustomReason = async (reason: string) => {
    console.log('💾 Attempting to save custom reason:', reason);
    
    if (!user) {
      console.error('❌ Cannot save custom reason: No user found');
      return;
    }
    
    // Optimistic update
    const previousReasons = [...customReasons];
    if (!customReasons.includes(reason)) {
      setCustomReasons(prev => [...prev, reason]);
    }

    try {
      if (user.isDemo) {
        storage.saveCustomReason(reason);
      } else {
        await api.saveCustomReason(reason);
      }
    } catch (error) {
      console.error('❌ Error saving custom reason:', error);
      setCustomReasons(previousReasons);
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
      handleAddCustomReason,
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
