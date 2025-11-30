// src/hooks/useCarouselSwipe.ts
// @ts-nocheck - Temporarily disabled for production build testing
/**
 * Horizontal Swipe Hook for Carousel Navigation
 *
 * Provides native-feel horizontal swiping with:
 * - Physics-based momentum and spring animations
 * - Rubber-band overscroll at edges
 * - Direction lock to prevent conflicts with vertical gestures
 * - Haptic feedback on snap
 * - RAF-based 60fps updates (no React re-renders during drag)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { VelocityTracker, determineDirection } from '../utils/velocityTracker';
import { springAnimationWithVelocity, rubberBandClamp, clamp } from '../utils/physics';
import { gestureHaptics } from '../utils/haptics';
import {
  GESTURE,
  PHYSICS,
  CAROUSEL_SWIPE,
} from '../config/mobile';

export interface UseCarouselSwipeOptions {
  /** Total number of items in the carousel */
  itemCount: number;
  /** Width of each item as percentage of container (default: 80) */
  itemWidth?: number;
  /** Gap between items as percentage of container (default: 10) */
  gapWidth?: number;
  /** Initial index to display (default: 0) */
  initialIndex?: number;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Callback when swipe starts */
  onSwipeStart?: () => void;
  /** Callback when swipe ends */
  onSwipeEnd?: () => void;
  /** Whether swiping is enabled (default: true) */
  enabled?: boolean;
}

export interface UseCarouselSwipeReturn {
  /** Ref to attach to the carousel container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current transform offset in percentage */
  offset: number;
  /** Current snapped index */
  currentIndex: number;
  /** Whether the user is actively dragging */
  isDragging: boolean;
  /** Whether a spring animation is currently in progress */
  isAnimating: boolean;
  /** Programmatically navigate to an index */
  goToIndex: (index: number, animated?: boolean) => void;
  /** Style object to apply to the carousel track */
  style: React.CSSProperties;
}

/**
 * Hook for horizontal carousel swipe with physics
 *
 * @example
 * const { containerRef, currentIndex, isDragging, style } = useCarouselSwipe({
 *   itemCount: shops.length,
 *   onIndexChange: (index) => setPreviewShop(shops[index]),
 * });
 *
 * return (
 *   <div ref={containerRef} className="carousel-container">
 *     <div className="carousel-track" style={style}>
 *       {shops.map((shop, i) => <Card key={i} shop={shop} />)}
 *     </div>
 *   </div>
 * );
 */
