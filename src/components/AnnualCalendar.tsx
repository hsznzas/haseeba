import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { HabitLog, HabitType, LogStatus, PrayerQuality } from '../../types';
import { clsx } from 'clsx';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface AnnualCalendarProps {
  habitId: string;
  habitType: HabitType;
  habitColor?: string;
  logs: HabitLog[];
  language: 'en' | 'ar';
  renderDayCell?: (date: Date, log?: HabitLog) => React.ReactNode;
  dailyTarget?: number; // Used for twice-daily detection
}

const AnnualCalendar: React.FC<AnnualCalendarProps> = ({
  habitId,
  habitType,
  habitColor = '#10b981',
  logs,
  language,
  renderDayCell,
  dailyTarget
}) => {
  // Detect twice-daily habit
  const isTwiceDaily = habitType === HabitType.COUNTER && dailyTarget === 2;
  const locale = language === 'ar' ? ar : enUS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get 12 months for the selected year
  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 12; i++) {
      result.push(new Date(selectedYear, i, 1));
    }
    return result;
  }, [selectedYear]);

  // Get log for a specific date
  const getLogForDate = (date: Date): HabitLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.find(l => l.habitId === habitId && l.date === dateStr);
  };

  // Default day cell renderer for regular habits
  const defaultRegularHabitRenderer = (date: Date, log?: HabitLog) => {
    const isDone = log?.status === LogStatus.DONE;
    const isFail = log?.status === LogStatus.FAIL;
    const isToday = isSameDay(date, new Date());

    return (
      <div
        className={clsx(
          "aspect-square rounded-sm flex items-center justify-center",
          !isDone && !isFail && "bg-slate-800/50",
          isDone && "shadow-sm",
          isToday && "ring-1 ring-primary/60"
        )}
        style={isDone ? { backgroundColor: habitColor } : undefined}
      >
        {isFail && (
          <X className="w-full h-full p-[1px]" style={{ color: habitColor }} strokeWidth={2.5} />
        )}
      </div>
    );
  };

  // Default day cell renderer for prayers (X for non-Takbirah)
  const defaultPrayerRenderer = (date: Date, log?: HabitLog) => {
    const isTakbirah = log?.value === PrayerQuality.TAKBIRAH;
    const isMissed = log?.value === PrayerQuality.MISSED;
    const hasLog = log !== undefined;
    const isToday = isSameDay(date, new Date());

    return (
      <div
        className={clsx(
          "aspect-square rounded-sm flex items-center justify-center",
          !hasLog && !isMissed && "bg-slate-800/50",
          isTakbirah && "shadow-sm",
          isMissed && "shadow-sm",
          isToday && "ring-1 ring-primary/60"
        )}
        style={
          isTakbirah ? { backgroundColor: habitColor }
          : isMissed ? { backgroundColor: '#ef4444' }
          : undefined
        }
      >
        {hasLog && !isTakbirah && (
          <X 
            className="w-full h-full p-[1px]" 
            style={{ color: isMissed ? '#000000' : habitColor }} 
            strokeWidth={2.5} 
          />
        )}
      </div>
    );
  };

  // Two-digit encoding helpers for Twice-Daily Habits
  // value = (MorningState * 10) + EveningState
  // State Key: 0 = Pending, 1 = Done, 2 = Fail
  const decodeTwiceDaily = (value: number) => {
    const amState = Math.floor(value / 10); // 0=pending, 1=done, 2=fail
    const pmState = value % 10;             // 0=pending, 1=done, 2=fail
    return { amState, pmState };
  };

  // Get color based on state: 0=gray, 1=green, 2=red
  const getStateColor = (state: number) => {
    if (state === 1) return '#10b981'; // emerald-500 (Done)
    if (state === 2) return '#ef4444'; // red-500 (Fail)
    return '#334155'; // slate-700 (Pending/Empty)
  };

  // Twice-daily split-doughnut renderer with two-digit encoding
  const twiceDailyRenderer = (date: Date, log?: HabitLog) => {
    const value = log?.value || 0;
    const isToday = isSameDay(date, new Date());
    const size = 12; // Cell size
    const strokeWidth = 2;
    const radius = (size / 2) - strokeWidth;
    const cx = size / 2;
    const cy = size / 2;
    
    const { amState, pmState } = decodeTwiceDaily(value);
    const amColor = getStateColor(amState);
    const pmColor = getStateColor(pmState);

    return (
      <div
        className={clsx(
          "aspect-square flex items-center justify-center",
          isToday && "ring-1 ring-primary/60 rounded-sm"
        )}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Base ring (empty) */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={radius} 
            fill="none" 
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          
          {/* Left half (AM) - color based on state */}
          <path
            d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 0 ${cx} ${cy + radius}`}
            fill="none"
            stroke={amColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Right half (PM) - color based on state */}
          <path
            d={`M ${cx} ${cy - radius} A ${radius} ${radius} 0 0 1 ${cx} ${cy + radius}`}
            fill="none"
            stroke={pmColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  // Choose renderer based on habit type
  const dayRenderer = renderDayCell || (
    isTwiceDaily 
      ? twiceDailyRenderer 
      : habitType === HabitType.PRAYER 
        ? defaultPrayerRenderer 
        : defaultRegularHabitRenderer
  );

  // Render a single month calendar
  const renderMonth = (monthDate: Date, monthIndex: number) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    
    const startDayOfWeek = getDay(start);
    const emptyDays = Array(startDayOfWeek).fill(null);
    
    return (
      <div key={monthIndex} className="flex-1 min-w-0">
        {/* Month label */}
        <p className="text-[9px] text-gray-500 text-center mb-1.5 font-medium uppercase tracking-wider">
          {format(monthDate, 'MMM yyyy', { locale })}
        </p>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-[2px] mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[7px] font-bold text-gray-600 uppercase">
              {d}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-[2px]">
          {emptyDays.map((_, i) => (
            <div key={`empty-${monthIndex}-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => (
            <div key={day.toISOString()}>
              {dayRenderer(day, getLogForDate(day))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={() => setSelectedYear(prev => prev - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
          aria-label={language === 'ar' ? 'السنة السابقة' : 'Previous year'}
        >
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        
        <h3 className="text-lg font-bold text-white min-w-[80px] text-center">
          {selectedYear}
        </h3>
        
        <button
          onClick={() => setSelectedYear(prev => prev + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={language === 'ar' ? 'السنة التالية' : 'Next year'}
        >
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Annual calendar grid - 3 columns × 4 rows */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {months.map((month, idx) => renderMonth(month, idx))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[9px] text-gray-500 flex-wrap">
        {isTwiceDaily ? (
          <>
            {/* Perfect Day: Both Done (11) */}
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4" fill="none" stroke="#1e293b" strokeWidth="2" />
                <path d="M 6 2 A 4 4 0 0 0 6 10" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <path d="M 6 2 A 4 4 0 0 1 6 10" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{language === 'ar' ? 'يوم مثالي' : 'Perfect'}</span>
            </div>
            {/* Partial: One Done, One Fail */}
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4" fill="none" stroke="#1e293b" strokeWidth="2" />
                <path d="M 6 2 A 4 4 0 0 0 6 10" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <path d="M 6 2 A 4 4 0 0 1 6 10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{language === 'ar' ? 'جزئي' : 'Partial'}</span>
            </div>
            {/* Both Failed (22) */}
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4" fill="none" stroke="#1e293b" strokeWidth="2" />
                <path d="M 6 2 A 4 4 0 0 0 6 10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <path d="M 6 2 A 4 4 0 0 1 6 10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{language === 'ar' ? 'فشل' : 'Failed'}</span>
            </div>
            {/* No Log (0) */}
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4" fill="none" stroke="#334155" strokeWidth="2" />
              </svg>
              <span>{language === 'ar' ? 'لا سجل' : 'No Log'}</span>
            </div>
          </>
        ) : habitType === HabitType.PRAYER ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: habitColor }} />
              <span>{language === 'ar' ? 'تكبيرة' : 'Takbirah'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500 flex items-center justify-center">
                <X className="w-full h-full text-black" strokeWidth={2.5} />
              </div>
              <span>{language === 'ar' ? 'فائتة' : 'Missed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm flex items-center justify-center">
                <X className="w-full h-full" style={{ color: habitColor }} strokeWidth={2.5} />
              </div>
              <span>{language === 'ar' ? 'ليس تكبيرة' : 'Not Takbirah'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/50" />
              <span>{language === 'ar' ? 'لا سجل' : 'No Log'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: habitColor }} />
              <span>{language === 'ar' ? 'تم' : 'Done'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm flex items-center justify-center">
                <X className="w-full h-full" style={{ color: habitColor }} strokeWidth={2.5} />
              </div>
              <span>{language === 'ar' ? 'فشل' : 'Failed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-800/50" />
              <span>{language === 'ar' ? 'لا سجل' : 'No Log'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnnualCalendar;
