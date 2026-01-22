import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Hourglass, Trophy, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { TRANSLATIONS } from '../../constants';
import { HabitLog, LogStatus, PrayerQuality } from '../../types';
import { addYears, differenceInDays } from 'date-fns';
import Tooltip from './Tooltip';
import PrayerTrendChart from './PrayerTrendChart';

interface AllPrayersInsightCardProps {
  logs: HabitLog[];
  language: 'en' | 'ar';
  dateOfBirth?: string | null;
  onDobClick?: () => void;
}

// Helper to parse YYYY-MM-DD strings locally without UTC shifting
const parseLocalISO = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// Rate Color Interpolation Helper (0% -> Red, 100% -> Blue)
const getRateColorStyle = (percentage: number) => {
  if (percentage <= 25) return '#7f1d1d'; // Deep Dark Red
  if (percentage <= 50) return '#ef4444'; // Red
  if (percentage <= 75) return '#eab308'; // Yellow
  return '#3b82f64D'; // Blue (30% opacity)
};

const AllPrayersInsightCard: React.FC<AllPrayersInsightCardProps> = ({
  logs,
  language,
  dateOfBirth,
  onDobClick,
}) => {
  const t = TRANSLATIONS[language];
  const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const remainingChances = useMemo(() => {
    if (!dateOfBirth) return null;
    try {
      const dob = parseLocalISO(dateOfBirth);
      const targetDate = addYears(dob, 75);
      const today = new Date();
      const diff = differenceInDays(targetDate, today);
      return Math.max(0, diff);
    } catch (e) {
      return null;
    }
  }, [dateOfBirth]);

  const bestStreak = useMemo(() => {
    const relevantLogs = logs
      .filter(l => prayerIds.includes(l.habitId))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (relevantLogs.length === 0) return 0;

    const logsByDate: Record<string, { perfectCount: number; excusedCount: number; logs: HabitLog[] }> = {};
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

    const allDates = Object.keys(logsByDate).sort();
    if (allDates.length === 0) return 0;

    let currentStreak = 0;
    let best = 0;

    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i]!;
      const data = logsByDate[date]!;

      if (data.excusedCount === 5) {
        continue;
      } else if (data.perfectCount === 5) {
        currentStreak++;
        if (currentStreak > best) best = currentStreak;
      } else {
        if (i > 0) {
          const prevDate = allDates[i - 1]!;
          const daysDiff = differenceInDays(parseLocalISO(date), parseLocalISO(prevDate));
          if (daysDiff > 1) {
            currentStreak = 0;
          }
        }
        currentStreak = 0;
      }
    }

    return best;
  }, [logs]);

  const { rateColor, fullScoreRate, total, takbirah, inGroup, onTime, missed, topObstacles, chartData } = useMemo(() => {
    const pLogs = logs.filter(l => prayerIds.includes(l.habitId));
    const totalCount = pLogs.length;
    const missedCount = pLogs.filter(l => l.value === PrayerQuality.MISSED).length;
    const onTimeCount = pLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
    const inGroupCount = pLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
    const takbirahCount = pLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;

    const rate = totalCount > 0 ? Math.round((takbirahCount / totalCount) * 100) : 0;
    const rateColorValue = getRateColorStyle(rate);

    const problematicLogs = pLogs.filter(l =>
      l.value !== undefined &&
      l.value < PrayerQuality.TAKBIRAH &&
      l.reason &&
      l.reason.trim() !== ''
    );

    const reasonCounts: Record<string, number> = {};
    problematicLogs.forEach(l => {
      const reason = l.reason!.trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const obstacles = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        reason,
        count,
        pct: problematicLogs.length > 0 ? Math.round((count / problematicLogs.length) * 100) : 0,
      }));

    const data = [
      { name: t.takbirah, value: takbirahCount, color: '#3b82f64D' },
      { name: t.inGroup, value: inGroupCount, color: '#eab308' },
      { name: t.onTime, value: onTimeCount, color: '#f97316' },
      { name: t.missed, value: missedCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return {
      rateColor: rateColorValue,
      fullScoreRate: rate,
      total: totalCount,
      takbirah: takbirahCount,
      inGroup: inGroupCount,
      onTime: onTimeCount,
      missed: missedCount,
      topObstacles: obstacles,
      chartData: data.length > 0 ? data : [{ name: 'Empty', value: 1, color: '#1e293b' }],
    };
  }, [logs, t.takbirah, t.inGroup, t.onTime, t.missed]);

  const qualityBreakdown = [
    { label: language === 'ar' ? 'تكبيرة الإحرام' : 'Takbirah', pct: total > 0 ? Math.round((takbirah / total) * 100) : 0, color: '#3b82f64D' },
    { label: language === 'ar' ? 'جماعة' : 'In Group', pct: total > 0 ? Math.round((inGroup / total) * 100) : 0, color: '#eab308' },
    { label: language === 'ar' ? 'في الوقت' : 'On Time', pct: total > 0 ? Math.round((onTime / total) * 100) : 0, color: '#f97316' },
    { label: language === 'ar' ? 'فائتة' : 'Missed', pct: total > 0 ? Math.round((missed / total) * 100) : 0, color: '#ef4444' },
  ];

  return (
    <div className="bg-card rounded-xl border border-primary/30 bg-slate-900/80 shadow-lg overflow-hidden">
      {/* Chances Left Header */}
      <button
        onClick={onDobClick}
        className="w-full bg-slate-900/50 py-2 px-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Hourglass size={12} className="text-gray-400" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{t.chancesLeft}</span>
        </div>
        <span className={clsx("text-xs font-mono font-bold", remainingChances !== null ? "text-primary" : "text-gray-500")}>
          {remainingChances !== null ? `${remainingChances.toLocaleString()} ${language === 'ar' ? 'يوم' : 'days'}` : t.setDob}
        </span>
      </button>

      <div className="p-4">
        {/* Title Row */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{t.allPrayers}</h3>
            <Tooltip text={language === 'ar' ? 'تحليل شامل لجميع الصلوات الخمس' : 'Comprehensive analysis of all 5 daily prayers'} />
          </div>
          {bestStreak > 0 && (
            <div className="flex items-center gap-1 text-xs bg-orange-500/10 px-2 py-1 rounded-lg text-orange-400">
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
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={42} paddingAngle={2} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
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
                {language === 'ar' ? 'توزيع الجودة' : 'Quality Breakdown'}
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

            {/* Spacer */}

            {/* Top Obstacles */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <AlertTriangle size={10} className="text-amber-500" />
                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  {language === 'ar' ? 'أهم العوائق' : 'Top Obstacles'}
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
                  {language === 'ar' ? 'لا توجد عوائق مسجلة بعد' : 'No obstacles logged yet'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 90-Day Trend Chart */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={12} className="text-gray-400" />
          <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {language === 'ar' ? 'اتجاه آخر 90 يوم' : '90-Day Trend'}
          </h4>
        </div>
        <PrayerTrendChart logs={logs} language={language} />
      </div>
    </div>
  );
};

export default AllPrayersInsightCard;
