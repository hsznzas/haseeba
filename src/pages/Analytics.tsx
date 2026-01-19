import React, { useState, useMemo, useEffect } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateDailyBriefing, getCachedBriefing, regenerateBriefing } from '../services/aiEngine';
import { logAiInsightGeneration } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Sparkles, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Trophy, AlertTriangle, Loader2, Brain, Zap, RefreshCw, Info, X } from 'lucide-react';
import { HabitType, PrayerQuality, LogStatus, HabitLog, DailyBriefing } from '../../types';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, addDays,
  isSameDay, differenceInDays, addYears, isWithinInterval, 
  startOfWeek, endOfWeek, addWeeks, startOfQuarter, endOfQuarter, addQuarters, 
  startOfYear, endOfYear
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { clsx } from 'clsx';
import DobModal from '../components/DobModal';
import Tooltip from '../components/Tooltip';
import BottomNav from '../components/BottomNav';
import DateSelector from '../components/DateSelector';
import GeneralHabitAnalyticsCard from '../components/GeneralHabitAnalyticsCard';
import AllPrayersInsightCard from '../components/AllPrayersInsightCard';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to parse YYYY-MM-DD strings locally without UTC shifting
const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// Color Helper - Added excused color (Lavender/Slate)
const getQualityColor = (val?: number, status?: string) => {
  // Check for excused status first
  if (status === 'EXCUSED') return '#94a3b8'; // Slate-400 (Neutral color for excused)
  
  switch (val) {
    case PrayerQuality.TAKBIRAH: return '#3b82f64D'; // Blue (30% opacity)
    case PrayerQuality.JAMAA: return '#eab308';    // Yellow
    case PrayerQuality.ON_TIME: return '#f97316';  // Orange
    case PrayerQuality.MISSED: return '#ef4444';   // Red
    default: return '#1e293b'; // Slate-800 (Empty)
  }
};

// Rate Color Interpolation Helper (0% -> Red, 100% -> Blue)
const getRateColorStyle = (percentage: number) => {
    if (percentage <= 25) return '#7f1d1d'; // Deep Dark Red
    if (percentage <= 50) return '#ef4444'; // Red
    if (percentage <= 75) return '#eab308'; // Yellow
    return '#3b82f64D'; // Blue (30% opacity)
};

