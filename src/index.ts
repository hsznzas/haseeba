/**
 * Core Types for Haseeb - Islamic Habit Tracker
 * 
 * Re-exports all types from the root types.ts file
 * and adds storage-related constants.
 */

// Re-export all types from the canonical source
export * from '../types';

// ============================================
// Storage Keys (unique to this module)
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
