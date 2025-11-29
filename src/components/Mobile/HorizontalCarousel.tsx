// src/components/Mobile/HorizontalCarousel.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useUI } from '../../contexts/UIContext';
import { useFilters } from '../../contexts/FilterContext';
import { useSearch } from '../../contexts/SearchContext';
import ShopCard from '../Listings/ShopCard';
import { getShopDetailBasePath } from '../../utils/typeUrlMappings';
import { encodeFiltersToURL } from '../../utils/urlSync';

/**
 * HorizontalCarousel - Arrow-controlled carousel for mobile bottom sheet
 *
 * Features:
 * - Transform-based positioning (no scroll behavior)
 * - Shows 1 large center card + side peeks (80% card width, 10% peeks)
 * - Arrow-only navigation (no swipe gestures)
 * - Auto-centers on selected shop
 *
 * Design:
 * - Center card: scale(1.2), bright, elevated shadow
 * - Side cards: scale(0.85), dimmed with dark overlay, 10% visible behind arrows
 * - Consistent percentage-based spacing
 */
const HorizontalCarousel: React.FC = () => {
  const { currentlyDisplayedLocations } = useLocationData();
  const { selectedShop, setSelectedShop, setBottomSheetHeight, setIsManuallyCollapsed, setPreviewShop } = useUI();
  const { activeLocationTypes, activeProductFilters } = useFilters();
  const { lastPlaceSelectedByAutocomplete, currentRadius } = useSearch();
  const navigate = useNavigate();
  const [centerIndex, setCenterIndex] = useState(0);

  // Auto-center on selected shop when selection changes
  useEffect(() => {
    if (!selectedShop) {
      // No selected shop - default to first card
      setCenterIndex(0);
      return;
    }

    const selectedIndex = currentlyDisplayedLocations.findIndex(
      (shop) =>
        shop.slug === selectedShop.slug ||
        shop.GoogleProfileID === selectedShop.GoogleProfileID
    );

    if (selectedIndex !== -1) {
      setCenterIndex(selectedIndex);
    }
  }, [selectedShop, currentlyDisplayedLocations]);

  // Handle card click - set as selected shop, expand, and navigate to URL
  const handleCardClick = (index: number) => {
    const shop = currentlyDisplayedLocations[index];
    setSelectedShop(shop);
    setPreviewShop(null); // Clear preview - we're now selecting
    setCenterIndex(index);
    setBottomSheetHeight(0.9);
    setIsManuallyCollapsed(false); // Clear collapse flag - user is actively expanding

    // Add URL navigation (matching ShopCard.tsx:81-100 pattern)
    const urlIdentifier = shop.slug || shop.GoogleProfileID || `shop-${shop.Name?.replace(/\W/g, '-').toLowerCase()}`;
    const basePath = getShopDetailBasePath(shop.type);

    const filterState = {
      locationTypes: activeLocationTypes,
      productFilters: activeProductFilters,
      searchLocation: lastPlaceSelectedByAutocomplete,
      searchRadius: currentRadius,
    };
    const queryParams = encodeFiltersToURL(filterState);
    const queryString = queryParams.toString();
    const url = queryString ? `${basePath}/${urlIdentifier}?${queryString}` : `${basePath}/${urlIdentifier}`;

    navigate(url);
  };

  // Navigate to previous card (just move carousel, don't select)
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (centerIndex > 0) {
      const newIndex = centerIndex - 1;
      setCenterIndex(newIndex);
      // Set preview to show in map InfoWindow (without selecting/expanding)
      setPreviewShop(currentlyDisplayedLocations[newIndex]);
    }
  };

  // Navigate to next card (just move carousel, don't select)
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (centerIndex < currentlyDisplayedLocations.length - 1) {
      const newIndex = centerIndex + 1;
      setCenterIndex(newIndex);
      // Set preview to show in map InfoWindow (without selecting/expanding)
      setPreviewShop(currentlyDisplayedLocations[newIndex]);
    }
  };

  // Calculate transform offset: each card takes 90% (80% width + 10% gap)
  const offset = centerIndex * -90;

  return (
    <div className="relative h-full overflow-visible">
      {/* Left Arrow - only show if not at first card */}
      {centerIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          aria-label="Previous location"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Arrow - only show if not at last card */}
      {centerIndex < currentlyDisplayedLocations.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          aria-label="Next location"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Card Container - uses transform for positioning */}
      <div
        className="flex h-full items-center pb-4 overflow-visible"
        style={{
          // Transform-based positioning (no scroll needed)
          // Start at 10% offset to center first card, then shift by offset
          transform: `translateX(calc(10% + ${offset}%))`,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // Prevent any user interaction on container
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {currentlyDisplayedLocations.map((shop, index) => {
          const isCenterCard = index === centerIndex;
          return (
            <div
              key={shop.slug || shop.GoogleProfileID || shop.Name}
              className="flex-shrink-0 relative"
              style={{
                // Consistent percentage-based sizing: 80% card + 10% gap
                flex: '0 0 80%',
                marginRight: '10%',
                // Center card: larger and elevated
                transform: isCenterCard ? 'scale(1.2)' : 'scale(0.85)',
                zIndex: isCenterCard ? 10 : 1,
                boxShadow: isCenterCard ? '0 12px 48px rgba(0, 0, 0, 0.3)' : 'none',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                // Re-enable interactions on cards
                pointerEvents: 'auto',
              }}
              onClick={() => handleCardClick(index)}
            >
              <div className="relative">
                <ShopCard shop={shop} />
                {/* Dimming overlay for side cards */}
                {!isCenterCard && (
                  <div
                    className="absolute inset-0 bg-black/60 rounded-lg pointer-events-none"
                    style={{ zIndex: 5 }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {currentlyDisplayedLocations.length === 0 && (
        <div className="flex items-center justify-center w-full h-full px-6 text-center">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No locations found
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalCarousel;
