import React, { useState, useMemo } from 'react';
import { usePreferences } from '../App';
import { TRANSLATIONS } from '../../constants';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, ChevronLeft, ChevronRight, Hourglass, ArrowUpRight, ArrowDownRight, Trophy, AlertTriangle } from 'lucide-react';
import { HabitType, PrayerQuality, LogStatus, HabitLog } from '../../types';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, 
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

// Helper to parse YYYY-MM-DD strings locally without UTC shifting
const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// Color Helper
const getQualityColor = (val?: number) => {
  switch (val) {
    case PrayerQuality.TAKBIRAH: return '#22c55e'; // Green
    case PrayerQuality.JAMAA: return '#eab308';    // Yellow
    case PrayerQuality.ON_TIME: return '#f97316';  // Orange
    case PrayerQuality.MISSED: return '#ef4444';   // Red
    default: return '#1e293b'; // Slate-800 (Empty)
  }
};

// Rate Color Interpolation Helper (0% -> Red, 100% -> Green)
const getRateColorStyle = (percentage: number) => {
    if (percentage <= 25) return '#7f1d1d'; // Deep Dark Red
    if (percentage <= 50) return '#ef4444'; // Red
    if (percentage <= 75) return '#eab308'; // Yellow
    return '#22c55e'; // Bright Green
};

