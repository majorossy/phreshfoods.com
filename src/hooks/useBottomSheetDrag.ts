// src/hooks/useBottomSheetDrag.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BOTTOM_SHEET,
  MOBILE_ANIMATION,
  SNAP_POINTS,
  selectSnapPoint,
} from '../config/mobile';

interface UseBottomSheetDragOptions {
  initialHeight?: number; // 0.3 to 0.9 (30vh to 90vh)
  snapPoints?: number[]; // Default: [0.3, 0.5, 0.75]
  onSnapChange?: (snapPoint: number) => void;
  enabled?: boolean;
}

/**
 * Hook for drag-to-expand bottom sheet gesture
 * Adapted from useSwipeToClose pattern with inverted direction
 *
 * Features:
 * - Touch drag from handle area to expand/collapse
 * - Smooth snap to predefined points (30vh, 50vh, 75vh)
 * - Uses refs for zero re-renders during drag (60fps)
 * - RequestAnimationFrame for smooth animations
 * - Direction lock to prevent carousel conflicts
 */
export function useBottomSheetDrag({
  initialHeight = BOTTOM_SHEET.SNAP_COLLAPSED,
  snapPoints = [...SNAP_POINTS.WITHOUT_SELECTED_SHOP],
  onSnapChange,
  enabled = true,
}: UseBottomSheetDragOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);

  // Refs for drag state (no re-renders during drag)
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(initialHeight);
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const dragLockedRef = useRef<boolean>(false);
  // Velocity tracking: rolling window of recent touch positions
  const velocitySamplesRef = useRef<Array<{ y: number; time: number }>>([]);

  // Snap to nearest snap point
  const snapToNearest = useCallback((height: number) => {
    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    return nearest;
  }, [snapPoints]);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow drag from top area (drag handle)
      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      const touchYRelative = touch.clientY - rect.top;

      if (touchYRelative > BOTTOM_SHEET.DRAG_HANDLE_HEIGHT_PX) {
        // Touch is below drag handle area - allow carousel scrolling
        return;
      }

      // Start drag
      startYRef.current = touch.clientY;
      currentYRef.current = touch.clientY;
      startHeightRef.current = currentHeight;
      startTimeRef.current = Date.now();
      dragLockedRef.current = false;
      // Reset velocity tracking
      velocitySamplesRef.current = [{ y: touch.clientY, time: Date.now() }];
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const now = Date.now();
      currentYRef.current = touch.clientY;

      // Track velocity samples (keep last 5 for smoothing)
      velocitySamplesRef.current.push({ y: touch.clientY, time: now });
      if (velocitySamplesRef.current.length > 5) {
        velocitySamplesRef.current.shift();
      }

      // Calculate delta (inverted vs swipe-to-close - drag UP increases height)
      const deltaY = startYRef.current - currentYRef.current;
      const deltaVh = deltaY / window.innerHeight;

      // Calculate new height with bounds
      const minHeight = snapPoints[0];
      const maxHeight = snapPoints[snapPoints.length - 1];
      const rawHeight = startHeightRef.current + deltaVh;

      // Apply rubber-band effect at boundaries
      let newHeight: number;
      if (rawHeight < minHeight) {
        const overscroll = minHeight - rawHeight;
        newHeight = minHeight - overscroll * 0.3; // Resistance
      } else if (rawHeight > maxHeight) {
        const overscroll = rawHeight - maxHeight;
        newHeight = maxHeight + overscroll * 0.3; // Resistance
      } else {
        newHeight = rawHeight;
      }

      // Prevent default if dragging vertically (prevents page scroll)
      if (Math.abs(deltaY) > 10) {
        e.preventDefault();
        dragLockedRef.current = true;
      }

      // Use RAF for smooth 60fps animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setCurrentHeight(newHeight);
      });
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      // Calculate velocity from recent samples
      let velocity = 0;
      const samples = velocitySamplesRef.current;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const deltaY = first.y - last.y; // Positive = dragging up
        const deltaTime = last.time - first.time;
        if (deltaTime > 0) {
          velocity = (deltaY / deltaTime) * 1000; // px/s
        }
      }

      // Clamp current height to valid bounds before snapping
      const minHeight = snapPoints[0];
      const maxHeight = snapPoints[snapPoints.length - 1];
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight));

      // Select snap point using velocity-aware function
      const nearest = selectSnapPoint(clampedHeight, velocity, snapPoints);
      setCurrentHeight(nearest);

      // Notify parent of snap change
      if (onSnapChange && nearest !== startHeightRef.current) {
        onSnapChange(nearest);
      }

      // Reset drag state
      setIsDragging(false);
      dragLockedRef.current = false;
      velocitySamplesRef.current = [];

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    // Event listeners with passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, isDragging, currentHeight, snapToNearest, onSnapChange, snapPoints]);

  return {
    ref: elementRef,
    height: currentHeight,
    isDragging,
    setHeight: setCurrentHeight, // Allow programmatic height changes
    style: {
      height: `${currentHeight * 100}vh`,
      // Use spring easing for snap animation (feels more natural)
      transition: isDragging
        ? 'none'
        : `height ${MOBILE_ANIMATION.SLOW_MS}ms ${MOBILE_ANIMATION.SPRING_EASING}`,
    },
  };
}
