export type Language = 'en' | 'ar';

export enum HabitType {
  PRAYER = 'PRAYER',
  REGULAR = 'REGULAR',
  COUNTER = 'COUNTER',
}

export enum PrayerQuality {
  MISSED = 0,
  ON_TIME = 1,
  JAMAA = 2,
  TAKBIRAH = 3,
}

export enum LogStatus {
  DONE = 'DONE',
  SKIP = 'SKIP',
  FAIL = 'FAIL',
}

export interface Habit {
  id: string;
  name: string;
  nameAr: string; // Ensuring this exists
  type: HabitType;
  emoji?: string;
  icon?: string;
  dailyTarget?: number;
  presetId?: string;
  isActive: boolean; // Ensuring this exists
  order: number;
  startDate?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface UserPreferences {
  language: Language;
  gender: 'male' | 'female';
  showHijri: boolean;
  dateOfBirth: string | null;
  theme?: 'dark' | 'light';
  notifications?: boolean;
  prayerReminders?: boolean;
  dailyGoalReminder?: boolean;
  reminderTime?: string;
  hijriDateDisplay?: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'ar',
  gender: 'male',
  showHijri: true,
  dateOfBirth: '1991-11-11',
  theme: 'dark',
  notifications: true,
  prayerReminders: true,
  dailyGoalReminder: true,
  reminderTime: "08:00",
  hijriDateDisplay: true,
};

export interface User {
  id: string;
  email?: string;
  name?: string;
  isDemo?: boolean;
}