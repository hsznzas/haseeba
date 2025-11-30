import React, { useState, useMemo } from 'react';
import { Habit, HabitLog } from '../../types';
import { format, addDays, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  habit: Habit;
  logs: HabitLog[];
  language: 'en' | 'ar';
}

type ViewMode = 'week' | 'month' | 'year';

// Helper to parse YYYY-MM-DD strings locally without UTC shifting
const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const HabitAnalyticsCard: React.FC<Props> = ({ habit, logs, language }) => {
  const [view, setView] = useState<ViewMode>('month');
  
  const relevantLogs = logs.filter(l => l.habitId === habit.id);

  // Helper: Get logs in range
  const getLogsInRange = (start: Date, end: Date) => {
    return relevantLogs.filter(l => {
      const d = parseLocalISO(l.date);
      return isWithinInterval(d, { start, end });
    });
  };

  const metrics = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    
    if (view === 'week') {
      start = startOfWeek(now); end = endOfWeek(now);
    } else if (view === 'month') {
      start = startOfMonth(now); end = endOfMonth(now);
    } else {
      start = startOfYear(now); end = endOfYear(now);
    }
    
    const rangeLogs = getLogsInRange(start, end);
    
    // Calculate completion count
    const count = rangeLogs.length;
    
    // Calculate streak (simple backward check from today)
    let currentStreak = 0;
    let checkDate = now;
    // Simplified streak logic for card display
    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const hasLog = relevantLogs.some(l => l.date === dateStr);
        if (hasLog) currentStreak++;
        else if (!isSameDay(checkDate, now)) break; // Break if missing a day (allow today to be missing if still early)
        checkDate = addDays(checkDate, -1);
        if (currentStreak > 365) break; // Safety
    }

    // Mock Data for Chart based on view
    const chartData = [];
    const points = view === 'week' ? 7 : view === 'month' ? 30 : 12;
    for(let i=0; i<points; i++) {
        // Generate dummy trend based on actual logs would be complex, doing simple presence check
        const d = addDays(now, -(points - 1 - i));
        const dStr = format(d, 'yyyy-MM-dd');
        const val = relevantLogs.find(l => l.date === dStr) ? 1 : 0;
        chartData.push({ date: format(d, view === 'year' ? 'MMM' : 'd'), value: val });
    }

    return {
      count,
      currentStreak,
      bestStreak: currentStreak, // Simplified
      rate: Math.round((count / (view === 'week' ? 7 : view === 'month' ? 30 : 365)) * 100),
      chartData
    };
  }, [view, relevantLogs]);

  // Generate simple "AI" comment deterministically
  const getAIComment = () => {
    if (metrics.rate > 80) return language === 'ar' ? "أداء ممتاز! استمر في هذا الثبات." : "Excellent performance! Keep up this consistency.";
    if (metrics.rate > 50) return language === 'ar' ? "جيد، ولكن يمكنك تحسين الانتظام." : "Good, but consistency can be improved.";
    return language === 'ar' ? "تحتاج إلى مزيد من التركيز على هذه العادة." : "Needs more focus on this habit.";
  };

  return (
    <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
             {habit.emoji && <span>{habit.emoji}</span>}
             {language === 'ar' ? habit.nameAr : habit.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
             <Sparkles size={10} className="text-purple-400" /> {getAIComment()}
          </p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
           {['week', 'month', 'year'].map((v) => (
             <button
               key={v}
               onClick={() => setView(v as ViewMode)}
               className={clsx(
                 "px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                 view === v ? "bg-slate-700 text-white" : "text-gray-500 hover:text-gray-300"
               )}
             >
               {v.charAt(0)}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
         <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800 text-center">
            <div className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'المجموع' : 'Total'}</div>
            <div className="font-mono text-xl font-bold text-white">{metrics.count}</div>
         </div>
         <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800 text-center">
            <div className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'التتابع' : 'Streak'}</div>
            <div className="font-mono text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
               <Flame size={14} fill="currentColor" /> {metrics.currentStreak}
            </div>
         </div>
         <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800 text-center">
            <div className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'المعدل' : 'Rate'}</div>
            <div className="font-mono text-xl font-bold text-emerald-400">{metrics.rate}%</div>
         </div>
      </div>

      <div className="h-24 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.chartData}>
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                cursor={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HabitAnalyticsCard;