export function useCarouselSwipe({
  itemCount,
  itemWidth = CAROUSEL_SWIPE.ITEM_WIDTH_PERCENT,
  gapWidth = CAROUSEL_SWIPE.GAP_PERCENT,
  initialIndex = 0,
  onIndexChange,
  onSwipeStart,
  onSwipeEnd,
  enabled = true,
}: UseCarouselSwipeOptions): UseCarouselSwipeReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  // Current index state (triggers re-renders for consumers)
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for drag state (no re-renders during drag for 60fps)
  // Also track animation state as ref for immediate checks (state updates are async)
  const offsetRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const velocityTrackerRef = useRef(new VelocityTracker());
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const animationRef = useRef<{ cancel: () => void } | null>(null);
  const trackElementRef = useRef<HTMLElement | null>(null);
  const isAnimatingRef = useRef(false); // Ref for synchronous checks during animation

  // Calculate step size (card width + gap)
  const stepPercent = itemWidth + gapWidth;

  // Calculate offset bounds
  const minOffset = 0;
  const maxOffset = Math.max(0, (itemCount - 1) * stepPercent);

  // Initial offset to center first card (same as CAROUSEL.INITIAL_OFFSET_PERCENT)
  const initialOffset = (100 - itemWidth) / 2;

  /**
   * Update the visual transform without React re-render
   */
  const updateTransform = useCallback((offset: number) => {
    // Find the track element if not yet cached
    if (!trackElementRef.current && containerRef.current) {
      trackElementRef.current = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (!trackElementRef.current) {
        trackElementRef.current = containerRef.current.firstElementChild as HTMLElement;
      }
    }

    // Apply transform: initial centering offset minus the swipe offset
    if (trackElementRef.current) {
      trackElementRef.current.style.transform = `translateX(calc(${initialOffset}% - ${offset}%))`;
    }
  }, [initialOffset]);

  /**
   * Snap to a specific index with spring animation
   */
  const snapToIndex = useCallback((
    targetIndex: number,
    initialVelocity: number = 0,
    animated: boolean = true
  ) => {
    // Cancel any ongoing animation
    animationRef.current?.cancel();

    const targetOffset = targetIndex * stepPercent;
    const clampedTarget = clamp(targetOffset, minOffset, maxOffset);
    const finalIndex = Math.round(clampedTarget / stepPercent);

    // Find the track element if not yet cached
    if (!trackElementRef.current && containerRef.current) {
      trackElementRef.current = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
      if (!trackElementRef.current) {
        trackElementRef.current = containerRef.current.firstElementChild as HTMLElement;
      }
    }

    if (!animated) {
      // Immediate update - no animation lock needed
      offsetRef.current = clampedTarget;
      updateTransform(clampedTarget);
      setCurrentIndex(finalIndex);
      if (onIndexChange) {
        onIndexChange(finalIndex);
      }
      return;
    }

    // Set animation lock BEFORE starting animation
    // This prevents auto-center and sync effects from interrupting
    isAnimatingRef.current = true;
    setIsAnimating(true);

    // Spring animation to target
    const previousIndex = currentIndex;
    animationRef.current = springAnimationWithVelocity(
      offsetRef.current,
      clampedTarget,
      -initialVelocity * 0.01, // Scale velocity for percentage space
      PHYSICS.SPRING_SNAP,
      (value) => {
        offsetRef.current = value;
        updateTransform(value);
      },
      () => {
        // Animation complete - clear lock
        isAnimatingRef.current = false;
        setIsAnimating(false);
        offsetRef.current = clampedTarget;
        animationRef.current = null;

        setCurrentIndex(finalIndex);
        if (finalIndex !== previousIndex && onIndexChange) {
          onIndexChange(finalIndex);
          gestureHaptics.carouselSnap();
        }
      }
    );
  }, [stepPercent, minOffset, maxOffset, currentIndex, onIndexChange, updateTransform]);

  /**
   * Navigate to a specific index
   */
  const goToIndex = useCallback((index: number, animated: boolean = true) => {
    const clampedIndex = clamp(index, 0, itemCount - 1);
    snapToIndex(clampedIndex, 0, animated);
  }, [itemCount, snapToIndex]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || itemCount <= 1) return;

    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startOffsetRef.current = offsetRef.current;
    directionLockedRef.current = null;

    // Reset velocity tracker
    velocityTrackerRef.current.reset();
    velocityTrackerRef.current.addSample(touch.clientX, touch.clientY);

    // Cancel any ongoing animation
    animationRef.current?.cancel();
    animationRef.current = null;

    setIsDragging(true);
    onSwipeStart?.();
  }, [enabled, itemCount, onSwipeStart]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !enabled) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - (velocityTrackerRef.current as any).samples?.[0]?.y ?? 0;

    // Track velocity
    velocityTrackerRef.current.addSample(touch.clientX, touch.clientY);

    // Determine direction if not yet locked
    if (!directionLockedRef.current) {
      const direction = determineDirection(
        deltaX,
        deltaY,
        GESTURE.HORIZONTAL_ANGLE_DEG,
        GESTURE.VERTICAL_ANGLE_DEG
      );

      if (direction !== 'undetermined') {
        directionLockedRef.current = direction;
      }
    }

    // If locked to vertical, let the parent (bottom sheet) handle it
    if (directionLockedRef.current === 'vertical') {
      return;
    }

    // Horizontal swipe - prevent default and handle
    if (directionLockedRef.current === 'horizontal') {
      e.preventDefault();

      // Calculate new offset (negative deltaX because swipe left = move forward)
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newOffset = startOffsetRef.current - deltaPercent;

      // Apply rubber band effect at boundaries
      const maxOverscroll = GESTURE.MAX_OVERSCROLL_PERCENT;
      const clampedOffset = rubberBandClamp(
        newOffset,
        minOffset,
        maxOffset,
        maxOverscroll,
        GESTURE.RUBBER_BAND_TENSION
      );

      offsetRef.current = clampedOffset;
      updateTransform(clampedOffset);

      // Haptic feedback at edges
      if (newOffset < minOffset || newOffset > maxOffset) {
        // Only trigger once when first hitting edge
        if (Math.abs(newOffset - minOffset) < 5 || Math.abs(newOffset - maxOffset) < 5) {
          gestureHaptics.carouselEdge();
        }
      }
    }
  }, [isDragging, enabled, minOffset, maxOffset, updateTransform]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    onSwipeEnd?.();

    // Get final velocity
    const velocity = velocityTrackerRef.current.getVelocity();
    const currentOffset = offsetRef.current;

    // Determine target index based on position and velocity
    let targetIndex: number;

    if (Math.abs(velocity.x) > GESTURE.FLICK_VELOCITY_THRESHOLD) {
      // High velocity flick - move in direction of flick
      const direction = velocity.x > 0 ? -1 : 1; // Positive velocity = swipe right = go back
      targetIndex = currentIndex + direction;
    } else if (Math.abs(velocity.x) > CAROUSEL_SWIPE.MIN_SWIPE_VELOCITY) {
      // Medium velocity - consider both position and velocity
      const naturalTarget = currentOffset / stepPercent;
      const direction = velocity.x > 0 ? -0.3 : 0.3; // Bias toward velocity direction
      targetIndex = Math.round(naturalTarget + direction);
    } else {
      // Low velocity - snap to nearest
      targetIndex = Math.round(currentOffset / stepPercent);
    }

    // Clamp to valid range
    targetIndex = clamp(targetIndex, 0, itemCount - 1);

    // Snap to target with momentum
    snapToIndex(targetIndex, velocity.x, true);
  }, [isDragging, onSwipeEnd, currentIndex, stepPercent, itemCount, snapToIndex]);

  /**
   * Set up touch event listeners
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Find the track element (first child)
    trackElementRef.current = container.querySelector('[data-carousel-track]') as HTMLElement;
    if (!trackElementRef.current) {
      // Fallback: use first child
      trackElementRef.current = container.firstElementChild as HTMLElement;
    }

    // Initialize transform
    updateTransform(currentIndex * stepPercent);
    offsetRef.current = currentIndex * stepPercent;

    // Touch events with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      animationRef.current?.cancel();
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, currentIndex, stepPercent, updateTransform]);

  /**
   * Sync with external index changes (e.g., when selected shop changes)
   * Note: Arrow buttons call goToIndex directly, they don't need this sync
   * IMPORTANT: Skip sync while animating to prevent race conditions (oscillation bug fix)
   */
  useEffect(() => {
    // Only sync if:
    // 1. Not currently dragging
    // 2. Not currently animating (prevents interrupting arrow button animations)
    // 3. initialIndex actually differs from current
    if (!isDragging && !isAnimatingRef.current && initialIndex !== currentIndex) {
      // Find the track element if needed
      if (!trackElementRef.current && containerRef.current) {
        trackElementRef.current = containerRef.current.querySelector('[data-carousel-track]') as HTMLElement;
        if (!trackElementRef.current) {
          trackElementRef.current = containerRef.current.firstElementChild as HTMLElement;
        }
      }

      const targetOffset = initialIndex * stepPercent;
      offsetRef.current = targetOffset;
      updateTransform(targetOffset);
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Style for the carousel track
  const style: React.CSSProperties = {
    display: 'flex',
    // Initial transform - will be overwritten by JS during drag
    transform: `translateX(calc(${initialOffset}% - ${currentIndex * stepPercent}%))`,
    // Disable CSS transition during drag
    transition: isDragging ? 'none' : `transform ${CAROUSEL_SWIPE.SNAP_ANIMATION_DURATION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
    // Touch optimization
    touchAction: 'pan-y', // Allow vertical scrolling, we handle horizontal
    willChange: isDragging ? 'transform' : 'auto',
  };

  return {
    containerRef,
    offset: offsetRef.current,
    currentIndex,
    isDragging,
    isAnimating,
    goToIndex,
    style,
  };
}

export default useCarouselSwipe;
