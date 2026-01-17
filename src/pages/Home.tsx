import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../App';
import { useAuth } from '../context/AuthContext';
import DateSelector from '../components/DateSelector';
import HabitCard from '../components/HabitCard';
import BottomNav from '../components/BottomNav';
import NewsTicker from '../components/NewsTicker';
import { useData } from '../context/DataContext';
import { HabitLog, LogStatus, HabitType, PrayerQuality, Habit, DailyBriefing } from '../../types';
import { format, subDays, getDay } from 'date-fns';
import { Plus, User, RotateCw, ArrowUpDown, Brain, Info, Hourglass, Pause } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import AddHabitModal from '../components/AddHabitModal';
import ReasonModal from '../components/ReasonModal';
import ActionButtonsKeyCard from '../components/ActionButtonsKeyCard';
import HadithDisplay from '../components/HadithDisplay';
import { generateDailyBriefing, getCachedBriefing } from '../services/aiEngine';
import { isOnboardingComplete, setOnboardingComplete, createExcusedLogsForToday as createExcusedLogsLocal } from '../services/storage';
import { createExcusedLogsForCurrentUser } from '../services/api';

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
  const [showKeyCard, setShowKeyCard] = useState(false);
  
  // AI Daily Briefing state
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch AI briefing on mount
  useEffect(() => {
    const fetchBriefing = async () => {
      // Check cache first (synchronous)
      const cached = getCachedBriefing();
      if (cached) {
        setDailyBriefing(cached);
        return;
      }
      
      // Generate new briefing in background
      if (habits.length > 0 && logs.length > 0) {
        setIsBriefingLoading(true);
        try {
          const briefing = await generateDailyBriefing(habits, logs, preferences.language);
          setDailyBriefing(briefing);
        } catch (error) {
          console.error('Error fetching briefing:', error);
        } finally {
          setIsBriefingLoading(false);
        }
      }
    };
    
    fetchBriefing();
  }, [habits.length, logs.length, preferences.language]);

  // Show onboarding key card for first-time logged-in users
  useEffect(() => {
    if (user && !user.isDemo && !isOnboardingComplete()) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowKeyCard(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Auto-log excused prayers when isExcused mode is active
  useEffect(() => {
    const autoLogExcused = async () => {
      if (preferences.isExcused && preferences.gender === 'female' && user) {
        try {
          if (user.isDemo) {
            // Demo account: use localStorage
            createExcusedLogsLocal();
            await refreshData();
          } else {
            // Real account: use Supabase
            await createExcusedLogsForCurrentUser();
            await refreshData();
          }
        } catch (error) {
          console.error('Error auto-logging excused prayers:', error);
        }
      }
    };
    
    autoLogExcused();
  }, [preferences.isExcused, preferences.gender, dateStr, user]);

  const handleKeyCardClose = () => {
    setShowKeyCard(false);
    setOnboardingComplete();
  };

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

  // Dynamic stats calculation helper
  const calculateDayStats = (date: Date) => {
    const dateStrLocal = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === dateStrLocal);
    let done = 0;
    let failed = 0;
    let pending = 0;
    
    // Get habits that existed on this date
    const habitsForDate = habits.filter(h => {
      if (!h.isActive) return false;
      if (h.startDate && dateStrLocal < h.startDate) return false;
      return shouldShowHabit(h, date, dateStrLocal);
    });
    
    habitsForDate.forEach(habit => {
      const log = dayLogs.find(l => l.habitId === habit.id);
      if (!log) {
        // Not logged yet = pending
        pending++;
        return;
      }
      
      if (habit.type === HabitType.PRAYER) {
        if (log.value >= PrayerQuality.ON_TIME) done++;
        else failed++; // Missed prayer
      } else if (habit.type === HabitType.COUNTER) {
        if ((log.value || 0) >= (habit.dailyTarget || 1) || log.status === LogStatus.DONE) done++;
        else failed++;
      } else {
        if (log.status === LogStatus.DONE) done++;
        else failed++;
      }
    });
    
    return { done, failed, pending };
  };

  // Stats for selectedDate and day before
  const headerStats = useMemo(() => {
    const selectedStats = calculateDayStats(selectedDate);
    const dayBefore = subDays(selectedDate, 1);
    const dayBeforeStats = calculateDayStats(dayBefore);
    
    const selectedDayName = format(selectedDate, 'EEE');
    const dayBeforeName = format(dayBefore, 'EEE');
    
    return {
      selected: selectedStats,
      dayBefore: dayBeforeStats,
      selectedDayName,
      dayBeforeName
    };
  }, [logs, habits, selectedDate]);

  const userName = useMemo(() => {
    if (!user) return preferences.language === 'ar' ? 'ضيف' : 'Guest';
    if (user.isDemo) return preferences.language === 'ar' ? 'ضيف' : 'Guest';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    return name;
  }, [user, preferences.language]);

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

  const handleViewHabitDetails = (habitId: string) => {
    navigate(`/habit/${habitId}`);
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
  // STREAK CALCULATION (Point-in-Time based on selectedDate)
  // With Excused Day Bridge Logic
  // ==========================================
  const streaks = useMemo(() => {
    const habitStreaks: Record<string, number> = {};
    const viewDate = selectedDate;
    const viewDateStr = format(viewDate, 'yyyy-MM-dd');
    const dayBeforeStr = format(subDays(viewDate, 1), 'yyyy-MM-dd');

    habits.forEach(habit => {
      const habitLogs = logs.filter(l => l.habitId === habit.id);
      let currentStreak = 0;
      let checkDate = new Date(viewDate);
      let isStreakActive = false;
      
      const startDate = habit.startDate ? new Date(habit.startDate) : new Date('2000-01-01');
      const viewDateLog = habitLogs.find(l => l.date === viewDateStr);

      const isSuccessful = (log: HabitLog) => {
        if (habit.type === HabitType.PRAYER) return log.value === PrayerQuality.TAKBIRAH;
        if (habit.type === HabitType.COUNTER) return (log.value || 0) >= (habit.dailyTarget || 1) || log.status === LogStatus.DONE;
        return log.status === LogStatus.DONE;
      };

      // Check if a log is excused (acts as a bridge)
      const isExcused = (log: HabitLog) => log.status === LogStatus.EXCUSED;

      // Calculate streak as of the selected date
      if (viewDateLog) {
         if (isExcused(viewDateLog)) {
            // Excused day - don't count but continue checking backwards
            checkDate = subDays(viewDate, 1);
            isStreakActive = true;
         } else if (isSuccessful(viewDateLog)) {
            currentStreak = 1;
            checkDate = subDays(viewDate, 1);
            isStreakActive = true;
         } else {
            // Habit was logged but not successful on selected date - streak is broken
            currentStreak = 0;
            isStreakActive = false;
         }
      } else {
         // No log on selected date - check if day before had a successful log or was excused
         const dayBeforeLog = habitLogs.find(l => l.date === dayBeforeStr);
         if (dayBeforeLog && isSuccessful(dayBeforeLog)) {
            currentStreak = 1;
            checkDate = subDays(viewDate, 2);
            isStreakActive = true;
         } else if (dayBeforeLog && isExcused(dayBeforeLog)) {
            // Excused day before - continue checking backwards
            checkDate = subDays(viewDate, 2);
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
           if (log) {
             if (isExcused(log)) {
               // Excused day acts as a bridge - don't increment but continue
               checkDate = subDays(checkDate, 1);
               continue;
             } else if (isSuccessful(log)) {
               currentStreak++;
               checkDate = subDays(checkDate, 1);
             } else {
               // Failed log breaks the streak
               break;
             }
           } else {
             // No log for this date - streak broken
             break;
           }
        }
      }
      habitStreaks[habit.id] = currentStreak;
    });
    return habitStreaks;
  }, [habits, logs, selectedDate]);

  // ==========================================
  // DATE COMPLETION STATUS (Fixed: Only count habits that existed on that date)
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
          
          // Only check habits that existed on this date (startDate <= d)
          const requiredHabits = habits.filter(h => {
            if (!h.isActive) return false;
            // Habit must have started on or before this date
            if (h.startDate && d < h.startDate) return false;
            return shouldShowHabit(h, dateObj, d);
          });
          
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

  // Separate habits into Core and Bonus
  const coreHabits = useMemo(() => {
    return visibleHabits.filter(h => h.affectsScore !== false);
  }, [visibleHabits]);

  const bonusHabits = useMemo(() => {
    return visibleHabits.filter(h => h.affectsScore === false);
  }, [visibleHabits]);

  return (
    <div className="pb-32 relative min-h-screen">
        <div className="sticky top-0 z-40 bg-slate-50/80 dark:bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 pt-[env(safe-area-inset-top)] shadow-sm">
            {/* Row 1: Avatar, Welcome, Actions */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                {/* Left: Avatar + Welcome */}
                <div 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-primary" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {preferences.language === 'ar' ? `مرحبًا، ${userName}` : `Hi, ${userName}`}
                  </p>
                </div>
                
                {/* Right: Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyCard(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 active:scale-95 transition-transform"
                    title={preferences.language === 'ar' ? 'دليل' : 'Guide'}
                  >
                    <Info size={16} className="text-slate-500 dark:text-gray-400" />
                  </button>
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
                </div>
            </div>
            
            {/* Excused Mode Indicator */}
            {preferences.isExcused && preferences.gender === 'female' && (
              <div className="px-4 pb-2">
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <Pause size={14} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-400">
                    {preferences.language === 'ar' ? 'وضع العذر مفعّل' : 'Excused Mode Active'}
                  </span>
                </div>
              </div>
            )}

            {/* Row 2: Stats bar */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-center gap-4 py-1.5 px-3 bg-slate-100/50 dark:bg-white/[0.03] rounded-lg" dir="ltr">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-emerald-500 font-semibold">{headerStats.selectedDayName}</span>
                  <span className="text-emerald-500">{headerStats.selected.done}✓</span>
                  <span className="text-red-400">{headerStats.selected.failed}✗</span>
                  {headerStats.selected.pending > 0 && (
                    <span className="text-yellow-400 inline-flex items-center gap-0.5">{headerStats.selected.pending}<Hourglass size={10} /></span>
                  )}
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-white/10" />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500">{headerStats.dayBeforeName}</span>
                  <span className="text-emerald-500/60">{headerStats.dayBefore.done}✓</span>
                  <span className="text-red-400/60">{headerStats.dayBefore.failed}✗</span>
                  {headerStats.dayBefore.pending > 0 && (
                    <span className="text-yellow-400/60 inline-flex items-center gap-0.5">{headerStats.dayBefore.pending}<Hourglass size={10} /></span>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Hadith Display - Calm Technology */}
        {preferences.showHadith && <HadithDisplay />}

        {/* Daily Focus Card - AI Insight */}
        {preferences.showAIInsights && (
          <div className="px-4 mt-4">
            <AnimatePresence mode="wait">
              {isBriefingLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-br from-blue-950/80 to-slate-900/90 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-blue-500/20 rounded animate-pulse w-24" />
                      <div className="h-4 bg-blue-500/10 rounded animate-pulse w-full" />
                      <div className="h-4 bg-blue-500/10 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </motion.div>
              ) : dailyBriefing?.home_advice ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-br from-blue-950/80 to-slate-900/90 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 mb-4 shadow-lg shadow-blue-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Brain size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-wider mb-1">
                        {preferences.language === 'ar' ? 'تركيز اليوم' : 'Daily Focus'}
                      </p>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {dailyBriefing.home_advice}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}

        <div className="px-4">
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
                        onViewDetails={undefined}
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
                  {/* Core Habits Section */}
                  {coreHabits.map(habit => {
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
                          onViewDetails={() => handleViewHabitDetails(habit.id)}
                          onReasonNeeded={(val, status) => setReasoningState({ id: habit.id, val, status })}
                          isSortMode={false}
                        />
                      </motion.div>
                    );
                  })}

                  {/* Bonus Habits Divider and Section */}
                  {bonusHabits.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 py-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-800">
                          {preferences.language === 'ar' ? 'عادات المكافأة' : 'Bonus Habits'}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                      </div>

                      {bonusHabits.map(habit => {
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
                              onViewDetails={() => handleViewHabitDetails(habit.id)}
                              onReasonNeeded={(val, status) => setReasoningState({ id: habit.id, val, status })}
                              isSortMode={false}
                            />
                          </motion.div>
                        );
                      })}
                    </>
                  )}
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

        <div className="mt-4">
          <NewsTicker />
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

        <ActionButtonsKeyCard 
          isOpen={showKeyCard} 
          onClose={handleKeyCardClose} 
        />
    </div>
  );
};

export default Home;
