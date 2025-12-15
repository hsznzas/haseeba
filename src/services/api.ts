import { supabase, supabaseAdmin } from './supabaseClient';
import { Habit, HabitLog, UserPreferences, DEFAULT_PREFERENCES } from '../../types';
import { INITIAL_HABITS } from '../../constants';

// ==========================================
// API LAYER FOR SUPABASE (REAL USERS ONLY)
// ==========================================

// --- HELPER FUNCTIONS ---

/**
 * Converts a timestamp to local date string (YYYY-MM-DD)
 * Fixes timezone issues by using local time instead of UTC
 */
const toLocalDateString = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- GLOBAL STATS (PUBLIC - NO AUTH REQUIRED) ---
export interface GlobalStats {
  totalHabitsLogged: number;
  totalAiInsights: number;
}

// --- ADMIN DASHBOARD STATS ---
export interface AdminStats {
  users: {
    total: number;
    activeToday: number;
  };
  logs: {
    last24h: number;
    last48h: number;
    last7d: number;
    last30d: number;
    total: number;
  };
  content: {
    totalHabits: number;
    totalAiInsights: number;
  };
  quality: {
    doneCount: number;
    failCount: number;
    failureRate: number;
  };
  topReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export interface DailyActivityData {
  date: string;
  count: number;
}

export interface HourlyActivityData {
  hour: number;
  count: number;
}

export interface StackedActivityData {
  date: string;
  success: number;
  failed: number;
}

export interface HeatmapData {
  day: number; // 0-6 (Mon-Sun)
  hour: number; // 0-23
  count: number;
}

export interface RecentLog {
  id: string;
  status: string;
  created_at: string;
  habit_id: string;
}

export interface AIAdoptionData {
  totalUsers: number;
  usersWithApiKey: number;
  adoptionRate: number;
}

export interface VolumeHistoryData {
  today: number;
  yesterday: number;
  threeDaysAgo: number;
  sevenDaysAgo: number;
  twoWeeksAgo: number;
  oneMonthAgo: number;
}

export interface SimpleLog {
  id: string;
  habit_id: string;
  created_at: string;
}

export interface EnhancedStats extends AdminStats {
  trends: {
    logsVsYesterday: number; // % change
    activeUsersVsYesterday: number;
    successRateVsYesterday: number;
    aiInsightsVsYesterday: number;
  };
  sparklines: {
    logs: number[]; // Last 30 days
    users: number[];
    successRate: number[];
    aiInsights: number[];
  };
}

export const getGlobalStats = async (): Promise<GlobalStats> => {
  try {
    // Get total habit logs count (real number from database)
    const { count: logsCount, error: logsError } = await supabase
      .from('habit_logs')
      .select('*', { count: 'exact', head: true });

    if (logsError) {
      console.error('Error fetching logs count:', logsError);
    }

    // Get total AI insight generations (real number from database)
    const { count: insightsCount, error: insightsError } = await supabase
      .from('ai_insight_logs')
      .select('*', { count: 'exact', head: true });

    if (insightsError) {
      console.error('Error fetching insights count:', insightsError);
    }

    return {
      totalHabitsLogged: logsCount ?? 0,
      totalAiInsights: insightsCount ?? 0,
    };
  } catch (err) {
    console.error('Error fetching global stats:', err);
    return { totalHabitsLogged: 0, totalAiInsights: 0 };
  }
};

// --- ADMIN STATS ---
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Query 1: Total logs count
    const { count: totalLogs } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true });

    // Query 2: Logs in last 24h
    const { count: logs24h } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24h);

    // Query 3: Logs in last 48h
    const { count: logs48h } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last48h);

    // Query 4: Logs in last 7d
    const { count: logs7d } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7d);

    // Query 5: Logs in last 30d
    const { count: logs30d } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last30d);

    // Query 6: Active users today (distinct user_ids with logs in last 24h)
    const { data: activeUsersData } = await supabaseAdmin
      .from('habit_logs')
      .select('user_id')
      .gte('created_at', last24h);
    
    const activeToday = activeUsersData 
      ? new Set(activeUsersData.map(log => log.user_id)).size 
      : 0;

    // Query 7: Total habits count
    const { count: totalHabits } = await supabaseAdmin
      .from('habits')
      .select('*', { count: 'exact', head: true });

    // Query 8: AI insights count
    const { count: totalAiInsights } = await supabaseAdmin
      .from('ai_insight_logs')
      .select('*', { count: 'exact', head: true });

    // Query 9: Quality metrics (DONE vs FAIL)
    const { data: qualityData } = await supabaseAdmin
      .from('habit_logs')
      .select('status');

    const doneCount = qualityData?.filter(log => log.status === 'DONE').length ?? 0;
    const failCount = qualityData?.filter(log => log.status === 'FAIL').length ?? 0;
    const totalQualityLogs = doneCount + failCount;
    const failureRate = totalQualityLogs > 0 ? Math.round((failCount / totalQualityLogs) * 100) : 0;

    // Query 10: Top reasons from custom_reasons
    const { data: reasonsData } = await supabaseAdmin
      .from('custom_reasons')
      .select('reason_text');

    const reasonCounts: Record<string, number> = {};
    reasonsData?.forEach(item => {
      const reason = item.reason_text.trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    // Query 11: Total users (try to get from auth, fallback to distinct user_ids)
    let totalUsers = 0;
    try {
      // Using supabaseAdmin to bypass RLS and get all users
      const { data: allLogs } = await supabaseAdmin
        .from('habit_logs')
        .select('user_id');
      totalUsers = allLogs ? new Set(allLogs.map(log => log.user_id)).size : 0;
    } catch (err) {
      console.warn('Could not fetch total users:', err);
    }

    return {
      users: {
        total: totalUsers,
        activeToday,
      },
      logs: {
        last24h: logs24h ?? 0,
        last48h: logs48h ?? 0,
        last7d: logs7d ?? 0,
        last30d: logs30d ?? 0,
        total: totalLogs ?? 0,
      },
      content: {
        totalHabits: totalHabits ?? 0,
        totalAiInsights: totalAiInsights ?? 0,
      },
      quality: {
        doneCount,
        failCount,
        failureRate,
      },
      topReasons,
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return {
      users: { total: 0, activeToday: 0 },
      logs: { last24h: 0, last48h: 0, last7d: 0, last30d: 0, total: 0 },
      content: { totalHabits: 0, totalAiInsights: 0 },
      quality: { doneCount: 0, failCount: 0, failureRate: 0 },
      topReasons: [],
    };
  }
};

export const getActivityTrend = async (days: 7 | 30 | 'all' = 30): Promise<DailyActivityData[]> => {
  try {
    const now = new Date();
    const startDate = days === 'all' 
      ? new Date('2020-01-01') 
      : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = toLocalDateString(startDate);

    // Fetch all logs within the date range
    const { data: logsData } = await supabaseAdmin
      .from('habit_logs')
      .select('log_date')
      .gte('log_date', startDateStr)
      .order('log_date', { ascending: false }) // Get NEWEST logs first to include recent dates
      .limit(100000); // Increase limit to fetch all logs (default is 1000)

    if (!logsData) return [];

    // Group logs by date - NORMALIZE log_date values to YYYY-MM-DD format
    const dateCounts: Record<string, number> = {};
    logsData.forEach(log => {
      // Normalize log_date to YYYY-MM-DD format regardless of what Supabase returns
      const normalizedDate = toLocalDateString(log.log_date);
      dateCounts[normalizedDate] = (dateCounts[normalizedDate] || 0) + 1;
    });

    // Create array with all dates (fill missing dates with 0)
    const result: DailyActivityData[] = [];
    const daysToShow = days === 'all' ? 365 : days;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toLocalDateString(date);
      result.push({
        date: dateStr,
        count: dateCounts[dateStr] || 0,
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching activity trend:', err);
    return [];
  }
};

export const getHourlyActivity = async (): Promise<HourlyActivityData[]> => {
  try {
    const now = new Date();
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    // Fetch logs from last 48 hours with timestamps
    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('created_at')
      .gte('created_at', last48h);

    if (!logsData) return [];

    // Group by hour
    const hourCounts: Record<number, number> = {};
    logsData.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Create array for all 24 hours
    const result: HourlyActivityData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        hour,
        count: hourCounts[hour] || 0,
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching hourly activity:', err);
    return [];
  }
};

export const getStackedActivityData = async (days: number = 14): Promise<StackedActivityData[]> => {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = toLocalDateString(startDate);

    const { data: logsData } = await supabaseAdmin
      .from('habit_logs')
      .select('log_date, status')
      .gte('log_date', startDateStr)
      .order('log_date', { ascending: false }) // Get NEWEST logs first to include recent dates
      .limit(100000); // Increase limit to fetch all logs (default is 1000)

    if (!logsData) return [];

    // Group by date and status - NORMALIZE log_date values to YYYY-MM-DD format
    const dateMap: Record<string, { success: number; failed: number }> = {};
    logsData.forEach(log => {
      // Normalize log_date to YYYY-MM-DD format regardless of what Supabase returns
      const normalizedDate = toLocalDateString(log.log_date);
      if (!dateMap[normalizedDate]) {
        dateMap[normalizedDate] = { success: 0, failed: 0 };
      }
      const entry = dateMap[normalizedDate];
      if (log.status === 'DONE') {
        entry!.success++;
      } else if (log.status === 'FAIL') {
        entry!.failed++;
      }
    });

    // Create array with all dates
    const result: StackedActivityData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toLocalDateString(date);
      result.push({
        date: dateStr,
        success: dateMap[dateStr]?.success || 0,
        failed: dateMap[dateStr]?.failed || 0,
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching stacked activity:', err);
    return [];
  }
};

export const getHeatmapData = async (): Promise<HeatmapData[]> => {
  try {
    const now = new Date();
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('created_at')
      .gte('created_at', last7days);

    if (!logsData) return [];

    // Group by day of week and hour
    const heatMap: Record<string, number> = {};
    logsData.forEach(log => {
      const date = new Date(log.created_at);
      const day = (date.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      heatMap[key] = (heatMap[key] || 0) + 1;
    });

    // Create array for all combinations
    const result: HeatmapData[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        result.push({
          day,
          hour,
          count: heatMap[key] || 0,
        });
      }
    }

    return result;
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    return [];
  }
};

export const getRecentLogs = async (limit: number = 5): Promise<RecentLog[]> => {
  try {
    const { data } = await supabase
      .from('habit_logs')
      .select('id, status, created_at, habit_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (err) {
    console.error('Error fetching recent logs:', err);
    return [];
  }
};

export const getEnhancedStats = async (): Promise<EnhancedStats> => {
  try {
    const baseStats = await getAdminStats();
    const now = new Date();
    
    // Get yesterday's and day before date strings
    const getDateString = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return toLocalDateString(d);
    };
    
    const yesterday = getDateString(1);
    const dayBefore = getDateString(2);
    
    const { count: logsYesterday } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('log_date', yesterday);
    
    const { count: logsDayBefore } = await supabaseAdmin
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('log_date', dayBefore);

    // Calculate trends
    const logsVsYesterday = logsDayBefore && logsDayBefore > 0
      ? Math.round(((logsYesterday || 0) - logsDayBefore) / logsDayBefore * 100)
      : 0;

    // Get 30-day sparkline data
    const sparklineData = await getActivityTrend(30);
    const logsSparkline = sparklineData.map(d => d.count);

    return {
      ...baseStats,
      trends: {
        logsVsYesterday,
        activeUsersVsYesterday: 0, // Simplified for now
        successRateVsYesterday: 0,
        aiInsightsVsYesterday: 0,
      },
      sparklines: {
        logs: logsSparkline,
        users: [],
        successRate: [],
        aiInsights: [],
      },
    };
  } catch (err) {
    console.error('Error fetching enhanced stats:', err);
    const baseStats = await getAdminStats();
    return {
      ...baseStats,
      trends: {
        logsVsYesterday: 0,
        activeUsersVsYesterday: 0,
        successRateVsYesterday: 0,
        aiInsightsVsYesterday: 0,
      },
      sparklines: {
        logs: [],
        users: [],
        successRate: [],
        aiInsights: [],
      },
    };
  }
};

export const getAIAdoption = async (): Promise<AIAdoptionData> => {
  try {
    // Get total users from user_preferences
    const { data: allUsers } = await supabaseAdmin
      .from('user_preferences')
      .select('user_id');

    // Get users who have generated at least one AI insight
    const { data: insightUsers } = await supabaseAdmin
      .from('ai_insight_logs')
      .select('user_id');

    const totalUsers = allUsers?.length || 0;
    const uniqueAIUsers = insightUsers 
      ? new Set(insightUsers.map(log => log.user_id)).size 
      : 0;
    
    const adoptionRate = totalUsers > 0 
      ? Math.round((uniqueAIUsers / totalUsers) * 100) 
      : 0;

    return {
      totalUsers,
      usersWithApiKey: uniqueAIUsers, // Now represents "users who have used AI"
      adoptionRate,
    };
  } catch (err) {
    console.error('Error fetching AI adoption:', err);
    return { totalUsers: 0, usersWithApiKey: 0, adoptionRate: 0 };
  }
};

export const getVolumeHistory = async (): Promise<VolumeHistoryData> => {
  try {
    const now = new Date();
    
    // Get date strings (YYYY-MM-DD) for each period using local timezone
    const getDateString = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return toLocalDateString(d);
    };

    const dates = {
      today: getDateString(0),
      yesterday: getDateString(1),
      threeDaysAgo: getDateString(3),
      sevenDaysAgo: getDateString(7),
      twoWeeksAgo: getDateString(14),
      oneMonthAgo: getDateString(30),
    };

    // Use .gte() for cumulative counts (all logs since that date)
    // This makes numbers increase as timeframe gets larger (correct behavior)
    const counts = await Promise.all([
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.today),
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.yesterday),
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.threeDaysAgo),
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.sevenDaysAgo),
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.twoWeeksAgo),
      supabaseAdmin.from('habit_logs').select('*', { count: 'exact', head: true }).gte('log_date', dates.oneMonthAgo),
    ]);

    return {
      today: counts[0].count ?? 0,
      yesterday: counts[1].count ?? 0,
      threeDaysAgo: counts[2].count ?? 0,
      sevenDaysAgo: counts[3].count ?? 0,
      twoWeeksAgo: counts[4].count ?? 0,
      oneMonthAgo: counts[5].count ?? 0,
    };
  } catch (err) {
    console.error('Error fetching volume history:', err);
    return {
      today: 0,
      yesterday: 0,
      threeDaysAgo: 0,
      sevenDaysAgo: 0,
      twoWeeksAgo: 0,
      oneMonthAgo: 0,
    };
  }
};