const Analytics: React.FC = () => {
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const t = TRANSLATIONS[preferences.language];
  const locale = preferences.language === 'ar' ? ar : enUS;
  
  const { habits, logs } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDobModalOpen, setIsDobModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHadithInfo, setShowHadithInfo] = useState(false);
  
  // AI Daily Briefing state
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);

  // Fetch AI briefing on mount
  useEffect(() => {
    const fetchBriefing = async () => {
      // Check cache first
      const cached = getCachedBriefing();
      if (cached) {
        setDailyBriefing(cached);
        return;
      }
      
      // Generate new briefing
      if (habits.length > 0 && logs.length > 0) {
        setIsLoadingBriefing(true);
        try {
          const briefing = await generateDailyBriefing(habits, logs, preferences.language);
          setDailyBriefing(briefing);
        } catch (error) {
          console.error('Error fetching briefing:', error);
        } finally {
          setIsLoadingBriefing(false);
        }
      }
    };
    
    fetchBriefing();
  }, [habits.length, logs.length, preferences.language]);

  const handleRefreshBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const briefing = await regenerateBriefing(habits, logs, preferences.language);
      setDailyBriefing(briefing);
      
      // Track AI insight generation for real users
      if (user && !user.isDemo) {
        await logAiInsightGeneration(user.id);
      }
    } catch (error) {
      console.error('Error refreshing briefing:', error);
    } finally {
      setIsLoadingBriefing(false);
    }
  }; 

  // --- Global Score Calculation (Wins vs Losses) ---
  // WIN = DONE for regular habits, TAKBIRAH for prayers
  // LOSS = FAIL for regular habits, non-TAKBIRAH for prayers
  // SKIP is ignored (deprecated)
  // BONUS HABITS (affectsScore === false) are excluded
  const globalStats = useMemo(() => {
    return logs.reduce((acc, log) => {
      const habit = habits.find(h => h.id === log.habitId);
      if (!habit) return acc;
      
      // Skip bonus habits (affectsScore === false)
      if (habit.affectsScore === false) return acc;
      
      // Skip legacy SKIP logs - they don't count
      if (log.status === LogStatus.SKIP) return acc;

      // For prayers: TAKBIRAH = win, anything else = loss
      if (habit.type === HabitType.PRAYER) {
        if (log.value === PrayerQuality.TAKBIRAH) {
          acc.wins += 1;
        } else {
          acc.losses += 1;
        }
      } 
      // For regular habits: DONE = win, FAIL = loss
      else if (habit.type === HabitType.REGULAR) {
        if (log.status === LogStatus.DONE) {
          acc.wins += 1;
        } else if (log.status === LogStatus.FAIL) {
          acc.losses += 1;
        }
      } 
      // For counter habits: met target = win, else loss
      else if (habit.type === HabitType.COUNTER) {
        const target = habit.dailyTarget || 1;
        if (log.value >= target || log.status === LogStatus.DONE) {
          acc.wins += 1;
        } else if (log.status === LogStatus.FAIL) {
          acc.losses += 1;
        }
      }

      return acc;
    }, { wins: 0, losses: 0 });
  }, [logs, habits]);

  const totalAttempts = globalStats.wins + globalStats.losses;
  const globalScoreRate = totalAttempts > 0 
    ? Math.round((globalStats.wins / totalAttempts) * 100) 
    : 0;
  
  const globalRateColor = getRateColorStyle(globalScoreRate);

  // --- Growth Logic (Absolute Takbirah Count Difference) ---
  const calculateGrowth = (habitId: string, intervalType: 'week' | 'month' | 'quarter' | 'year'): number | null => {
    const today = new Date();
    let currStart: Date, currEnd: Date, prevStart: Date, prevEnd: Date;

    if (intervalType === 'week') {
      currStart = startOfWeek(today); currEnd = endOfWeek(today);
      prevStart = startOfWeek(addWeeks(today, -1)); prevEnd = endOfWeek(addWeeks(today, -1));
    } else if (intervalType === 'month') {
      currStart = startOfMonth(today); currEnd = endOfMonth(today);
      prevStart = startOfMonth(addMonths(today, -1)); prevEnd = endOfMonth(addMonths(today, -1));
    } else if (intervalType === 'quarter') {
      currStart = startOfQuarter(today); currEnd = endOfQuarter(today);
      prevStart = startOfQuarter(addQuarters(today, -1)); prevEnd = endOfQuarter(addQuarters(today, -1));
    } else {
      currStart = startOfYear(today); currEnd = endOfYear(today);
      prevStart = startOfYear(addYears(today, -1)); prevEnd = endOfYear(addYears(today, -1));
    }

    // Returns the raw count of Takbirahs (not percentage)
    const getTakbirahCount = (start: Date, end: Date): number | null => {
      const rangeLogs = logs.filter(l => {
        if (l.habitId !== habitId) return false;
        const d = parseLocalISO(l.date);
        return isWithinInterval(d, { start, end });
      });
      if (rangeLogs.length === 0) return null; // No data
      return rangeLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
    };

    const currCount = getTakbirahCount(currStart, currEnd);
    const prevCount = getTakbirahCount(prevStart, prevEnd);

    // Handle edge cases
    if (currCount === null && prevCount === null) return null; // No data at all
    if (currCount === null) return null; // No current data, can't calc growth
    if (prevCount === null) return null; // No previous data to compare against

    return currCount - prevCount; // Simple difference: +1 means 1 more Takbirah
  };

  const renderGrowthCell = (val: number | null) => {
    if (val === null) return <span className="text-gray-700 flex justify-center text-[10px]">--</span>;
    if (val === 0) return <span className="text-gray-500 flex justify-center font-medium text-[10px]">0</span>;
    
    const isPos = val > 0;
    return (
      <div className={clsx("flex items-center justify-center gap-1 font-bold text-xs", isPos ? "text-green-500" : "text-red-500")}>
        {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {isPos ? '+' : ''}{val}
      </div>
    );
  };

  // --- Best Streak Logic (with Excused Day Bridge Support) ---
  const calculateBestStreak = (habitId: string | string[]) => {
    const ids = Array.isArray(habitId) ? habitId : [habitId];
    
    // Filter out bonus habits (affectsScore === false) from streak calculation
    const relevantHabits = habits.filter(h => ids.includes(h.id) && h.affectsScore !== false);
    const relevantHabitIds = relevantHabits.map(h => h.id);
    
    const relevantLogs = logs
        .filter(l => relevantHabitIds.includes(l.habitId))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (relevantLogs.length === 0) return 0;

    let bestStreak = 0;
    let currentStreak = 0;
    
    if (Array.isArray(habitId)) {
        // Aggregated streak for all 5 prayers
        // Group logs by date
        const logsByDate: Record<string, { perfectCount: number, excusedCount: number, logs: HabitLog[] }> = {};
        relevantLogs.forEach(l => {
            if (!logsByDate[l.date]) {
                logsByDate[l.date] = { perfectCount: 0, excusedCount: 0, logs: [] };
            }
            logsByDate[l.date]!.logs.push(l);
            if (l.value === PrayerQuality.TAKBIRAH) {
                logsByDate[l.date]!.perfectCount++;
            }
            if (l.status === LogStatus.EXCUSED) {
                logsByDate[l.date]!.excusedCount++;
            }
        });
        
        // Get all dates sorted
        const allDates = Object.keys(logsByDate).sort();
        if (allDates.length === 0) return 0;
        
        // Calculate streak with bridge logic
        currentStreak = 0; bestStreak = 0;
        
        for (let i = 0; i < allDates.length; i++) {
            const date = allDates[i]!;
            const data = logsByDate[date]!;
            
            if (data.excusedCount === 5) {
                // All 5 prayers excused - bridge day (don't increment, don't break)
                continue;
            } else if (data.perfectCount === 5) {
                // All 5 prayers perfect - count it
                currentStreak++;
                if (currentStreak > bestStreak) bestStreak = currentStreak;
            } else {
                // Not perfect - check if this breaks the streak
                if (i > 0) {
                    const prevDate = allDates[i-1]!;
                    const daysDiff = differenceInDays(parseLocalISO(date), parseLocalISO(prevDate));
                    if (daysDiff > 1) {
                        // Gap in dates - reset streak
                        currentStreak = 0;
                    }
                }
                currentStreak = 0;
            }
        }
        
        return bestStreak;
    } else {
        // Single Habit streak with bridge logic
        const sortedDates = [...new Set(relevantLogs.map(l => l.date))].sort();
        
        currentStreak = 0; bestStreak = 0;
        let lastCountedDate: string | null = null;
        
        for (let i = 0; i < sortedDates.length; i++) {
            const date = sortedDates[i]!;
            const logsForDate = relevantLogs.filter(l => l.date === date);
            const log = logsForDate[0]; // Single habit, should be one log per date
            
            if (!log) continue;
            
            if (log.status === LogStatus.EXCUSED) {
                // Excused - bridge day (don't increment, don't break)
                continue;
            }
            
            if (log.value === PrayerQuality.TAKBIRAH) {
                // Check if consecutive to last counted date (accounting for bridge days)
                if (lastCountedDate) {
                    const daysDiff = differenceInDays(parseLocalISO(date), parseLocalISO(lastCountedDate));
                    
                    // Check if all days between were excused
                    let allBridged = true;
                    for (let d = 1; d < daysDiff; d++) {
                        const checkDate = format(addDays(parseLocalISO(lastCountedDate), d), 'yyyy-MM-dd');
                        const checkLog = relevantLogs.find(l => l.date === checkDate);
                        if (!checkLog || checkLog.status !== LogStatus.EXCUSED) {
                            allBridged = false;
                            break;
                        }
                    }
                    
                    if (daysDiff === 1 || allBridged) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                
                lastCountedDate = date;
                if (currentStreak > bestStreak) bestStreak = currentStreak;
            } else {
                // Failed - reset streak
                currentStreak = 0;
                lastCountedDate = null;
            }
        }
        
        return bestStreak;
    }
  };
  

  // --- Individual Prayer Analytics ---
  const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  // --- Rawatib Prayer IDs (12 Sunnah Muakkadah) ---
  const rawatibIds = [
    'fajr_sunnah',           // 2 before Fajr
    'dhuhr_sunnah_before_1', // 2 before Dhuhr (1st set)
    'dhuhr_sunnah_before_2', // 2 before Dhuhr (2nd set)
    'dhuhr_sunnah_after',    // 2 after Dhuhr
    'maghrib_sunnah',        // 2 after Maghrib
    'isha_sunnah',           // 2 after Isha
  ];

  // --- Top Obstacles Analysis ---
  const obstacleColors = ['#ef4444', '#f97316', '#eab308', '#3b82f64D', '#60a5fa'];
  
  const obstaclesData = useMemo(() => {
    // Helper to extract top 5 reasons from logs
    const extractTopReasons = (filteredLogs: HabitLog[]) => {
      const reasonCounts: Record<string, number> = {};
      filteredLogs.forEach(l => {
        if (l.reason && l.reason.trim()) {
          const reason = l.reason.trim();
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
      });
      
      const total = Object.values(reasonCounts).reduce((sum, c) => sum + c, 0);
      
      return Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count], idx) => ({
          reason,
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          color: obstacleColors[idx] || '#6b7280',
        }));
    };

    // 5KP (Fard) - Non-Takbirah prayers with reasons
    const fardLogs = logs.filter(l => 
      prayerIds.includes(l.habitId) && 
      l.value !== undefined && 
      l.value < PrayerQuality.TAKBIRAH && 
      l.reason && 
      l.reason.trim()
    );
    
    // Rawatib - Failed/not done with reasons
    const rawatibLogs = logs.filter(l => 
      rawatibIds.includes(l.habitId) && 
      l.status !== LogStatus.DONE && 
      l.reason && 
      l.reason.trim()
    );
    
    // Other habits - Failed with reasons
    const otherLogs = logs.filter(l => {
      const habit = habits.find(h => h.id === l.habitId);
      if (!habit) return false;
      return !prayerIds.includes(l.habitId) && 
             !rawatibIds.includes(l.habitId) && 
             l.status === LogStatus.FAIL && 
             l.reason && 
             l.reason.trim();
    });

    return {
      fard: extractTopReasons(fardLogs),
      rawatib: extractTopReasons(rawatibLogs),
      other: extractTopReasons(otherLogs),
      fardTotal: fardLogs.length,
      rawatibTotal: rawatibLogs.length,
      otherTotal: otherLogs.length,
    };
  }, [logs, habits, prayerIds, rawatibIds]);

  const renderPrayerCard = (prayerId: string) => {
    const habit = habits.find(h => h.id === prayerId);
    
    const name = preferences.language === 'ar' ? habit?.nameAr : habit?.name;
    const pLogs = logs.filter(l => l.habitId === prayerId);
    const total = pLogs.length;
    const missed = pLogs.filter(l => l.value === PrayerQuality.MISSED).length;
    const onTime = pLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
    const inGroup = pLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
    const takbirah = pLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
    
    const fullScoreCount = takbirah;
    const fullScoreRate = total > 0 ? Math.round((fullScoreCount / total) * 100) : 0;
    const rateColor = getRateColorStyle(fullScoreRate);
    const bestStreak = calculateBestStreak([prayerId]);

    const data = [
      { name: t.takbirah, value: takbirah, color: '#3b82f64D' },
      { name: t.inGroup, value: inGroup, color: '#eab308' },
      { name: t.onTime, value: onTime, color: '#f97316' },
      { name: t.missed, value: missed, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const emptyData = [{ name: 'Empty', value: 1, color: '#1e293b' }];
    const chartData = data.length > 0 ? data : emptyData;

    return (
      <div key={prayerId} className="bg-card rounded-lg border border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
        <div className="p-3 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1">
                    <h3 className="font-bold text-foreground leading-tight text-xs uppercase tracking-wide text-gray-400">
                        {name}
                    </h3>
                    <Tooltip text={`Analytics for ${name} based on log quality.`} />
                </div>
                {bestStreak > 0 && (
                    <div className="flex items-center gap-1 text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400 border border-orange-500/20">
                        <Trophy size={10} />
                        <span className="font-bold">{bestStreak}</span>
                    </div>
                )}
            </div>
            
            <div className="flex flex-row items-center justify-between gap-1">
                <div className="flex-shrink-0 relative h-14 w-14">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={18} outerRadius={25} paddingAngle={2} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold text-[10px]" style={{ color: rateColor }}>
                            {fullScoreRate}%
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold text-sm" style={{ color: rateColor }}>{fullScoreCount}</span>
                        <span className="text-[10px] text-gray-500">/ {total}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium truncate w-full text-right" style={{ color: rateColor }}>{t.perfectRate}</div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  // --- Monthly View Components ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const emptyDays = Array.from({ length: startDay });

  const getDayLogs = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return prayerIds.map(pid => logs.find(l => l.habitId === pid && l.date === dateStr));
  };

  const ConsolidatedDayRing = ({ date, dayLogs }: { date: Date, dayLogs: (HabitLog | undefined)[] }) => {
    // Check if all prayers for this day are excused
    const allExcused = dayLogs.every(log => log?.status === LogStatus.EXCUSED);
    
    return (
      <div className="relative w-full aspect-square flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full rotate-[-90deg]">
          {dayLogs.map((log, i) => {
            const startAngle = i * 72;
            const endAngle = startAngle + 72 - 5; 
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const radius = 16; const center = 20;
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            const d = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`].join(' ');
            // Pass status to getQualityColor for excused rendering
            return <path key={i} d={d} fill="none" stroke={getQualityColor(log?.value, log?.status)} strokeWidth={4} strokeLinecap="round" />;
          })}
        </svg>
        <span className={clsx(
          "absolute text-xs font-bold", 
          isSameDay(date, new Date()) ? "text-primary" : 
          allExcused ? "text-slate-400" : "text-gray-400"
        )}>
          {format(date, 'd')}
        </span>
      </div>
    );
  };

  // Get Rawatib logs for a specific date
  const getRawatibDayLogs = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return rawatibIds.map(rid => logs.find(l => l.habitId === rid && l.date === dateStr));
  };

  // Rawatib House Component - Creative house shape with 6 segments
  const RawatibHouse = ({ date, dayLogs }: { date: Date, dayLogs: (HabitLog | undefined)[] }) => {
    // Count how many rawatib are completed (DONE status)
    const completedCount = dayLogs.filter(log => log?.status === LogStatus.DONE).length;
    const allCompleted = completedCount === 6;
    
    // House SVG paths - 6 symmetrical segments
    // Viewbox: 0 0 40 40
    // Roof apex: (20, 6), Roof corners: (6, 18) and (34, 18)
    // Wall bottom: (9, 34) and (31, 34)
    const segments = [
      { id: 0, d: 'M 20,6 L 6,18', name: 'roof-left' },      // Fajr Sunnah
      { id: 1, d: 'M 20,6 L 34,18', name: 'roof-right' },    // Isha Sunnah (symmetry)
      { id: 2, d: 'M 6,18 L 9,34', name: 'wall-left' },      // Dhuhr Before 1
      { id: 3, d: 'M 34,18 L 31,34', name: 'wall-right' },   // Dhuhr After (symmetry)
      { id: 4, d: 'M 9,34 L 20,34', name: 'floor-left' },    // Dhuhr Before 2
      { id: 5, d: 'M 20,34 L 31,34', name: 'floor-right' },  // Maghrib Sunnah
    ];
    
    // Mapping: segments array index matches rawatibIds order for intuitive display
    // Reorder for visual symmetry: [0:fajr, 5:isha, 1:dhuhrB1, 3:dhuhrA, 2:dhuhrB2, 4:maghrib]
    const segmentMapping = [0, 5, 1, 3, 2, 4]; // Maps rawatibIds index to segment index
    
    const baseColor = '#1e293b'; // Slate-800 - faded house outline
    const activeColor = '#eab308'; // Yellow - individual segment completed
    const perfectColor = '#3b82f64D'; // Blue (30% opacity) - all 6 completed
    
    return (
      <div className="relative w-full aspect-square flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Base house outline (always visible, faded) */}
          {segments.map((seg) => (
            <path 
              key={`base-${seg.id}`} 
              d={seg.d} 
              fill="none" 
              stroke={baseColor} 
              strokeWidth={2.5} 
              strokeLinecap="round"
            />
          ))}
          
          {/* Active segments based on completed rawatib */}
          {dayLogs.map((log, rawatibIdx) => {
            if (log?.status !== LogStatus.DONE) return null;
            const segmentIdx = segmentMapping[rawatibIdx];
            if (segmentIdx === undefined) return null;
            const seg = segments[segmentIdx];
            if (!seg) return null;
            return (
              <path 
                key={`active-${seg.id}`} 
                d={seg.d} 
                fill="none" 
                stroke={allCompleted ? perfectColor : activeColor}
                strokeWidth={3}
                strokeLinecap="round"
                className={allCompleted ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]' : ''}
              />
            );
          })}
        </svg>
        
        {/* Day number in center */}
        <span className={clsx(
          "absolute text-[10px] font-bold",
          isSameDay(date, new Date()) ? "text-primary" : 
          allCompleted ? "text-emerald-400" : "text-gray-500"
        )}>
          {format(date, 'd')}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header with Verse Image */}
      <div className={clsx(
        "flex items-center justify-between gap-4",
        preferences.language === 'ar' && "flex-row-reverse"
      )}>
        <h1 className="text-2xl font-bold text-white">{t.analytics}</h1>
        <img 
          src="/verse.png" 
          alt="Verse" 
          className="w-auto h-10 opacity-90 p-1"
        />
      </div>

      {/* Global Overview */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
            <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.overallPerformance}</h2>
            <Tooltip text="Aggregated score of all habit logs based on completion quality." />
        </div>
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-800 relative overflow-hidden shadow-md">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           {/* Overall Performance: Wins / Total with losses count */}
           <div className="flex justify-between items-center relative z-10">
             <div>
               <p className="text-gray-400 text-sm mb-1">{preferences.language === 'ar' ? 'الإنجازات' : 'Wins'}</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-emerald-500">{globalStats.wins}</span>
                 <span className="text-lg text-gray-500">/ {totalAttempts}</span>
               </div>
               <p className="text-xs text-gray-500 mt-1">
                 <span className="text-red-400">{globalStats.losses}</span> {preferences.language === 'ar' ? 'خسائر' : 'losses'}
               </p>
             </div>
             <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 relative" style={{ borderColor: `${globalRateColor}4D` }}>
               <span className="text-xl font-bold" style={{ color: globalRateColor }}>{globalScoreRate}%</span>
               <div className="absolute inset-0 border-4 rounded-full opacity-100" style={{ borderColor: globalRateColor, clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, transform: `rotate(${(globalScoreRate/100)*360}deg)` }}></div>
             </div>
           </div>
        </div>
        {/* AI General Insight Card */}
        <AnimatePresence mode="wait">
          {isLoadingBriefing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-blue-950/80 to-slate-900/90 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-blue-500/20 rounded animate-pulse w-32" />
                  <div className="h-3 bg-blue-500/10 rounded animate-pulse w-full" />
                  <div className="h-3 bg-blue-500/10 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-blue-500/10 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </motion.div>
          ) : dailyBriefing?.analytics_insight ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-blue-950/80 to-slate-900/90 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg shadow-blue-500/5"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-blue-500/20 bg-blue-500/10">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-400" />
                  <span className="text-sm font-bold text-blue-300">
                    {preferences.language === 'ar' ? 'التحليل الذكي' : 'AI Insight'}
                  </span>
                </div>
                <button
                  onClick={handleRefreshBriefing}
                  disabled={isLoadingBriefing}
                  className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                >
                  {isLoadingBriefing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  {preferences.language === 'ar' ? 'تحديث' : 'Refresh'}
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-white/90 leading-relaxed">
                  {dailyBriefing.analytics_insight}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Prayers Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
          {preferences.language === 'ar' ? 'تحليل الصلوات' : 'Prayers Breakdown'}
        </h2>
        {/* Enhanced All Prayers Insight Card */}
        <div className="w-full">
          <AllPrayersInsightCard
            logs={logs}
            language={preferences.language}
            dateOfBirth={preferences.dateOfBirth}
            onDobClick={() => setIsDobModalOpen(true)}
          />
        </div>
        {/* Individual Prayer Cards */}
        <div className="grid grid-cols-2 gap-2">{prayerIds.map(id => renderPrayerCard(id))}</div>
        
        {/* 5 Prayers AI Focus Card */}
        {dailyBriefing?.five_prayers_focus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-950/60 to-orange-950/40 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 shadow-lg shadow-amber-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider mb-1">
                  {preferences.language === 'ar' ? 'تركيز الصلوات الخمس' : '5 Prayers Focus'}
                </p>
                <p className="text-sm text-white/90 leading-relaxed">
                  {dailyBriefing.five_prayers_focus}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Top Prayer Streaks */}
      <div className="space-y-3">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-2">
          <Trophy size={14} className="text-orange-500" />
          {preferences.language === 'ar' ? 'أطول تتابعات الصلوات' : 'Prayer Streaks'}
        </h2>
        <div className="bg-card rounded-xl border border-slate-800 overflow-hidden">
          {(() => {
            // Calculate "All Prayers Perfect" streak (all 5 prayers at TAKBIRAH level)
            const allPrayersPerfectStreak = calculateBestStreak(prayerIds);
            
            // Calculate best streaks for individual prayers
            const prayerStreaks = habits
              .filter(h => h.isActive && h.type === HabitType.PRAYER)
              .map(h => ({
                id: h.id,
                name: preferences.language === 'ar' ? h.nameAr : h.name,
                type: h.type,
                streak: calculateBestStreak(h.id),
              }))
              .filter(s => s.streak > 0)
              .sort((a, b) => b.streak - a.streak)
              .slice(0, 5);

            return (
              <div className="divide-y divide-slate-800">
                {/* All Prayers Perfect Streak - ALWAYS SHOWN at top with special styling */}
                <div className="relative overflow-hidden">
                  {/* Animated gradient background */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981)',
                      backgroundSize: '200% 100%',
                      animation: 'gradientShift 4s ease infinite',
                    }}
                  />
                  <style>{`
                    @keyframes gradientShift {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                  `}</style>
                  
                  <div className="relative flex items-center gap-3 p-4">
                    {/* Animated checkmark badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-base font-bold text-white truncate">
                          {preferences.language === 'ar' ? 'مؤشر البراءة' : 'Innocence Index'}
                        </p>
                        <button 
                          onClick={() => setShowHadithInfo(true)}
                          className="p-1 text-emerald-300/70 hover:text-emerald-300 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-300/80">
                        {preferences.language === 'ar' ? 'الخمس صلوات بتكبيرة الإحرام' : 'All 5 prayers at Takbirah level'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                      <span className="text-white font-bold text-lg">{allPrayersPerfectStreak}</span>
                      <span className="text-[11px] text-white/70">
                        {preferences.language === 'ar' ? 'يوم' : 'days'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Hadith Info Modal */}
                  <AnimatePresence>
                    {showHadithInfo && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                          onClick={() => setShowHadithInfo(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="fixed inset-x-4 top-1/4 z-[9999] max-w-lg mx-auto"
                        >
                          <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 shadow-2xl">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Info size={20} className="text-emerald-400" />
                              </div>
                              <button
                                onClick={() => setShowHadithInfo(false)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-3">
                              {preferences.language === 'ar' ? 'حديث البراءتين' : 'Hadith of the Two Immunities'}
                            </h3>
                            
                            <div className={clsx(
                              "text-sm leading-relaxed mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700",
                              preferences.language === 'ar' ? "text-right font-arabic" : "text-left"
                            )}>
                              {preferences.language === 'ar' ? (
                                <p className="text-white/90">
                                  «مَن صَلَّى لِلَّهِ أَرْبَعِينَ يَوْمًا فِي جَمَاعَةٍ يُدْرِكُ التَّكْبِيرَةَ الأُولَى، كُتِبَتْ لَهُ بَرَاءَتَانِ: بَرَاءَةٌ مِنَ النَّارِ، وَبَرَاءَةٌ مِنَ النِّفَاقِ»
                                </p>
                              ) : (
                                <p className="text-white/90">
                                  "Whoever prays to Allah for forty days in congregation, catching the first takbir, two immunities will be written for him: immunity from the Fire and immunity from hypocrisy."
                                </p>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-400">
                              {preferences.language === 'ar' 
                                ? 'رواه الترمذي عن أنس بن مالك رضي الله عنه'
                                : 'Narrated by Anas ibn Malik (RA) - Sunan al-Tirmidhi'
                              }
                            </p>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Individual Prayer Streaks */}
                {prayerStreaks.length > 0 ? (
                  prayerStreaks.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-900/50 transition-colors">
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                        idx === 0 ? "bg-amber-500/20 text-amber-400" :
                        idx === 1 ? "bg-gray-400/20 text-gray-300" :
                        idx === 2 ? "bg-orange-700/20 text-orange-500" :
                        "bg-slate-800 text-gray-500"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">
                          {preferences.language === 'ar' ? 'صلاة' : 'Prayer'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                        <span className="text-orange-400 font-bold">{s.streak}</span>
                        <span className="text-[10px] text-orange-400/70">
                          {preferences.language === 'ar' ? 'يوم' : 'days'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500">
                      {preferences.language === 'ar' ? 'لا توجد تتابعات فردية بعد' : 'No individual streaks yet'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Growth Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
            <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.growth}</h2>
            <Tooltip text={preferences.language === 'ar' 
              ? "يُظهر عدد التكبيرات الإضافية (أو الأقل) مقارنة بالفترة السابقة. مثال: إذا حققت 6 تكبيرات في الأسبوع الأول و7 في الأسبوع الثاني، يُعرض +1. الرقم الموجب يعني تحسن، والسالب يعني تراجع."
              : "Shows how many more (or fewer) Takbirahs you achieved vs. the previous period. Example: 6 Takbirahs in Week 1, 7 in Week 2 = +1. Positive = improvement, negative = decline."
            } />
        </div>
        <div className="bg-card rounded-lg border border-slate-800 overflow-hidden">
           <div className="grid grid-cols-5 bg-slate-900/50 border-b border-slate-800 p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
             <div className="text-start">Prayer</div>
             <div>{t.wow}</div><div>{t.mom}</div><div>{t.qoq}</div><div>{t.yoy}</div>
           </div>
           {prayerIds.map(id => {
             const habit = habits.find(h => h.id === id);
             if (!habit || !habit.isActive) return null;
             return (
               <div key={id} className="grid grid-cols-5 border-b border-slate-800 last:border-0 p-3 items-center text-center">
                  <div className="text-start font-medium text-xs text-foreground flex items-center gap-1 truncate">{preferences.language === 'ar' ? habit.nameAr : habit.name}</div>
                  <div>{renderGrowthCell(calculateGrowth(id, 'week'))}</div>
                  <div>{renderGrowthCell(calculateGrowth(id, 'month'))}</div>
                  <div>{renderGrowthCell(calculateGrowth(id, 'quarter'))}</div>
                  <div>{renderGrowthCell(calculateGrowth(id, 'year'))}</div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Prayers Monthly View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.prayersMonthlyView}</h2>
           <div className="flex items-center gap-2 bg-card rounded-md p-1 border border-slate-800">
             <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={16} /></button>
             <span className="text-xs font-bold min-w-[80px] text-center">{format(currentMonth, 'MMMM yyyy', { locale })}</span>
             <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
           </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-slate-800 shadow-sm">
           <div className="grid grid-cols-7 mb-2">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d.charAt(0)}</div>)}
           </div>
           <div className="grid grid-cols-7 gap-y-2 gap-x-1">
             {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
             {daysInMonth.map((date) => (
                  <div key={date.toISOString()} className="flex justify-center"><div className="w-full max-w-[45px]"><ConsolidatedDayRing date={date} dayLogs={getDayLogs(date)} /></div></div>
             ))}
           </div>
        </div>
      </div>

      {/* Rawatib AI Focus Card */}
      {dailyBriefing?.rawatib_focus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-950/60 to-indigo-950/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 shadow-lg shadow-purple-500/5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Brain size={16} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-purple-400/70 font-semibold uppercase tracking-wider mb-1">
                {preferences.language === 'ar' ? 'تركيز الرواتب' : 'Rawatib Focus'}
              </p>
              <p className="text-sm text-white/90 leading-relaxed">
                {dailyBriefing.rawatib_focus}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rawatib Prayers Monthly View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.rawatibMonthlyView}</h2>
           <div className="flex items-center gap-2 bg-card rounded-md p-1 border border-slate-800">
             <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1 text-gray-400 hover:text-white"><ChevronLeft size={16} /></button>
             <span className="text-xs font-bold min-w-[80px] text-center">{format(currentMonth, 'MMMM yyyy', { locale })}</span>
             <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
           </div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-slate-800 shadow-sm">
           {/* Legend */}
           <div className="flex items-center justify-center gap-4 mb-3 text-[10px]">
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700"></div>
               <span className="text-gray-500">{preferences.language === 'ar' ? 'لم يتم' : 'Pending'}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
               <span className="text-gray-500">{preferences.language === 'ar' ? 'جزئي' : 'Partial'}</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
               <span className="text-gray-500">{preferences.language === 'ar' ? 'كامل' : 'Complete'}</span>
             </div>
           </div>
           <div className="grid grid-cols-7 mb-2">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d.charAt(0)}</div>)}
           </div>
           <div className="grid grid-cols-7 gap-y-2 gap-x-1">
             {emptyDays.map((_, i) => <div key={`empty-rawatib-${i}`} />)}
             {daysInMonth.map((date) => (
                  <div key={`rawatib-${date.toISOString()}`} className="flex justify-center">
                    <div className="w-full max-w-[45px]">
                      <RawatibHouse date={date} dayLogs={getRawatibDayLogs(date)} />
                    </div>
                  </div>
             ))}
           </div>
        </div>
      </div>

      {/* Top Obstacles Card - 3 Column Layout */}
      <div className="space-y-4">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
          {preferences.language === 'ar' ? 'أهم العوائق' : 'Top Obstacles'}
        </h2>
        <div className="bg-card rounded-xl border border-red-500/20 bg-gradient-to-br from-slate-900/90 to-red-950/20 shadow-lg overflow-hidden p-4">
          <div className="grid grid-cols-3 gap-3" dir="ltr">
            {/* Column 1: 5 Fard Prayers */}
            <div className="flex flex-col items-center">
              <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-2 text-center">
                {preferences.language === 'ar' ? 'الصلوات الخمس' : '5 Fard'}
              </h3>
              {obstaclesData.fard.length > 0 ? (
                <>
                  <div className="relative h-20 w-20 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={obstaclesData.fard.map(d => ({ name: d.reason, value: d.count, color: d.color }))} 
                          cx="50%" cy="50%" innerRadius={22} outerRadius={32} paddingAngle={2} dataKey="value" stroke="none"
                        >
                          {obstaclesData.fard.map((entry, index) => (
                            <Cell key={`fard-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{obstaclesData.fardTotal}</span>
                    </div>
                  </div>
                  <div className="space-y-1 w-full">
                    {obstaclesData.fard.slice(0, 5).map((item) => (
                      <div key={`fard-${item.reason}`} className="flex items-center gap-1.5 text-[9px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-400 truncate flex-1">{item.reason}</span>
                        <span className="font-bold shrink-0" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <AlertTriangle size={16} className="mx-auto mb-1 opacity-50" />
                  <p className="text-[9px]">{preferences.language === 'ar' ? 'لا توجد' : 'None'}</p>
                </div>
              )}
            </div>

            {/* Column 2: Rawatib */}
            <div className="flex flex-col items-center border-x border-slate-800/50 px-2">
              <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-wide mb-2 text-center">
                {preferences.language === 'ar' ? 'الرواتب' : 'Rawatib'}
              </h3>
              {obstaclesData.rawatib.length > 0 ? (
                <>
                  <div className="relative h-20 w-20 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={obstaclesData.rawatib.map(d => ({ name: d.reason, value: d.count, color: d.color }))} 
                          cx="50%" cy="50%" innerRadius={22} outerRadius={32} paddingAngle={2} dataKey="value" stroke="none"
                        >
                          {obstaclesData.rawatib.map((entry, index) => (
                            <Cell key={`rawatib-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{obstaclesData.rawatibTotal}</span>
                    </div>
                  </div>
                  <div className="space-y-1 w-full">
                    {obstaclesData.rawatib.slice(0, 5).map((item) => (
                      <div key={`rawatib-${item.reason}`} className="flex items-center gap-1.5 text-[9px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-400 truncate flex-1">{item.reason}</span>
                        <span className="font-bold shrink-0" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <AlertTriangle size={16} className="mx-auto mb-1 opacity-50" />
                  <p className="text-[9px]">{preferences.language === 'ar' ? 'لا توجد' : 'None'}</p>
                </div>
              )}
            </div>

            {/* Column 3: Other Habits */}
            <div className="flex flex-col items-center">
              <h3 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide mb-2 text-center">
                {preferences.language === 'ar' ? 'العادات' : 'Habits'}
              </h3>
              {obstaclesData.other.length > 0 ? (
                <>
                  <div className="relative h-20 w-20 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={obstaclesData.other.map(d => ({ name: d.reason, value: d.count, color: d.color }))} 
                          cx="50%" cy="50%" innerRadius={22} outerRadius={32} paddingAngle={2} dataKey="value" stroke="none"
                        >
                          {obstaclesData.other.map((entry, index) => (
                            <Cell key={`other-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{obstaclesData.otherTotal}</span>
                    </div>
                  </div>
                  <div className="space-y-1 w-full">
                    {obstaclesData.other.slice(0, 5).map((item) => (
                      <div key={`other-${item.reason}`} className="flex items-center gap-1.5 text-[9px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-400 truncate flex-1">{item.reason}</span>
                        <span className="font-bold shrink-0" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-600">
                  <AlertTriangle size={16} className="mx-auto mb-1 opacity-50" />
                  <p className="text-[9px]">{preferences.language === 'ar' ? 'لا توجد' : 'None'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Habits Analytics Cards */}
      {habits.filter(h => h.isActive && h.type !== HabitType.PRAYER && h.presetId !== 'rawatib').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
            {preferences.language === 'ar' ? 'تحليلات العادات' : 'Habits Analytics'}
          </h2>
          <div className="space-y-4">
            {habits
              .filter(h => h.isActive && h.type !== HabitType.PRAYER && h.presetId !== 'rawatib')
              .sort((a, b) => a.order - b.order)
              .map(habit => (
                <GeneralHabitAnalyticsCard 
                  key={habit.id} 
                  habit={habit} 
                  logs={logs} 
                  language={preferences.language} 
                />
              ))
            }
          </div>
        </div>
      )}

      <DobModal isOpen={isDobModalOpen} onClose={() => setIsDobModalOpen(false)} />

      <BottomNav>
        <DateSelector 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
          completedDates={[]}
          loggedDates={[]}
        />
      </BottomNav>
    </div>
  );
};

export default Analytics;
