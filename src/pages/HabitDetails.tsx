import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePreferences } from '../App';
import { useData } from '../context/DataContext';
import { ArrowLeft, Flame, TrendingDown, CheckCircle2, XCircle, AlertTriangle, Trophy } from 'lucide-react';
import { HabitType, LogStatus, HabitLog, PrayerQuality } from '../../types';
import AnnualCalendar from '../components/AnnualCalendar';
import PrayerInsightCard from '../components/PrayerInsightCard';
import HabitSettingsSection from '../components/HabitSettingsSection';
import { ICON_MAP, IconName } from '../utils/iconMap';
import { INITIAL_HABITS } from '../../constants';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const HabitDetails: React.FC = () => {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const { habits, logs } = useData();

  const habit = habits.find(h => h.id === habitId);

  // Check if this is a Rawatib prayer
  const rawatibIds = [
    'fajr_sunnah',
    'dhuhr_sunnah_before_1',
    'dhuhr_sunnah_before_2',
    'dhuhr_sunnah_after',
    'maghrib_sunnah',
    'isha_sunnah',
  ];
  const isRawatib = habit?.presetId === 'rawatib' || (habit && rawatibIds.includes(habit.id));

  if (!habit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">
            {preferences.language === 'ar' ? 'العادة غير موجودة' : 'Habit not found'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            {preferences.language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const habitLogs = logs.filter(l => l.habitId === habitId);
  const displayName = preferences.language === 'ar' ? habit.nameAr : habit.name;
  const isArabic = preferences.language === 'ar';

  // Get habit color and icon
  const habitColor = habit.color || INITIAL_HABITS.find(h => h.id === habit.id)?.color || '#10b981';
  const HabitIcon = useMemo(() => {
    const iconName = habit.icon || INITIAL_HABITS.find(h => h.id === habit.id)?.icon;
    if (iconName && ICON_MAP[iconName as IconName]) {
      return ICON_MAP[iconName as IconName];
    }
    return ICON_MAP.Activity;
  }, [habit]);

  // Helper to parse YYYY-MM-DD strings locally without UTC shifting
  const parseLocalISO = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  };

  // Calculate metrics for Rawatib (similar to regular habits but prayer-like)
  const rawatibMetrics = useMemo(() => {
    if (!isRawatib) return null;

    const total = habitLogs.length;
    const completed = habitLogs.filter(l => l.status === LogStatus.DONE).length;
    const failed = habitLogs.filter(l => l.status === LogStatus.FAIL).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate best streak (consecutive DONE days)
    const sortedLogs = [...habitLogs].sort((a, b) => a.date.localeCompare(b.date));
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
    
    // Top 3 obstacles
    const reasonCounts: Record<string, number> = {};
    habitLogs
      .filter(l => l.status !== LogStatus.DONE && l.reason && l.reason.trim())
      .forEach(l => {
        const reason = l.reason!.trim();
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    
    const topObstacles = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        reason,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0
      }));
    
    return {
      total,
      completed,
      failed,
      completionRate,
      bestStreak,
      topObstacles
    };
  }, [habitLogs, isRawatib]);

  // Calculate metrics for prayers
  const prayerMetrics = useMemo(() => {
    if (habit.type !== HabitType.PRAYER || isRawatib) return null;

    const total = habitLogs.length;
    const missed = habitLogs.filter(l => l.value === PrayerQuality.MISSED).length;
    const onTime = habitLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
    const inGroup = habitLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
    const takbirah = habitLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
    
    const takbirahRate = total > 0 ? Math.round((takbirah / total) * 100) : 0;
    
    // Calculate best streak (consecutive Takbirah days)
    const sortedLogs = [...habitLogs].sort((a, b) => a.date.localeCompare(b.date));
    let bestStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    
    const takbirahLogs = sortedLogs.filter(l => l.value === PrayerQuality.TAKBIRAH);
    takbirahLogs.forEach(log => {
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
    
    // Top 3 obstacles (reasons for non-Takbirah)
    const reasonCounts: Record<string, number> = {};
    habitLogs
      .filter(l => l.value !== undefined && l.value < PrayerQuality.TAKBIRAH && l.reason && l.reason.trim())
      .forEach(l => {
        const reason = l.reason!.trim();
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    
    const topObstacles = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        reason,
        count,
        pct: habitLogs.length > 0 ? Math.round((count / habitLogs.length) * 100) : 0
      }));
    
    return {
      total,
      missed,
      onTime,
      inGroup,
      takbirah,
      takbirahRate,
      bestStreak,
      topObstacles
    };
  }, [habitLogs, habit.type]);

  // Rate color helper
  const getRateColorStyle = (percentage: number) => {
    if (percentage <= 25) return '#7f1d1d';
    if (percentage <= 50) return '#ef4444';
    if (percentage <= 75) return '#eab308';
    return '#22c55e';
  };

  // Calculate metrics for regular habits
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

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
            <p className="text-xs text-gray-400">
              {habit.type === HabitType.PRAYER 
                ? (preferences.language === 'ar' ? 'صلاة' : 'Prayer')
                : habit.type === HabitType.COUNTER
                ? (preferences.language === 'ar' ? 'عداد' : 'Counter')
                : (preferences.language === 'ar' ? 'عادة' : 'Habit')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {habit.type === HabitType.REGULAR || habit.type === HabitType.COUNTER ? (
          <>
            {/* Header with Icon */}
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${habitColor}20` }}
              >
                <HabitIcon size={24} style={{ color: habitColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500">
                  {isArabic ? 'عرض سنوي' : 'Annual View'}
                </p>
              </div>
            </div>

            {/* Annual Calendar Section */}
            <div className="bg-card rounded-xl border border-slate-800 p-4">
              <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide mb-4">
                {isArabic ? 'التقويم السنوي' : 'Annual Calendar'}
              </h2>
              <AnnualCalendar
                habitId={habit.id}
                habitType={habit.type}
                habitColor={habitColor}
                logs={logs}
                language={preferences.language}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-2">
              {/* Best Streak */}
              <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                  <Flame size={12} />
                </div>
                <div className="font-mono text-lg font-bold text-white">{metrics.bestStreak}</div>
                <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'أفضل تتابع' : 'Best'}</div>
              </div>
              
              {/* Worst Fail Streak */}
              <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                  <TrendingDown size={12} />
                </div>
                <div className="font-mono text-lg font-bold text-white">{metrics.worstFailStreak}</div>
                <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'أسوأ فشل' : 'Worst'}</div>
              </div>
              
              {/* Total Done */}
              <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                  <CheckCircle2 size={12} />
                </div>
                <div className="font-mono text-lg font-bold text-white">{metrics.totalDone}</div>
                <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'تم' : 'Done'}</div>
              </div>
              
              {/* Total Fails */}
              <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                  <XCircle size={12} />
                </div>
                <div className="font-mono text-lg font-bold text-white">{metrics.totalFails}</div>
                <div className="text-[8px] text-gray-500 uppercase">{isArabic ? 'فشل' : 'Fails'}</div>
              </div>
            </div>

            {/* Top Reasons for Failures */}
            {metrics.topReasons.length > 0 && (
              <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-800">
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
          </>
        ) : habit.type === HabitType.PRAYER && prayerMetrics ? (
          <>
            {/* Annual Calendar Section for Prayer */}
            <div className="bg-card rounded-xl border border-slate-800 p-4">
              <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide mb-4">
                {isArabic ? 'التقويم السنوي' : 'Annual Calendar'}
              </h2>
              <AnnualCalendar
                habitId={habit.id}
                habitType={habit.type}
                habitColor={habitColor}
                logs={logs}
                language={preferences.language}
              />
            </div>

            {/* Ring Visualization */}
            <div className="bg-card rounded-xl border border-primary/30 bg-slate-900/80 shadow-lg overflow-hidden p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
                  {isArabic ? 'توزيع الجودة' : 'Quality Breakdown'}
                </h2>
                {prayerMetrics.bestStreak > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-orange-500/10 px-2 py-1 rounded-lg text-orange-400 border border-orange-500/20">
                    <Trophy size={12} />
                    <span className="font-bold">{prayerMetrics.bestStreak}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4" dir="ltr">
                {/* Ring Chart */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-24 w-24">
                    {(() => {
                      const chartData = [
                        { name: isArabic ? 'تكبيرة الإحرام' : 'Takbirah', value: prayerMetrics.takbirah, color: '#22c55e' },
                        { name: isArabic ? 'جماعة' : 'In Group', value: prayerMetrics.inGroup, color: '#eab308' },
                        { name: isArabic ? 'في الوقت' : 'On Time', value: prayerMetrics.onTime, color: '#f97316' },
                        { name: isArabic ? 'فائتة' : 'Missed', value: prayerMetrics.missed, color: '#ef4444' },
                      ].filter(d => d.value > 0);

                      const finalChartData = chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#1e293b' }];
                      const rateColor = getRateColorStyle(prayerMetrics.takbirahRate);

                      return (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={finalChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={42} paddingAngle={2} dataKey="value" stroke="none">
                                {finalChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold" style={{ color: rateColor }}>{prayerMetrics.takbirahRate}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-bold" style={{ color: getRateColorStyle(prayerMetrics.takbirahRate) }}>{prayerMetrics.takbirah}</span>
                    <span className="text-xs text-gray-500">/ {prayerMetrics.total}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5">{isArabic ? 'معدل التكبيرة' : 'Takbirah Rate'}</span>
                </div>

                {/* Quality Breakdown */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      {isArabic ? 'التفاصيل' : 'Details'}
                    </h4>
                    <div className="flex flex-col gap-1">
                      {[
                        { label: isArabic ? 'تكبيرة الإحرام' : 'Takbirah', val: prayerMetrics.takbirah, pct: prayerMetrics.total > 0 ? Math.round((prayerMetrics.takbirah / prayerMetrics.total) * 100) : 0, color: '#22c55e' },
                        { label: isArabic ? 'جماعة' : 'In Group', val: prayerMetrics.inGroup, pct: prayerMetrics.total > 0 ? Math.round((prayerMetrics.inGroup / prayerMetrics.total) * 100) : 0, color: '#eab308' },
                        { label: isArabic ? 'في الوقت' : 'On Time', val: prayerMetrics.onTime, pct: prayerMetrics.total > 0 ? Math.round((prayerMetrics.onTime / prayerMetrics.total) * 100) : 0, color: '#f97316' },
                        { label: isArabic ? 'فائتة' : 'Missed', val: prayerMetrics.missed, pct: prayerMetrics.total > 0 ? Math.round((prayerMetrics.missed / prayerMetrics.total) * 100) : 0, color: '#ef4444' },
                      ].map(item => (
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
                  {prayerMetrics.topObstacles.length > 0 && (
                    <div className="h-px bg-slate-700/50" />
                  )}

                  {/* Top Obstacles */}
                  {prayerMetrics.topObstacles.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={10} className="text-amber-500" />
                        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                          {isArabic ? 'أهم العوائق' : 'Top Obstacles'}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {prayerMetrics.topObstacles.map((obs, idx) => (
                          <div key={obs.reason} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600 text-[10px] font-mono">{idx + 1}.</span>
                            <span className="text-gray-300 truncate flex-1">{obs.reason}</span>
                            <span className="text-amber-500/80 font-semibold text-[10px]">{obs.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insight Section */}
            <PrayerInsightCard
              prayerId={habit.id}
              prayerName={displayName}
              logs={habitLogs}
              language={preferences.language}
            />
          </>
        ) : isRawatib && rawatibMetrics ? (
          <>
            {/* Annual Calendar Section for Rawatib */}
            <div className="bg-card rounded-xl border border-slate-800 p-4">
              <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide mb-4">
                {isArabic ? 'التقويم السنوي' : 'Annual Calendar'}
              </h2>
              <AnnualCalendar
                habitId={habit.id}
                habitType={HabitType.REGULAR}
                habitColor={habitColor}
                logs={logs}
                language={preferences.language}
              />
            </div>

            {/* Ring Visualization for Rawatib */}
            <div className="bg-card rounded-xl border border-purple-500/30 bg-slate-900/80 shadow-lg overflow-hidden p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
                  {isArabic ? 'معدل الإكمال' : 'Completion Rate'}
                </h2>
                {rawatibMetrics.bestStreak > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-orange-500/10 px-2 py-1 rounded-lg text-orange-400 border border-orange-500/20">
                    <Trophy size={12} />
                    <span className="font-bold">{rawatibMetrics.bestStreak}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4" dir="ltr">
                {/* Ring Chart */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-24 w-24">
                    {(() => {
                      const chartData = [
                        { name: isArabic ? 'مكتمل' : 'Completed', value: rawatibMetrics.completed, color: '#22c55e' },
                        { name: isArabic ? 'فشل' : 'Failed', value: rawatibMetrics.failed, color: '#ef4444' },
                      ].filter(d => d.value > 0);

                      const finalChartData = chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#1e293b' }];
                      const rateColor = getRateColorStyle(rawatibMetrics.completionRate);

                      return (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={finalChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={42} paddingAngle={2} dataKey="value" stroke="none">
                                {finalChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold" style={{ color: rateColor }}>{rawatibMetrics.completionRate}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-bold" style={{ color: getRateColorStyle(rawatibMetrics.completionRate) }}>{rawatibMetrics.completed}</span>
                    <span className="text-xs text-gray-500">/ {rawatibMetrics.total}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5">{isArabic ? 'مكتمل' : 'Completed'}</span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      {isArabic ? 'التفاصيل' : 'Details'}
                    </h4>
                    <div className="flex flex-col gap-1">
                      {[
                        { label: isArabic ? 'مكتمل' : 'Completed', val: rawatibMetrics.completed, pct: rawatibMetrics.completionRate, color: '#22c55e' },
                        { label: isArabic ? 'فشل' : 'Failed', val: rawatibMetrics.failed, pct: 100 - rawatibMetrics.completionRate, color: '#ef4444' },
                      ].map(item => (
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
                  {rawatibMetrics.topObstacles.length > 0 && (
                    <div className="h-px bg-slate-700/50" />
                  )}

                  {/* Top Obstacles */}
                  {rawatibMetrics.topObstacles.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={10} className="text-amber-500" />
                        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                          {isArabic ? 'أهم العوائق' : 'Top Obstacles'}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        {rawatibMetrics.topObstacles.map((obs, idx) => (
                          <div key={obs.reason} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600 text-[10px] font-mono">{idx + 1}.</span>
                            <span className="text-gray-300 truncate flex-1">{obs.reason}</span>
                            <span className="text-amber-500/80 font-semibold text-[10px]">{obs.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Insight Section for Rawatib */}
            <PrayerInsightCard
              prayerId={habit.id}
              prayerName={displayName}
              logs={habitLogs}
              language={preferences.language}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {isArabic ? 'نوع العادة غير مدعوم' : 'Unsupported habit type'}
            </p>
          </div>
        )}

        {/* Settings Section */}
        <div className="bg-card rounded-xl border border-slate-800 p-4">
          <HabitSettingsSection
            habit={habit}
            language={preferences.language}
            onClose={() => navigate('/')}
          />
        </div>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 py-3 flex items-center justify-center">
          <button
            onClick={() => navigate('/')}
            className="w-full max-w-md py-3 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={18} />
            {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitDetails;
