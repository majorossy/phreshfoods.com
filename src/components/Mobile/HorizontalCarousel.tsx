// src/components/Mobile/HorizontalCarousel.tsx
import React, { useRef, useEffect } from 'react';
import { useLocationData } from '../../contexts/LocationDataContext';
import { useUI } from '../../contexts/UIContext';
import ShopCard from '../Listings/ShopCard';

/**
 * HorizontalCarousel - Horizontal scrolling carousel for mobile bottom sheet
 *
 * Features:
 * - Native CSS scroll-snap for 60fps scrolling
 * - Shows 1 full card + 1/3 peek on each side (67% card width)
 * - Reuses existing ShopCard component unchanged
 * - Auto-centers on selected shop
 * - iOS momentum scrolling support
 *
 * Performance:
 * - No virtualization needed (max 10 visible cards)
 * - GPU-accelerated with will-change hints
 * - No scroll event listeners (pure CSS)
 */
const HorizontalCarousel: React.FC = () => {
  const { currentlyDisplayedLocations } = useLocationData();
  const { selectedShop, setSelectedShop } = useUI();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected shop when selection changes
  useEffect(() => {
    if (!selectedShop || !carouselRef.current) return;

    const selectedIndex = currentlyDisplayedLocations.findIndex(
      (shop) =>
        shop.slug === selectedShop.slug ||
        shop.GoogleProfileID === selectedShop.GoogleProfileID
    );

    if (selectedIndex === -1) return;

    // Calculate scroll position to center the selected card
    const carousel = carouselRef.current;
    const cardWidth = carousel.clientWidth * 0.67; // 67% of viewport
    const gap = 12; // gap-3 = 12px
    const scrollLeft = selectedIndex * (cardWidth + gap);

    carousel.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [selectedShop, currentlyDisplayedLocations]);

  // Handle card click - set as selected shop
  const handleCardClick = (index: number) => {
    const shop = currentlyDisplayedLocations[index];
    setSelectedShop(shop);
  };

  return (
    <div
      ref={carouselRef}
      className="mobile-carousel h-full flex items-center overflow-x-scroll overflow-y-hidden pb-4"
      style={{
        // Native scroll-snap for smooth centering
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
        // iOS momentum scrolling
        WebkitOverflowScrolling: 'touch',
        // GPU acceleration hint
        willChange: 'scroll-position',
        // Hide scrollbar
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        // Padding creates centered layout for first/last cards
        // 16.5% on each side = (100% - 67%) / 2
        paddingLeft: '16.5%',
        paddingRight: '16.5%',
        // Gap between cards
        gap: '12px',
      }}
    >
      {/* Hide scrollbar for WebKit browsers */}
      <style>{`
        .mobile-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {currentlyDisplayedLocations.map((shop, index) => (
        <div
          key={shop.slug || shop.GoogleProfileID || shop.Name}
          className="mobile-carousel-item flex-shrink-0"
          style={{
            // Card width: 67% of viewport (1 full + 2×1/6 peek)
            width: '67%',
            // Snap to center of viewport
            scrollSnapAlign: 'center',
            // Force stop at each card (no accidental skip)
            scrollSnapStop: 'always',
          }}
          onClick={() => handleCardClick(index)}
        >
          <ShopCard shop={shop} />
        </div>
      ))}

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
