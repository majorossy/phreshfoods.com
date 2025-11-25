// src/components/Listings/ListingsPanel.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
// Using react-window v2 API
import { List } from 'react-window';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useFilters } from '../../contexts/FilterContext';
import ShopCard from './ShopCard.tsx';
import ShopCardSkeleton from '../UI/ShopCardSkeleton.tsx';
import { NoResultsState } from '../UI/EmptyState.tsx';
import { ShopWithDistance } from '../../types';

const ITEM_HEIGHT = 180; // Approximate height of each shop card
const GAP_SIZE = 12; // Gap between cards

// Row renderer for virtual scrolling
interface RowProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes?: any;
  shops: ShopWithDistance[];
  columnsPerRow: number;
}

const Row = ({ index, style, shops, columnsPerRow }: RowProps) => {
  const startIdx = index * columnsPerRow;
  const items = shops.slice(startIdx, startIdx + columnsPerRow);

  return (
    <div style={style} className="px-3 sm:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {items.map(shop => (
          <ShopCard
            key={shop.slug || shop.GoogleProfileID || shop.Name}
            shop={shop}
          />
        ))}
        {/* Fill empty cells in the last row */}
        {items.length < columnsPerRow &&
          Array(columnsPerRow - items.length).fill(0).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
      </div>
    </div>
  );
};

const ListingsPanel = () => {
  const { currentlyDisplayedLocations, allLocations, isLoadingLocations, locationsError, retryLoadLocations } = useLocationData();
  const { setActiveProductFilters, activeLocationTypes } = useFilters();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [columnsPerRow, setColumnsPerRow] = useState(2);
  const [listHeight, setListHeight] = useState(600);

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

  // Calculate columns based on window width - must be before early returns (Rules of Hooks)
  useEffect(() => {
    const updateDimensions = () => {
      const panel = document.getElementById('listingsPanel');
      if (panel) {
        const width = panel.clientWidth;
        // Responsive columns: 1 on small, 2 on large
        setColumnsPerRow(width < 640 ? 1 : 2);
        setListHeight(window.innerHeight - (headerHeight || 128));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [headerHeight]);

  // Virtual scrolling replaces the old infinite scroll logic
  // react-window handles viewport management automatically

  // Clear filters handler - must be defined before early returns (Rules of Hooks)
  const handleClearFilters = useCallback(() => {
    setActiveProductFilters({});
  }, [setActiveProductFilters]);

  // Calculate row count and memoize list data - must be before early returns (Rules of Hooks)
  const rowCount = Math.ceil(currentlyDisplayedLocations.length / columnsPerRow);
  const listData = useMemo(() => ({
    shops: currentlyDisplayedLocations,
    columnsPerRow,
  }), [currentlyDisplayedLocations, columnsPerRow]);

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

  // Virtual scrolling temporarily disabled - fixed row heights don't work well with variable card content
  // TODO: Re-enable once react-window v2 row height issues are resolved
  const useVirtualScrolling = false; // Disabled: currentlyDisplayedLocations.length > 20;

  return (
    <section
      id="listingsPanel"
      className="w-full md:w-2/5 lg:w-1/3 overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-sm md:bg-white/95 md:backdrop-blur-none shrink-0"
      style={{ paddingTop: headerHeight > 0 ? `${headerHeight}px` : '8rem' }}
    >
      {currentlyDisplayedLocations.length > 0 ? (
        useVirtualScrolling ? (
          <List
            className="custom-scrollbar"
            style={{ height: listHeight, width: '100%' }}
            rowCount={rowCount}
            rowHeight={ITEM_HEIGHT + GAP_SIZE}
            rowComponent={Row}
            rowProps={listData}
            overscanCount={2}
          />
        ) : (
          // Regular rendering
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
        )
      ) : (
        <div className="p-3 sm:p-4">
          <NoResultsState onClearFilters={handleClearFilters} activeLocationTypes={activeLocationTypes} />
        </div>
      )}
    </section>
  );
};

export default ListingsPanel;