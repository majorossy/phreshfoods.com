// src/components/Mobile/HorizontalCarousel.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useUI } from '../../contexts/UIContext';
import { useFilters } from '../../contexts/FilterContext';
import { useSearch } from '../../contexts/SearchContext';
import ShopCardMobile from './ShopCardMobile';
import { getShopDetailBasePath } from '../../utils/typeUrlMappings';
import { encodeFiltersToURL } from '../../utils/urlSync';
import { useCarouselSwipe } from '../../hooks/useCarouselSwipe';
import {
  CAROUSEL,
  BOTTOM_SHEET,
  MOBILE_ANIMATION,
} from '../../config/mobile';

/**
 * Get card tier based on bottom sheet height
 */
function getCardTier(height: number): 'minimal' | 'compact' | 'expanded' {
  if (height <= BOTTOM_SHEET.SNAP_COLLAPSED) {
    return 'minimal';
  }
  if (height <= BOTTOM_SHEET.SNAP_HALF) {
    return 'compact';
  }
  return 'expanded';
}

/**
 * HorizontalCarousel - Swipe-enabled carousel for mobile bottom sheet
 *
 * Features:
 * - Touch swipe with momentum physics (NEW!)
 * - Arrow button navigation (accessibility fallback)
 * - Transform-based positioning (no scroll behavior)
 * - Shows 1 large center card + side peeks (80% card width, 10% peeks)
 * - Auto-centers on selected shop
 *
 * Design:
 * - Center card: scale(1.05), bright, elevated shadow
 * - Side cards: scale(0.9), dimmed with dark overlay, 10% visible behind arrows
 * - Consistent percentage-based spacing
 */
