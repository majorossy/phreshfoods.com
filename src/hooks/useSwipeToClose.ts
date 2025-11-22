// src/hooks/useSwipeToClose.ts
import { useEffect, useRef, useState } from 'react';

interface UseSwipeToCloseOptions {
  onClose: () => void;
  threshold?: number; // Distance in pixels to trigger close
  enabled?: boolean;
}

/**
 * Hook to enable swipe-down-to-close gesture on mobile overlays
 * Provides smooth, native-feeling interaction for dismissing modals
 */
export function useSwipeToClose({
  onClose,
  threshold = 100,
  enabled = true,
}: UseSwipeToCloseOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    let rafId: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow swipe from top 50px of overlay
      const touch = e.touches[0];
      const rect = element.getBoundingClientRect();
      if (touch.clientY - rect.top > 50) return;

      startYRef.current = touch.clientY;
      currentYRef.current = touch.clientY;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      currentYRef.current = touch.clientY;
      const deltaY = currentYRef.current - startYRef.current;

      // Only allow downward swipes
      if (deltaY > 0) {
        e.preventDefault();

        // Use RAF for smooth animation
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setTranslateY(deltaY);
        });
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      const deltaY = currentYRef.current - startYRef.current;

      if (deltaY > threshold) {
        // Trigger close with animation
        setTranslateY(window.innerHeight);
        setTimeout(onClose, 200);
      } else {
        // Snap back
        setTranslateY(0);
      }

      setIsDragging(false);
      if (rafId) cancelAnimationFrame(rafId);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, isDragging, onClose, threshold]);

  return {
    ref: elementRef,
    style: {
      transform: `translateY(${translateY}px)`,
      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    },
    isDragging,
  };
}
