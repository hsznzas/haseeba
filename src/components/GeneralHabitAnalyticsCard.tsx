import React, { useMemo } from 'react';
import { Habit, HabitLog, LogStatus } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { X, Flame, TrendingDown, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { ICON_MAP, IconName } from '../utils/iconMap';
import { INITIAL_HABITS } from '../../constants';

interface GeneralHabitAnalyticsCardProps {
  habit: Habit;
  logs: HabitLog[];
  language: 'en' | 'ar';
}

// Helper to parse YYYY-MM-DD strings locally without UTC shifting
const parseLocalISO = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const GeneralHabitAnalyticsCard: React.FC<GeneralHabitAnalyticsCardProps> = ({ habit, logs, language }) => {
  const locale = language === 'ar' ? ar : enUS;
  const isArabic = language === 'ar';
  
  // Filter logs for this habit only
  const habitLogs = useMemo(() => logs.filter(l => l.habitId === habit.id), [logs, habit.id]);
  
  // Get habit color
  const habitColor = useMemo(() => {
    return habit.color || INITIAL_HABITS.find(h => h.id === habit.id)?.color || '#10b981';
  }, [habit]);
  
  // Get habit icon
  const HabitIcon = useMemo(() => {
    const iconName = habit.icon || INITIAL_HABITS.find(h => h.id === habit.id)?.icon;
    if (iconName && ICON_MAP[iconName as IconName]) {
      return ICON_MAP[iconName as IconName];
    }
    return ICON_MAP.Activity;
  }, [habit]);

  // Get quarter months (current + 2 previous)
  const quarterMonths = useMemo(() => {
    const now = new Date();
    return [
      addMonths(now, -2),
      addMonths(now, -1),
      now
    ];
  }, []);

  // Get log for a specific date
  const getLogForDate = (date: Date): HabitLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habitLogs.find(l => l.date === dateStr);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const sortedLogs = [...habitLogs].sort((a, b) => a.date.localeCompare(b.date));
    
    // Count totals
    const totalDone = habitLogs.filter(l => l.status === LogStatus.DONE).length;
    const totalFails = habitLogs.filter(l => l.status === LogStatus.FAIL).length;
    
    // Calculate best streak (consecutive DONE days)
    let bestStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    
    const doneLogs = sortedLogs.filter(l => l.status === LogStatus.DONE);
    doneLogs.forEach(log => {
      const logDate = parseLocalISO(log.date);
      if (prevDate) {
        const dayDiff = Math.round((logDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      prevDate = logDate;
    });
    
    // Calculate worst fail streak (consecutive FAIL days)
    let worstFailStreak = 0;
    let currentFailStreak = 0;
    prevDate = null;
    
    const failLogs = sortedLogs.filter(l => l.status === LogStatus.FAIL);
    failLogs.forEach(log => {
      const logDate = parseLocalISO(log.date);
      if (prevDate) {
        const dayDiff = Math.round((logDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentFailStreak++;
        } else {
          currentFailStreak = 1;
        }
      } else {
        currentFailStreak = 1;
      }
      worstFailStreak = Math.max(worstFailStreak, currentFailStreak);
      prevDate = logDate;
    });
    
    // Top 3 reasons for failures
    const reasonCounts: Record<string, number> = {};
    failLogs.forEach(log => {
      if (log.reason) {
        reasonCounts[log.reason] = (reasonCounts[log.reason] || 0) + 1;
      }
    });
    
    const topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));
    
    return {
      totalDone,
      totalFails,
      bestStreak,
      worstFailStreak,
      topReasons
    };
  }, [habitLogs]);

  // Render a single month calendar
  const renderMonthCalendar = (monthDate: Date, monthIndex: number) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    
    // Calculate empty days at start (to align with day of week)
    const startDayOfWeek = getDay(start);
    const emptyDays = Array(startDayOfWeek).fill(null);
    
    return (
      <div key={monthIndex} className="flex-1">
        {/* Month label */}
        <p className="text-[9px] text-gray-500 text-center mb-1 font-medium uppercase tracking-wider">
          {format(monthDate, 'MMM', { locale })}
        </p>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${monthIndex}-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const log = getLogForDate(day);
            const isDone = log?.status === LogStatus.DONE;
            const isFail = log?.status === LogStatus.FAIL;
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  "aspect-square rounded-sm flex items-center justify-center",
                  // All unlogged days (past and future) look the same
                  !isDone && !isFail && "bg-slate-800/50",
                  // Done days get the habit color
                  isDone && "shadow-sm",
                  // Today highlight
                  isToday && "ring-1 ring-primary/60"
                )}
                style={isDone ? { backgroundColor: habitColor } : undefined}
              >
                {isFail && (
                  <X className="w-full h-full p-[1px]" style={{ color: habitColor }} strokeWidth={2.5} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${habitColor}20` }}
        >
          <HabitIcon size={20} style={{ color: habitColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-white truncate">
            {isArabic ? habit.nameAr : habit.name}
          </h3>
          <p className="text-[10px] text-gray-500">
            {isArabic ? 'عرض ربع سنوي' : 'Quarter View'}
          </p>
        </div>
      </div>

      {/* Quarter Calendar View - 3 months in a row */}
      <div className="flex gap-3 mb-4">
        {quarterMonths.map((month, idx) => renderMonthCalendar(month, idx))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-[9px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: habitColor }} />
          <span>{isArabic ? 'تم' : 'Done'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm flex items-center justify-center">
            <X className="w-full h-full" style={{ color: habitColor }} strokeWidth={2.5} />
          </div>
          <span>{isArabic ? 'فشل' : 'Failed'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/50" />
          <span>{isArabic ? 'لا سجل' : 'No Log'}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {/* Best Streak */}
        <div className="bg-slate-900/50 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
            <Flame size={12} />
          </div>
          <div className="font-mono text-lg font-bold text-white">{metrics.bestStreak}</div>
          <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'أفضل تتابع' : 'Best'}</div>
        </div>
        
        {/* Worst Fail Streak */}
        <div className="bg-slate-900/50 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
            <TrendingDown size={12} />
          </div>
          <div className="font-mono text-lg font-bold text-white">{metrics.worstFailStreak}</div>
          <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'أسوأ فشل' : 'Worst'}</div>
        </div>
        
        {/* Total Done */}
        <div className="bg-slate-900/50 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <CheckCircle2 size={12} />
          </div>
          <div className="font-mono text-lg font-bold text-white">{metrics.totalDone}</div>
          <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'تم' : 'Done'}</div>
        </div>
        
        {/* Total Fails */}
        <div className="bg-slate-900/50 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
            <XCircle size={12} />
          </div>
          <div className="font-mono text-lg font-bold text-white">{metrics.totalFails}</div>
          <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'فشل' : 'Fails'}</div>
        </div>
      </div>

      {/* Top Reasons for Failures */}
      {metrics.topReasons.length > 0 && (
        <div className="bg-slate-900/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-2">
            <AlertTriangle size={10} />
            <span className="uppercase font-semibold tracking-wider">
              {isArabic ? 'أسباب الفشل الشائعة' : 'Top Fail Reasons'}
            </span>
          </div>
          <div className="space-y-1.5">
            {metrics.topReasons.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 truncate flex-1">{item.reason}</span>
                <span className="text-gray-500 font-mono ml-2">{item.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralHabitAnalyticsCard;
