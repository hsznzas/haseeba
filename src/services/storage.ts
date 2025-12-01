// @ts-nocheck
/**
 * Local Storage Service
 * 
 * Typed wrapper around localStorage for Guest/Demo mode.
 * Provides CRUD operations for all data types with proper error handling.
 */

import {
  Habit,
  HabitCompletion,
  HabitLog,
  LogStatus,
  PrayerCompletion,
  PrayerQuality,
  QuranProgress,
  User,
  UserPreferences,
  STORAGE_KEYS,
  StorageKey,
  HabitType,
} from "@/index";
import { INITIAL_HABITS } from "../../constants";
import { generateId, getTodayString } from "@/lib/utils";

// ============================================
// Core Storage Utilities
// ============================================

/**
 * Safely parse JSON from localStorage
 */
function safeGetItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`[Storage] Error reading ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Safely set JSON in localStorage
 */
function safeSetItem<T>(key: StorageKey, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Error writing ${key}:`, error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("[Storage] localStorage quota exceeded");
    }
    return false;
  }
}

/**
 * Remove item from localStorage
 */
function removeItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
  }
}

/**
 * Clear all Haseeb data from localStorage
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeItem(key);
  });
}

// ============================================
// User Storage
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  language: "en",
  theme: "dark",
  notifications: true,
  prayerReminders: true,
  dailyGoalReminder: true,
  reminderTime: "08:00",
  hijriDateDisplay: true,
  showHijri: true,
};

/**
 * Create a demo user for guest mode
 */
export function createDemoUser(): User {
  const now = new Date().toISOString();
  const user: User = {
    id: `demo-${generateId()}`,
    email: "guest@haseeb.app",
    name: "Guest",
    isDemo: true,
    createdAt: now,
    updatedAt: now,
    preferences: DEFAULT_PREFERENCES,
  };
  safeSetItem(STORAGE_KEYS.USER, user);
  return user;
}

/**
 * Get stored user
 */
export function getUser(): User | null {
  return safeGetItem<User | null>(STORAGE_KEYS.USER, null);
}

/**
 * Save user to storage
 */
