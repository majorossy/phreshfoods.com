// src/components/Listings/ListingsPanel.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useFilters } from '../../contexts/FilterContext';
import { useUI } from '../../contexts/UIContext';
import ShopCard from './ShopCard.tsx';
import ShopCardSkeleton from '../UI/ShopCardSkeleton.tsx';
import { NoResultsState } from '../UI/EmptyState.tsx';

const INITIAL_ITEMS = 20; // Initial number of items to render
const LOAD_MORE_THRESHOLD = 300; // px from bottom to trigger load more

const ListingsPanel = () => {
  const { currentlyDisplayedLocations, allLocations, isLoadingLocations, locationsError, retryLoadLocations } = useLocationData();
  const { setActiveProductFilters, activeLocationTypes } = useFilters();
  const { selectedShop } = useUI();
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const panelRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track the number of shops to detect meaningful changes (not just re-sorts)
  const prevShopCountRef = useRef<number>(0);

  // Measure header height dynamically
  useEffect(() => {
    const measureHeader = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight + 8); // Add 8px spacing
      }
    };

    measureHeader();
    window.addEventListener('resize', measureHeader);

    // Use ResizeObserver if available for better accuracy
    const header = document.querySelector('header');
    let resizeObserver: ResizeObserver | null = null;

    if (header && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureHeader);
      resizeObserver.observe(header);
    }

    return () => {
      window.removeEventListener('resize', measureHeader);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Reset visible count only when the number of shops significantly changes
  // This prevents reset on distance re-calculations or minor updates
  useEffect(() => {
    const currentCount = currentlyDisplayedLocations.length;
    const prevCount = prevShopCountRef.current;

    // Reset if: initial load, or shop count changed significantly (filter/search applied)
    if (prevCount === 0 || Math.abs(currentCount - prevCount) > 0) {
      setVisibleCount(Math.max(INITIAL_ITEMS, currentCount)); // Show all results immediately
      prevShopCountRef.current = currentCount;
    }
  }, [currentlyDisplayedLocations.length]);

  // Scroll handler for infinite scrolling (throttled with requestAnimationFrame)
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !currentlyDisplayedLocations) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    // Load more when near bottom and more items available
    if (scrollBottom < LOAD_MORE_THRESHOLD && visibleCount < currentlyDisplayedLocations.length) {
      setVisibleCount(prev => Math.min(prev + INITIAL_ITEMS, currentlyDisplayedLocations.length));
    }
  }, [visibleCount, currentlyDisplayedLocations]);

  // Attach scroll listener with requestAnimationFrame throttling
  useEffect(() => {
    const panel = scrollContainerRef.current;
    if (!panel) return;

    let frameId: number | null = null;
    let isThrottled = false;

    const onScroll = () => {
      // Skip if already processing a scroll event
      if (isThrottled) return;

      isThrottled = true;
      frameId = requestAnimationFrame(() => {
        handleScroll();
        isThrottled = false;
      });
    };

    panel.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      panel.removeEventListener('scroll', onScroll);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [handleScroll]);

  // Clear filters handler - must be defined before early returns (Rules of Hooks)
  const handleClearFilters = useCallback(() => {
    setActiveProductFilters({});
  }, [setActiveProductFilters]);

  // Show loading state
  if (isLoadingLocations) {
    return (
      <section
        id="listingsPanel"
        className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
        style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
      >
        <div id="listingsContainer" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Show 6 skeleton cards while loading */}
          {Array(6).fill(0).map((_, index) => (
            <ShopCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </section>
    );
  }

  // Show error state
  if (locationsError && allLocations.length === 0) {
    return (
      <section
        id="listingsPanel"
        className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
        style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
      >
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Farm Stands</h3>
            <p className="text-sm text-gray-600 mb-4">{locationsError}</p>
            <button
              onClick={retryLoadLocations}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Get visible shops for windowed rendering
  const visibleShops = currentlyDisplayedLocations.slice(0, visibleCount);
  const hasMore = visibleCount < currentlyDisplayedLocations.length;

  return (
    <section
      id="listingsPanel"
      ref={scrollContainerRef}
      className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
      style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
    >
      {currentlyDisplayedLocations.length > 0 ? (
        <>
          <div id="listingsContainer" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {visibleShops.map(shop => (
              <ShopCard key={shop.slug || shop.GoogleProfileID || shop.Name} shop={shop} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center py-4 text-sm text-gray-500">
              Scroll for more results...
            </div>
          )}
        </>
      ) : (
        <NoResultsState onClearFilters={handleClearFilters} activeLocationTypes={activeLocationTypes} />
      )}
    </section>
  );
};

export default ListingsPanel;