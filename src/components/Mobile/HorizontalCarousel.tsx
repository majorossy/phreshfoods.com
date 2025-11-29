// src/components/Mobile/HorizontalCarousel.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useUI } from '../../contexts/UIContext';
import { useFilters } from '../../contexts/FilterContext';
import { useSearch } from '../../contexts/SearchContext';
import ShopCard from '../Listings/ShopCard';
import { getShopDetailBasePath } from '../../utils/typeUrlMappings';
import { encodeFiltersToURL } from '../../utils/urlSync';
import {
  CAROUSEL,
  BOTTOM_SHEET,
  MOBILE_ANIMATION,
} from '../../config/mobile';

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
  const handleCardClick = useCallback((index: number) => {
    const shop = currentlyDisplayedLocations[index];
    setSelectedShop(shop);
    setPreviewShop(null); // Clear preview - we're now selecting
    setCenterIndex(index);
    setBottomSheetHeight(BOTTOM_SHEET.SNAP_FULL_DETAILS);
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
  }, [currentlyDisplayedLocations, setSelectedShop, setPreviewShop, setBottomSheetHeight, setIsManuallyCollapsed, activeLocationTypes, activeProductFilters, lastPlaceSelectedByAutocomplete, currentRadius, navigate]);

  // Navigate to previous card (just move carousel, don't select)
  const handlePrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (centerIndex > 0) {
      const newIndex = centerIndex - 1;
      setCenterIndex(newIndex);
      // Set preview to show in map InfoWindow (without selecting/expanding)
      setPreviewShop(currentlyDisplayedLocations[newIndex]);
    }
  }, [centerIndex, currentlyDisplayedLocations, setPreviewShop]);

  // Navigate to next card (just move carousel, don't select)
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (centerIndex < currentlyDisplayedLocations.length - 1) {
      const newIndex = centerIndex + 1;
      setCenterIndex(newIndex);
      // Set preview to show in map InfoWindow (without selecting/expanding)
      setPreviewShop(currentlyDisplayedLocations[newIndex]);
    }
  }, [centerIndex, currentlyDisplayedLocations, setPreviewShop]);

  // Calculate transform offset: each card takes (cardWidth + gap)% of container
  const cardStep = CAROUSEL.CARD_WIDTH_PERCENT + CAROUSEL.CARD_GAP_PERCENT; // 90%
  const offset = centerIndex * -cardStep;

  return (
    <div className="relative h-full overflow-visible">
      {/* Left Arrow - only show if not at first card */}
      {centerIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                     bg-white/95 dark:bg-gray-800/95 rounded-full
                     p-3 min-w-[48px] min-h-[48px]
                     shadow-lg border border-gray-200 dark:border-gray-600
                     hover:bg-white dark:hover:bg-gray-700
                     active:scale-90 active:bg-gray-100 dark:active:bg-gray-600
                     transition-all duration-150"
          aria-label="Previous location"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Arrow - only show if not at last card */}
      {centerIndex < currentlyDisplayedLocations.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                     bg-white/95 dark:bg-gray-800/95 rounded-full
                     p-3 min-w-[48px] min-h-[48px]
                     shadow-lg border border-gray-200 dark:border-gray-600
                     hover:bg-white dark:hover:bg-gray-700
                     active:scale-90 active:bg-gray-100 dark:active:bg-gray-600
                     transition-all duration-150"
          aria-label="Next location"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Position Indicator - shows current card position */}
      {currentlyDisplayedLocations.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <span className="text-xs text-gray-500 dark:text-gray-400
                         bg-white/80 dark:bg-gray-800/80
                         px-2.5 py-1 rounded-full
                         backdrop-blur-sm shadow-sm">
            {centerIndex + 1} / {currentlyDisplayedLocations.length}
          </span>
        </div>
      )}

      {/* Card Container - uses transform for positioning */}
      <div
        className="flex h-full items-center pb-4 overflow-visible"
        style={{
          // Transform-based positioning (no scroll needed)
          // Start at initial offset to center first card, then shift by offset
          transform: `translateX(calc(${CAROUSEL.INITIAL_OFFSET_PERCENT}% + ${offset}%))`,
          transition: MOBILE_ANIMATION.TRANSFORM_TRANSITION,
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
              className="flex-shrink-0 relative mobile-carousel-item"
              style={{
                // Consistent percentage-based sizing from config
                flex: `0 0 ${CAROUSEL.CARD_WIDTH_PERCENT}%`,
                marginRight: `${CAROUSEL.CARD_GAP_PERCENT}%`,
                // Center card: slightly larger and elevated; side cards: smaller and dimmed
                transform: isCenterCard
                  ? `scale(${CAROUSEL.CENTER_CARD_SCALE})`
                  : `scale(${CAROUSEL.SIDE_CARD_SCALE})`,
                zIndex: isCenterCard ? CAROUSEL.CENTER_CARD_Z_INDEX : CAROUSEL.SIDE_CARD_Z_INDEX,
                boxShadow: isCenterCard ? CAROUSEL.CENTER_CARD_SHADOW : CAROUSEL.SIDE_CARD_SHADOW,
                // Side cards: use opacity/filter instead of dark overlay (keeps text readable)
                opacity: isCenterCard ? 1 : CAROUSEL.SIDE_CARD_OPACITY,
                filter: isCenterCard ? 'none' : `brightness(${CAROUSEL.SIDE_CARD_BRIGHTNESS})`,
                transition: MOBILE_ANIMATION.CARD_TRANSITION,
                // Re-enable interactions on cards
                pointerEvents: 'auto',
              }}
              onClick={() => handleCardClick(index)}
            >
              <ShopCard shop={shop} />
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
