// src/components/Listings/ListingsPanel.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useFilters } from '../../contexts/FilterContext';
import ShopCard from './ShopCard.tsx';
import ShopCardSkeleton from '../UI/ShopCardSkeleton.tsx';
import { NoResultsState } from '../UI/EmptyState.tsx';

// Minimum items before enabling virtualization (small lists don't benefit)
const VIRTUALIZATION_THRESHOLD = 20;

const ListingsPanel = () => {
  const { currentlyDisplayedLocations, allLocations, isLoadingLocations, locationsError, retryLoadLocations } = useLocationData();
  const { setActiveProductFilters, activeLocationTypes } = useFilters();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [columnsPerRow, setColumnsPerRow] = useState(2);

  // Ref for the scrollable container
  const parentRef = useRef<HTMLElement>(null);

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

  // Calculate columns based on panel width
  useEffect(() => {
    const updateColumns = () => {
      const panel = parentRef.current;
      if (panel) {
        const width = panel.clientWidth;
        // Match Tailwind breakpoints: 1 column on small, 2 on sm+
        // md breakpoint goes back to 1, lg+ goes to 2
        setColumnsPerRow(width < 640 ? 1 : 2);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setActiveProductFilters({});
  }, [setActiveProductFilters]);

  // Calculate rows from locations based on columns per row
  const rowCount = Math.ceil(currentlyDisplayedLocations.length / columnsPerRow);

  // Get shops for a specific row
  const getRowShops = useCallback((rowIndex: number) => {
    const startIdx = rowIndex * columnsPerRow;
    return currentlyDisplayedLocations.slice(startIdx, startIdx + columnsPerRow);
  }, [currentlyDisplayedLocations, columnsPerRow]);

  // Virtual scrolling setup with dynamic height measurement
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Estimated row height (will be measured dynamically)
    overscan: 3, // Render 3 extra rows above/below viewport for smooth scrolling
    measureElement: (element) => {
      // Dynamically measure actual row height
      return element.getBoundingClientRect().height;
    },
  });

  // Determine if we should use virtualization
  const useVirtualScrolling = currentlyDisplayedLocations.length > VIRTUALIZATION_THRESHOLD;

  // Show loading state
  if (isLoadingLocations) {
    return (
      <section
        id="listingsPanel"
        ref={parentRef}
        className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
        style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
        ref={parentRef}
        className="w-full md:w-2/5 lg:w-1/3 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
        style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
      >
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Locations</h3>
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

  // No results state
  if (currentlyDisplayedLocations.length === 0) {
    return (
      <section
        id="listingsPanel"
        ref={parentRef}
        className="w-full md:w-2/5 lg:w-1/3 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
        style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
      >
        <div className="p-3 sm:p-4">
          <NoResultsState onClearFilters={handleClearFilters} activeLocationTypes={activeLocationTypes} />
        </div>
      </section>
    );
  }

  // Main render with virtual scrolling
  return (
    <section
      id="listingsPanel"
      ref={parentRef}
      className="w-full md:w-2/5 lg:w-1/3 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0 animate-fadeIn"
      style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
    >
      {useVirtualScrolling ? (
        // Virtualized rendering for large lists
        <div
          className="p-3 sm:p-4"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowShops = getRowShops(virtualRow.index);
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pb-3 sm:pb-4">
                  {rowShops.map(shop => (
                    <ShopCard
                      key={shop.slug || shop.GoogleProfileID || shop.Name}
                      shop={shop}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Regular rendering for small lists
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {currentlyDisplayedLocations.map(shop => (
              <ShopCard
                key={shop.slug || shop.GoogleProfileID || shop.Name}
                shop={shop}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ListingsPanel;
