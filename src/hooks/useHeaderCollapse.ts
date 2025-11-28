// src/hooks/useHeaderCollapse.ts
import { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect when header should collapse/expand based on scroll
 * Uses IntersectionObserver for better performance than scroll events
 *
 * Usage:
 * - Place sentinel element at top of scrollable content
 * - When sentinel scrolls out of view → header collapses
 * - When sentinel comes back into view → header expands
 *
 * Performance:
 * - No scroll event listeners (freed main thread)
 * - Declarative observation
 * - Built-in threshold logic
 */
export function useHeaderCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Observer configuration
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Collapsed when sentinel is NOT intersecting (scrolled out of view)
        setIsCollapsed(!entry.isIntersecting);
      },
      {
        threshold: 0, // Trigger as soon as any part leaves viewport
        rootMargin: '0px', // No margin
      }
    );

    observer.observe(sentinel);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    isCollapsed,
    sentinelRef, // Place this at top of scrollable area
  };
}
