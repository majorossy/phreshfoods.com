// src/types/gestures.ts
/**
 * Type definitions for gesture handling
 *
 * These types support the gesture coordination system used in:
 * - Bottom sheet drag
 * - Card carousel swipe
 * - Photo carousel swipe
 */

// Re-export types from mobile config for convenience
export type { GestureOwner, GestureDirection, GestureState } from '../config/mobile';

/**
 * Touch point data for gesture tracking
 */
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Velocity data from gesture tracking
 */
export interface GestureVelocity {
  x: number;  // Horizontal velocity in px/s
  y: number;  // Vertical velocity in px/s
}

/**
 * Configuration for spring physics
 */
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Result of direction determination
 */
export type DirectionResult = 'horizontal' | 'vertical' | 'undetermined';

/**
 * Swipe gesture result
 */
export interface SwipeResult {
  /** Direction of the swipe */
  direction: 'left' | 'right' | 'up' | 'down';
  /** Velocity of the swipe in px/s */
  velocity: number;
  /** Total distance traveled */
  distance: number;
  /** Duration of the swipe in ms */
  duration: number;
}

/**
 * Carousel swipe hook options
 */
export interface CarouselSwipeOptions {
  /** Total number of items */
  itemCount: number;
  /** Item width as percentage */
  itemWidth?: number;
  /** Gap width as percentage */
  gapWidth?: number;
  /** Initial item index */
  initialIndex?: number;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Callback when swipe starts */
  onSwipeStart?: () => void;
  /** Callback when swipe ends */
  onSwipeEnd?: () => void;
  /** Whether swipe is enabled */
  enabled?: boolean;
}

/**
 * Carousel swipe hook return value
 */
export interface CarouselSwipeReturn {
  /** Ref for the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current offset in percentage */
  offset: number;
  /** Current snapped index */
  currentIndex: number;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Navigate to specific index */
  goToIndex: (index: number, animated?: boolean) => void;
  /** Style to apply to track */
  style: React.CSSProperties;
}

/**
 * Bottom sheet drag hook options
 */
export interface BottomSheetDragOptions {
  /** Initial height fraction (0-1) */
  initialHeight?: number;
  /** Available snap points */
  snapPoints?: number[];
  /** Callback when snap point changes */
  onSnapChange?: (snapPoint: number) => void;
  /** Whether drag is enabled */
  enabled?: boolean;
}

/**
 * Bottom sheet drag hook return value
 */
export interface BottomSheetDragReturn {
  /** Ref for the sheet element */
  ref: React.RefObject<HTMLDivElement>;
  /** Current height fraction */
  height: number;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Programmatically set height */
  setHeight: (height: number) => void;
  /** Style to apply to sheet */
  style: React.CSSProperties;
}

/**
 * Photo carousel swipe state
 */
export interface PhotoCarouselState {
  /** Current photo index */
  currentIndex: number;
  /** Whether swiping */
  isSwiping: boolean;
  /** Current transform offset */
  offset: number;
}

/**
 * Haptic feedback types
 */
export type HapticType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'error'
  | 'warning';

/**
 * Gesture event handlers
 */
export interface GestureHandlers {
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onTouchCancel?: (e: TouchEvent) => void;
}

/**
 * Animation controller interface
 */
export interface AnimationController {
  /** Cancel the animation */
  cancel: () => void;
}
