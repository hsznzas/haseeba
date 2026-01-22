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
  // Raw daily counts for tooltip detail
  rawTakbirah: number;
  rawJamaa: number;
  rawOnTime: number;
  rawMissed: number;
}

interface RawDayData {
  takbirah: number;
  jamaa: number;
  onTime: number;
  missed: number;
}

const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ROLLING_WINDOW = 7;

/**
 * Calculate 7-day rolling average for smoother trend visualization.
 * For days with less than 7 days of history, uses available days.
 */
const calculateRollingAverage = (
  rawData: RawDayData[],
  currentIndex: number
): { takbirah: number; jamaa: number; onTime: number; missed: number } => {
  const startIdx = Math.max(0, currentIndex - ROLLING_WINDOW + 1);
  const windowSize = currentIndex - startIdx + 1;
  
  let sumTakbirah = 0;
  let sumJamaa = 0;
  let sumOnTime = 0;
  let sumMissed = 0;
  
  for (let i = startIdx; i <= currentIndex; i++) {
    sumTakbirah += rawData[i].takbirah;
    sumJamaa += rawData[i].jamaa;
    sumOnTime += rawData[i].onTime;
    sumMissed += rawData[i].missed;
  }
  
  return {
    takbirah: Math.round((sumTakbirah / windowSize) * 10) / 10,
    jamaa: Math.round((sumJamaa / windowSize) * 10) / 10,
    onTime: Math.round((sumOnTime / windowSize) * 10) / 10,
    missed: Math.round((sumMissed / windowSize) * 10) / 10,
  };
};

/**
 * Hook to process prayer logs for the last 90 days into trend data
 * with 7-day rolling averages for smooth visualization.
 */
export const usePrayerTrends = (logs: HabitLog[], days: number = 90): PrayerTrendDataPoint[] => {
  return useMemo(() => {
    const today = new Date();
    
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
    
    // First pass: collect raw daily counts
    const rawData: (RawDayData & { dateStr: string; displayDate: string })[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(today, days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'MMM d');
      
      const dayLogs = logsByDate[dateStr] || [];
      
      rawData.push({
        dateStr,
        displayDate,
        takbirah: dayLogs.filter(l => l.value === PrayerQuality.TAKBIRAH).length,
        jamaa: dayLogs.filter(l => l.value === PrayerQuality.JAMAA).length,
        onTime: dayLogs.filter(l => l.value === PrayerQuality.ON_TIME).length,
        missed: dayLogs.filter(l => l.value === PrayerQuality.MISSED).length,
      });
    }
    
    // Second pass: calculate rolling averages
    const dataPoints: PrayerTrendDataPoint[] = rawData.map((day, index) => {
      const avg = calculateRollingAverage(rawData, index);
      
      return {
        date: day.dateStr,
        displayDate: day.displayDate,
        takbirah: avg.takbirah,
        jamaa: avg.jamaa,
        onTime: avg.onTime,
        missed: avg.missed,
        rawTakbirah: day.takbirah,
        rawJamaa: day.jamaa,
        rawOnTime: day.onTime,
        rawMissed: day.missed,
      };
    });
    
    return dataPoints;
  }, [logs, days]);
};

export default usePrayerTrends;
