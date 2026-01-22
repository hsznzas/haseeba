import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { HabitLog, PrayerQuality } from '../../types';

export interface PrayerTrendDataPoint {
  date: string;
  displayDate: string;
  takbirah: number;
  jamaa: number;
  onTime: number;
  missed: number;
}

const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Hook to process prayer logs for the last 90 days into trend data
 * for visualization in a line chart.
 */
export const usePrayerTrends = (logs: HabitLog[], days: number = 90): PrayerTrendDataPoint[] => {
  return useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, days - 1);
    
    // Filter to only prayer logs
    const prayerLogs = logs.filter(l => PRAYER_IDS.includes(l.habitId));
    
    // Group logs by date
    const logsByDate: Record<string, HabitLog[]> = {};
    prayerLogs.forEach(log => {
      if (!logsByDate[log.date]) {
        logsByDate[log.date] = [];
      }
      logsByDate[log.date].push(log);
    });
    
    // Generate data points for each day in the range
    const dataPoints: PrayerTrendDataPoint[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(today, days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'MMM d');
      
      const dayLogs = logsByDate[dateStr] || [];
      
      // Count each quality level
      const takbirah = dayLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length;
      const jamaa = dayLogs.filter(l => l.value === PrayerQuality.JAMAA).length;
      const onTime = dayLogs.filter(l => l.value === PrayerQuality.ON_TIME).length;
      const missed = dayLogs.filter(l => l.value === PrayerQuality.MISSED).length;
      
      dataPoints.push({
        date: dateStr,
        displayDate,
        takbirah,
        jamaa,
        onTime,
        missed,
      });
    }
    
    return dataPoints;
  }, [logs, days]);
};

export default usePrayerTrends;