const Analytics: React.FC = () => {
  const { preferences } = usePreferences();
  const t = TRANSLATIONS[preferences.language];
  const locale = preferences.language === 'ar' ? ar : enUS;
  
  const { habits, logs } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDobModalOpen, setIsDobModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeHabitCount = habits.filter(h => h.isActive).length;
  
  // Simple current streak for overview (Placeholder or calculated)
  const streak = 12; 

  // Calculate Countdown
  const calculateRemainingChances = () => {
      if (!preferences.dateOfBirth) return null;
      try {
        const dob = parseLocalISO(preferences.dateOfBirth);
        const targetDate = addYears(dob, 75);
        const today = new Date();
        const diff = differenceInDays(targetDate, today);
        return Math.max(0, diff); // Ensure non-negative
      } catch (e) {
          return null;
      }
  };

  const remainingChances = calculateRemainingChances();

  // --- Global Score Calculation ---
  const globalStats = useMemo(() => {
    return logs.reduce((acc, log) => {
      const habit = habits.find(h => h.id === log.habitId);
      if (!habit) return acc;

      acc.totalLogs += 1;

      let isPerfect = false;
      if (habit.type === HabitType.PRAYER) {
        if (log.value === PrayerQuality.TAKBIRAH) isPerfect = true;
      } else if (habit.type === HabitType.REGULAR) {
        if (log.status === LogStatus.DONE) isPerfect = true;
      } else if (habit.type === HabitType.COUNTER) {
        const target = habit.dailyTarget || 1;
        if (log.value >= target || log.status === LogStatus.DONE) isPerfect = true;
      }

      if (isPerfect) acc.perfectLogs += 1;
      return acc;
    }, { totalLogs: 0, perfectLogs: 0 });
  }, [logs, habits]);

  const globalScoreRate = globalStats.totalLogs > 0 
    ? Math.round((globalStats.perfectLogs / globalStats.totalLogs) * 100) 
    : 0;
  
  const globalRateColor = getRateColorStyle(globalScoreRate);

  // --- Growth Rate Logic ---
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

    const getRateAndCount = (start: Date, end: Date) => {
      const rangeLogs = logs.filter(l => {
        if (l.habitId !== habitId) return false;
        const d = parseLocalISO(l.date);
        return isWithinInterval(d, { start, end });
      });
      if (rangeLogs.length === 0) return null; // No data
      const perfectCount = rangeLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
      return (perfectCount / rangeLogs.length) * 100;
    };

    const currRate = getRateAndCount(currStart, currEnd);
    const prevRate = getRateAndCount(prevStart, prevEnd);

    // Handle edge cases
    if (currRate === null && prevRate === null) return null; // No data at all
    if (currRate === null) return null; // No current data, can't calc growth
    if (prevRate === null) return null; // No previous data to compare against

    return Math.round(currRate - prevRate);
  };

  const renderGrowthCell = (val: number | null) => {
    if (val === null) return <span className="text-gray-700 flex justify-center text-[10px]">--</span>;
    if (val === 0) return <span className="text-gray-500 flex justify-center font-medium text-[10px]">0%</span>;
    
    const isPos = val > 0;
    return (
      <div className={clsx("flex items-center justify-center gap-1 font-bold text-xs", isPos ? "text-green-500" : "text-red-500")}>
        {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(val)}%
      </div>
    );
  };

  // --- Best Streak Logic ---
  const calculateBestStreak = (habitId: string | string[]) => {
    const ids = Array.isArray(habitId) ? habitId : [habitId];
    const relevantLogs = logs
        .filter(l => ids.includes(l.habitId))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (relevantLogs.length === 0) return 0;

    let bestStreak = 0;
    let currentStreak = 0;
    
    if (Array.isArray(habitId)) {
        // Simplified aggregated streak
        const logsByDate: Record<string, number> = {};
        relevantLogs.forEach(l => {
            if (l.value === PrayerQuality.TAKBIRAH) {
                logsByDate[l.date] = (logsByDate[l.date] || 0) + 1;
            }
        });
        const dates = Object.keys(logsByDate).sort().filter(d => logsByDate[d] === 5);
        
        if (dates.length === 0) return 0;
        currentStreak = 1; bestStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const prev = parseLocalISO(dates[i-1]!);
            const curr = parseLocalISO(dates[i]!);
            if (differenceInDays(curr, prev) === 1) currentStreak++;
            else currentStreak = 1;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
        }
        return bestStreak;
    } else {
        // Single Habit
        const perfectDates = relevantLogs
            .filter(l => l.value === PrayerQuality.TAKBIRAH)
            .map(l => l.date);

        if (perfectDates.length === 0) return 0;
        currentStreak = 1; bestStreak = 1;

        for (let i = 1; i < perfectDates.length; i++) {
            const prev = parseLocalISO(perfectDates[i-1]!);
            const curr = parseLocalISO(perfectDates[i]!);
            if (differenceInDays(curr, prev) === 1) currentStreak++;
            else currentStreak = 1;
            if (currentStreak > bestStreak) bestStreak = currentStreak;
        }
        return bestStreak;
    }
  };

  // --- Individual Prayer Analytics ---
  const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  // --- Enhanced All Prayers Insight Card ---
  const renderAllPrayersInsightCard = () => {
    const pLogs = logs.filter(l => prayerIds.includes(l.habitId));
    const total = pLogs.length;
    const missed = pLogs.filter(l => l.value === PrayerQuality.MISSED).length;
    const onTime = pLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
    const inGroup = pLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
    const takbirah = pLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
    
    const fullScoreRate = total > 0 ? Math.round((takbirah / total) * 100) : 0;
    const rateColor = getRateColorStyle(fullScoreRate);
    const bestStreak = calculateBestStreak(prayerIds);

    // Calculate percentages for quality breakdown
    const takbirahPct = total > 0 ? Math.round((takbirah / total) * 100) : 0;
    const inGroupPct = total > 0 ? Math.round((inGroup / total) * 100) : 0;
    const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const missedPct = total > 0 ? Math.round((missed / total) * 100) : 0;

    const qualityBreakdown = [
      { label: preferences.language === 'ar' ? 'تكبيرة الإحرام' : 'Takbirah', pct: takbirahPct, color: '#22c55e' },
      { label: preferences.language === 'ar' ? 'جماعة' : 'In Group', pct: inGroupPct, color: '#eab308' },
      { label: preferences.language === 'ar' ? 'في الوقت' : 'On Time', pct: onTimePct, color: '#f97316' },
      { label: preferences.language === 'ar' ? 'فائتة' : 'Missed', pct: missedPct, color: '#ef4444' },
    ];

    // --- Top Obstacles Analysis ---
    // Filter logs where quality is not perfect (< TAKBIRAH) AND has a reason
    const problematicLogs = pLogs.filter(l => 
      l.value !== undefined && 
      l.value < PrayerQuality.TAKBIRAH && 
      l.reason && 
      l.reason.trim() !== ''
    );

    // Group by reason and count frequency
    const reasonCounts: Record<string, number> = {};
    problematicLogs.forEach(l => {
      const reason = l.reason!.trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Sort by count and get top 3
    const topObstacles = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        reason,
        count,
        pct: problematicLogs.length > 0 ? Math.round((count / problematicLogs.length) * 100) : 0
      }));

    const chartData = [
      { name: t.takbirah, value: takbirah, color: '#22c55e' },
      { name: t.inGroup, value: inGroup, color: '#eab308' },
      { name: t.onTime, value: onTime, color: '#f97316' },
      { name: t.missed, value: missed, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const emptyData = [{ name: 'Empty', value: 1, color: '#1e293b' }];
    const finalChartData = chartData.length > 0 ? chartData : emptyData;

    return (
      <div className="bg-card rounded-xl border border-primary/30 bg-slate-900/80 shadow-lg overflow-hidden">
        {/* Chances Left Header */}
        <button 
          onClick={() => setIsDobModalOpen(true)}
          className="w-full bg-slate-900/50 border-b border-slate-800 py-2 px-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Hourglass size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{t.chancesLeft}</span>
          </div>
          <span className={clsx("text-xs font-mono font-bold", remainingChances !== null ? "text-primary" : "text-gray-500")}>
            {remainingChances !== null ? `${remainingChances.toLocaleString()} ${preferences.language === 'ar' ? 'يوم' : 'days'}` : t.setDob}
          </span>
        </button>

        <div className="p-4">
          {/* Title Row */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{t.allPrayers}</h3>
              <Tooltip text={preferences.language === 'ar' ? 'تحليل شامل لجميع الصلوات الخمس' : 'Comprehensive analysis of all 5 daily prayers'} />
            </div>
            {bestStreak > 0 && (
              <div className="flex items-center gap-1 text-xs bg-orange-500/10 px-2 py-1 rounded-lg text-orange-400 border border-orange-500/20">
                <Trophy size={12} />
                <span className="font-bold">{bestStreak}</span>
              </div>
            )}
          </div>

          {/* Main Content: Split View */}
          <div className="flex gap-4" dir="ltr">
            {/* Left Side: Ring Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-24 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={finalChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={42} paddingAngle={2} dataKey="value" stroke="none">
                      {finalChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: rateColor }}>{fullScoreRate}%</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-xl font-bold" style={{ color: rateColor }}>{takbirah}</span>
                <span className="text-xs text-gray-500">/ {total}</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5">{t.perfectRate}</span>
            </div>

            {/* Right Side: Breakdown & Obstacles */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Quality Breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  {preferences.language === 'ar' ? 'توزيع الجودة' : 'Quality Breakdown'}
                </h4>
                <div className="flex flex-col gap-1">
                  {qualityBreakdown.map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-400 flex-1">{item.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-700/50" />

              {/* Top Obstacles */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <AlertTriangle size={10} className="text-amber-500" />
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    {preferences.language === 'ar' ? 'أهم العوائق' : 'Top Obstacles'}
                  </h4>
                </div>
                {topObstacles.length > 0 ? (
                  <div className="space-y-1">
                    {topObstacles.map((obs, idx) => (
                      <div key={obs.reason} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 text-[10px] font-mono">{idx + 1}.</span>
                        <span className="text-gray-300 truncate flex-1">{obs.reason}</span>
                        <span className="text-amber-500/80 font-semibold text-[10px]">{obs.pct}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-600 italic">
                    {preferences.language === 'ar' ? 'لا توجد عوائق مسجلة بعد' : 'No obstacles logged yet'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      { name: t.takbirah, value: takbirah, color: '#22c55e' },
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
            return <path key={i} d={d} fill="none" stroke={getQualityColor(log?.value)} strokeWidth={4} strokeLinecap="round" />;
          })}
        </svg>
        <span className={clsx("absolute text-xs font-bold", isSameDay(date, new Date()) ? "text-primary" : "text-gray-400")}>
          {format(date, 'd')}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-4">{t.analytics}</h1>

      {/* Global Overview */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
            <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.overallPerformance}</h2>
            <Tooltip text="Aggregated score of all habit logs based on completion quality." />
        </div>
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-800 relative overflow-hidden shadow-md">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="flex justify-between items-center relative z-10">
             <div>
               <p className="text-gray-400 text-sm mb-1">{t.perfectLogs}</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-white">{globalStats.perfectLogs}</span>
                 <span className="text-lg text-gray-500">/ {globalStats.totalLogs}</span>
               </div>
             </div>
             <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 relative" style={{ borderColor: `${globalRateColor}4D` }}>
               <span className="text-xl font-bold" style={{ color: globalRateColor }}>{globalScoreRate}%</span>
               <div className="absolute inset-0 border-4 rounded-full opacity-100" style={{ borderColor: globalRateColor, clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, transform: `rotate(${(globalScoreRate/100)*360}deg)` }}></div>
             </div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-3 rounded-lg border border-slate-800 flex flex-col justify-center items-center text-center shadow-sm">
            <div className="flex items-center gap-2 text-blue-400 mb-1"><Activity size={14} /> <span className="text-xl font-bold text-white">{activeHabitCount}</span></div>
            <span className="text-[10px] text-gray-400 uppercase">{t.activeHabits}</span>
          </div>
          <div className="bg-card p-3 rounded-lg border border-slate-800 flex flex-col justify-center items-center text-center shadow-sm">
            <div className="flex items-center gap-2 text-orange-400 mb-1"><TrendingUp size={14} /> <span className="text-xl font-bold text-white">{streak} days</span></div>
            <span className="text-[10px] text-gray-400 uppercase">{t.streak}</span>
          </div>
        </div>
      </div>

      {/* Prayers Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
          {preferences.language === 'ar' ? 'تحليل الصلوات' : 'Prayers Breakdown'}
        </h2>
        {/* Enhanced All Prayers Insight Card */}
        <div className="w-full">{renderAllPrayersInsightCard()}</div>
        {/* Individual Prayer Cards */}
        <div className="grid grid-cols-2 gap-2">{prayerIds.map(id => renderPrayerCard(id))}</div>
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
                      <p className="text-base font-bold text-white truncate">
                        {preferences.language === 'ar' ? 'جميع الصلوات كاملة' : 'All Prayers Perfect'}
                      </p>
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
            <Tooltip text="Percentage point change in perfect logs over time periods." />
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

      {/* Monthly View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{t.monthlyView}</h2>
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
