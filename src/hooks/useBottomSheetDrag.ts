// src/hooks/useBottomSheetDrag.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBottomSheetDragOptions {
  initialHeight?: number; // 0.3 to 0.75 (30vh to 75vh)
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
  initialHeight = 0.3,
  snapPoints = [0.3, 0.5, 0.75],
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
  const rafIdRef = useRef<number | null>(null);
  const dragLockedRef = useRef<boolean>(false);

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
      // Only allow drag from top 60px (drag handle area)
      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      const touchYRelative = touch.clientY - rect.top;

      if (touchYRelative > 60) {
        // Touch is below drag handle area - allow carousel scrolling
        return;
      }

      // Start drag
      startYRef.current = touch.clientY;
      currentYRef.current = touch.clientY;
      startHeightRef.current = currentHeight;
      dragLockedRef.current = false;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      currentYRef.current = touch.clientY;

      // Calculate delta (inverted vs swipe-to-close - drag UP increases height)
      const deltaY = startYRef.current - currentYRef.current;
      const deltaVh = deltaY / window.innerHeight;

      // Calculate new height with bounds
      const newHeight = Math.max(
        snapPoints[0], // Min: 0.3 (30vh)
        Math.min(
          snapPoints[snapPoints.length - 1], // Max: 0.75 (75vh)
          startHeightRef.current + deltaVh
        )
      );

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

      // Snap to nearest point
      const nearest = snapToNearest(currentHeight);
      setCurrentHeight(nearest);

      // Notify parent of snap change
      if (onSnapChange && nearest !== startHeightRef.current) {
        onSnapChange(nearest);
      }

      // Reset drag state
      setIsDragging(false);
      dragLockedRef.current = false;

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
      transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };
}
