import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, subMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { HabitLog, HabitType, LogStatus, PrayerQuality } from '../../types';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface AnnualCalendarProps {
  habitId: string;
  habitType: HabitType;
  habitColor?: string;
  logs: HabitLog[];
  language: 'en' | 'ar';
  renderDayCell?: (date: Date, log?: HabitLog) => React.ReactNode;
}

const AnnualCalendar: React.FC<AnnualCalendarProps> = ({
  habitId,
  habitType,
  habitColor = '#10b981',
  logs,
  language,
  renderDayCell
}) => {
  const locale = language === 'ar' ? ar : enUS;

  // Get rolling 12 months (ending with current month)
  const months = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 11; i >= 0; i--) {
      result.push(subMonths(now, i));
    }
    return result;
  }, []);

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
    const hasLog = log !== undefined;
    const isToday = isSameDay(date, new Date());

    return (
      <div
        className={clsx(
          "aspect-square rounded-sm flex items-center justify-center",
          !hasLog && "bg-slate-800/50",
          isTakbirah && "shadow-sm",
          isToday && "ring-1 ring-primary/60"
        )}
        style={isTakbirah ? { backgroundColor: habitColor } : undefined}
      >
        {hasLog && !isTakbirah && (
          <X className="w-full h-full p-[1px]" style={{ color: habitColor }} strokeWidth={2.5} />
        )}
      </div>
    );
  };

  // Choose renderer based on habit type
  const dayRenderer = renderDayCell || (habitType === HabitType.PRAYER ? defaultPrayerRenderer : defaultRegularHabitRenderer);

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
      {/* Annual calendar grid - 3 columns × 4 rows */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {months.map((month, idx) => renderMonth(month, idx))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[9px] text-gray-500">
        {habitType === HabitType.PRAYER ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: habitColor }} />
              <span>{language === 'ar' ? 'تكبيرة' : 'Takbirah'}</span>
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
