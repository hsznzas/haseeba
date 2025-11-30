/**
 * Haptics Service
 * 
 * Provides tactile feedback for mobile interactions.
 * Falls back gracefully on web/unsupported platforms.
 */

import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativePlatform } from "@/lib/utils";

/**
 * Check if haptics are available
 */
export function isHapticsAvailable(): boolean {
  return isNativePlatform();
}

/**
 * Light impact - for subtle interactions like selections
 */
export async function lightImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.warn("[Haptics] Light impact failed:", error);
  }
}

/**
 * Medium impact - for standard interactions like button taps
 */
export async function mediumImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.warn("[Haptics] Medium impact failed:", error);
  }
}

/**
 * Heavy impact - for significant actions like completing a habit
 */
export async function heavyImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.warn("[Haptics] Heavy impact failed:", error);
  }
}

/**
 * Success notification - for positive confirmations
 */
export async function successNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.warn("[Haptics] Success notification failed:", error);
  }
}

/**
 * Warning notification - for alerts that need attention
 */
export async function warningNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.warn("[Haptics] Warning notification failed:", error);
  }
}

/**
 * Error notification - for error states
 */
export async function errorNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.warn("[Haptics] Error notification failed:", error);
  }
}

/**
 * Selection changed - for picker/selection interactions
 */
export async function selectionChanged(): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.selectionChanged();
  } catch (error) {
    console.warn("[Haptics] Selection changed failed:", error);
  }
}

/**
 * Vibrate pattern - for custom vibration patterns
 * @param duration - Duration in milliseconds
 */
export async function vibrate(duration: number = 300): Promise<void> {
  if (!isHapticsAvailable()) return;
  
  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.warn("[Haptics] Vibrate failed:", error);
  }
}

// ============================================
// Semantic Haptic Functions (for common actions)
// ============================================

/**
 * Haptic feedback for completing a habit
 */
export async function onHabitComplete(): Promise<void> {
  await successNotification();
}

/**
 * Haptic feedback for uncompleting a habit
 */
export async function onHabitUncomplete(): Promise<void> {
  await lightImpact();
}

/**
 * Haptic feedback for incrementing a counter
 */
export async function onCounterIncrement(): Promise<void> {
  await mediumImpact();
}

/**
 * Haptic feedback for prayer completion
 */
export async function onPrayerComplete(): Promise<void> {
  await successNotification();
}

/**
 * Haptic feedback for button tap
 */
export async function onButtonTap(): Promise<void> {
  await lightImpact();
}

/**
 * Haptic feedback for drag/reorder
 */
export async function onDragStart(): Promise<void> {
  await mediumImpact();
}

/**
 * Haptic feedback for drag end/drop
 */
export async function onDragEnd(): Promise<void> {
  await lightImpact();
}

/**
 * Haptic feedback for error
 */
export async function onError(): Promise<void> {
  await errorNotification();
}

/**
 * Haptic feedback for swipe action
 */
export async function onSwipeAction(): Promise<void> {
  await mediumImpact();
}

