import React, { useRef, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { usePreferences } from '../App';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates: string[]; // Array of YYYY-MM-DD (Fully complete)
  loggedDates?: string[]; // Array of YYYY-MM-DD (Any log exists)
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate, completedDates, loggedDates = [] }) => {
  const { preferences } = usePreferences();
  const locale = preferences.language === 'ar' ? ar : enUS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate 30 days past / 14 days future
  const dates = Array.from({ length: 45 }, (_, i) => addDays(addDays(new Date(), 14), -i)).reverse();

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedDate]);

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto py-3 px-2 gap-2 no-scrollbar w-full"
    >
      {dates.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isCompleted = completedDates.includes(dateStr);
        const hasLog = loggedDates.includes(dateStr);
        const isToday = isSameDay(date, new Date());

        return (
          <button
            key={date.toISOString()}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelectDate(date)}
            className={clsx(
              "flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-lg transition-all duration-200 relative border",
              isSelected 
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                : "bg-card text-gray-400 border-slate-700 hover:bg-slate-800",
              isToday && !isSelected && "border-primary/50 text-primary"
            )}
          >
            <span className="text-[10px] font-medium opacity-80 uppercase">
              {format(date, 'EEE', { locale })}
            </span>
            <span className="text-base font-bold leading-none mt-0.5">
              {format(date, 'd', { locale })}
            </span>
            
            {/* Fully Completed Indicator (Green Check) - Top Right */}
            {isCompleted && (
              <div className="absolute top-1 right-1 bg-black rounded-full p-0.5 z-20 shadow-sm">
                <Check size={10} className="text-emerald-400" strokeWidth={3} />
              </div>
            )}

            {/* Partially Logged Indicator (Small Dot) - Bottom Center */}
            {!isCompleted && hasLog && (
               <div className="absolute bottom-1.5 w-1 h-1 bg-slate-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DateSelector;
