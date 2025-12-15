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
  CustomReason,
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
 * Supports both old format (string[]) and new format (CustomReason[])
 */
export function getCustomReasons(): CustomReason[] {
  const raw = safeGetItem<(string | CustomReason | { text?: string; reason_text?: string })[]>(STORAGE_KEYS.CUSTOM_REASONS, []);
  // Migrate old formats to new CustomReason format with reason_text
  return raw.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `custom_${index}_${Date.now()}`,
        reason_text: item,
        createdAt: new Date().toISOString()
      };
    }
    // Handle old format with 'text' property
    if ('text' in item && item.text && !('reason_text' in item)) {
      return {
        id: item.id || `custom_${index}_${Date.now()}`,
        reason_text: item.text,
        createdAt: item.createdAt || new Date().toISOString()
      };
    }
    return item as CustomReason;
  });
}

/**
 * Save a custom reason for skipping habits
 */
export function saveCustomReason(reason: CustomReason): void {
  const reasons = getCustomReasons();
  const existingIndex = reasons.findIndex(r => r.id === reason.id);
  if (existingIndex >= 0) {
    // Update existing
    reasons[existingIndex] = reason;
  } else {
    // Add new
    reasons.push(reason);
  }
  safeSetItem(STORAGE_KEYS.CUSTOM_REASONS, reasons);
}

/**
 * Delete a custom reason
 */