const HorizontalCarousel: React.FC = () => {
  const { currentlyDisplayedLocations } = useLocationData();
  const { selectedShop, setSelectedShop, setBottomSheetHeight, setIsManuallyCollapsed, setPreviewShop, bottomSheetHeight } = useUI();

  // Calculate card tier based on bottom sheet height
  const cardTier = useMemo(() => getCardTier(bottomSheetHeight), [bottomSheetHeight]);
  const { activeLocationTypes, activeProductFilters } = useFilters();
  const { lastPlaceSelectedByAutocomplete, currentRadius } = useSearch();
  const navigate = useNavigate();

  // Find the initial index based on selected shop
  const getInitialIndex = useCallback(() => {
    if (!selectedShop) return 0;
    const index = currentlyDisplayedLocations.findIndex(
      (shop) =>
        shop.slug === selectedShop.slug ||
        shop.GoogleProfileID === selectedShop.GoogleProfileID
    );
    return index !== -1 ? index : 0;
  }, [selectedShop, currentlyDisplayedLocations]);

  // Use the swipe hook for touch navigation
  const {
    containerRef,
    currentIndex,
    isDragging,
    isAnimating,
    goToIndex,
    style: swipeStyle,
  } = useCarouselSwipe({
    itemCount: currentlyDisplayedLocations.length,
    itemWidth: CAROUSEL.CARD_WIDTH_PERCENT,
    gapWidth: CAROUSEL.CARD_GAP_PERCENT,
    initialIndex: getInitialIndex(),
    onIndexChange: (index) => {
      // Update preview shop when swiping (shows InfoWindow on map)
      if (currentlyDisplayedLocations[index]) {
        setPreviewShop(currentlyDisplayedLocations[index]);
      }
    },
    enabled: currentlyDisplayedLocations.length > 1,
  });

  // Auto-center on selected shop when selection changes externally
  // IMPORTANT: Skip while animating to prevent race conditions (oscillation bug fix)
  useEffect(() => {
    // Don't interrupt ongoing animations - this prevents the oscillation bug
    // where arrow clicks would compete with auto-center effects
    if (!selectedShop || isAnimating) return;

    const selectedIndex = currentlyDisplayedLocations.findIndex(
      (shop) =>
        shop.slug === selectedShop.slug ||
        shop.GoogleProfileID === selectedShop.GoogleProfileID
    );

    if (selectedIndex !== -1 && selectedIndex !== currentIndex) {
      goToIndex(selectedIndex, true);
    }
  }, [selectedShop, currentlyDisplayedLocations, currentIndex, goToIndex, isAnimating]);

  // Handle card click - set as selected shop, expand, and navigate to URL
  const handleCardClick = useCallback((index: number) => {
    // Don't handle clicks while dragging
    if (isDragging) return;

    const shop = currentlyDisplayedLocations[index];
    setSelectedShop(shop);
    setPreviewShop(null); // Clear preview - we're now selecting
    setBottomSheetHeight(BOTTOM_SHEET.SNAP_FULL_DETAILS);
    setIsManuallyCollapsed(false); // Clear collapse flag - user is actively expanding

    // Add URL navigation (matching ShopCard.tsx pattern)
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
  }, [currentlyDisplayedLocations, setSelectedShop, setPreviewShop, setBottomSheetHeight, setIsManuallyCollapsed, activeLocationTypes, activeProductFilters, lastPlaceSelectedByAutocomplete, currentRadius, navigate, isDragging]);

  // Navigate to previous card (arrow button)
  const handlePrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1, true);
    }
  }, [currentIndex, goToIndex]);

  // Navigate to next card (arrow button)
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < currentlyDisplayedLocations.length - 1) {
      goToIndex(currentIndex + 1, true);
    }
  }, [currentIndex, currentlyDisplayedLocations.length, goToIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      goToIndex(currentIndex - 1, true);
    } else if (e.key === 'ArrowRight' && currentIndex < currentlyDisplayedLocations.length - 1) {
      e.preventDefault();
      goToIndex(currentIndex + 1, true);
    }
  }, [currentIndex, currentlyDisplayedLocations.length, goToIndex]);

  return (
    <div
      id="horizontal-carousel"
      ref={containerRef}
      className={`relative h-full overflow-visible carousel-container ${isDragging ? 'is-swiping' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-labelledby="carousel-heading"
    >
      {/* Screen reader heading for proper heading hierarchy */}
      <h2 id="carousel-heading" className="sr-only">Shop listings</h2>
      {/* Left Arrow - kept for accessibility */}
      {currentIndex > 0 && (
        <button
          id="carousel-prev-button"
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

      {/* Right Arrow - kept for accessibility */}
      {currentIndex < currentlyDisplayedLocations.length - 1 && (
        <button
          id="carousel-next-button"
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

      {/* Position Indicator */}
      {currentlyDisplayedLocations.length > 1 && (
        <div id="carousel-position-indicator" className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <span
            id="carousel-position-text"
            className="text-xs text-gray-500 dark:text-gray-400
                       bg-white/80 dark:bg-gray-800/80
                       px-2.5 py-1 rounded-full
                       backdrop-blur-sm shadow-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentIndex + 1} / {currentlyDisplayedLocations.length}
          </span>
        </div>
      )}

      {/* Card Container - uses swipe hook for transform */}
      <div
        data-carousel-track
        className="flex h-full items-center pb-4 overflow-visible"
        style={{
          ...swipeStyle,
          // Disable transition during drag for immediate feedback
          transition: isDragging ? 'none' : MOBILE_ANIMATION.TRANSFORM_TRANSITION,
          // Prevent selection during drag
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        aria-live="polite"
      >
        {currentlyDisplayedLocations.map((shop, index) => {
          const isCenterCard = index === currentIndex;
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
                // Allow pointer events for card interaction
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
              onClick={() => handleCardClick(index)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${currentlyDisplayedLocations.length}: ${shop.Name}`}
              aria-current={isCenterCard ? 'true' : undefined}
            >
              <ShopCardMobile
                shop={shop}
                tier={cardTier}
                isCenterCard={isCenterCard}
                onTap={() => handleCardClick(index)}
              />
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {currentlyDisplayedLocations.length === 0 && (
        <div id="carousel-empty-state" className="flex items-center justify-center w-full h-full px-6 text-center">
          <div>
            <p id="carousel-empty-title" className="text-gray-500 dark:text-gray-400 text-sm">
              No locations found
            </p>
            <p id="carousel-empty-subtitle" className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalCarousel;