export const getTotalVolumeTrend = async (days: number = 30): Promise<DailyActivityData[]> => {
  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = toLocalDateString(startDate);

    // NEW: Server-side aggregation via RPC (No 1000-row limit)
    const { data, error } = await supabaseAdmin.rpc('get_daily_log_counts', {
      start_date: startDateStr
    });

    if (error) {
      console.error('Error fetching volume trend via RPC:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('No data returned from RPC');
      return [];
    }

    // Convert RPC results to lookup object
    const dateCounts: Record<string, number> = {};
    data.forEach((row: any) => {
      const normalizedDate = toLocalDateString(row.log_date);
      dateCounts[normalizedDate] = row.count;
    });

    // Create array with all dates (fill missing dates with 0)
    const result: DailyActivityData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toLocalDateString(date);
      result.push({
        date: dateStr,
        count: dateCounts[dateStr] || 0,
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching total volume trend:', err);
    return [];
  }
};

export const getSimplifiedLogs = async (limit: number = 5): Promise<SimpleLog[]> => {
  try {
    const { data } = await supabaseAdmin
      .from('habit_logs')
      .select('id, habit_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (err) {
    console.error('Error fetching simplified logs:', err);
    return [];
  }
};

// --- PRAYER/RAWATIB LOG RESET (For gender switching) ---
// These IDs match constants.ts INITIAL_HABITS
const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const RAWATIB_IDS = [
  'fajr_sunnah',
  'dhuhr_sunnah_before_1',
  'dhuhr_sunnah_before_2',
  'dhuhr_sunnah_after',
  'maghrib_sunnah',
  'isha_sunnah',
];
const PRAYER_AND_RAWATIB_IDS = [...PRAYER_IDS, ...RAWATIB_IDS];

export const resetPrayerLogs = async (userId: string): Promise<void> => {
  try {
    console.log('🗑️ Resetting prayer and rawatib logs for user:', userId);
    
    // Delete all logs for the 5 prayers and their rawatib
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .in('habit_id', PRAYER_AND_RAWATIB_IDS);

    if (error) {
      console.error('❌ Error resetting prayer logs:', error);
      throw error;
    }
    
    console.log('✅ Prayer and rawatib logs reset successfully');
  } catch (err) {
    console.error('❌ Unexpected error in resetPrayerLogs:', err);
    throw err;
  }
};

// Wrapper function
export const resetPrayerLogsForCurrentUser = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  return resetPrayerLogs(userId);
};

// --- CREATE EXCUSED LOGS FOR TODAY ---
export const createExcusedLogsForToday = async (userId: string): Promise<void> => {
  try {
    const today = toLocalDateString(new Date());
    console.log('🌙 Creating excused logs for today:', today);
    
    // Check which prayers already have logs for today
    const { data: existingLogs, error: fetchError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('log_date', today)
      .in('habit_id', PRAYER_IDS);

    if (fetchError) {
      console.error('❌ Error checking existing logs:', fetchError);
      throw fetchError;
    }

    const existingHabitIds = new Set(existingLogs?.map(l => l.habit_id) || []);
    const prayersToCreate = PRAYER_IDS.filter(id => !existingHabitIds.has(id));

    if (prayersToCreate.length === 0) {
      console.log('✅ All prayers already logged for today');
      return;
    }

    // Create excused logs for missing prayers
    const logsToInsert = prayersToCreate.map(habitId => ({
      user_id: userId,
      id: `${habitId}-${today}`,
      habit_id: habitId,
      log_date: today,
      value: 0, // Excused prayers have no quality value
      status: 'EXCUSED',
      notes: null,
      reason: null,
    }));

    const { error: insertError } = await supabase
      .from('habit_logs')
      .upsert(logsToInsert, { onConflict: 'user_id, id' });

    if (insertError) {
      console.error('❌ Error creating excused logs:', insertError);
      throw insertError;
    }

    console.log(`✅ Created ${logsToInsert.length} excused logs for today`);
  } catch (err) {
    console.error('❌ Unexpected error in createExcusedLogsForToday:', err);
    throw err;
  }
};

// Wrapper function
export const createExcusedLogsForCurrentUser = async (): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  await createExcusedLogsForToday(userId);
  return getLogs();
};

// --- AI INSIGHT TRACKING ---
export const logAiInsightGeneration = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_insight_logs')
      .insert({ user_id: userId });

    if (error) {
      console.error('Error logging AI insight:', error);
    }
  } catch (err) {
    console.error('Error in logAiInsightGeneration:', err);
  }
};

