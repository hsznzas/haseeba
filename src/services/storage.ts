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
  QuranProgress,
  User,
  UserPreferences,
  STORAGE_KEYS,
  StorageKey,
} from "@/index";
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
  const completions = getHabitCompletions(); // Assuming this function exists in your file
  // Convert 'HabitCompletion' to 'HabitLog' format if needed
  return completions.map(c => ({
    id: c.id,
    habitId: c.habitId,
    date: c.date,
    value: c.count,
    status: LogStatus.DONE, // Defaulting for now
    timestamp: new Date(c.completedAt).getTime()
  }));
};

export const saveLog = (log: HabitLog): HabitLog[] => {
  logCompletion(log.habitId, 'local-user', log.value);
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

  // 3. Define Initial Habits (Simplified for Demo)
  const habits = [
    { name: 'Fajr Sunnah', type: 'REGULAR', emoji: '🌅', order: 1 },
    { name: 'Morning Athkar', type: 'REGULAR', emoji: '☀️', order: 2 },
    { name: 'Read Quran', type: 'REGULAR', emoji: '📖', order: 3 },
    { name: 'Drink Water', type: 'COUNTER', emoji: '💧', dailyTarget: 8, order: 4 },
  ];

  // 4. Save Habits
  const createdHabits = habits.map(h => createHabit({
    name: h.name,
    type: h.type as any, // Cast if types differ slightly
    emoji: h.emoji,
    isActive: true,
    order: h.order,
    dailyTarget: h.dailyTarget
  }));

  // 5. Generate Logs based on Persona
  const today = new Date();
  const daysBack = persona === 'devout' ? 365 : persona === 'struggler' ? 90 : 14;
  const successRate = persona === 'devout' ? 0.95 : persona === 'struggler' ? 0.6 : 0.3;

  // Helper to format date as YYYY-MM-DD
  const fmtDate = (d: Date) => d.toISOString().split('T')[0];

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = fmtDate(date);

    // Forced "Perfect Week" for the last 7 days (so green dots appear)
    const isRecent = i < 7;
    const isSuccess = isRecent || Math.random() < successRate;

    if (isSuccess) {
      // Log Prayers
      ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(prayer => {
        logPrayer('demo-user-id', prayer as any, { 
          isOnTime: Math.random() > 0.2, 
          isJamaat: Math.random() > 0.5 
        });
      });

      // Log Habits
      createdHabits.forEach(habit => {
        logCompletion(habit.id, 'demo-user-id', habit.dailyTarget || 1);
      });
    }
  }
  
  console.log(`[Storage] Seeding complete. Generated ${daysBack} days of history.`);
};