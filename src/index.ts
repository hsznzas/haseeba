/**
 * Core Types for Haseeb - Islamic Habit Tracker
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: "en" | "ar";
  theme: "dark" | "light" | "system";
  notifications: boolean;
  prayerReminders: boolean;
  dailyGoalReminder: boolean;
  reminderTime: string; // HH:MM format
  hijriDateDisplay: boolean;
  showHijri: boolean;
  gender?: "male" | "female";
  dateOfBirth?: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
}

// ============================================
// Habit Types
// ============================================

export type HabitCategory = 
  | "prayer"      // Salah
  | "quran"       // Quran reading
  | "dhikr"       // Remembrance
  | "charity"     // Sadaqah
  | "fasting"     // Sawm
  | "dua"         // Supplications
  | "knowledge"   // Islamic learning
  | "community"   // Community service
  | "health"      // Physical health
  | "custom";     // User-defined

export type HabitFrequency = 
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

export type HabitUnit = 
  | "times"
  | "minutes"
  | "pages"
  | "rakaat"
  | "ayat"
  | "custom";

export enum HabitType {
  PRAYER = 'PRAYER',
  REGULAR = 'REGULAR',
  COUNTER = 'COUNTER',
}

export interface Habit {
  id: string;
  name: string;
  nameAr: string;
  type: HabitType;
  emoji?: string;
  icon?: string;
  dailyTarget?: number;
  presetId?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum LogStatus {
  DONE = 'DONE',
  SKIP = 'SKIP',
  FAIL = 'FAIL',
}

export enum PrayerQuality {
  MISSED = 0,
  ON_TIME = 1,
  JAMAA = 2,
  TAKBIRAH = 3,
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
  status?: LogStatus;
  notes?: string;
  timestamp: number;
  reason?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  count: number;
  note?: string;
  completedAt: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
  todayProgress: number;
  isCompletedToday: boolean;
}

// Custom reason - matches Supabase custom_reasons table
export interface CustomReason {
  id: string;
  reason_text: string; // Column name in Supabase
  createdAt?: string;
}

// ============================================
// Prayer Types
// ============================================

export type PrayerName = 
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "tahajjud"
  | "duha"
  | "witr";

export interface PrayerTime {
  name: PrayerName;
  time: string; // HH:MM format
  isObligatory: boolean;
}

export interface PrayerCompletion {
  id: string;
  userId: string;
  prayerName: PrayerName;
  date: string; // YYYY-MM-DD
  completedAt: string;
  isOnTime: boolean;
  isJamaat: boolean; // Prayed in congregation
}

// ============================================
// Quran Types
// ============================================

export interface QuranProgress {
  id: string;
  userId: string;
  date: string;
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  pagesRead: number;
  minutesRead: number;
  note?: string;
  createdAt: string;
}

export interface QuranGoal {
  id: string;
  userId: string;
  type: "khatm" | "surah" | "pages" | "minutes";
  target: number;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
}

// ============================================
// Stats & Analytics Types
// ============================================

export interface DailyStats {
  date: string;
  habitsCompleted: number;
  totalHabits: number;
  prayersCompleted: number;
  quranMinutes: number;
  overallScore: number; // 0-100
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStats[];
  averageScore: number;
  bestDay: string;
  totalStreakDays: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  weeklyStats: WeeklyStats[];
  totalHabitsCompleted: number;
  averageScore: number;
  longestStreak: number;
}

// ============================================
// UI Types
// ============================================

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: "success" | "error";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  USER: "haseeb_user",
  HABITS: "haseeb_habits",
  COMPLETIONS: "haseeb_completions",
  PRAYERS: "haseeb_prayers",
  QURAN_PROGRESS: "haseeb_quran_progress",
  PREFERENCES: "haseeb_preferences",
  ONBOARDING_COMPLETE: "haseeb_onboarding_complete",
  LAST_SYNC: "haseeb_last_sync",
  CUSTOM_REASONS: "haseeb_custom_reasons",
  LOGS: "haseeb_logs",
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