export function saveUser(user: User): boolean {
  return safeSetItem(STORAGE_KEYS.USER, {
    ...user,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update user preferences
 */
export function updatePreferences(preferences: Partial<UserPreferences>): boolean {
  const user = getUser();
  if (!user) return false;
  
  return saveUser({
    ...user,
    preferences: { ...user.preferences, ...preferences },
  });
}

/**
 * Get user preferences from storage
 */
export function getPreferences(): UserPreferences {
  const user = getUser();
  const defaultPrefs: UserPreferences = {
    language: 'ar',
    theme: 'dark',
    notifications: true,
    prayerReminders: true,
    dailyGoalReminder: true,
    reminderTime: '08:00',
    hijriDateDisplay: true,
    showHijri: true,
  };
  return user?.preferences ?? defaultPrefs;
}

/**
 * Save user preferences to storage
 */
export function savePreferences(preferences: UserPreferences): boolean {
  return updatePreferences(preferences);
}

/**
 * Clear user session
 */
export function clearUser(): void {
  removeItem(STORAGE_KEYS.USER);
}

// ============================================
// Habits Storage
// ============================================

/**
 * Get all habits
 */
export function getHabits(): Habit[] {
  return safeGetItem<Habit[]>(STORAGE_KEYS.HABITS, []);
}

/**
 * Get habit by ID
 */
export function getHabitById(id: string): Habit | undefined {
  return getHabits().find((h) => h.id === id);
}

/**
 * Get active (non-archived) habits
 */
export function getActiveHabits(): Habit[] {
  return getHabits()
    .filter((h) => !h.isArchived)
    .sort((a, b) => a.order - b.order);
}

/**
 * Save a new habit
 */
export function createHabit(habit: Omit<Habit, "id" | "createdAt" | "updatedAt">): Habit {
  const habits = getHabits();
  const now = new Date().toISOString();
  
  const newHabit: Habit = {
    ...habit,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    order: habits.length,
  };
  
  safeSetItem(STORAGE_KEYS.HABITS, [...habits, newHabit]);
  return newHabit;
}

/**
 * Update an existing habit
 */
export function updateHabit(id: string, updates: Partial<Habit>): Habit | null {
  const habits = getHabits();
  const index = habits.findIndex((h) => h.id === id);
  
  if (index === -1) return null;
  
  const updatedHabit: Habit = {
    ...habits[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  habits[index] = updatedHabit;
  safeSetItem(STORAGE_KEYS.HABITS, habits);
  return updatedHabit;
}

/**
 * Delete a habit and its completions
 */
export function deleteHabit(id: string): Habit[] {
  const habits = getHabits();
  const filtered = habits.filter((h) => h.id !== id);
  
  // Also delete related completions
  const completions = getHabitCompletions();
  const filteredCompletions = completions.filter((c) => c.habitId !== id);
  
  safeSetItem(STORAGE_KEYS.HABITS, filtered);
  safeSetItem(STORAGE_KEYS.COMPLETIONS, filteredCompletions);
  return filtered;
}

/**
 * Save a habit (create or update)
 * Returns updated list of all habits
 */
export function saveHabit(habit: Habit): Habit[] {
  const habits = getHabits();
  const existingIndex = habits.findIndex((h) => h.id === habit.id);
  
  if (existingIndex >= 0) {
    // Update existing
    habits[existingIndex] = { ...habit, updatedAt: new Date().toISOString() };
  } else {
    // Create new
    habits.push({
      ...habit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  safeSetItem(STORAGE_KEYS.HABITS, habits);
  return habits;
}

/**
 * Get custom reasons for skipping habits
 */
export function getCustomReasons(): string[] {
  return safeGetItem<string[]>(STORAGE_KEYS.CUSTOM_REASONS, []);
}

/**
 * Save a custom reason for skipping habits
 */
export function saveCustomReason(reason: string): void {
  const reasons = getCustomReasons();
  if (!reasons.includes(reason)) {
    reasons.push(reason);
    safeSetItem(STORAGE_KEYS.CUSTOM_REASONS, reasons);
  }
}

/**
 * Reorder habits
 */
export function reorderHabits(orderedIds: string[]): boolean {
  const habits = getHabits();
  const reordered = orderedIds
    .map((id, index) => {
      const habit = habits.find((h) => h.id === id);
      if (habit) return { ...habit, order: index };
      return null;
    })
    .filter((h): h is Habit => h !== null);
  
  return safeSetItem(STORAGE_KEYS.HABITS, reordered);
}

// ============================================
// Habit Completions Storage
// ============================================

/**
 * Get all habit completions
 */
export function getHabitCompletions(): HabitCompletion[] {
  return safeGetItem<HabitCompletion[]>(STORAGE_KEYS.COMPLETIONS, []);
}

/**
 * Get completions for a specific habit
 */
export function getCompletionsForHabit(habitId: string): HabitCompletion[] {
  return getHabitCompletions().filter((c) => c.habitId === habitId);
}

/**
 * Get completions for a specific date
 */
export function getCompletionsForDate(date: string): HabitCompletion[] {
  return getHabitCompletions().filter((c) => c.date === date);
}

/**
 * Get today's completions
 */
export function getTodayCompletions(): HabitCompletion[] {
  return getCompletionsForDate(getTodayString());
}

/**
 * Log a habit completion
 */
export function logCompletion(
  habitId: string,
  userId: string,
  count: number = 1,
  note?: string
): HabitCompletion {
  const completions = getHabitCompletions();
  const today = getTodayString();
  
  // Check if there's already a completion for today
  const existingIndex = completions.findIndex(
    (c) => c.habitId === habitId && c.date === today
  );
  
  if (existingIndex !== -1) {
    // Update existing completion
    const updated: HabitCompletion = {
      ...completions[existingIndex],
      count: completions[existingIndex].count + count,
      note: note || completions[existingIndex].note,
      completedAt: new Date().toISOString(),
    };
    completions[existingIndex] = updated;
    safeSetItem(STORAGE_KEYS.COMPLETIONS, completions);
    return updated;
  }
  
  // Create new completion
  const newCompletion: HabitCompletion = {
    id: generateId(),
    habitId,
    userId,
    date: today,
    count,
    note,
    completedAt: new Date().toISOString(),
  };
  
  safeSetItem(STORAGE_KEYS.COMPLETIONS, [...completions, newCompletion]);
  return newCompletion;
}

/**
 * Remove/undo a completion
 */
export function removeCompletion(habitId: string, date: string): boolean {
  const completions = getHabitCompletions();
  const filtered = completions.filter(
    (c) => !(c.habitId === habitId && c.date === date)
  );
  
  if (filtered.length === completions.length) return false;
  
  return safeSetItem(STORAGE_KEYS.COMPLETIONS, filtered);
}

/**
 * Decrement completion count
 */
export function decrementCompletion(habitId: string, date: string): HabitCompletion | null {
  const completions = getHabitCompletions();
  const index = completions.findIndex(
    (c) => c.habitId === habitId && c.date === date
  );
  
  if (index === -1) return null;
  
  if (completions[index].count <= 1) {
    // Remove if count would go to 0
    safeSetItem(
      STORAGE_KEYS.COMPLETIONS,
      completions.filter((_, i) => i !== index)
    );
    return null;
  }
  
  // Decrement count
  completions[index] = {
    ...completions[index],
    count: completions[index].count - 1,
  };
  safeSetItem(STORAGE_KEYS.COMPLETIONS, completions);
  return completions[index];
}

// ============================================
// Prayer Completions Storage
// ============================================

/**
 * Get all prayer completions
 */
export function getPrayerCompletions(): PrayerCompletion[] {
  return safeGetItem<PrayerCompletion[]>(STORAGE_KEYS.PRAYERS, []);
}

/**
 * Get prayer completions for a date
 */
export function getPrayersForDate(date: string): PrayerCompletion[] {
  return getPrayerCompletions().filter((p) => p.date === date);
}

/**
 * Get today's prayer completions
 */
export function getTodayPrayers(): PrayerCompletion[] {
  return getPrayersForDate(getTodayString());
}

/**
 * Log a prayer completion
 */
export function logPrayer(
  userId: string,
  prayerName: PrayerCompletion["prayerName"],
  options: { isOnTime?: boolean; isJamaat?: boolean } = {}
): PrayerCompletion {
  const prayers = getPrayerCompletions();
  const today = getTodayString();
  
  // Check if already logged today
  const existing = prayers.find(
    (p) => p.prayerName === prayerName && p.date === today
  );
  
  if (existing) {
    // Update existing
    const updated: PrayerCompletion = {
      ...existing,
      isOnTime: options.isOnTime ?? existing.isOnTime,
      isJamaat: options.isJamaat ?? existing.isJamaat,
      completedAt: new Date().toISOString(),
    };
    const index = prayers.findIndex((p) => p.id === existing.id);
    prayers[index] = updated;
    safeSetItem(STORAGE_KEYS.PRAYERS, prayers);
    return updated;
  }
  
  // Create new
  const newPrayer: PrayerCompletion = {
    id: generateId(),
    userId,
    prayerName,
    date: today,
    completedAt: new Date().toISOString(),
    isOnTime: options.isOnTime ?? false,
    isJamaat: options.isJamaat ?? false,
  };
  
  safeSetItem(STORAGE_KEYS.PRAYERS, [...prayers, newPrayer]);
  return newPrayer;
}

/**
 * Remove a prayer completion
 */
export function removePrayer(prayerName: string, date: string): boolean {
  const prayers = getPrayerCompletions();
  const filtered = prayers.filter(
    (p) => !(p.prayerName === prayerName && p.date === date)
  );
  
  if (filtered.length === prayers.length) return false;
  return safeSetItem(STORAGE_KEYS.PRAYERS, filtered);
}

// ============================================
// Quran Progress Storage
// ============================================

/**
 * Get all Quran progress entries
 */
export function getQuranProgress(): QuranProgress[] {
  return safeGetItem<QuranProgress[]>(STORAGE_KEYS.QURAN_PROGRESS, []);
}

/**
 * Get Quran progress for a date
 */
export function getQuranProgressForDate(date: string): QuranProgress[] {
  return getQuranProgress().filter((q) => q.date === date);
}

/**
 * Log Quran reading progress
 */
export function logQuranProgress(
  userId: string,
  progress: Omit<QuranProgress, "id" | "userId" | "createdAt">
): QuranProgress {
  const entries = getQuranProgress();
  
  const newEntry: QuranProgress = {
    ...progress,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString(),
  };
  
  safeSetItem(STORAGE_KEYS.QURAN_PROGRESS, [...entries, newEntry]);
  return newEntry;
}

/**
 * Delete a Quran progress entry
 */
export function deleteQuranProgress(id: string): boolean {
  const entries = getQuranProgress();
  const filtered = entries.filter((e) => e.id !== id);
  
  if (filtered.length === entries.length) return false;
  return safeSetItem(STORAGE_KEYS.QURAN_PROGRESS, filtered);
}

// ============================================
// Sync Utilities
// ============================================

/**
 * Get last sync timestamp
 */
export function getLastSync(): string | null {
  return safeGetItem<string | null>(STORAGE_KEYS.LAST_SYNC, null);
}

/**
 * Set last sync timestamp
 */
export function setLastSync(timestamp: string): boolean {
  return safeSetItem(STORAGE_KEYS.LAST_SYNC, timestamp);
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(): boolean {
  return safeGetItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE, false);
}

/**
 * Mark onboarding as complete
 */
export function setOnboardingComplete(): boolean {
  return safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
}

/**
 * Get all local data for export/sync
 */
export function exportAllData(): {
  user: User | null;
  habits: Habit[];
  completions: HabitCompletion[];
  prayers: PrayerCompletion[];
  quranProgress: QuranProgress[];
} {
  return {
    user: getUser(),
    habits: getHabits(),
    completions: getHabitCompletions(),
    prayers: getPrayerCompletions(),
    quranProgress: getQuranProgress(),
  };
}

/**
 * Import data (for sync from cloud)
 */
export function importData(data: ReturnType<typeof exportAllData>): boolean {
  try {
    if (data.user) saveUser(data.user);
    if (data.habits) safeSetItem(STORAGE_KEYS.HABITS, data.habits);
    if (data.completions) safeSetItem(STORAGE_KEYS.COMPLETIONS, data.completions);
    if (data.prayers) safeSetItem(STORAGE_KEYS.PRAYERS, data.prayers);
    if (data.quranProgress) safeSetItem(STORAGE_KEYS.QURAN_PROGRESS, data.quranProgress);
    setLastSync(new Date().toISOString());
    return true;
  } catch (error) {
    console.error("[Storage] Error importing data:", error);
    return false;
  }
}

// --- Legacy Wrappers for Web Compatibility ---
export const getLogs = (): HabitLog[] => {
  const completions = getHabitCompletions();
  return completions.map(c => ({
    id: c.id,
    habitId: c.habitId,
    date: c.date,
    value: c.count,
    status: (c as any).status || LogStatus.DONE,
    reason: c.note,
    timestamp: new Date(c.completedAt).getTime()
  }));
};

export const saveLog = (log: HabitLog): HabitLog[] => {
  const completions = getHabitCompletions();
  
  // Find existing completion for this habit and date
  const existingIndex = completions.findIndex(
    (c) => c.habitId === log.habitId && c.date === log.date
  );
  
  // Store status alongside the completion data
  const completion = {
    id: log.id || `${log.habitId}-${log.date}`,
    habitId: log.habitId,
    userId: 'local-user',
    date: log.date, // Use the log's date, not today
    count: log.value,
    note: log.reason,
    status: log.status, // Preserve the status (DONE, SKIPPED, etc.)
    completedAt: new Date().toISOString(),
  };
  
  if (existingIndex !== -1) {
    completions[existingIndex] = completion as HabitCompletion;
  } else {
    completions.push(completion as HabitCompletion);
  }
  
  safeSetItem(STORAGE_KEYS.COMPLETIONS, completions);
  return getLogs();
};

export const deleteLog = (habitId: string, date: string): HabitLog[] => {
  removeCompletion(habitId, date);
  return getLogs();
};
// Make sure 'saveHabit' and 'deleteHabit' are also exported!

// ============================================
// Demo / Seeding Utilities
// ============================================

export type DemoPersona = 'devout' | 'struggler' | 'beginner' | 'intermediate' | 'advanced';

export const seedDemoData = (persona: DemoPersona = 'struggler') => {
  console.log(`[Storage] Seeding demo data for persona: ${persona}`);
  
  // 1. Clear existing data to start fresh
  clearAllData();
  
  // 2. Create Demo User
  createDemoUser();

  // 3. Use ALL habits from INITIAL_HABITS (including 5 Prayers and Rawatib)
  const today = new Date();
  const startDateStr = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Save all initial habits with proper startDate
  const createdHabits: Habit[] = INITIAL_HABITS.map(h => {
    const habit: Habit = {
      ...h,
      startDate: startDateStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return habit;
  });
  
  safeSetItem(STORAGE_KEYS.HABITS, createdHabits);

  // 4. Generate Logs based on Persona
  const daysBack = persona === 'devout' ? 365 : persona === 'struggler' ? 90 : 14;
  const successRate = persona === 'devout' ? 0.95 : persona === 'struggler' ? 0.6 : 0.3;

  // Helper to format date as YYYY-MM-DD
  const fmtDate = (d: Date) => d.toISOString().split('T')[0];
  
  // Build logs array
  const allLogs: HabitLog[] = [];
  const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = fmtDate(date);

    // Forced "Perfect Week" for the last 7 days (so green dots appear)
    const isRecent = i < 7;
    const isSuccess = isRecent || Math.random() < successRate;

    if (isSuccess) {
      // Log Prayers with quality values
      prayerIds.forEach(prayerId => {
        const quality = Math.random() > 0.3 
          ? PrayerQuality.TAKBIRAH 
          : Math.random() > 0.5 
            ? PrayerQuality.JAMAA 
            : PrayerQuality.ON_TIME;
        
        allLogs.push({
          id: `${prayerId}-${dateStr}`,
          habitId: prayerId,
          date: dateStr,
          value: quality,
          status: LogStatus.DONE,
          timestamp: date.getTime(),
        });
      });

      // Log Regular/Counter habits (non-prayer, active ones)
      createdHabits
        .filter(h => h.isActive && h.type !== HabitType.PRAYER)
        .forEach(habit => {
          // Skip conditional habits (fasting) unless it's the right day
          if (habit.id === 'fasting_monday' && date.getDay() !== 1) return;
          if (habit.id === 'fasting_thursday' && date.getDay() !== 4) return;
          if (habit.id.includes('fasting_white')) return; // Skip white days for simplicity
          
          const value = habit.dailyTarget || 1;
          allLogs.push({
            id: `${habit.id}-${dateStr}`,
            habitId: habit.id,
            date: dateStr,
            value: value,
            status: LogStatus.DONE,
            timestamp: date.getTime(),
          });
        });
    } else {
      // Even on "miss" days, log some prayers as missed or late
      prayerIds.forEach(prayerId => {
        if (Math.random() > 0.5) {
          allLogs.push({
            id: `${prayerId}-${dateStr}`,
            habitId: prayerId,
            date: dateStr,
            value: Math.random() > 0.5 ? PrayerQuality.ON_TIME : PrayerQuality.MISSED,
            status: LogStatus.DONE,
            timestamp: date.getTime(),
          });
        }
      });
    }
  }
  
  // Convert to HabitCompletion format for storage
  const completions: HabitCompletion[] = allLogs.map(log => ({
    id: log.id,
    habitId: log.habitId,
    userId: 'demo-user-id',
    date: log.date,
    count: log.value,
    completedAt: new Date(log.timestamp).toISOString(),
  }));
  
  safeSetItem(STORAGE_KEYS.COMPLETIONS, completions);
  
  console.log(`[Storage] Seeding complete. Created ${createdHabits.length} habits with ${allLogs.length} logs over ${daysBack} days.`);
};