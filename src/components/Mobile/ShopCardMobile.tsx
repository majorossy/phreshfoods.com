// src/components/Mobile/ShopCardMobile.tsx
import React, { useMemo, useCallback } from 'react';
import type { Shop, ShopWithDistance } from '../../types';
import { transformShopToCardData, getLocationTypeLabel, getLocationTypeColors } from '../../utils/cardDataTransform';
import StatusBadge from '../UI/StatusBadge';
import ProductPreview from '../UI/ProductPreview';
import ReviewSnippet from '../UI/ReviewSnippet';
import ShopPhotoCarousel from '../UI/ShopPhotoCarousel';
import QuickActionBar from '../UI/QuickActionBar';

interface ShopCardMobileProps {
  shop: Shop | ShopWithDistance;
  /** Card height tier based on bottom sheet position */
  tier?: 'minimal' | 'compact' | 'expanded';
  /** Callback when card is tapped (for selection) */
  onTap?: () => void;
  /** Callback when directions action is triggered */
  onDirections?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether this card is the currently focused center card */
  isCenterCard?: boolean;
}

/**
 * ShopCardMobile Component
 *
 * Rich, mobile-optimized shop card for the horizontal carousel.
 * Uses progressive disclosure based on tier prop.
 *
 * Content Tiers:
 * - minimal: Photo, name, distance badge only (collapsed sheet)
 * - compact: + status, rating, location type (mid-expanded)
 * - expanded: + products, review snippet, quick actions (full)
 *
 * Features:
 * - Swipeable photo carousel within card
 * - Status badge (open/closed)
 * - Product preview icons
 * - Featured review snippet
 * - Quick action buttons
 *
 * Performance:
 * - Uses pre-computed CardDisplayData
 * - Memoized to prevent unnecessary re-renders
 * - Lazy loads content based on tier
 */
const ShopCardMobile: React.FC<ShopCardMobileProps> = ({
  shop,
  tier = 'compact',
  onTap,
  onDirections,
  className = '',
  isCenterCard = false,
}) => {
  // Pre-compute all display data
  const cardData = useMemo(
    () => transformShopToCardData(shop),
    [shop]
  );

  const typeColors = useMemo(
    () => getLocationTypeColors(cardData.type),
    [cardData.type]
  );

  const typeLabel = useMemo(
    () => getLocationTypeLabel(cardData.type),
    [cardData.type]
  );

  // Handle card tap
  const handleTap = useCallback((e: React.MouseEvent) => {
    // Don't trigger tap if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    onTap?.();
  }, [onTap]);

  // Photo height based on tier
  const photoHeight = tier === 'minimal' ? 100 : tier === 'compact' ? 140 : 160;

  return (
    <article
      id={`shop-card-mobile-${shop.slug || shop.GoogleProfileID}`}
      className={`
        shop-card-mobile
        bg-white dark:bg-gray-800
        rounded-xl
        shadow-lg
        overflow-hidden
        transition-shadow duration-200
        ${isCenterCard ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        ${className}
      `}
      onClick={handleTap}
      role="article"
      aria-label={`${cardData.name} - ${typeLabel}`}
    >
      {/* Photo Carousel Section */}
      <div className="relative">
        <ShopPhotoCarousel
          shop={shop}
          height={photoHeight}
          maxPhotos={5}
          photoSize={400}
        />

        {/* Overlaid badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {/* Location Type Badge */}
          <span
            id={`shop-mobile-type-badge-${shop.slug || shop.GoogleProfileID}`}
            className={`
              text-[10px] font-semibold px-2 py-0.5 rounded
              ${typeColors.bg} ${typeColors.text}
              backdrop-blur-sm
            `}
          >
            {typeLabel}
          </span>

          {/* Status Badge */}
          <StatusBadge shop={shop} size="sm" />
        </div>

        {/* Distance Badge (top right) */}
        {cardData.distance && (
          <div className="absolute top-2 right-2 z-10">
            <span id={`shop-mobile-distance-${shop.slug || shop.GoogleProfileID}`} className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm font-medium">
              {cardData.distance}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        {/* Header: Name + Rating */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 id={`shop-mobile-name-${shop.slug || shop.GoogleProfileID}`} className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
            {cardData.name}
          </h3>

          {/* Rating */}
          {tier !== 'minimal' && cardData.hasRating && (
            <div id={`shop-mobile-rating-${shop.slug || shop.GoogleProfileID}`} className="flex items-center gap-0.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span id={`shop-mobile-rating-value-${shop.slug || shop.GoogleProfileID}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {cardData.rating.toFixed(1)}
              </span>
              <span id={`shop-mobile-rating-count-${shop.slug || shop.GoogleProfileID}`} className="text-[10px] text-gray-500 dark:text-gray-400">
                ({cardData.ratingCount})
              </span>
            </div>
          )}
        </div>

        {/* Location (compact & expanded tiers) */}
        {tier !== 'minimal' && (
          <p id={`shop-mobile-location-${shop.slug || shop.GoogleProfileID}`} className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
            {cardData.city || cardData.address}
          </p>
        )}

        {/* Products Preview (compact & expanded tiers) */}
        {tier !== 'minimal' && cardData.hasProducts && (
          <div className="mb-2">
            <ProductPreview
              shop={shop}
              maxProducts={tier === 'expanded' ? 5 : 4}
              iconSize={tier === 'expanded' ? 28 : 24}
            />
          </div>
        )}

        {/* Review Snippet (expanded tier only) */}
        {tier === 'expanded' && cardData.featuredReview && (
          <div className="mb-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <ReviewSnippet
              shop={shop}
              maxLength={tier === 'expanded' ? 80 : 60}
            />
          </div>
        )}

        {/* Quick Actions (expanded tier only) */}
        {tier === 'expanded' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <QuickActionBar
              shop={shop}
              size="sm"
              onDirectionsClick={onDirections}
            />
          </div>
        )}
      </div>
    </article>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(ShopCardMobile);