export function deleteCustomReason(reasonId: string): void {
  const reasons = getCustomReasons();
  const filtered = reasons.filter(r => r.id !== reasonId);
  safeSetItem(STORAGE_KEYS.CUSTOM_REASONS, filtered);
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
// Female Profile / Excused Mode Functions
// ============================================

// Prayer and Rawatib IDs (matching constants.ts)
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

/**
 * Reset all prayer and rawatib logs (for gender switching)
 * Only deletes logs for the 5 prayers and their rawatib, preserves other habits
 */
export function resetPrayerLogs(): void {
  console.log('🗑️ [Demo] Resetting prayer and rawatib logs from localStorage');
  const completions = getHabitCompletions();
  const filtered = completions.filter(c => 
    !PRAYER_AND_RAWATIB_IDS.includes(c.habitId)
  );
  safeSetItem(STORAGE_KEYS.COMPLETIONS, filtered);
  console.log(`✅ [Demo] Removed ${completions.length - filtered.length} prayer/rawatib logs`);
}

/**
 * Create excused logs for today's 5 prayers (for excused mode toggle)
 * Only creates logs for prayers that don't already have a log for today
 */
export function createExcusedLogsForToday(): void {
  const today = getTodayString();
  console.log('🌙 [Demo] Creating excused logs for today:', today);
  
  const completions = getHabitCompletions();
  
  // Check which prayers already have logs for today
  const existingHabitIds = new Set(
    completions
      .filter(c => c.date === today && PRAYER_IDS.includes(c.habitId))
      .map(c => c.habitId)
  );
  
  const prayersToCreate = PRAYER_IDS.filter(id => !existingHabitIds.has(id));
  
  if (prayersToCreate.length === 0) {
    console.log('✅ [Demo] All prayers already logged for today');
    return;
  }
  
  // Create excused logs for missing prayers
  const newLogs = prayersToCreate.map(habitId => ({
    id: `${habitId}-${today}`,
    habitId: habitId,
    userId: 'demo-user',
    date: today,
    count: 0, // Excused prayers have no quality value
    note: undefined,
    status: LogStatus.EXCUSED,
    completedAt: new Date().toISOString(),
  }));
  
  safeSetItem(STORAGE_KEYS.COMPLETIONS, [...completions, ...newLogs]);
  console.log(`✅ [Demo] Created ${newLogs.length} excused logs for today`);
}

// ============================================
// Demo / Seeding Utilities
// ============================================

export type DemoPersona = 'devout' | 'struggler' | 'beginner' | 'intermediate' | 'advanced';

// ============================================
// REASON LISTS (for obstacles/excuses)
// ============================================
const REASONS = {
  // Reasons more common for Devout users (rare failures)
  devout: ['Sick', 'Travel'],
  // Reasons for Struggler users
  struggler: ['Work/Money', 'Family', 'Sleep', 'Travel', 'Other'],
  // Reasons for Beginner users  
  beginner: ['Sleep', 'Food', 'Other', 'Forgot', 'Lazy'],
  // All reasons combined
  all: ['Sleep', 'Work/Money', 'Family', 'Food', 'Travel', 'Sick', 'Forgot', 'Lazy', 'Other'],
};

// Pick a random reason based on persona
const getReasonForPersona = (persona: DemoPersona): string => {
  const list = REASONS[persona] || REASONS.all;
  return list[Math.floor(Math.random() * list.length)];
};

// ============================================
// 12 ADDITIONAL DEMO HABITS
// ============================================
const DEMO_EXTRA_HABITS: Partial<Habit>[] = [
  { id: 'demo_walk', name: 'Walk 5k Steps', nameAr: 'المشي ٥٠٠٠ خطوة', emoji: '🚶', type: HabitType.REGULAR },
  { id: 'demo_water', name: 'Drink 3L Water', nameAr: 'شرب ٣ لتر ماء', emoji: '💧', type: HabitType.COUNTER, dailyTarget: 8 },
  { id: 'demo_no_social', name: 'No Social Media', nameAr: 'بدون تواصل اجتماعي', emoji: '📵', type: HabitType.REGULAR },
  { id: 'demo_read', name: 'Read 30 min', nameAr: 'قراءة ٣٠ دقيقة', emoji: '📚', type: HabitType.REGULAR },
  { id: 'demo_parents', name: 'Call Parents', nameAr: 'الاتصال بالوالدين', emoji: '📞', type: HabitType.REGULAR },
  { id: 'demo_charity', name: 'Give Charity', nameAr: 'صدقة', emoji: '🤲', type: HabitType.REGULAR },
  { id: 'demo_study', name: 'Study 1 hour', nameAr: 'دراسة ساعة', emoji: '📖', type: HabitType.REGULAR },
  { id: 'demo_sleep', name: 'Sleep by 11 PM', nameAr: 'النوم قبل ١١', emoji: '🌙', type: HabitType.REGULAR },
  { id: 'demo_stretch', name: 'Morning Stretch', nameAr: 'تمارين الصباح', emoji: '🧘', type: HabitType.REGULAR },
  { id: 'demo_floss', name: 'Floss Teeth', nameAr: 'تنظيف الأسنان', emoji: '🦷', type: HabitType.REGULAR },
  { id: 'demo_breakfast', name: 'Healthy Breakfast', nameAr: 'فطور صحي', emoji: '🥗', type: HabitType.REGULAR },
  { id: 'demo_journal', name: 'Journal', nameAr: 'كتابة المذكرات', emoji: '📝', type: HabitType.REGULAR },
];

// ============================================
// PERSONA CONFIGURATION
// ============================================
interface PersonaConfig {
  successRate: number;           // Overall success rate for habits
  prayerQualityDistribution: {   // Distribution of prayer quality levels
    takbirah: number;            // Probability of Takbirah (best)
    jamaa: number;               // Probability of Jamaa
    onTime: number;              // Probability of On Time
    missed: number;              // Probability of Missed
  };
}

const PERSONA_CONFIGS: Record<DemoPersona, PersonaConfig> = {
  devout: {
    successRate: 0.95,
    prayerQualityDistribution: {
      takbirah: 0.75,  // 75% Takbirah
      jamaa: 0.20,     // 20% Jamaa
      onTime: 0.04,    // 4% On Time
      missed: 0.01,    // 1% Missed
    },
  },
  struggler: {
    successRate: 0.60,
    prayerQualityDistribution: {
      takbirah: 0.15,  // 15% Takbirah
      jamaa: 0.25,     // 25% Jamaa
      onTime: 0.35,    // 35% On Time
      missed: 0.25,    // 25% Missed
    },
  },
  beginner: {
    successRate: 0.30,
    prayerQualityDistribution: {
      takbirah: 0.05,  // 5% Takbirah
      jamaa: 0.10,     // 10% Jamaa
      onTime: 0.35,    // 35% On Time
      missed: 0.50,    // 50% Missed
    },
  },
  intermediate: {
    successRate: 0.75,
    prayerQualityDistribution: {
      takbirah: 0.40,
      jamaa: 0.30,
      onTime: 0.20,
      missed: 0.10,
    },
  },
  advanced: {
    successRate: 0.85,
    prayerQualityDistribution: {
      takbirah: 0.60,
      jamaa: 0.25,
      onTime: 0.10,
      missed: 0.05,
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format date as YYYY-MM-DD
const formatDate = (d: Date): string => d.toISOString().split('T')[0];

// Get prayer quality based on persona distribution
const getPrayerQuality = (persona: DemoPersona): PrayerQuality => {
  const config = PERSONA_CONFIGS[persona];
  const rand = Math.random();
  const { takbirah, jamaa, onTime } = config.prayerQualityDistribution;
  
  if (rand < takbirah) return PrayerQuality.TAKBIRAH;
  if (rand < takbirah + jamaa) return PrayerQuality.JAMAA;
  if (rand < takbirah + jamaa + onTime) return PrayerQuality.ON_TIME;
  return PrayerQuality.MISSED;
};

// Check if habit succeeded based on persona
const didHabitSucceed = (persona: DemoPersona): boolean => {
  const config = PERSONA_CONFIGS[persona];
  return Math.random() < config.successRate;
};

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

/**
 * Seed demo data with STRICT "NO GAPS" RULE:
 * - Every active habit has a log for every day (365 days / 12 months)
 * - Status is DONE, SKIP, or FAIL (proper mix based on persona)
 * - Streaks are naturally affected by the persona profile
 */
export const seedDemoData = (persona: DemoPersona = 'struggler') => {
  console.log(`[Storage] 🌱 Seeding demo data for persona: ${persona.toUpperCase()}`);
  
  // 1. Clear existing data to start fresh
  clearAllData();
  
  // 2. Create Demo User
  createDemoUser();

  // 3. Calculate date range (12 months = 365 days)
  const today = new Date();
  const daysBack = 365;
  const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const startDateStr = formatDate(startDate);

  // 4. Build habit list: INITIAL_HABITS + 12 Demo Extras
  const allHabits: Habit[] = [
    // Include all initial habits
    ...INITIAL_HABITS.map((h, idx) => ({
      ...h,
      isActive: true, // Activate all for demo richness
      affectsScore: h.affectsScore !== undefined ? h.affectsScore : true, // Default to true
      startDate: startDateStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: h.order || idx * 10,
    })),
    // Add 12 demo extra habits
    ...DEMO_EXTRA_HABITS.map((h, idx) => ({
      id: h.id!,
      name: h.name!,
      nameAr: h.nameAr!,
      emoji: h.emoji,
      type: h.type || HabitType.REGULAR,
      isActive: true,
      affectsScore: true, // Default to true
      dailyTarget: h.dailyTarget || 1,
      startDate: startDateStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1000 + idx * 10,
    } as Habit)),
  ];
  
  safeSetItem(STORAGE_KEYS.HABITS, allHabits);

  // 5. Identify prayer habits (5KP)
  const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerHabits = allHabits.filter(h => prayerIds.includes(h.id));
  const nonPrayerHabits = allHabits.filter(h => !prayerIds.includes(h.id));
  
  // 6. Generate logs - STRICT NO GAPS! Every applicable habit gets a log for every day
  // NOTE: SKIP status is DEPRECATED - we only use DONE or FAIL
  const allLogs: HabitLog[] = [];
  
  // Tracking for stats
  let winsCount = 0;  // DONE or TAKBIRAH
  let lossCount = 0;  // FAIL or non-TAKBIRAH prayers
  
  // Start from 1 (yesterday) so users can log today's habits themselves
  for (let i = 1; i <= daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // ===== PRAYERS: Always log all 5 prayers (NO GAPS) =====
    // WIN = TAKBIRAH, LOSS = anything else
    prayerHabits.forEach(prayer => {
      const quality = getPrayerQuality(persona);
      let reason: string | undefined;
      
      // Track wins/losses for prayers
      if (quality === PrayerQuality.TAKBIRAH) {
        winsCount++;
      } else {
        lossCount++;
      }
      
      // MANDATORY REASONING: If quality < TAKBIRAH, MUST have a reason
      if (quality < PrayerQuality.TAKBIRAH) {
        reason = getReasonForPersona(persona);
      }
      
      allLogs.push({
        id: `${prayer.id}-${dateStr}`,
        habitId: prayer.id,
        date: dateStr,
        value: quality,
        status: LogStatus.DONE, // All prayers are "logged", quality indicates win/loss
        reason: reason,
        timestamp: date.getTime(),
      });
    });

    // ===== NON-PRAYER HABITS: Log only on applicable days =====
    // No SKIP status - either don't log (non-applicable) or log DONE/FAIL
    nonPrayerHabits.forEach(habit => {
      let status: LogStatus;
      let value: number;
      let reason: string | undefined;
      
      // Fasting habits: Only log on applicable days (no log = not applicable)
      if (habit.id === 'fasting_monday' && dayOfWeek !== 1) return; // Skip - not Monday
      if (habit.id === 'fasting_thursday' && dayOfWeek !== 4) return; // Skip - not Thursday
      if (habit.id === 'fasting_white_days') return; // Skip white days for simplicity
      
      // Determine DONE or FAIL based on persona success rate
      const succeeded = didHabitSucceed(persona);
      
      if (succeeded) {
        status = LogStatus.DONE;
        value = habit.dailyTarget || 1;
        winsCount++;
      } else {
        status = LogStatus.FAIL;
        value = 0;
        lossCount++;
        // MANDATORY REASONING for failed habits
        reason = getReasonForPersona(persona);
      }
      
      allLogs.push({
        id: `${habit.id}-${dateStr}`,
        habitId: habit.id,
        date: dateStr,
        value: value,
        status: status,
        reason: reason,
        timestamp: date.getTime(),
      });
    });
  }
  
  // 7. Convert to HabitCompletion format for storage (with reason preserved)
  const completions: HabitCompletion[] = allLogs.map(log => ({
    id: log.id,
    habitId: log.habitId,
    userId: 'demo-user-id',
    date: log.date,
    count: log.value,
    note: log.reason, // Store reason in 'note' field
    status: log.status,
    completedAt: new Date(log.timestamp).toISOString(),
  } as HabitCompletion));
  
  safeSetItem(STORAGE_KEYS.COMPLETIONS, completions);
  
  // 8. Log summary stats
  const prayerLogs = allLogs.filter(l => prayerIds.includes(l.habitId));
  const habitLogs = allLogs.filter(l => !prayerIds.includes(l.habitId));
  const logsWithReasons = allLogs.filter(l => l.reason);
  const overallRate = Math.round((winsCount / (winsCount + lossCount)) * 100);
  
  console.log(`[Storage] ✅ Seeding complete!`);
  console.log(`  📋 Habits: ${allHabits.length} (${prayerHabits.length} prayers + ${nonPrayerHabits.length} others)`);
  console.log(`  📊 Logs: ${allLogs.length} total (${prayerLogs.length} prayers, ${habitLogs.length} habits)`);
  console.log(`  ✅ WINS: ${winsCount} | ❌ LOSSES: ${lossCount} | 📈 Rate: ${overallRate}%`);
  console.log(`  💬 Reasons: ${logsWithReasons.length} logs have reasoning`);
  console.log(`  📅 Period: ${daysBack} days (${startDateStr} to ${formatDate(today)})`);
};