// --- USER PREFERENCES (SUPABASE OPERATIONS) ---
export const supabaseGetPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching preferences:', error);
      return DEFAULT_PREFERENCES;
    }

    if (!data) {
      // Create default preferences for new user
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          language: DEFAULT_PREFERENCES.language,
          gender: DEFAULT_PREFERENCES.gender,
          is_excused: DEFAULT_PREFERENCES.isExcused,
          show_hijri: DEFAULT_PREFERENCES.showHijri,
          date_of_birth: DEFAULT_PREFERENCES.dateOfBirth,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return DEFAULT_PREFERENCES;
      }

      return {
        language: newPrefs.language,
        gender: newPrefs.gender,
        isExcused: newPrefs.is_excused ?? false,
        showHijri: newPrefs.show_hijri,
        dateOfBirth: newPrefs.date_of_birth,
      };
    }

    return {
      language: data.language,
      gender: data.gender,
      isExcused: data.is_excused ?? false,
      showHijri: data.show_hijri,
      dateOfBirth: data.date_of_birth,
    };
  } catch (err) {
    console.error('Unexpected error in syncUserPreferences:', err);
    return DEFAULT_PREFERENCES;
  }
};

export const supabaseSavePreferences = async (
  userId: string,
  prefs: UserPreferences
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        language: prefs.language,
        gender: prefs.gender,
        is_excused: prefs.isExcused ?? false,
        show_hijri: prefs.showHijri,
        date_of_birth: prefs.dateOfBirth,
      });

    if (error) {
      console.error('Error saving preferences:', error);
    }
  } catch (err) {
    console.error('Unexpected error in saveUserPreferences:', err);
  }
};

