/**
 * Mobile Component Configuration
 *
 * Centralized constants for mobile carousel, bottom sheet, and card components.
 * This eliminates magic numbers and makes the mobile UX easily configurable.
 */

// =============================================================================
// BOTTOM SHEET CONFIGURATION
// =============================================================================

export const BOTTOM_SHEET = {
  // Snap points as viewport height fractions (0-1)
  SNAP_COLLAPSED: 0.3, // 30vh - Shows carousel only
  SNAP_HALF: 0.5, // 50vh - Transition point, shows quick info
  SNAP_EXPANDED: 0.75, // 75vh - Default expanded (no shop selected)
  SNAP_FULL_DETAILS: 0.9, // 90vh - Full details (shop selected)

  // Touch detection
  DRAG_HANDLE_HEIGHT_PX: 60, // Area where drag gestures are detected

  // Content thresholds
  SHOW_QUICK_INFO_THRESHOLD: 0.5, // Show QuickShopInfo above this height
  SHOW_FULL_DETAILS_THRESHOLD: 0.85, // Show full accordion details above this

  // Velocity-based snapping
  VELOCITY_THRESHOLD_PX_S: 800, // Velocity above this triggers directional snap

  // Fixed height for transform-based animation
  MAX_HEIGHT_VH: 90, // Maximum sheet height in vh
} as const;

// Snap point arrays for different states
export const SNAP_POINTS = {
  WITH_SELECTED_SHOP: [
    BOTTOM_SHEET.SNAP_COLLAPSED,
    BOTTOM_SHEET.SNAP_HALF,
    BOTTOM_SHEET.SNAP_FULL_DETAILS,
  ],
  WITHOUT_SELECTED_SHOP: [
    BOTTOM_SHEET.SNAP_COLLAPSED,
    BOTTOM_SHEET.SNAP_HALF,
    BOTTOM_SHEET.SNAP_EXPANDED,
  ],
} as const;

// =============================================================================
// CAROUSEL CONFIGURATION
// =============================================================================

export const CAROUSEL = {
  // Card sizing (percentages of container width)
  CARD_WIDTH_PERCENT: 80, // Each card takes 80% of container width
  CARD_GAP_PERCENT: 10, // Gap between cards (10% margin-right)
  INITIAL_OFFSET_PERCENT: 10, // Initial offset to center first card

  // Card transforms
  CENTER_CARD_SCALE: 1.05, // Reduced from 1.2 for subtler effect
  SIDE_CARD_SCALE: 0.9, // Reduced from 0.85 for less dramatic difference

  // Visual effects for non-center cards
  SIDE_CARD_OPACITY: 0.7, // Opacity for side cards (replacing dark overlay)
  SIDE_CARD_BRIGHTNESS: 0.85, // CSS filter brightness for side cards

  // Shadows
  CENTER_CARD_SHADOW: '0 12px 48px rgba(0, 0, 0, 0.25)',
  SIDE_CARD_SHADOW: '0 4px 12px rgba(0, 0, 0, 0.1)',

  // Z-index layering
  CENTER_CARD_Z_INDEX: 10,
  SIDE_CARD_Z_INDEX: 1,

  // Navigation
  ARROW_SIZE_PX: 48, // Minimum touch target for arrows (44px + padding)
} as const;

// =============================================================================
// ANIMATION CONFIGURATION
// =============================================================================

export const MOBILE_ANIMATION = {
  // Easing functions
  STANDARD_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design standard
  SPRING_EASING: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Overshoot for snap feel
  SMOOTH_OUT: 'cubic-bezier(0, 0, 0.2, 1)', // Decelerate

  // Durations
  FAST_MS: 150,
  STANDARD_MS: 300,
  SLOW_MS: 400,

  // Pre-built transition strings
  TRANSFORM_TRANSITION: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  OPACITY_TRANSITION: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  SPRING_TRANSITION: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Combined transitions for common use cases
  CARD_TRANSITION:
    'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// =============================================================================
// TOUCH TARGETS (Accessibility)
// =============================================================================

export const TOUCH_TARGETS = {
  MINIMUM_PX: 44, // WCAG 2.1 minimum touch target
  COMFORTABLE_PX: 48, // Recommended comfortable size
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get snap points array based on whether a shop is selected
 */
export function getSnapPoints(hasSelectedShop: boolean): readonly number[] {
  return hasSelectedShop
    ? SNAP_POINTS.WITH_SELECTED_SHOP
    : SNAP_POINTS.WITHOUT_SELECTED_SHOP;
}

/**
 * Calculate transform translateY percentage for a given height fraction
 * Used for transform-based bottom sheet animation
 */
export function calculateSheetTransform(
  heightFraction: number,
  maxHeightVh: number = BOTTOM_SHEET.MAX_HEIGHT_VH
): number {
  // Convert height fraction (0-1) to translateY percentage
  // At heightFraction = 0.9 (full), translateY = 0%
  // At heightFraction = 0.3 (collapsed), translateY = 66.7%
  return ((maxHeightVh / 100 - heightFraction) / (maxHeightVh / 100)) * 100;
}

/**
 * Select snap point based on current height and velocity
 * Implements velocity-based snapping for natural feel
 */
export function selectSnapPoint(
  currentHeight: number,
  velocity: number,
  snapPoints: readonly number[]
): number {
  const sortedPoints = [...snapPoints].sort((a, b) => a - b);

  // High velocity = directional snap
  if (Math.abs(velocity) > BOTTOM_SHEET.VELOCITY_THRESHOLD_PX_S) {
    if (velocity > 0) {
      // Dragging UP (increasing height)
      const nextUp = sortedPoints.find((p) => p > currentHeight);
      return nextUp ?? sortedPoints[sortedPoints.length - 1];
    } else {
      // Dragging DOWN (decreasing height)
      const nextDown = [...sortedPoints].reverse().find((p) => p < currentHeight);
      return nextDown ?? sortedPoints[0];
    }
  }

  // Low velocity = snap to nearest
  return sortedPoints.reduce((prev, curr) =>
    Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
  );
}
