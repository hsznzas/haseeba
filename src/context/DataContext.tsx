import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog } from '../../types';
import { useAuth } from './AuthContext';

import * as storage from '../services/storage';
import * as api from '../services/api';

interface DataContextType {
  habits: Habit[];
  logs: HabitLog[];
  customReasons: string[];
  loading: boolean;
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

  const handleSaveLog = async (log: HabitLog) => {
    console.log('🔄 Attempting to save log...', {
      log,
      userExists: !!user,
      isDemo: user?.isDemo,
      userId: user?.id
    });

    if (!user) {
      console.error('❌ Cannot save log: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        console.log('💾 Saving to LocalStorage (Demo Mode)');
        const newLogs = storage.saveLog(log);
        setLogs(newLogs);
        console.log('✅ Log saved to LocalStorage');
      } else {
        console.log('☁️ Saving to Supabase (Cloud Mode)');
        const newLogs = await api.saveLog(log);
        setLogs(newLogs);
        console.log('✅ Log saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Error saving log:', error);
    }
  };

  const handleDeleteLog = async (habitId: string, date: string) => {
    console.log('🗑️ Attempting to delete log...', {
      habitId,
      date,
      userExists: !!user,
      isDemo: user?.isDemo,
      userId: user?.id
    });

    if (!user) {
      console.error('❌ Cannot delete log: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        console.log('💾 Deleting from LocalStorage (Demo Mode)');
        const newLogs = storage.deleteLog(habitId, date);
        setLogs(newLogs);
        console.log('✅ Log deleted from LocalStorage');
      } else {
        console.log('☁️ Deleting from Supabase (Cloud Mode)');
        const newLogs = await api.deleteLog(habitId, date);
        setLogs(newLogs);
        console.log('✅ Log deleted from Supabase');
      }
    } catch (error) {
      console.error('❌ Error deleting log:', error);
    }
  };

  const handleSaveHabit = async (habit: Habit) => {
    console.log('💾 Attempting to save HABIT:', habit.name);
    console.log('💾 Habit details:', {
      id: habit.id,
      isActive: habit.isActive,
      order: habit.order,
      type: habit.type,
      userExists: !!user,
      isDemo: user?.isDemo,
      userId: user?.id
    });

    if (!user) {
      console.error('❌ Cannot save habit: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        console.log('💾 Routing to LocalStorage (Demo Mode)');
        const newHabits = storage.saveHabit(habit);
        setHabits(newHabits);
        console.log('✅ Habit saved to LocalStorage, total habits:', newHabits.length);
      } else {
        console.log('☁️ Routing to Supabase (Cloud Mode)');
        const newHabits = await api.saveHabit(habit);
        console.log('☁️ Received updated habits from API:', newHabits.length);
        setHabits(newHabits);
        console.log('✅ Habit saved to Supabase and state updated');
      }
    } catch (error) {
      console.error('❌ Error saving habit:', error);
      throw error; // Propagate error so AddHabitModal knows it failed
    }
  };

  const handleDeleteHabit = async (id: string) => {
    console.log('🗑️ Attempting to delete HABIT:', id);
    console.log('🗑️ User details:', {
      userExists: !!user,
      isDemo: user?.isDemo,
      userId: user?.id
    });

    if (!user) {
      console.error('❌ Cannot delete habit: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        console.log('💾 Deleting from LocalStorage (Demo Mode)');
        const newHabits = storage.deleteHabit(id);
        setHabits(newHabits);
        console.log('✅ Habit deleted from LocalStorage, total habits:', newHabits.length);
      } else {
        console.log('☁️ Deleting from Supabase (Cloud Mode)');
        const newHabits = await api.deleteHabit(id);
        setHabits(newHabits);
        console.log('✅ Habit deleted from Supabase, total habits:', newHabits.length);
      }
      // Refresh logs to ensure any orphaned logs are cleaned up
      await refreshData();
    } catch (error) {
      console.error('❌ Error deleting habit:', error);
      throw error;
    }
  };

  const handleAddCustomReason = async (reason: string) => {
    console.log('💾 Attempting to save custom reason:', reason);
    
    if (!user) {
      console.error('❌ Cannot save custom reason: No user found');
      return;
    }
    
    try {
      if (user.isDemo) {
        console.log('💾 Saving to LocalStorage (Demo Mode)');
        storage.saveCustomReason(reason);
        const updatedReasons = storage.getCustomReasons();
        setCustomReasons(updatedReasons);
        console.log('✅ Custom reason saved to LocalStorage');
      } else {
        console.log('☁️ Saving to Supabase (Cloud Mode)');
        await api.saveCustomReason(reason);
        const updatedReasons = await api.getCustomReasons();
        setCustomReasons(updatedReasons);
        console.log('✅ Custom reason saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Error saving custom reason:', error);
    }
  };

  const handleSeedData = () => {
    storage.seedDemoData();
    refreshData();
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
        console.log('💾 Saving reordered habits to LocalStorage (Demo Mode)');
        // Save each habit with updated order
        for (const habit of updatedHabits) {
          storage.saveHabit(habit);
        }
        console.log('✅ Habit order saved to LocalStorage');
      } else {
        console.log('☁️ Saving reordered habits to Supabase (Cloud Mode)');
        await api.updateHabitOrder(updatedHabits);
        console.log('✅ Habit order saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Error reordering habits:', error);
      // Rollback on error by refreshing data
      await refreshData();
    }
  };

  return (
    <DataContext.Provider value={{ 
      habits, 
      logs, 
      customReasons,
      loading, 
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