// --- HABITS (SUPABASE OPERATIONS) ---
export const supabaseGetHabits = async (userId: string): Promise<Habit[]> => {
  try {
    console.log('📥 Fetching habits from Supabase for user:', userId);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching habits from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      // First-time user: seed with INITIAL_HABITS
      console.log('🌱 New user detected (0 habits). Seeding INITIAL_HABITS...');
      const today = new Date().toISOString().split('T')[0]; // Seed habits start from today
      const habitsToInsert = INITIAL_HABITS.map(h => ({
        user_id: userId,
        id: h.id, // Pass preset IDs as-is (e.g., 'fajr', 'dhuhr')
        name: h.name,
        name_ar: h.nameAr,
        type: h.type,
        emoji: h.emoji,
        daily_target: h.dailyTarget,
        preset_id: h.id, // Mark as preset using the habit ID
        is_active: h.isActive !== undefined ? h.isActive : true, // Default to true if not specified
        require_reason: h.requireReason !== undefined ? h.requireReason : false, // Sync requireReason toggle
        affects_score: h.affectsScore !== undefined ? h.affectsScore : true, // Default to true
        order_index: h.order, // Frontend 'order' -> DB 'order_index'
        start_date: today, // Preset habits start from today for new users
      }));

      console.log(`🌱 Inserting ${habitsToInsert.length} initial habits...`);
      const { data: newHabits, error: insertError } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error seeding habits:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully seeded ${newHabits?.length || 0} habits`);
      return (newHabits || []).map(dbHabit => ({
        id: dbHabit.id,
        name: dbHabit.name,
        nameAr: dbHabit.name_ar,
        type: dbHabit.type,
        emoji: dbHabit.emoji,
        dailyTarget: dbHabit.daily_target,
        presetId: dbHabit.preset_id,
        isActive: dbHabit.is_active,
        requireReason: dbHabit.require_reason, // Sync requireReason toggle
        affectsScore: dbHabit.affects_score !== undefined ? dbHabit.affects_score : true, // Default to true
        order: dbHabit.order_index, // DB 'order_index' -> Frontend 'order'
        startDate: dbHabit.start_date, // When habit tracking began
      }));
    }

    console.log(`✅ Fetched ${data.length} habits from Supabase`);
    return data.map(dbHabit => ({
      id: dbHabit.id,
      name: dbHabit.name,
      nameAr: dbHabit.name_ar,
      type: dbHabit.type,
      emoji: dbHabit.emoji,
      dailyTarget: dbHabit.daily_target,
      presetId: dbHabit.preset_id,
      isActive: dbHabit.is_active,
      requireReason: dbHabit.require_reason, // Sync requireReason toggle
      affectsScore: dbHabit.affects_score !== undefined ? dbHabit.affects_score : true, // Default to true
      order: dbHabit.order_index, // DB 'order_index' -> Frontend 'order'
      startDate: dbHabit.start_date, // When habit tracking began
    }));
  } catch (err) {
    console.error('❌ Unexpected error in fetchHabits:', err);
    throw err;
  }
};

export const supabaseSaveHabit = async (userId: string, habit: Habit): Promise<void> => {
  try {
    console.log('💾 Upserting habit to Supabase:', { id: habit.id, name: habit.name, isActive: habit.isActive, requireReason: habit.requireReason, affectsScore: habit.affectsScore, startDate: habit.startDate });
    const { error } = await supabase
      .from('habits')
      .upsert({
        user_id: userId,
        id: habit.id, // Pass ID as-is (no UUID generation for preset habits like 'fajr')
        name: habit.name,
        name_ar: habit.nameAr,
        type: habit.type,
        emoji: habit.emoji,
        daily_target: habit.dailyTarget,
        preset_id: habit.presetId,
        is_active: habit.isActive,
        require_reason: habit.requireReason, // Sync requireReason toggle
        affects_score: habit.affectsScore !== undefined ? habit.affectsScore : true, // Default to true
        order_index: habit.order, // Frontend 'order' -> DB 'order_index'
        start_date: habit.startDate, // When the habit tracking began
      }, {
        onConflict: 'user_id,id' // Composite primary key
      });

    if (error) {
      console.error('❌ Error saving habit to Supabase:', error);
      throw error;
    }
    console.log('✅ Habit upserted successfully to Supabase');
  } catch (err) {
    console.error('❌ Unexpected error in saveHabit:', err);
    throw err;
  }
};

// --- HABIT LOGS (SUPABASE OPERATIONS) ---
// IMPORTANT: Frontend uses 'date', DB uses 'log_date'
export const supabaseGetLogs = async (userId: string): Promise<HabitLog[]> => {
  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }

    return (data || []).map(dbLog => ({
      id: dbLog.id, // DB 'id' -> Frontend 'id'
      habitId: dbLog.habit_id,
      date: dbLog.log_date, // DB column -> Frontend property
      value: dbLog.value,
      status: dbLog.status,
      notes: dbLog.notes,
      reason: dbLog.reason, // Why was prayer missed/low quality or habit failed
      timestamp: new Date(dbLog.created_at).getTime(),
    }));
  } catch (err) {
    console.error('Unexpected error in fetchLogs:', err);
    return [];
  }
};

export const supabaseSaveLog = async (userId: string, log: HabitLog): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habit_logs')
      .upsert({
        user_id: userId,
        id: log.id,
        habit_id: log.habitId,
        log_date: log.date,
        value: log.value,
        status: log.status,
        notes: log.notes,
        reason: log.reason,
      }, {
        onConflict: 'user_id, id'
      });

    if (error) {
      console.error('❌ Error saving log to Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in saveLog:', err);
    throw err;
  }
};

export const supabaseDeleteLog = async (
  userId: string,
  habitId: string,
  date: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('log_date', date); // Use composite key columns

    if (error) {
      console.error('❌ Error deleting log from Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in deleteLog:', err);
    throw err;
  }
};

// ==========================================
// WRAPPER FUNCTIONS (MATCH STORAGE.TS INTERFACE)
// ==========================================
// These functions automatically get the user ID and match
// the localStorage function signatures for easy routing

const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
};

export const getPreferences = async (): Promise<UserPreferences> => {
  const userId = await getCurrentUserId();
  return supabaseGetPreferences(userId);
};

export const savePreferences = async (prefs: UserPreferences): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseSavePreferences(userId, prefs);
};

export const getHabits = async (): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetHabits(userId);
};

export const saveHabit = async (habit: Habit): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  console.log('🔄 API saveHabit: Starting for habit', habit.id);
  await supabaseSaveHabit(userId, habit);
  console.log('🔄 API saveHabit: Fetching updated habits list...');
  const updatedHabits = await getHabits();
  console.log(`✅ API saveHabit: Returning ${updatedHabits.length} habits`);
  return updatedHabits;
};

export const deleteHabit = async (habitId: string): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  console.log('🗑️ API deleteHabit: Deleting habit', habitId);
  
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('user_id', userId)
      .eq('id', habitId);

    if (error) {
      console.error('❌ Error deleting habit from Supabase:', error);
      throw error;
    }
    
    console.log('✅ Habit deleted from Supabase (logs cascade-deleted automatically)');
    const updatedHabits = await getHabits();
    console.log(`✅ API deleteHabit: Returning ${updatedHabits.length} habits`);
    return updatedHabits;
  } catch (err) {
    console.error('❌ Unexpected error in deleteHabit:', err);
    throw err;
  }
};

export const getLogs = async (): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetLogs(userId);
};

export const saveLog = async (log: HabitLog): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  await supabaseSaveLog(userId, log);
  return getLogs();
};

export const deleteLog = async (habitId: string, date: string): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  await supabaseDeleteLog(userId, habitId, date);
  return getLogs();
};

export const getLogForDate = async (habitId: string, date: string): Promise<HabitLog | undefined> => {
  const logs = await getLogs();
  return logs.find(l => l.habitId === habitId && l.date === date);
};

// ==========================================
// CUSTOM REASONS (CLOUD STORAGE)
// ==========================================

import { CustomReason } from '../../types';

export const supabaseGetCustomReasons = async (userId: string): Promise<CustomReason[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_reasons')
      .select('id, reason_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching custom reasons:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      reason_text: row.reason_text,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error('Unexpected error in fetchCustomReasons:', err);
    return [];
  }
};

export const supabaseSaveCustomReason = async (userId: string, reason: CustomReason): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_reasons')
      .upsert({
        id: reason.id,
        user_id: userId,
        reason_text: reason.reason_text.trim(),
      });

    if (error) {
      console.error('❌ Error saving custom reason to Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in saveCustomReason:', err);
    throw err;
  }
};

export const supabaseDeleteCustomReason = async (userId: string, reasonId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_reasons')
      .delete()
      .eq('id', reasonId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting custom reason from Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in deleteCustomReason:', err);
    throw err;
  }
};

// Wrapper functions
export const getCustomReasons = async (): Promise<CustomReason[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetCustomReasons(userId);
};

export const saveCustomReason = async (reason: CustomReason): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseSaveCustomReason(userId, reason);
};

export const deleteCustomReason = async (reasonId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseDeleteCustomReason(userId, reasonId);
};

// --- BATCH UPDATE HABIT ORDER ---
export const updateHabitOrder = async (habits: Habit[]): Promise<void> => {
  const userId = await getCurrentUserId();
  console.log('📦 Batch updating habit order for', habits.length, 'habits');
  
  try {
    // Update each habit's order_index based on array position
    const updates = habits.map((habit, index) => ({
      user_id: userId,
      id: habit.id,
      name: habit.name,
      name_ar: habit.nameAr,
      type: habit.type,
      emoji: habit.emoji,
      daily_target: habit.dailyTarget,
      preset_id: habit.presetId,
      is_active: habit.isActive,
      require_reason: habit.requireReason,
      affects_score: habit.affectsScore !== undefined ? habit.affectsScore : true,
      order_index: index, // New order based on array position
      start_date: habit.startDate, // Preserve startDate
    }));

    const { error } = await supabase
      .from('habits')
      .upsert(updates, { onConflict: 'user_id,id' });

    if (error) {
      console.error('❌ Error updating habit order:', error);
      throw error;
    }
    
    console.log('✅ Habit order updated successfully');
  } catch (err) {
    console.error('❌ Unexpected error in updateHabitOrder:', err);
    throw err;
  }
};
