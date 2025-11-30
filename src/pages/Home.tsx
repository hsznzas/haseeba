import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../App';
import { useAuth } from '../context/AuthContext';
import DateSelector from '../components/DateSelector';
import HabitCard from '../components/HabitCard';
import BottomNav from '../components/BottomNav';
import { useData } from '../context/DataContext';
import { HabitLog, LogStatus, HabitType, PrayerQuality, Habit } from '../../types';
import { format, addDays, getDay } from 'date-fns';
import { Plus, User, RotateCw, ArrowUpDown } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import AddHabitModal from '../components/AddHabitModal';
import ReasonModal from '../components/ReasonModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const { habits, logs, handleSaveLog, handleDeleteLog, refreshData, handleReorderHabits } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [reasoningState, setReasoningState] = useState<{ id: string, val: number, status: LogStatus } | null>(null);
  const [isSortMode, setIsSortMode] = useState(false);
  
  const yesterdayStats = useMemo(() => {
    const yesterday = addDays(new Date(), -1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    const yesterdayLogs = logs.filter(l => l.date === yesterdayStr);
    let done = 0;
    let missed = 0;
    
    yesterdayLogs.forEach(log => {
      const habit = habits.find(h => h.id === log.habitId);
      if (!habit) return;
      
      if (habit.type === HabitType.PRAYER) {
        if (log.value >= PrayerQuality.ON_TIME) done++;
        else missed++;
      } else if (habit.type === HabitType.COUNTER) {
        if ((log.value || 0) >= (habit.dailyTarget || 1) || log.status === LogStatus.DONE) done++;
        else missed++;
      } else {
        if (log.status === LogStatus.DONE) done++;
        else missed++;
      }
    });
    
    return { done, missed };
  }, [logs, habits]);

  const userName = useMemo(() => {
    if (!user) return preferences.language === 'ar' ? 'ضيف' : 'Guest';
    if (user.isDemo) return preferences.language === 'ar' ? 'ضيف' : 'Guest';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    return name;
  }, [user, preferences.language]);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // ==========================================
  // ISLAMIC CALENDAR HELPER FUNCTION
  // ==========================================
  const isHijriWhiteDay = (date: Date): boolean => {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric'
      });
      const hijriDay = parseInt(formatter.format(date), 10);
      return hijriDay === 13 || hijriDay === 14 || hijriDay === 15;
    } catch (e) {
      console.error('Error checking Hijri date:', e);
      return false;
    }
  };

  // ==========================================
  // HABIT VISIBILITY FILTER
  // ==========================================
  const shouldShowHabit = (habit: Habit, date: Date, dateStr: string): boolean => {
    if (!habit.isActive) return false;
    if (habit.startDate && dateStr < habit.startDate) return false;
    
    const dayOfWeek = getDay(date);
    
    if (habit.id === 'fasting_white_days') {
      return isHijriWhiteDay(date);
    }
    
    if (habit.id === 'fasting_monday') {
      return dayOfWeek === 1;
    }
    
    if (habit.id === 'fasting_thursday') {
      return dayOfWeek === 4;
    }
    
    return true;
  };

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleUpdate = (habitId: string, value: number, status?: LogStatus, reason?: string) => {
    console.log('👆 Home: handleUpdate called -', { habitId, value, status, reason });
    
    const newLog: HabitLog = {
      id: `${habitId}-${dateStr}`,
      habitId,
      date: dateStr,
      value,
      status: status || LogStatus.DONE,
      reason: reason,
      timestamp: Date.now(),
    };
    
    handleSaveLog(newLog);
  };

  const handleDelete = (habitId: string) => {
    handleDeleteLog(habitId, dateStr);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
    refreshData();
  };

  const handleAdded = () => {
    refreshData();
  };

  const handleReasonConfirm = (reason: string) => {
    if (reasoningState) {
      console.log('✅ Reason confirmed, saving with status:', reasoningState.status);
      handleUpdate(reasoningState.id, reasoningState.val, reasoningState.status, reason);
      setReasoningState(null);
    }
  };

  const handleReorder = (newOrder: Habit[]) => {
    // Immediately persist the new order via DataContext
    handleReorderHabits(newOrder);
  };

  const toggleSortMode = () => {
    setIsSortMode(!isSortMode);
  };

  // ==========================================
  // STREAK CALCULATION
  // ==========================================
  const streaks = useMemo(() => {
    const habitStreaks: Record<string, number> = {};
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(addDays(today, -1), 'yyyy-MM-dd');

    habits.forEach(habit => {
      const habitLogs = logs.filter(l => l.habitId === habit.id);
      let currentStreak = 0;
      let checkDate = new Date();
      let isStreakActive = false;
      
      const startDate = habit.startDate ? new Date(habit.startDate) : new Date('2000-01-01');
      const todayLog = habitLogs.find(l => l.date === todayStr);

      const isSuccessful = (log: HabitLog) => {
        if (habit.type === HabitType.PRAYER) return log.value === PrayerQuality.TAKBIRAH;
        if (habit.type === HabitType.COUNTER) return (log.value || 0) >= (habit.dailyTarget || 1) || log.status === LogStatus.DONE;
        return log.status === LogStatus.DONE;
      };

      if (todayLog) {
         if (isSuccessful(todayLog)) {
            currentStreak = 1;
            checkDate = addDays(today, -1);
            isStreakActive = true;
         } else {
            currentStreak = 0;
            isStreakActive = false;
         }
      } else {
         const yesterdayLog = habitLogs.find(l => l.date === yesterdayStr);
         if (yesterdayLog && isSuccessful(yesterdayLog)) {
            currentStreak = 1;
            checkDate = addDays(today, -2);
            isStreakActive = true;
         } else {
            currentStreak = 0;
            isStreakActive = false;
         }
      }

      if (isStreakActive) {
        while (true) {
           if (checkDate < startDate) break;
           const dateToCheckStr = format(checkDate, 'yyyy-MM-dd');
           const log = habitLogs.find(l => l.date === dateToCheckStr);
           if (log && isSuccessful(log)) {
             currentStreak++;
             checkDate = addDays(checkDate, -1);
           } else {
             break;
           }
        }
      }
      habitStreaks[habit.id] = currentStreak;
    });
    return habitStreaks;
  }, [habits, logs]);

  // ==========================================
  // DATE COMPLETION STATUS
  // ==========================================
  const completedDates = useMemo(() => {
      const dates = new Set<string>();
      const logsByDate: Record<string, HabitLog[]> = {};
      
      logs.forEach(l => {
          if (!logsByDate[l.date]) logsByDate[l.date] = [];
          logsByDate[l.date]!.push(l);
      });
      
      const datesToCheck = new Set([...Object.keys(logsByDate), dateStr]);
      
      datesToCheck.forEach(d => {
          const dayLogs = logsByDate[d] || [];
          const dateObj = new Date(d);
          
          const requiredHabits = habits.filter(h => shouldShowHabit(h, dateObj, d));
          
          if (requiredHabits.length === 0) return; 
          
          const allHabitsLogged = requiredHabits.every(h => {
             const log = dayLogs.find(l => l.habitId === h.id);
             return !!log;
          });
          
          if (allHabitsLogged) dates.add(d);
      });
      
      return Array.from(dates);
  }, [habits, logs, dateStr]);

  const loggedDates = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(l => dates.add(l.date));
    return Array.from(dates);
  }, [logs]);

  // ==========================================
  // VISIBLE HABITS FOR SELECTED DATE
  // ==========================================
  const visibleHabits = useMemo(() => {
     return habits
       .filter(h => shouldShowHabit(h, selectedDate, dateStr))
       .sort((a, b) => a.order - b.order);
  }, [habits, selectedDate, dateStr]);

  return (
    <div className="pb-32 relative min-h-screen">
        <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 pt-4 pb-3 shadow-sm">
            <div className="px-4 flex justify-between items-center">
                <div 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSortMode}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${
                      isSortMode 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'
                    }`}
                    title={preferences.language === 'ar' ? 'ترتيب' : 'Sort'}
                  >
                    <ArrowUpDown size={16} className={isSortMode ? 'text-white' : 'text-slate-500 dark:text-gray-400'} />
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 active:scale-95 transition-transform"
                    title={preferences.language === 'ar' ? 'تحديث' : 'Refresh'}
                  >
                    <RotateCw size={16} className="text-slate-500 dark:text-gray-400" />
                  </button>
                  <div 
                    onClick={() => navigate('/profile')}
                    className="min-w-[140px] px-6 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95 transition-transform text-right"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {preferences.language === 'ar' ? `مرحبًا، ${userName}` : `Welcome, ${userName}`}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">
                      {preferences.language === 'ar' 
                        ? `الأمس: ${yesterdayStats.done} مكتمل، ${yesterdayStats.missed} فائت`
                        : `Yesterday: ${yesterdayStats.done} Done, ${yesterdayStats.missed} Missed`
                      }
                    </p>
                  </div>
                </div>
            </div>
        </div>

        <div className="px-4 mt-4">
            {isSortMode ? (
              <Reorder.Group 
                axis="y" 
                values={visibleHabits} 
                onReorder={handleReorder}
                className="space-y-3"
              >
                {visibleHabits.map(habit => {
                  const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
                  return (
                    <Reorder.Item 
                      key={habit.id} 
                      value={habit}
                      className="list-none"
                    >
                      <HabitCard 
                        habit={habit}
                        log={log}
                        streak={streaks[habit.id] || 0}
                        onUpdate={(val, status) => handleUpdate(habit.id, val, status)}
                        onDeleteLog={() => handleDelete(habit.id)}
                        onEdit={undefined}
                        onReasonNeeded={(val, status) => setReasoningState({ id: habit.id, val, status })}
                        isSortMode={true}
                      />
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {visibleHabits.map(habit => {
                    const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
                    return (
                      <motion.div
                        key={habit.id}
                        layout
                      >
                        <HabitCard 
                          habit={habit}
                          log={log}
                          streak={streaks[habit.id] || 0}
                          onUpdate={(val, status) => handleUpdate(habit.id, val, status)}
                          onDeleteLog={() => handleDelete(habit.id)}
                          onEdit={!habit.presetId ? handleEditHabit : undefined}
                          onReasonNeeded={(val, status) => setReasoningState({ id: habit.id, val, status })}
                          isSortMode={false}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
        </div>

        <div className="fixed right-4 bottom-24 z-40">
             <button 
                onClick={() => { setEditingHabit(null); setIsModalOpen(true); }}
                className="w-14 h-14 bg-primary hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform active:scale-95 border-4 border-slate-50 dark:border-[#09090b]"
             >
                 <Plus size={28} strokeWidth={2.5} />
             </button>
        </div>

        <BottomNav>
          <DateSelector 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
            completedDates={completedDates}
            loggedDates={loggedDates}
          />
        </BottomNav>

        <AddHabitModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal} 
            onAdded={handleAdded}
            habitToEdit={editingHabit}
        />

        <ReasonModal 
          isOpen={!!reasoningState} 
          onClose={() => setReasoningState(null)} 
          onConfirm={handleReasonConfirm} 
        />
    </div>
  );
};

export default Home;
