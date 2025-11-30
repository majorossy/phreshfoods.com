// src/utils/haptics.ts
/**
 * Haptic Feedback Utilities
 *
 * Provides iOS-style haptic feedback for touch interactions.
 * Uses the Web Vibration API with fallbacks for unsupported devices.
 *
 * Note: iOS Safari doesn't support the Vibration API, but this code
 * will gracefully degrade to no-ops on those devices.
 */

/**
 * Check if the device supports vibration
 */
const canVibrate = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Vibration patterns for different feedback types
 *
 * Patterns are arrays of numbers where:
 * - Odd indices = vibration duration in ms
 * - Even indices = pause duration in ms
 *
 * Example: [10, 50, 10] = vibrate 10ms, pause 50ms, vibrate 10ms
 */
const VIBRATION_PATTERNS = {
  /** Ultra-light feedback for subtle interactions (5ms) */
  selection: [5],
  /** Light feedback for carousel snap, edge hit (10ms) */
  light: [10],
  /** Medium feedback for bottom sheet snap (25ms) */
  medium: [25],
  /** Heavy feedback for significant actions (50ms) */
  heavy: [50],
  /** Success pattern for completing actions like "Add to Trip" */
  success: [10, 30, 10, 30, 20],
  /** Error pattern for failed actions */
  error: [50, 30, 50],
  /** Warning pattern for alerts */
  warning: [25, 50, 25],
} as const;

type HapticType = keyof typeof VIBRATION_PATTERNS;

/**
 * Internal flag to enable/disable haptics globally
 */
let hapticsEnabled = true;

/**
 * Trigger haptic feedback
 *
 * @param type - Type of haptic feedback
 * @returns true if vibration was triggered, false otherwise
 */
function triggerHaptic(type: HapticType): boolean {
  // Don't vibrate if haptics are disabled
  if (!hapticsEnabled) return false;

  // Respect reduced motion preference
  if (prefersReducedMotion()) return false;

  // Check device support
  if (!canVibrate()) return false;

  try {
    const pattern = VIBRATION_PATTERNS[type];
    return navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail - vibration is a nice-to-have
    return false;
  }
}

/**
 * Haptic feedback API
 *
 * @example
 * // On carousel snap:
 * haptics.selection();
 *
 * // On hitting carousel edge:
 * haptics.light();
 *
 * // On bottom sheet snap:
 * haptics.medium();
 *
 * // On "Add to Trip":
 * haptics.success();
 */
export const haptics = {
  /**
   * Ultra-light selection feedback (5ms)
   * Use for: menu selections, toggles, subtle confirmations
   */
  selection: (): boolean => triggerHaptic('selection'),

  /**
   * Light feedback (10ms)
   * Use for: carousel snap, hitting boundaries, light taps
   */
  light: (): boolean => triggerHaptic('light'),

  /**
   * Medium feedback (25ms)
   * Use for: bottom sheet snap points, mode changes
   */
  medium: (): boolean => triggerHaptic('medium'),

  /**
   * Heavy feedback (50ms)
   * Use for: important actions, significant state changes
   */
  heavy: (): boolean => triggerHaptic('heavy'),

  /**
   * Success pattern feedback
   * Use for: completing actions, "Add to Trip", successful saves
   */
  success: (): boolean => triggerHaptic('success'),

  /**
   * Error pattern feedback
   * Use for: failed actions, validation errors
   */
  error: (): boolean => triggerHaptic('error'),

  /**
   * Warning pattern feedback
   * Use for: alerts, confirmations needed
   */
  warning: (): boolean => triggerHaptic('warning'),

  /**
   * Stop any ongoing vibration
   */
  cancel: (): boolean => {
    if (!canVibrate()) return false;
    try {
      return navigator.vibrate(0);
    } catch {
      return false;
    }
  },

  /**
   * Check if haptics are supported
   */
  isSupported: (): boolean => canVibrate(),

  /**
   * Enable haptic feedback
   */
  enable: (): void => {
    hapticsEnabled = true;
  },

  /**
   * Disable haptic feedback
   */
  disable: (): void => {
    hapticsEnabled = false;
    haptics.cancel();
  },

  /**
   * Check if haptics are enabled
   */
  isEnabled: (): boolean => hapticsEnabled,

  /**
   * Toggle haptics on/off
   */
  toggle: (): boolean => {
    hapticsEnabled = !hapticsEnabled;
    if (!hapticsEnabled) {
      haptics.cancel();
    }
    return hapticsEnabled;
  },
};

/**
 * Custom haptic pattern
 *
 * For advanced use cases requiring custom vibration patterns.
 *
 * @param pattern - Array of vibration/pause durations in ms
 * @returns true if vibration was triggered
 *
 * @example
 * // Custom triple-tap pattern
 * customHaptic([10, 20, 10, 20, 10]);
 */
export function customHaptic(pattern: number[]): boolean {
  if (!hapticsEnabled || prefersReducedMotion() || !canVibrate()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Haptic feedback hook for specific gesture events
 *
 * Maps gesture events to appropriate haptic feedback.
 * Use this to ensure consistent haptic UX across the app.
 */
export const gestureHaptics = {
  /** Carousel: snapped to new card */
  carouselSnap: (): boolean => haptics.selection(),

  /** Carousel: hit edge boundary */
  carouselEdge: (): boolean => haptics.light(),

  /** Bottom sheet: snapped to new height */
  sheetSnap: (): boolean => haptics.medium(),

  /** Photo carousel: changed photo */
  photoChange: (): boolean => haptics.selection(),

  /** Action: added stop to trip */
  addToTrip: (): boolean => haptics.success(),

  /** Action: removed stop from trip */
  removeFromTrip: (): boolean => haptics.light(),

  /** Action: long press detected */
  longPress: (): boolean => haptics.medium(),

  /** Selection: item selected */
  select: (): boolean => haptics.selection(),
};

export default haptics;
